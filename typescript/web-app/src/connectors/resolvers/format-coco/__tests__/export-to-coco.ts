import { gql } from "@apollo/client";
import probe from "probe-image-size";
// eslint-disable-next-line import/no-extraneous-dependencies
import { mocked } from "ts-jest/utils";
import { omit } from "lodash/fp";
import { client } from "../../../apollo-client-schema";

import { setupTestsWithLocalDatabase } from "../../../../utils/setup-local-db-tests";
import { initialCocoDataset } from "../coco-core/converters";
import { CocoDataset } from "../coco-core/types";
import { jsonToDataUri } from "..";
import { dataUriToJson } from "../json-to-data-uri";

jest.mock("probe-image-size");
const mockedProbeSync = mocked(probe.sync);

setupTestsWithLocalDatabase();

const omitUrl = omit(["images", 0, "coco_url"]);

const testProjectId = "test project id";

const createProject = async (
  name: string,
  projectId: string = testProjectId
) => {
  return client.mutate({
    mutation: gql`
      mutation createProject($projectId: String, $name: String!) {
        createProject(data: { id: $projectId, name: $name }) {
          id
          name
        }
      }
    `,
    variables: {
      name,
      projectId,
    },
    fetchPolicy: "no-cache",
  });
};

const createImage = async (name: String): Promise<string> => {
  const mutationResult = await client.mutate({
    mutation: gql`
      mutation createImage($file: Upload!, $name: String!, $projectId: ID!) {
        createImage(
          data: {
            name: $name
            file: $file
            projectId: $projectId
            width: 100
            height: 200
          }
        ) {
          id
        }
      }
    `,
    variables: {
      file: new Blob(),
      name,
      projectId: testProjectId,
    },
  });

  const {
    data: {
      createImage: { id },
    },
  } = mutationResult;

  return id;
};

const createLabelClass = async (data: {
  name: string;
  color: string;
  id?: string;
}) => {
  const mutationResult = await client.mutate({
    mutation: gql`
      mutation createLabelClass($data: LabelClassCreateInput!) {
        createLabelClass(data: $data) {
          id
        }
      }
    `,
    variables: {
      data: { ...data, projectId: testProjectId },
    },
  });

  const {
    data: {
      createLabelClass: { id },
    },
  } = mutationResult;

  return id;
};

const createLabelWithLabelClass = (imageId: string, labelClassId: string) => {
  return client.mutate({
    mutation: gql`
      mutation createLabel($data: LabelCreateInput!) {
        createLabel(data: $data) {
          id
        }
      }
    `,
    variables: {
      data: {
        imageId,
        labelClassId,
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [1, 1],
              [2, 1],
              [2, 2],
              [1, 2],
              [1, 1],
            ],
          ],
        },
      },
    },
  });
};

describe("Exporting a dataset to coco format", () => {
  beforeEach(async () => {
    // Images and label classes are always liked to a project
    await createProject("Test project");
  });

  test("The exportToCoco graphql endpoint returns an empty dataset when no label class and no image exist", async () => {
    expect(
      (
        await client.query({
          query: gql`
            query exportToCoco($projectId: ID!) {
              exportToCoco(where: { projectId: $projectId })
            }
          `,
          variables: {
            projectId: testProjectId,
          },
        })
      ).data.exportToCoco
    ).toEqual(jsonToDataUri(JSON.stringify(initialCocoDataset)));
  });

  test("The exportToCoco graphql endpoint returns a dataset with a category when a label class exist", async () => {
    await createLabelClass({
      name: "label-class-1",
      color: "#000000",
      id: "id-label-class-1",
    });

    const expectedDataset: CocoDataset = {
      ...initialCocoDataset,
      categories: [
        {
          id: 1,
          name: "label-class-1",
          supercategory: "",
        },
      ],
    };

    expect(
      (
        await client.query({
          query: gql`
            query exportToCoco($projectId: ID!) {
              exportToCoco(where: { projectId: $projectId })
            }
          `,
          variables: {
            projectId: testProjectId,
          },
        })
      ).data.exportToCoco
    ).toEqual(jsonToDataUri(JSON.stringify(expectedDataset)));
  });

  test("The exportToCoco graphql endpoint returns a dataset with a category and an image when a label class, and an image exist", async () => {
    mockedProbeSync.mockReturnValue({
      width: 42,
      height: 36,
      mime: "image/jpeg",
      length: 1000,
      hUnits: "px",
      wUnits: "px",
      url: "https://example.com/image.jpeg",
      type: "jpg",
    });

    await createLabelClass({
      name: "label-class-1",
      color: "#000000",
      id: "id-label-class-1",
    });
    await createLabelWithLabelClass(
      await createImage("image-1"),
      "id-label-class-1"
    );

    const expectedDataset: CocoDataset = {
      ...initialCocoDataset,
      annotations: [
        {
          id: 1,
          image_id: 1,
          category_id: 1,
          segmentation: [[1, 199, 2, 199, 2, 198, 1, 198, 1, 199]],
          area: 1,
          bbox: [1, 198, 1, 1],
          iscrowd: 0,
        },
      ],
      categories: [
        {
          id: 1,
          name: "label-class-1",
          supercategory: "",
        },
      ],
      images: [
        {
          id: 1,
          file_name: "image-1",
          coco_url: "mockedUrl",
          date_captured: new Date().toISOString(),
          flickr_url: "",
          height: 36,
          width: 42,
          license: 0,
        },
      ],
    };

    expect(
      omitUrl(
        JSON.parse(
          dataUriToJson(
            (
              await client.query({
                query: gql`
                  query exportToCoco($projectId: ID!) {
                    exportToCoco(where: { projectId: $projectId })
                  }
                `,
                variables: {
                  projectId: testProjectId,
                },
              })
            ).data.exportToCoco
          )
        )
      )
    ).toEqual(omitUrl(expectedDataset));
  });
});
