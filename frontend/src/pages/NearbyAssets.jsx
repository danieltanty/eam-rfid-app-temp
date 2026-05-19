import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Box, Typography, TextField, IconButton,
  Card,
  CardContent,
  Button,
  Chip,
  Skeleton
} from "@mui/material";

import TagIcon from "@mui/icons-material/Tag";
import DescriptionIcon from "@mui/icons-material/Description";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SensorsIcon from "@mui/icons-material/Sensors";

import AssetDetailsModal from "../components/AssetDetailsModal";
import NewAssetModal from "../components/NewAssetModal";

import { scanAssetsByRfid } from "../api/asset";
import { ASSET_SCAN_STATUS } from "../constants";
import { AssetCardSkeleton } from "../components/Skeletons";
import { ASSET_STATUS_UI } from "../utils/assetStatusUI";

const isNewAsset = (asset) => asset.isNew === true || asset.scanStatus === ASSET_SCAN_STATUS.NEW;

export default function NearbyAssets() {

  const assetsSetRef = useRef(new Set());

  const scanBufferRef = useRef("");
  const scanTimeoutRef = useRef(null);

  const [assets, setAssets] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openNewAsset, setOpenNewAsset] = useState(false);
  const [pendingRFID, setPendingRFID] = useState(null);

  const normalize = (code) => (code || "").toUpperCase();

  useEffect(() => {
    assetsSetRef.current = new Set(
      assets.map(a => normalize(a.rfidCode))
    );
  }, [assets]);

  const stats = useMemo(() => {
    let found = 0;
    let newCount = 0;

    assets.forEach((a) => {
      if (a.scanStatus === ASSET_SCAN_STATUS.FOUND) {
        found++;
      }

      if (a.scanStatus === ASSET_SCAN_STATUS.NEW) {
        newCount++;
      }
    });

    return {
      found,
      new: newCount,
    };
  }, [assets]);

  const visibleAssets = useMemo(() => {
    let data = assets;

    if (statusFilter) {
      data = data.filter(
        (a) => a.scanStatus === statusFilter
      );
    }

    const priority = {
      [ASSET_SCAN_STATUS.NEW]: 0,
      [ASSET_SCAN_STATUS.FOUND]: 1,
    };

    return [...data].sort(
      (a, b) =>
        (priority[a.scanStatus] ?? 99) -
        (priority[b.scanStatus] ?? 99)
    );
  }, [assets, statusFilter]);

  const toggleFilter = (status) => {
    setStatusFilter((prev) =>
      prev === status ? null : status
    );
  };

  const handleInspect = (asset) => {
    if (isNewAsset(asset)) {
      setPendingRFID(asset.rfidCode);
      setOpenNewAsset(true);
      return;
    }

    setSelectedAsset(asset);
    setOpenModal(true);
  };

  const handleReset = () => {
    setAssets([]);

    assetsSetRef.current.clear();
  };

  const refreshSingleRFID = async (rfidCode) => {
    try {
      setLoading(true);
      const res = await scanAssetsByRfid([rfidCode]);
      const resolved = res || [];

      if (resolved.length === 0) return;

      const updatedAsset = resolved[0];

      setAssets((prev) => {
        const map = new Map(
          prev.map((a) => [a.rfidCode?.toUpperCase(), a])
        );

        const code = rfidCode.toUpperCase();

        map.set(code, {
          ...map.get(code),
          ...updatedAsset,
          isNew: false,
          scanStatus: ASSET_SCAN_STATUS.FOUND
        });

        return Array.from(map.values());
      });

    } catch (err) {
      console.error("Failed to refresh RFID:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      document.activeElement &&
      typeof document.activeElement.blur === "function"
    ) {
      document.activeElement.blur();
    }

    const bufferRef = scanBufferRef;
    const timeoutRef = scanTimeoutRef;

    let lastKeyTime = 0;

    const handleKeyDown = (e) => {
      const now = Date.now();
      const diff = now - lastKeyTime;

      lastKeyTime = now;

      const isScannerInput = diff < 30;

      if (isScannerInput) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === "Enter") {
        if (bufferRef.current.length > 0) {
          processScan(bufferRef.current);
          bufferRef.current = "";
        }
        return;
      }

      if (e.key.length > 1) return;

      bufferRef.current += e.key;

      clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length > 0) {
          processScan(bufferRef.current);
          bufferRef.current = "";
        }
      }, 300);
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const processScan = async (raw) => {
    let codes = [
      ...new Set(
        raw
          .split(/[\n,]+/)
          .map(c => c.trim().toUpperCase())
          .filter(c => c.length >= 24)
      )
    ];

    codes = codes.filter(
      code => !assetsSetRef.current.has(code)
    );

    if (codes.length === 0) {
      console.log("No new RFIDs to process");
      return;
    }

    console.log("Detected RFID Code:", codes);

    setLoading(true);

    try {
      const res = await scanAssetsByRfid(codes);
      const found = res?.map(r => ({
        ...r,
        scanStatus: ASSET_SCAN_STATUS.FOUND
      })) || [];

      const foundCodes = new Set(
        found.map(a => normalize(a.rfidCode))
      );

      const newAssets = codes
        .filter(code => !foundCodes.has(code))
        .map(code => ({
          id: `new-${code}`,
          rfidCode: code,
          assetCode: "NEW ASSET",
          description: "-",
          zone: "-",
          scanStatus: ASSET_SCAN_STATUS.NEW,
          isNew: true
        }));

      setAssets((prev) => {
        const map = new Map();

        prev.forEach(a => {
          map.set(normalize(a.rfidCode), a);
        });

        found.forEach(a => {
          map.set(normalize(a.rfidCode), a);
        });

        newAssets.forEach(a => {
          map.set(normalize(a.rfidCode), a);
        });

        return Array.from(map.values());
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" fontWeight="bold">
        Nearby Assets Scan
      </Typography>
      
      <Card
        sx={{
          mt: 2,
          mb: 2,
          borderRadius: 3,
          background:
            "linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%)",
          border: "1px solid #cbd5e1",
          boxShadow: 1,
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            py: 1.5,
            "&:last-child": {
              pb: 1.5,
            },
          }}
        >
          <SensorsIcon
            sx={{
              color: "#475569",
              fontSize: 32,
              animation: "scannerPulse 1.8s infinite",
              "@keyframes scannerPulse": {
                "0%": {
                  transform: "scale(1)",
                  opacity: 1,
                },
                "50%": {
                  transform: "scale(1.15)",
                  opacity: 0.6,
                },
                "100%": {
                  transform: "scale(1)",
                  opacity: 1,
                },
              },
            }}
          />
          
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#334155" }}
            >
              Press scanner trigger to scan assets
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {visibleAssets.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={handleReset}
            disabled={loading}
          >
            <RestartAltIcon sx={{ mr: 1 }} /> Reset
          </Button>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
        {visibleAssets.length > 0 && (
          <>
            <Typography variant="body1" sx={{ mt: 2 }} fontWeight="bold">
              Total Scanned: {loading ? <Skeleton width={40} /> : assets.length ?? 0}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 2 }}>

              <Box
                onClick={() =>
                  toggleFilter(ASSET_SCAN_STATUS.FOUND)
                }
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  textAlign: "center",
                  backgroundColor:
                    statusFilter === ASSET_SCAN_STATUS.FOUND
                      ? ASSET_STATUS_UI[ASSET_SCAN_STATUS.FOUND].bg
                      : "#fff",
                  cursor: "pointer",
                  boxShadow: 1,
                }}
              >
                <Typography variant="caption">
                  Found
                </Typography>

                <Typography
                  fontWeight="bold"
                  color="primary"
                >
                  {stats.found}
                </Typography>
              </Box>

              <Box
                onClick={() =>
                  toggleFilter(ASSET_SCAN_STATUS.NEW)
                }
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  textAlign: "center",
                  backgroundColor:
                    statusFilter === ASSET_SCAN_STATUS.NEW
                      ? ASSET_STATUS_UI[ASSET_SCAN_STATUS.NEW].bg
                      : "#fff",
                  cursor: "pointer",
                  boxShadow: 1,
                }}
              >
                <Typography variant="caption">
                  New
                </Typography>

                <Typography
                  fontWeight="bold"
                  color="error.main"
                >
                  {stats.new}
                </Typography>
              </Box>

            </Box>
          </>
        )}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <AssetCardSkeleton key={i} />
          ))
        ) : (
          visibleAssets.map((asset) => {
            const assetUI = ASSET_STATUS_UI[asset.scanStatus];
            return (
              <Card
                key={asset.id ?? asset.rfidCode}
                sx={{
                  borderRadius: 3,
                  boxShadow: 2,
                  borderLeft: `6px solid ${assetUI.color}`,
                  backgroundColor: assetUI.cardColor,
                  transition: "0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4
                  }
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={0.5} sx={{ width: "100%" }}>

                    <Box display="flex" alignItems="center" gap={1}>
                      <TagIcon fontSize="small" sx={{ color: assetUI.color }} />
                      <Typography fontWeight="bold">
                        {asset.assetCode || ""}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                      <DescriptionIcon fontSize="small" sx={{ color: assetUI.color }} />
                      <Typography variant="body2" color="text.secondary">
                        {asset.description === "-" ? asset.rfidCode : asset.description}
                      </Typography>
                    </Box>

                    {(asset.scanStatus !== ASSET_SCAN_STATUS.NEW) && (
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                        <LocationOnIcon fontSize="small" sx={{ color: assetUI.color }} />
                        <Typography variant="caption">
                          {asset.zone || "-"}
                        </Typography>
                      </Box>
                    )}

                    {isNewAsset(asset) && (
                      <Chip
                        icon={<assetUI.icon fontSize="small" />}
                        label={assetUI.label}
                        size="small"
                        component="div"
                        sx={{
                          mt: 1.5,
                          alignSelf: "start",
                          backgroundColor: assetUI.bg,
                          color: assetUI.color,
                          fontWeight: 600
                        }}
                      />
                    )}

                  </Box>

                  {isNewAsset(asset) ? (
                    <IconButton 
                      onClick={() => {
                        setPendingRFID(asset.rfidCode);
                        setOpenNewAsset(true);
                      }}
                    >
                      <AddIcon color="error" />
                    </IconButton>
                  ) : (
                    <IconButton onClick={() => handleInspect(asset)}>
                      <SearchIcon color="primary" />
                    </IconButton>
                  )}

                </CardContent>
              </Card>
            )
          })
        )}
      </Box>

      <AssetDetailsModal
        open={openModal}
        asset={selectedAsset}
        onClose={() => setOpenModal(false)}
      />

      <NewAssetModal
        open={openNewAsset}
        rfidCode={pendingRFID}
        onClose={() => setOpenNewAsset(false)}
        onSuccess={async () => {
          setOpenNewAsset(false);

          if (pendingRFID) {
            await refreshSingleRFID(pendingRFID);
            setPendingRFID(null);
          }
        }}
      />
    </Box>
  );
}