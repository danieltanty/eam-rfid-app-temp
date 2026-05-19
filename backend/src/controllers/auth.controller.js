import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { loginService, logLoginService } from "../services/auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "username and password are required");
  }

  if (req.context) {
    req.context.username = username;
  }

  const data = await loginService(
    { username, password },
    req.context
  );

  res.json(new ApiResponse({ data }));
});

export const logLogin = asyncHandler(async (req, res) => {
  const {
    username,
    deviceName,
    deviceIp,
    loginStatus
  } = req.body;

  if (!username || !loginStatus) {
    throw new ApiError(400, "username and loginStatus are required");
  }

  const data = await logLoginService(
    {
      username,
      deviceName,
      deviceIp,
      loginStatus
    },
    req.context
  );

  res.json(new ApiResponse({ data }));
});