import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

const swaggerDoc = YAML.load(path.resolve("src/docs/swagger.yaml"));

export const swaggerSetup = [
  swaggerUi.serve,
  swaggerUi.setup(swaggerDoc, {
    customSiteTitle: "EAM RFID API",
    customCssUrl: "/swagger/swagger-custom.css",
    customJs: "/swagger/swagger-custom.js",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  })
];