import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { saveWorkOrderScanResultService, getWorkOrderScanAssetsService } from "../services/workOrderScan.service.js";

export const saveWorkOrderScanResult = asyncHandler(async (req, res) => {
  const { workOrderId, zone } = req.params;

  const body = req.body;
  const initiatedBy = body.initiatedBy;
  let assets = body.assets;

  if (!assets.length) {
    throw new ApiError(400, "No scan data provided");
  }

  assets = assets.map(s => ({
    ...s,
    workOrderId,
    initiatedBy,
    zoneCode: zone
  }));

  const results = await saveWorkOrderScanResultService(assets, req.context);

  res.json(
    new ApiResponse({
      data: results,
      message: `${assets?.length} assets saved`
    })
  );
});

export const getWorkOrderScanAssets = asyncHandler(async (req, res) => {
  const { workOrderId, scanSeq } = req.query;

  if (!workOrderId) {
    throw new ApiError(400, "workOrderId is required");
  }

  const data = await getWorkOrderScanAssetsService(
    { workOrderId, scanSeq },
    req.context
  );

  res.json(new ApiResponse({ data }));
});