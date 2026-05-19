import logger from "../config/logger.js";

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  const logPayload = {
    method: req.method,
    path: req.originalUrl,
    status: statusCode,
    batch: req.context?.batch,
    batchSeq: (req.context?.sequence?.value ?? 1) - 1,
    username: req.context?.username,
    message: err.message,
  };

  if (statusCode >= 500) {
    logger.error("", {
      ...logPayload,
      stack: err.stack,
    });
  } 
  else {
    logger.info("", logPayload);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
}