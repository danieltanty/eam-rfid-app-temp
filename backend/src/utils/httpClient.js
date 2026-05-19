import logger from "../config/logger.js";
import { ApiError } from "./apiError.js";

export async function safeRequest(promise) {
  try {
    const res = await promise;
    return res;
  } catch (err) {
    logger.error(`ApiError: ${err.response?.data}`);
    throw new ApiError(
      err.response?.status || 500,
      err.response?.data?.ErrorAlert?.[0]?.Message ||
      err.message ||
      "HxGN service error"
    );
  }
}