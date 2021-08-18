import torch, cv2
import numpy.random as random
import numpy as np
import dataloaders.helpers as helpers
import scipy.misc as sm
from dataloaders.helpers import *


class ScaleNRotate(object):
    """Scale (zoom-in, zoom-out) and Rotate the image and the ground truth.
    Args:
        two possibilities:
        1.  rots (tuple): (minimum, maximum) rotation angle
            scales (tuple): (minimum, maximum) scale
        2.  rots [list]: list of fixed possible rotation angles
            scales [list]: list of fixed possible scales
    """

    def __init__(self, rots=(-30, 30), scales=(0.75, 1.25), semseg=False):
        assert isinstance(rots, type(scales))
        self.rots = rots
        self.scales = scales
        self.semseg = semseg

    def __call__(self, sample):

        if type(self.rots) == tuple:
            # Continuous range of scales and rotations
            rot = (self.rots[1] - self.rots[0]) * random.random() - (
                self.rots[1] - self.rots[0]
            ) / 2

            sc = (
                (self.scales[1] - self.scales[0]) * random.random()
                - (self.scales[1] - self.scales[0]) / 2
                + 1
            )
        elif type(self.rots) == list:
            # Fixed range of scales and rotations
            rot = self.rots[random.randint(0, len(self.rots))]
            sc = self.scales[random.randint(0, len(self.scales))]

        for elem in sample.keys():
            if "meta" in elem:
                continue

            tmp = sample[elem]

            h, w = tmp.shape[:2]
            center = (w / 2, h / 2)
            assert center != 0  # Strange behaviour warpAffine
            M = cv2.getRotationMatrix2D(center, rot, sc)

            if ((tmp == 0) | (tmp == 1)).all():
                flagval = cv2.INTER_NEAREST
            elif "gt" in elem and self.semseg:
                flagval = cv2.INTER_NEAREST
            else:
                flagval = cv2.INTER_CUBIC
            tmp = cv2.warpAffine(tmp, M, (w, h), flags=flagval)

            sample[elem] = tmp

        return sample

    def __str__(self):
        return (
            "ScaleNRotate:(rot=" + str(self.rots) + ",scale=" + str(self.scales) + ")"
        )


class FixedResize(object):
    """Resize the image and the ground truth to specified resolution.
    Args:
        resolutions (dict): the list of resolutions
    """

    def __init__(self, resolutions=None, flagvals=None):
        self.resolutions = resolutions
        self.flagvals = flagvals
        if self.flagvals is not None:
            assert len(self.resolutions) == len(self.flagvals)

    def __call__(self, sample):

        # Fixed range of scales
        if self.resolutions is None:
            return sample

        elems = list(sample.keys())

        for elem in elems:

            if (
                "meta" in elem
                or "bbox" in elem
                or ("extreme_points_coord" in elem and elem not in self.resolutions)
            ):
                continue
            if "extreme_points_coord" in elem and elem in self.resolutions:
                bbox = sample["bbox"]
                crop_size = np.array([bbox[3] - bbox[1] + 1, bbox[4] - bbox[2] + 1])
                res = np.array(self.resolutions[elem]).astype(np.float32)
                sample[elem] = np.round(sample[elem] * res / crop_size).astype(np.int)
                continue
            if elem in self.resolutions:
                if self.resolutions[elem] is None:
                    continue
                if isinstance(sample[elem], list):
                    if sample[elem][0].ndim == 3:
                        output_size = np.append(
                            self.resolutions[elem], [3, len(sample[elem])]
                        )
                    else:
                        output_size = np.append(
                            self.resolutions[elem], len(sample[elem])
                        )
                    tmp = sample[elem]
                    sample[elem] = np.zeros(output_size, dtype=np.float32)
                    for ii, crop in enumerate(tmp):
                        if self.flagvals is None:
                            sample[elem][..., ii] = helpers.fixed_resize(
                                crop, self.resolutions[elem]
                            )
                        else:
                            sample[elem][..., ii] = helpers.fixed_resize(
                                crop,
                                self.resolutions[elem],
                                flagval=self.flagvals[elem],
                            )
                else:
                    if self.flagvals is None:
                        sample[elem] = helpers.fixed_resize(
                            sample[elem], self.resolutions[elem]
                        )
                    else:
                        sample[elem] = helpers.fixed_resize(
                            sample[elem],
                            self.resolutions[elem],
                            flagval=self.flagvals[elem],
                        )
            else:
                del sample[elem]

        return sample

    def __str__(self):
        return "FixedResize:" + str(self.resolutions)


