import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { getAssetMetadataService, getAssetService, scanAssetsByRFIDService, searchAssetsService, updateAssetRFIDService } from "../services/asset.service.js";
import { getDocumentService } from "../services/document.service.js";

export const getProfilePicture = asyncHandler(async (req, res) => {
  const { documentCode } = req.query;

  if (!documentCode) {
    throw new ApiError(400, "documentCode is required");
  }

  const result = await getDocumentService(
    { documentCode },
    req.context
  );

  if (!result) {
    throw new ApiError(404, "Image not found");
  }

  res.json(new ApiResponse({
    data: {
      imageUrl: result.dataUrl,
      mimeType: result.mimeType
    }
  }));
});

export const getAsset = asyncHandler(async (req, res) => {
  const { assetCode, orgCode } = req.query;

  if (!assetCode || !orgCode) {
    throw new ApiError(400, "assetCode and orgCode are required");
  }

  const data = await getAssetService(
    { assetCode, orgCode },
    req.context
  );

  res.json(new ApiResponse({ data }));
});

export const getAssetDetails = asyncHandler(async (req, res) => {
  const { assetCode, orgCode } = req.query;

  if (!assetCode || !orgCode) {
    throw new ApiError(400, "assetCode and orgCode are required");
  }

  const asset = await getAssetService({ assetCode, orgCode }, req.context);

  if (!asset) {
    throw new ApiError(404, "Asset not found");
  }

  let image = null;

  if (asset?.profilePicture) {
    const [img] = await Promise.all([
      getDocumentService(
        { documentCode: asset.profilePicture },
        req.context
      ).catch(() => null)
    ]);

    image = img;
  }

  res.json(
    new ApiResponse({
      data: {
        ...asset,
        image
      }
    })
  );
});

export const getAssetsByZone = asyncHandler(async (req, res) => {
  const { zone } = req.params;

  if (!zone) {
    throw new ApiError(400, "zone is required");
  }

  const data = await searchAssetsService(
    { zone },
    req.context
  );

  res.json(new ApiResponse({ data }));
});

export const searchAssets = asyncHandler(async (req, res) => {
  const {
    zone,
    orgCode,
    assetCode,
    rfidCode
  } = req.query;

  const data = await searchAssetsService(
    { zone, orgCode, assetCode, rfidCode },
    req.context
  );

  res.json(new ApiResponse({ data }));
});

export const scanAssetsByRFID = asyncHandler(async (req, res) => {
  const { rfidCodes, org } = req.body;

  if (!rfidCodes || !Array.isArray(rfidCodes) || rfidCodes.length === 0) {
    throw new ApiError(400, "rfidCodes array is required");
  }

  const result = await scanAssetsByRFIDService({ rfidCodes, org }, req.context);

  res.json(new ApiResponse({
    data: result.assets,
    message: ""
  }));
});

export const getAssetMetadata = asyncHandler(async (req, res) => {
  const data = await getAssetMetadataService(req.context);

  res.json(new ApiResponse({ data }));
});

export const updateAssetRFID = asyncHandler(async (req, res) => {
  const { assetCode, orgCode } = req.query;

  const {
    location,
    zone,
    rfidCode
  } = req.body;

  if (!assetCode || !orgCode) {
    throw new ApiError(400, "assetCode and orgCode are required");
  }

  if (!rfidCode) {
    throw new ApiError(400, "rfidCode is required");
  }

  const data = await updateAssetRFIDService(
    {
      assetCode,
      orgCode,
      location,
      zone,
      rfidCode
    },
    req.context
  );

  res.json(new ApiResponse({ data }));
});