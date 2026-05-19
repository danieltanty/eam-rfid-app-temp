import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { ENV } from "./config/env.js";
import { apiLimiter } from "./config/rateLimit.js";
import { swaggerSetup } from "./config/swagger.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { contextMiddleware } from "./middlewares/context.middleware.js";

import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../public");

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  })
);

app.set("trust proxy", false);

app.use(contextMiddleware);

app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth")) return next();
  return apiLimiter(req, res, next);
});
app.use("/api", routes);

app.use("/swagger", express.static("src/docs/swagger-assets"));
app.use("/swagger", ...swaggerSetup);

app.use(express.static(frontendPath));

app.get(/^\/(?!api|swagger).*/, (req, res) => { 
  res.sendFile(path.join(frontendPath, "index.html")); 
});

app.use(errorHandler);

export default app;