class RandomHorizontalFlip(object):
    """Horizontally flip the given image and ground truth randomly with a probability of 0.5."""

    def __call__(self, sample):

        if random.random() < 0.5:
            for elem in sample.keys():
                if "meta" in elem:
                    continue
                tmp = sample[elem]
                tmp = cv2.flip(tmp, flipCode=1)
                sample[elem] = tmp

        return sample

    def __str__(self):
        return "RandomHorizontalFlip"


class IOGPoints(object):
    """
    Returns the IOG Points (top-left and bottom-right or top-right and bottom-left) in a given binary mask
    sigma: sigma of Gaussian to create a heatmap from a point
    pad_pixel: number of pixels fo the maximum perturbation
    elem: which element of the sample to choose as the binary mask
    """

    def __init__(self, sigma=10, elem="crop_gt", pad_pixel=10):
        self.sigma = sigma
        self.elem = elem
        self.pad_pixel = pad_pixel

    def __call__(self, sample):

        if sample[self.elem].ndim == 3:
            raise ValueError("IOGPoints not implemented for multiple object per image.")
        _target = sample[self.elem]

        targetshape = _target.shape
        if np.max(_target) == 0:
            sample["IOG_points"] = np.zeros(
                [targetshape[0], targetshape[1], 2], dtype=_target.dtype
            )  #  TODO: handle one_mask_per_point case
        else:
            _points = helpers.iog_points(_target, self.pad_pixel)
            sample["IOG_points"] = helpers.make_gt(
                _target, _points, sigma=self.sigma, one_mask_per_point=False
            )

        return sample

    def __str__(self):
        return (
            "IOGPoints:(sigma="
            + str(self.sigma)
            + ", pad_pixel="
            + str(self.pad_pixel)
            + ", elem="
            + str(self.elem)
            + ")"
        )


class IOGPointRefinement(object):
    """
    Add one IOG Point to the original list of iog points
    sigma: sigma of Gaussian to create a heatmap from a point
    pad_pixel: number of pixels fo the maximum perturbation
    elem: which element of the sample to choose as the binary mask
    """

    def __init__(self, sigma=10, elem="crop_gt", pad_pixel=10):
        self.sigma = sigma
        self.elem = elem
        self.pad_pixel = pad_pixel

    def getPosition(self, point_mask):
        """Gives the position of the max element of a mask"""
        a = np.mat(point_mask)
        row, column = a.shape  # get the matrix of a row and column
        _positon = np.argmax(a)  # get the index of max in the a
        m, n = divmod(_positon, column)
        row = m
        column = n
        return column, row

    def __call__(self, sample):

        _target = sample[self.elem]

        (m, n, _) = _target.shape
        sample["IOG_points"] = np.zeros([m, n, 2], dtype=_target.dtype)
        for i in range(2):  # fg and bg
            if np.max(_target[:, :, i]) > 0:
                sample["IOG_points"][:, :, i] = helpers.make_gaussian(
                    (m, n), center=self.getPosition(_target[:, :, i]), sigma=self.sigma
                )

        return sample

    def __str__(self):
        return (
            "IOGPoints:(sigma="
            + str(self.sigma)
            + ", pad_pixel="
            + str(self.pad_pixel)
            + ", elem="
            + str(self.elem)
            + ")"
        )


