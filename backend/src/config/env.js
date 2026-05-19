import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DEV_ENV: process.env.DEV_ENV,

  JWT_SECRET: process.env.JWT_SECRET || "burn1million",

  EAM_BASE_URL: process.env.EAM_BASE_URL,
  EAM_TENANT: process.env.EAM_TENANT,
  EAM_ORG: process.env.EAM_ORG,
  EAM_USERNAME: process.env.EAM_USERNAME,
  EAM_PASSWORD: process.env.EAM_PASSWORD,
  
  USER_INFO_GRID_ID: process.env.USER_INFO_GRID_ID,
  USER_INFO_GRID_NAME: process.env.USER_INFO_GRID_NAME,
  
  ASSET_DETAILS_GRID_ID: process.env.ASSET_DETAILS_GRID_ID,
  ASSET_DETAILS_GRID_NAME: process.env.ASSET_DETAILS_GRID_NAME,
  
  ASSET_METADATA_GRID_ID : process.env.ASSET_METADATA_GRID_ID,
  ASSET_METADATA_GRID_NAME: process.env.ASSET_METADATA_GRID_NAME,
  
  WO_DETAILS_GRID_ID: process.env.WO_DETAILS_GRID_ID,
  WO_DETAILS_GRID_NAME: process.env.WO_DETAILS_GRID_NAME,
  
  ASSET_SCAN_GRID_ID: process.env.ASSET_SCAN_GRID_ID,
  ASSET_SCAN_GRID_NAME: process.env.ASSET_SCAN_GRID_NAME,
};