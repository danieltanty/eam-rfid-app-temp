import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getWorkOrderScanAssets, saveWorkOrderScanResult } from "../controllers/workOrderScan.controller.js";

const router = express.Router();

router.post("/work-order/:workOrderId/zone/:zone/save-result", authMiddleware, saveWorkOrderScanResult);

router.get("/assets", authMiddleware, getWorkOrderScanAssets);

export default router;