class IOGPointsInference(object):
    """
    IOG for inference, from lists of points in image's referential
    """

    def __init__(
        self,
        sigma=10,
        pad_pixel=10,
        relax_pixel=30,
        resolution=(512, 512),
        zero_pad=True,
    ):
        self.sigma = sigma
        self.pad_pixel = pad_pixel
        self.relax_pixel = relax_pixel
        self.resolution = resolution
        self.zero_pad = zero_pad

    def get_point_in_cropped_referential(self, point, roi):
        """Gives the position of a point in the final iog map
        roi format is [x, y, w, h]
        """
        [x, y, w, h] = roi
        if self.zero_pad:
            x_min_bound = -np.inf
            y_min_bound = -np.inf
            x_max_bound = np.inf
            y_max_bound = np.inf
        else:
            x_min_bound = 0
            y_min_bound = 0
            x_max_bound = x + w - 1
            y_max_bound = y + h - 1

        x_min = max(x - self.relax_pixel, x_min_bound)
        y_min = max(y - self.relax_pixel, y_min_bound)
        x_max = min(x + w + self.relax_pixel, x_max_bound)
        y_max = min(y + h + self.relax_pixel, y_max_bound)
        roi_relaxed = [
            x_min,
            y_min,
            x_max - x_min,
            y_max - y_min,
        ]
        [x, y, w, h] = roi_relaxed
        [point_x, point_y] = point
        point_in_relaxed_roi = [point_x - x, point_y - y]
        [point_x, point_y] = point_in_relaxed_roi
        [resolution_x, resolution_y] = self.resolution
        return [int(point_x * resolution_x / w), int(point_y * resolution_y / h)]

    def get_points_in_cropped_referential(self, points, roi):
        return list(
            map(
                lambda point: self.get_point_in_cropped_referential(point, roi),
                points,
            )
        )

    def __call__(self, sample):
        assert "point_center" in sample, "sample needs a point_center key"
        assert "roi" in sample, "sample needs a roi key"
        # assert (
        #     "points_foreground_refinement" in sample
        # ), "sample needs a points_foreground_refinement key (can be [] if no refinement has been done yet)"
        # assert (
        #     "points_background_refinement" in sample
        # ), "sample needs a points_background_refinement key (can be [] if no refinement has been done yet)"
        point_center = sample["point_center"]
        roi = sample["roi"]
        points_foreground_refinement = sample.get("points_foreground_refinement", [])
        points_background_refinement = sample.get("points_background_refinement", [])
        [x, y, w, h] = roi
        points_extreme = [
            [x, y],
            [x + w - 1, y + h - 1],
        ]
        points_extreme_in_cropped_referential = self.get_points_in_cropped_referential(
            points_extreme, roi
        )
        [x_min, y_min] = points_extreme_in_cropped_referential[0]
        [x_min_padded, y_min_padded] = [
            max(x_min - self.pad_pixel, 0),
            max(y_min - self.pad_pixel, 0),
        ]
        [x_max, y_max] = points_extreme_in_cropped_referential[1]
        [x_max_padded, y_max_padded] = [
            min(x_max + self.pad_pixel, self.resolution[0] - 1),
            min(y_max + self.pad_pixel, self.resolution[1] - 1),
        ]

        points_foreground_refinement_in_cropped_referential = (
            self.get_points_in_cropped_referential(
                [point_center, *points_foreground_refinement], roi
            )
        )
        points_background_refinement_in_cropped_referential = (
            self.get_points_in_cropped_referential(points_background_refinement, roi)
        )
        points_background_in_cropped_referential = [
            [x_min_padded, y_min_padded],
            [x_max_padded, y_min_padded],
            [x_max_padded, y_max_padded],
            [x_min_padded, y_max_padded],
            *points_background_refinement_in_cropped_referential,
        ]
        points_in_cropped_referential = [
            points_foreground_refinement_in_cropped_referential,
            points_background_in_cropped_referential,
        ]

        sample["IOG_points"] = np.zeros(
            [self.resolution[0], self.resolution[1], 2], dtype=sample["gt"].dtype
        )
        for i in range(2):  # fg and bg
            for point in points_in_cropped_referential[i]:
                current_gaussian_point = helpers.make_gaussian(
                    self.resolution,
                    center=point,
                    sigma=self.sigma,
                )
                sample["IOG_points"][:, :, i] = np.maximum(
                    sample["IOG_points"][:, :, i],
                    current_gaussian_point,
                )
        del sample["point_center"]
        del sample["roi"]
        if "points_foreground_refinement" in sample:
            del sample["points_foreground_refinement"]
        if "points_background_refinement" in sample:
            del sample["points_background_refinement"]

        return sample

    def __str__(self):
        return (
            "IOGPoints:(sigma="
            + str(self.sigma)
            + ", pad_pixel="
            + str(self.pad_pixel)
            + ", elem="
            + str(self.elem)
            + ")"
        )


