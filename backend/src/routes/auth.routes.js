import express from "express";
import { login, logLogin } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/log-login", logLogin);

router.post("/login", login);

export default router;