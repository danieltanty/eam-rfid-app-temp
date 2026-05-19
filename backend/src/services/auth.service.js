import { getUserFromGrid, updateLoginAttempts } from "./user.service.js";
import { signToken } from "../lib/jwt.js";
import { ApiError } from "../utils/apiError.js";
import { isExpired } from "../utils/date.util.js";
import { eamClient } from "../lib/axios.js";
import { safeRequest } from "../utils/httpClient.js";
import { eamRequest } from "../lib/eamRequest.js";
import { buildUDSRequest, UDSField } from "../lib/userDefinedScreenBuilder.js";
import { v4 as uuidv4 } from "uuid";

export async function loginService({ username, password }, context) {
  const user = await getUserFromGrid(username, context);

  const maxAttempts = user.maxLoginAttempts || 5;

  const logAttempt = async (status) => {
    try {
      await logLoginService(
        {
          username,
          deviceName: context?.deviceName,
          deviceIp: context?.clientIp,
          loginStatus: status
        },
        context
      );
    } catch (err) {
      console.error("Login audit failed:", err.message);
    }
  };

  if (user.lockedDate) {
    await logAttempt("FAILED");
    throw new ApiError(403, "Account is locked");
  }

  if (isExpired(user.userExpire)) {
    await logAttempt("FAILED");
    throw new ApiError(403, "User account is expired");
  }

  if (isExpired(user.passExpire)) {
    await logAttempt("FAILED");
    throw new ApiError(403, "Password is expired");
  }

  if (password !== user.password) {
    const newAttempts = (user.loginAttempts || 0) + 1;

    const shouldLock = newAttempts >= maxAttempts;

    await updateLoginAttempts(
      username,
      {
        attempts: newAttempts,
        lock: shouldLock
      },
      context
    );

    await logAttempt("FAILED");

    if (shouldLock) {
      throw new ApiError(
        403,
        "Account locked due to too many failed attempts"
      );
    }

    throw new ApiError(401, "Invalid username or password");
  }

  if ((user.loginAttempts || 0) > 0) {
    await updateLoginAttempts(
      username,
      {
        attempts: 0,
        lock: false
      },
      context
    );
  }

  const token = signToken({
    username: user.username,
    description: user.description
  });

  await logAttempt("SUCCESS");

  return {
    token,
    username: user.username,
    description: user.description
  };
}

export async function logLoginService(
  { username, deviceName, deviceIp, loginStatus },
  context
) {
  const requestBody = buildUDSRequest({
    screenName: "UULOGA",
    action: "ADD",
    fields: [
      UDSField.text("UUID", uuidv4().toUpperCase()),
      UDSField.text("USERNAME", username),
      UDSField.text("DEVICENAME", deviceName || ""),
      UDSField.text("DEVICEIP", deviceIp || context?.clientIp || ""),
      UDSField.text("LOGINSTATUS", loginStatus)
    ]
  });

  const res = await safeRequest(
    eamClient.post(
      "/userdefinedscreenservices",
      requestBody,
      eamRequest(context)
    )
  );

  return {
    success: true,
    message:
      res.data?.Result?.InfoAlert?.Message || "Login log saved",
    record:
      res.data?.Result?.ResultData?.UserDefinedScreenService
  };
}