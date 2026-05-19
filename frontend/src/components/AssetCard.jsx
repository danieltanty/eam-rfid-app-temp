import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  TextField,
  IconButton
} from "@mui/material";

import TagIcon from '@mui/icons-material/Tag';
import DescriptionIcon from "@mui/icons-material/Description";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

import { ASSET_SCAN_STATUS } from "../constants";
import { ASSET_STATUS_UI } from "../utils/assetStatusUI";

const AssetCard = ({
  asset,
  isSecondScan,
  onRemarkChange,
  onMarkAsMatched,
  onOpenModal
}) => {

    const [remark, setRemark] = useState(asset.remark || "");

    useEffect(() => {
        console.log('Setting remark: ', asset.remark)
        setRemark(asset.remark || "");
    }, [asset.remark]);

    const assetUI = ASSET_STATUS_UI[asset.scanStatus];

  return (
    <Card
      sx={{
        borderRadius: 3,
        background: "#fff",
        boxShadow: 3,
        borderLeft: `6px solid ${assetUI.color}`,
        backgroundColor: assetUI.cardColor
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2
        }}
      >
        <Box display="flex" flexDirection="column" gap={0.5} sx={{ width: "100%" }}>

          <Box display="flex" alignItems="center" gap={1}>
            <TagIcon fontSize="small" color={assetUI.iconColor} />
            <Typography fontWeight="bold" fontSize={16}>
              {asset.assetCode || "NEW ASSET"}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
            <DescriptionIcon fontSize="small" color={assetUI.iconColor} />
            <Typography variant="caption" color="text.secondary">
              {(asset.assetCode) ? asset.description : asset.rfidCode}
            </Typography>
          </Box>

        {(asset.scanStatus !== ASSET_SCAN_STATUS.NEW && asset.assetCode !== "") && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
            <LocationOnIcon fontSize="small" color={assetUI.iconColor} />
            <Typography variant="caption">
                {asset.zoneCode === "" ? "-" : asset.zoneCode}
            </Typography>
            </Box>
        )}

        {asset.zoneCode !== asset.currentZoneCode && asset.assetCode !== "" && asset.scanStatus !== ASSET_SCAN_STATUS.MATCHED && (
            <Box>
                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                    <LocationOnIcon fontSize="small" color={assetUI.iconColor} />
                    <Typography variant="caption" fontWeight="bold">
                    Original Zone: {asset.zoneCode}
                    </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                    <LocationOnIcon fontSize="small" color={assetUI.iconColor} />
                    <Typography variant="caption" color={assetUI.iconColor} fontWeight="bold">
                    Current Zone: {asset.currentZoneCode}
                    </Typography>
                </Box>
            </Box>
        )}

          {isSecondScan && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">
                Remark:
              </Typography>

              <TextField
                size="small"
                fullWidth
                value={remark}
                onChange={(e) => {
                    setRemark(e.target.value);
                }}
                onBlur={() => {
                    onRemarkChange(asset, remark);
                }}
              />
            </Box>
          )}

        <Chip
            icon={<assetUI.icon fontSize="small" />}
            label={assetUI.label}
            size="small"
            sx={{
            mt: 1.5,
            alignSelf: "start",
            backgroundColor: assetUI.bg,
            color: assetUI.color,
            fontWeight: 600
            }}
        />

          {!isSecondScan &&
            (asset.scanStatus === ASSET_SCAN_STATUS.NEW ||
              asset.scanStatus === ASSET_SCAN_STATUS.MISSING) &&
            asset.assetCode !== "" && (
              <Button
                size="small"
                variant="contained"
                sx={{ mt: 1 }}
                onClick={() => onMarkAsMatched(asset)}
              >
                <KeyboardReturnIcon sx={{ mr: 1 }} />
                Returned
              </Button>
            )}
        </Box>

        <IconButton onClick={() => onOpenModal(asset)}>
          <SearchIcon color={assetUI.iconColor} />
        </IconButton>
      </CardContent>
    </Card>
  );
};

export default React.memo(AssetCard);