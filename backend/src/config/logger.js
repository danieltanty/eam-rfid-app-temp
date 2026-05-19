import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const logDir = path.resolve("logs");
const auditDir = path.join(logDir, ".audit");
const combinedDir = path.join(logDir, "combined");
const errorDir = path.join(logDir, "error");

[logDir, auditDir, combinedDir, errorDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ""
    }`;
  })
);

const dailyTransport = new DailyRotateFile({
  filename: path.join(combinedDir, "combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  auditFile: path.join(auditDir, "combined-audit.json")
});

const errorTransport = new DailyRotateFile({
  filename: path.join(errorDir, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
  auditFile: path.join(auditDir, "error-audit.json")
});

const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    dailyTransport,
    errorTransport,
    new winston.transports.Console()
  ]
});

export default logger;