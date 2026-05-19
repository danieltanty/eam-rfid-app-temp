import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";

import { ASSET_SCAN_STATUS } from "../constants";

export const ASSET_STATUS_UI = {
  [ASSET_SCAN_STATUS.MATCHED]: {
    cardColor: "#fbfffb",
    iconColor: "success",
    color: "#2e7d32",
    bg: "#e8f5e9",
    icon: CheckCircleIcon,
    label: "Matched",
  },

  [ASSET_SCAN_STATUS.MISSING]: {
    cardColor: "#fcf9f5",
    iconColor: "warning",
    color: "#ed6c02",
    bg: "#fff3e0",
    icon: WarningAmberIcon,
    label: "Missing",
  },

  [ASSET_SCAN_STATUS.NEW]: {
    cardColor: "#fff5f4",
    iconColor: "error",
    color: "#d32f2f",
    bg: "#fdecea",
    icon: NewReleasesIcon,
    label: "New",
  },

  [ASSET_SCAN_STATUS.FOUND]: {
    cardColor: "#ffffff",
    iconColor: "primary",
    color: "#004b8f",
    bg: "#e3f2fd",
    icon: WarningAmberIcon,
    label: "Found",
  },
};