class ConcatInputs(object):
    def __init__(self, elems=("image", "point")):
        self.elems = elems

    def __call__(self, sample):

        res = sample[self.elems[0]]

        for elem in self.elems[1:]:
            assert sample[self.elems[0]].shape[:2] == sample[elem].shape[:2]

            # Check if third dimension is missing
            tmp = sample[elem]
            if tmp.ndim == 2:
                tmp = tmp[:, :, np.newaxis]

            res = np.concatenate((res, tmp), axis=2)

        sample["concat"] = res
        return sample

    def __str__(self):
        return "ExtremePoints:" + str(self.elems)


class CropFromMask(object):
    """
    Returns image cropped in bounding box from a given mask
    """

    def __init__(
        self,
        crop_elems=("image", "gt", "void_pixels"),
        mask_elem="gt",
        relax=0,
        zero_pad=False,
    ):

        self.crop_elems = crop_elems
        self.mask_elem = mask_elem
        self.relax = relax
        self.zero_pad = zero_pad

    def __call__(self, sample):
        _target = sample[self.mask_elem]
        if _target.ndim == 2:
            _target = np.expand_dims(_target, axis=-1)
        for elem in self.crop_elems:
            _img = sample[elem]
            _crop = []
            if self.mask_elem == elem:
                if _img.ndim == 2:
                    _img = np.expand_dims(_img, axis=-1)
                for k in range(0, _target.shape[-1]):
                    _tmp_img = _img[..., k]
                    _tmp_target = _target[..., k]
                    if np.max(_target[..., k]) == 0:
                        _crop.append(np.zeros(_tmp_img.shape, dtype=_img.dtype))
                    else:
                        _crop.append(
                            helpers.crop_from_mask(
                                _tmp_img,
                                _tmp_target,
                                relax=self.relax,
                                zero_pad=self.zero_pad,
                            )
                        )
            else:
                for k in range(0, _target.shape[-1]):
                    if np.max(_target[..., k]) == 0:
                        _crop.append(np.zeros(_img.shape, dtype=_img.dtype))
                    else:
                        _tmp_target = _target[..., k]
                        _crop.append(
                            helpers.crop_from_mask(
                                _img,
                                _tmp_target,
                                relax=self.relax,
                                zero_pad=self.zero_pad,
                            )
                        )
            if len(_crop) == 1:
                sample["crop_" + elem] = _crop[0]
            else:
                sample["crop_" + elem] = _crop

        return sample

    def __str__(self):
        return (
            "CropFromMask:(crop_elems="
            + str(self.crop_elems)
            + ", mask_elem="
            + str(self.mask_elem)
            + ", relax="
            + str(self.relax)
            + ",zero_pad="
            + str(self.zero_pad)
            + ")"
        )


class ToImage(object):
    """
    Return the given elements between 0 and 255
    """

    def __init__(self, norm_elem="image", custom_max=255.0):
        self.norm_elem = norm_elem
        self.custom_max = custom_max

    def __call__(self, sample):
        if isinstance(self.norm_elem, tuple):
            for elem in self.norm_elem:
                tmp = sample[elem]
                sample[elem] = (
                    self.custom_max
                    * (tmp - tmp.min())
                    / (tmp.max() - tmp.min() + 1e-10)
                )
        else:
            tmp = sample[self.norm_elem]
            sample[self.norm_elem] = (
                self.custom_max * (tmp - tmp.min()) / (tmp.max() - tmp.min() + 1e-10)
            )
        return sample

    def __str__(self):
        return "NormalizeImage"


class ToTensor(object):
    """Convert ndarrays in sample to Tensors."""

    def __call__(self, sample):

        for elem in sample.keys():
            if "meta" in elem:
                continue
            elif "bbox" in elem:
                tmp = sample[elem]
                sample[elem] = torch.from_numpy(tmp)
                continue

            tmp = sample[elem]

            if tmp.ndim == 2:
                tmp = tmp[:, :, np.newaxis]

            # swap color axis because
            # numpy image: H x W x C
            # torch image: C X H X W
            tmp = tmp.transpose((2, 0, 1))
            sample[elem] = torch.from_numpy(tmp)

        return sample

    def __str__(self):
        return "ToTensor"
