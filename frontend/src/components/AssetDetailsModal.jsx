import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  CircularProgress
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";

import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { fetchAssetImage } from "../api/asset";
import AssetImage from "../assets/loading_logo.jpg";

const renderText = (text) => { return text === "" || text === undefined ? "-" : text };

export default function AssetDetailsModal({ open, onClose, asset }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [imageSrc, setImageSrc] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!asset?.profilePicture) {
        setImageSrc(null);
        return;
      }

      try {
        setLoadingImage(true);

        const data = await fetchAssetImage(asset.profilePicture);

        if (data?.imageUrl) {
          setImageSrc(data?.imageUrl);
        } else {
          setImageSrc(null);
        }

      } catch (err) {
        console.error("Failed to load image:", err);
        setImageSrc(null);
      } finally {
        setLoadingImage(false);
      }
    };

    if (open) {
      loadImage();
    }
  }, [asset, open]);

  if (!asset) return null;

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth sx={{ margin: 1 }}
      slotProps={{
        paper: {
          sx: { borderRadius: 1 }
        }
      }}
      disableRestoreFocus
    >
      <DialogTitle sx={{ display:"flex", justifyContent:"space-between", backgroundColor: "#f5f5f5", p: 3, paddingBottom: 2 }}>
        <Typography variant="h5" component="span" sx={{ alignItems: 'center' }}>
          Asset Details
        </Typography>

        <IconButton onClick={onClose} size="small">
          <CloseIcon/>
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ backgroundColor: "#f5f5f5", p: 3 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid #eee",
            mb: 2,
            display: "flex",
            gap: 2,
            alignItems: "center",
            backgroundColor: "white"
          }}
        >
          {loadingImage && <CircularProgress />}

          {!loadingImage && (<Box
            component="img"
            src={imageSrc ?? AssetImage}
            alt="asset"
            sx={{
              width: 80,
              height: 80,
              objectFit: "contain",
              borderRadius: 1,
              border: "1px solid #eee",

            }}
          />)}

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {asset.assetCode === "" ? "NEW ASSET" : asset.assetCode}
            </Typography>

            <Typography variant="caption" color="text.secondary" component="div">
              {renderText(asset.description)}
            </Typography>

            <Chip
              component="div"
              label={renderText(asset.status)}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        <Accordion defaultExpanded style={{ marginBottom: 1, marginTop: 0 }}>
          <AccordionSummary style={{ minHeight: 50 }} expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body1">
              📑 Information
            </Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Info label="Organization" value={asset.organization} />
            <Info label="Location" value={asset.location} />
            <Info label="Zone" value={asset.zone} />
            <Info label="Department" value={asset.department} />
            <Info label="Commission Date" value={asset.commissionDate} />
            <Info label="RFID Code" value={asset.rfidCode === "" ? asset.newRfidCode : asset.rfidCode} />
          </AccordionDetails>
        </Accordion>

      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }) {
  return (
    <Box mb={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="body1">
        {value || "-"}
      </Typography>
    </Box>
  );
}