import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { getWorkOrdersService, addWorkOrderScanService, updateWorkOrderStatusService, getWorkOrderByIdService } from "../services/workOrder.service.js";

export const getWorkOrders = asyncHandler(async (req, res) => {
  const {
    org,
    location,
    fromDate,
    toDate,
    workOrderId,
    status
  } = req.body;

  const data = await getWorkOrdersService(
    { org, location, fromDate, toDate, workOrderId, status },
    req.context
  );

  res.json(new ApiResponse({ data }));
});

export const getWorkOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "work order id is required");
  }

  const data = await getWorkOrderByIdService(
    { workOrderId: id },
    req.context
  );

  if (!data) {
    throw new ApiError(404, "Work order not found");
  }

  res.json(new ApiResponse({ data }));
});

export const addWorkOrderScan = asyncHandler(async (req, res) => {
  const {
    workOrderId,
    status,
    deviceName,
    deviceIp,
    remark,
    initiatedBy
  } = req.body;

  if (!workOrderId || !status) {
    throw new ApiError(400, "workOrderId and status are required");
  }

  const data = await addWorkOrderScanService(
    {
      workOrderId,
      status,
      deviceName,
      deviceIp: deviceIp ?? req.context?.clientIp,
      remark,
      initiatedBy
    },
    req.context
  );

  res.json(new ApiResponse({ data }));
});

export const updateWorkOrderStatus = asyncHandler(async (req, res) => {
  const { workOrderId, orgCode } = req.query;
  const { status } = req.body;

  if (!workOrderId || !orgCode) {
    throw new ApiError(400, "workOrderId and orgCode are required");
  }

  if (!status) {
    throw new ApiError(400, "status is required");
  }

  const data = await updateWorkOrderStatusService(
    { workOrderId, orgCode, status },
    req.context
  );

  res.json(new ApiResponse({ data }));
});