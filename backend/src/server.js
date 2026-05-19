import app from "./app.js";
import { ENV } from "./config/env.js";
import logger from "./config/logger.js";

app.listen(ENV.PORT, "0.0.0.0", () => {
  logger.info(`EAM RFID APP is running on port ${ENV.PORT}`);
  logger.info(`HxGN EAM Tenant: ${ENV.EAM_TENANT}`);
});