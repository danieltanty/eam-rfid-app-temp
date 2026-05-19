import express from "express";
import { getWorkOrders, addWorkOrderScan, updateWorkOrderStatus, getWorkOrderById } from "../controllers/workOrder.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/scan", authMiddleware, addWorkOrderScan);

router.patch("/status", authMiddleware, updateWorkOrderStatus);

router.get("/:id", authMiddleware, getWorkOrderById);

router.post("/", authMiddleware, getWorkOrders);

export default router;