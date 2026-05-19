import express from "express";
import pkg from "../../package.json" with { type: "json" };
import { getEamHealth } from "../controllers/health.controller.js";

const router = express.Router();

router.get("/eam", getEamHealth);

router.get('/app-info', (req, res) => {
  res.json({
    description: pkg.description
  });
});

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "OK",
      uptime: `${Math.floor(process.uptime())}s`
    },
    message: ""
  });
});

export default router;