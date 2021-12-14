import { v4 as uuidv4 } from "uuid";
import { ImageCreateInput } from "@labelflow/graphql-types";
import { Repository, DbImageCreateInput } from "../types";
import { getOrigin } from "../utils/get-origin";
import { getImageFileKey, getImageName } from "./utils";

const importFromExternalUrl = async (
  externalUrl: string,
  getImageFileKeyFromMimeType: (mimeType: string) => string,
  { req, repository }: { req: Request; repository: Repository }
) => {
  const origin = getOrigin(req);

  const headers = new Headers();
  headers.set("Accept", "image/tiff,image/jpeg,image/png,image/*,*/*;q=0.8");
  headers.set("Sec-Fetch-Dest", "image");

  // TODO: Investigate this. It looks like a major security issue.
  if ((req?.headers as any)?.cookie) {
    headers.set("Cookie", (req?.headers as any)?.cookie);
  }

  const fetchResult = await fetch(externalUrl, {
    method: "GET",
    mode: "cors",
    headers,
    credentials: "omit",
  });

  if (fetchResult.status !== 200) {
    throw new Error(
      `While transferring image could not fetch image at url ${externalUrl} properly, code ${fetchResult.status}`
    );
  }

  const blob = await fetchResult.blob();

  const uploadTarget = await repository.upload.getUploadTargetHttp(
    getImageFileKeyFromMimeType(blob.type),
    origin
  );

  // eslint-disable-next-line no-underscore-dangle
  if (uploadTarget.__typename !== "UploadTargetHttp") {
    throw new Error(
      "This Server does not support file upload. You can create images by providing a `file` directly in the `createImage` mutation"
    );
  }

  await repository.upload.put(uploadTarget.uploadUrl, blob, req);

  return uploadTarget.downloadUrl;
};

const importFromFile = async (
  file: any,
  getImageFileKeyFromMimeType: (mimeType: string) => string,
  { req, repository }: { req: Request; repository: Repository }
) => {
  const origin = getOrigin(req);

  const uploadTarget = await repository.upload.getUploadTargetHttp(
    getImageFileKeyFromMimeType(file.type),
    origin
  );

  // eslint-disable-next-line no-underscore-dangle
  if (uploadTarget.__typename !== "UploadTargetHttp") {
    throw new Error(
      "This Server does not support file upload. You can create images by providing a `file` directly in the `createImage` mutation"
    );
  }

  await repository.upload.put(uploadTarget.uploadUrl, file, req);

  return uploadTarget.downloadUrl;
};

/**
 * Very important function, which processes images (download from external URL if needed, probe metadata, create and upload thumbnails, etc.)
 * @param image ImageCreateInput
 * @param repository
 * @param req
 * @returns
 */
export const getImageEntityFromMutationArgs = async (
  {
    image,
    workspaceId,
    user,
  }: { image: ImageCreateInput; workspaceId: string; user?: { id: string } },
  { repository, req }: { repository: Repository; req?: Request }
) => {
  const {
    file,
    id,
    name,
    height,
    width,
    mimetype,
    path,
    url,
    externalUrl,
    datasetId,
    thumbnail20Url,
    thumbnail50Url,
    thumbnail100Url,
    thumbnail200Url,
    thumbnail500Url,
  } = image;

  const now = image?.createdAt ?? new Date().toISOString();
  const imageId = id ?? uuidv4();

  let finalUrl: string | undefined;

  let thumbnailsUrls: { [key: string]: string } = {};
  if (thumbnail20Url) thumbnailsUrls.thumbnail20Url = thumbnail20Url;
  if (thumbnail50Url) thumbnailsUrls.thumbnail50Url = thumbnail50Url;
  if (thumbnail100Url) thumbnailsUrls.thumbnail100Url = thumbnail100Url;
  if (thumbnail200Url) thumbnailsUrls.thumbnail200Url = thumbnail200Url;
  if (thumbnail500Url) thumbnailsUrls.thumbnail500Url = thumbnail500Url;

  const getImageFileKeyFromMimeType = (mimeType: string) =>
    getImageFileKey(imageId, workspaceId, datasetId, mimeType);

  if (url) {
    // We don't need to perform anything else, we can use the provided URL
    finalUrl = url;
  }

  if (externalUrl) {
    finalUrl = await importFromExternalUrl(
      externalUrl,
      getImageFileKeyFromMimeType,
      { req, repository }
    );
  }

  if (file) {
    finalUrl = await importFromFile(file, getImageFileKeyFromMimeType, {
      req,
      repository,
    });
  }

  if (image.noThumbnails) {
    // Do not generate or store thumbnails on server, use either the thumbnails url provided above, or use the full size image as thumbnails
    thumbnailsUrls = {
      thumbnail20Url: finalUrl,
      thumbnail50Url: finalUrl,
      thumbnail100Url: finalUrl,
      thumbnail200Url: finalUrl,
      thumbnail500Url: finalUrl,
      ...thumbnailsUrls,
    };
  }

  const origin = getOrigin(req);

  const downloadUrlPrefix = (
    await repository.upload.getUploadTargetHttp("", origin)
  ).downloadUrl;

  const imageToProcess = {
    ...thumbnailsUrls,
    id: imageId,
    width,
    height,
    mimetype,
    url: finalUrl,
  };

  const getImage = (fromUrl: string) => repository.upload.get(fromUrl, req);

  const putThumbnail = async (targetDownloadUrl: string, blob: Blob) => {
    const key = targetDownloadUrl.substring(downloadUrlPrefix.length);
    const toUrl = (await repository.upload.getUploadTargetHttp(key, origin))
      .uploadUrl;
    // console.log("targetDownloadUrl", targetDownloadUrl);
    // console.log(" key", key);
    // console.log(" toUrl", toUrl);
    await repository.upload.put(toUrl, blob, req);
  };

  const imageMetaDataFromProcessing =
    await repository.imageProcessing.processImage(
      imageToProcess,
      getImage,
      putThumbnail,
      repository.image.update,
      user
    );

  const finalName = getImageName({ externalUrl, finalUrl, name });
  const finalPath = path ?? externalUrl ?? finalUrl;

  const newImageEntity: DbImageCreateInput = {
    id: imageId,
    createdAt: now,
    updatedAt: now,
    name: finalName,
    path: finalPath,
    url: finalUrl,
    externalUrl,
    datasetId,
    ...imageMetaDataFromProcessing,
  };

  return newImageEntity;
};
