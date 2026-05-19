import { HTTP_EVENT_TYPES } from "../constants/httpEventTypes.js";
import logger from "../config/logger.js";

export function contextMiddleware(req, res, next) {
  if (!req.originalUrl.startsWith("/api")) {
    return next();
  }

  const startTime = Date.now();

  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    req.ip;

  const batch = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  req.context = {
    method: req.method,
    path: req.originalUrl,
    clientIp,
    startTime,
    batch,
    sequence: { value: 1 }
  };

  logger.info(HTTP_EVENT_TYPES.REQ_IN, {
    ip: clientIp,
    method: req.method,
    path: req.originalUrl,
    batch,
    batchSeq: req.context?.sequence?.value ?? 1,
    username: req.context?.username
  })

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info(HTTP_EVENT_TYPES.RES_OUT, {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration,
      batch: req.context?.batch,
      batchSeq: (req.context?.sequence?.value ?? 1) - 1,
      username: req.context?.username
    })
  });

  next();
}