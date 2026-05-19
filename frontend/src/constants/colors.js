import { ASSET_SCAN_STATUS } from "./assetScanStatus";

export const STATUS_COLOR = {
  [ASSET_SCAN_STATUS.MATCHED]: "#d6fdd9",
  [ASSET_SCAN_STATUS.MISSING]: "#fff8e1",
  [ASSET_SCAN_STATUS.NEW]: "#ffe5e5"
};