import express from "express";

import authRoutes from "./auth.routes.js";
import workOrderRoutes from "./workOrder.routes.js";
import assetRoutes from "./asset.routes.js";
import workOrderScanRoutes from "./workOrderScan.routes.js";
import healthRoutes from "./health.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);

router.use("/work-order", workOrderRoutes);

router.use("/asset", assetRoutes);

router.use("/work-order-scan", workOrderScanRoutes);

router.use("/health", healthRoutes);

export default router;