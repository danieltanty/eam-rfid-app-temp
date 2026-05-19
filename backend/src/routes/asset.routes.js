import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import { getAsset, searchAssets, scanAssetsByRFID, getAssetMetadata, getProfilePicture } from "../controllers/asset.controller.js";
import { getAssetDetails, getAssetsByZone, updateAssetRFID } from "../controllers/asset.controller.js";

const router = express.Router();

router.post("/rfid/scan", authMiddleware, scanAssetsByRFID);

router.patch("/rfid", authMiddleware, updateAssetRFID);

router.get("/search", authMiddleware, searchAssets);

router.get("/details", authMiddleware, getAssetDetails);

router.get("/metadata", authMiddleware, getAssetMetadata);

router.get("/zone/:zone", authMiddleware, getAssetsByZone);

router.get("/profile-picture", authMiddleware, getProfilePicture);

router.get("/", authMiddleware, getAsset);

export default router;