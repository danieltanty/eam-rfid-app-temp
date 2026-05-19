import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import TagIcon from "@mui/icons-material/Tag";
import DescriptionIcon from "@mui/icons-material/Description";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import AddIcon from "@mui/icons-material/Add";
import SensorsIcon from "@mui/icons-material/Sensors";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import AssetDetailsModal from "../components/AssetDetailsModal";
import NewAssetModal from "../components/NewAssetModal";

import { processRFIDScanWithBackend } from "../services/rfidProcessor";

import { ASSET_SCAN_STATUS, WorkOrderStatus } from "../constants";
import { useUIStore } from "../store";
import { ASSET_STATUS_UI } from "../utils/assetStatusUI";

import {
  fetchAssetsByZone,
  mapAssets,
  scanAssetsByRfid,
} from "../api/asset";

import {
  fetchWorkOrderById,
  createWorkOrderScan,
} from "../api/workOrder";

import {
  saveWorkOrderScanResult,
} from "../api/workOrderScan";

import { getDeviceName } from "../utils/device";

import {
  AssetCardSkeleton,
  StatsSkeleton,
} from "../components/Skeletons";
import { getLoggedInUsername } from "../utils/auth";

const getScanType = (status) => {
  if (status === WorkOrderStatus.FIRST_SCAN_IN_PROGRESS) {
    return "firstScan";
  }

  if (status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS) {
    return "secondScan";
  }

  return null;
};

const getInitialZone = (zones, scanType) => {
  if (!zones) return "";

  if (scanType === "firstScan") {
    return zones.find((z) => Number(z.status) === 0)?.id || "";
  }

  if (scanType === "secondScan") {
    return zones.find((z) => Number(z.status) < 2)?.id || "";
  }

  return "";
};

const PerformInventoryCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const selectedZoneRef = useRef("");
  const tableDataRef = useRef([]);
  const scanBufferRef = useRef("");
  const scanTimeoutRef = useRef(null);

  const [workOrder, setWorkOrder] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [openNewAsset, setOpenNewAsset] = useState(false);
  const [pendingRFID, setPendingRFID] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openAssetModal, setOpenAssetModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  
  const showConfirmDialog = useUIStore((state) => state.showConfirmDialog);

  useEffect(() => {
    selectedZoneRef.current = selectedZone;
  }, [selectedZone]);

  useEffect(() => {
    tableDataRef.current = tableData;
  }, [tableData]);

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
        bufferRef.current += "\n";

        clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
          if (bufferRef.current.length > 0) {
            processBufferedScan();
          }
        }, 300);

        return;
      }

      if (e.key.length > 1) return;

      bufferRef.current += e.key;

      clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length > 0) {
          processBufferedScan();
        }
      }, 300);
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const loadWorkOrder = async () => {
      try {
        setLoading(true);

        const raw = await fetchWorkOrderById(id);

        setWorkOrder(raw);

        const scanType = getScanType(raw?.status);
        const initialZone = getInitialZone(raw?.zone, scanType);

        setSelectedZone(initialZone);
      } catch (err) {
        console.error("Failed to load work order:", err);
      }
    };

    loadWorkOrder();
  }, [id]);

  const scanType = getScanType(workOrder?.status);
  const allZones = workOrder?.zone || [];

  useEffect(() => {
    const loadAssets = async () => {
      if (!selectedZone) return;

      try {
        setLoading(true);

        const raw = await fetchAssetsByZone(selectedZone);
        const mapped = mapAssets(raw, selectedZone);

        setTableData(mapped);
      } catch (err) {
        console.error("Failed to fetch assets:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [selectedZone]);

  const visibleAssets = useMemo(() => {
    let data = tableData;

    if (statusFilter) {
      data = data.filter(
        (a) => a.scanStatus === statusFilter
      );
    }

    const priority = {
      [ASSET_SCAN_STATUS.NEW]: 0,
      [ASSET_SCAN_STATUS.MISSING]: 1,
    };

    return [...data].sort(
      (a, b) =>
        (priority[a.scanStatus] ?? 99) -
        (priority[b.scanStatus] ?? 99)
    );
  }, [tableData, statusFilter]);

  const stats = useMemo(() => {
    let matched = 0;
    let missing = 0;
    let newCount = 0;
    let totalFound = 0;

    tableData.forEach((a) => {
      if (a.scanStatus === ASSET_SCAN_STATUS.MATCHED) {
        matched++;
        totalFound++;
      }

      if (a.scanStatus === ASSET_SCAN_STATUS.MISSING) missing++;

      if (a.scanStatus === ASSET_SCAN_STATUS.NEW) {
        newCount++;
        totalFound++;
      }
    });

    return {
      matched,
      missing,
      new: newCount,
      totalFound
    };
  }, [tableData]);

  const processBufferedScan = async () => {
    const raw = scanBufferRef.current;

    if (!raw?.trim()) {
      setLoading(false);
      return;
    }

    const codes = [
      ...new Set(
        raw
          .split(/[\n,]+/)
          .map((x) => x.trim().toUpperCase())
          .filter((x) => x.length >= 24)
      )
    ];

    scanBufferRef.current = "";

    if (codes.length === 0) {
      setLoading(false);
      return;
    }

    console.log("Detected RFID Codes:", codes);

    try {
      const updated = await processRFIDScanWithBackend({
        existingTableData: tableDataRef.current,
        scannedCodes: codes,
        selectedZone: selectedZoneRef.current,
        scanAssetsByRfid,
      });

      setTableData(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!selectedZone) return;

    const confirmReset = await showConfirmDialog({
      title: "Reset",
      message:
        "This will discard all current scan progress for this zone.",
      confirmText: "Reset",
      cancelText: "Cancel",
    });

    if (!confirmReset) {
      return;
    }

    setLoading(true);

    try {
      const raw = await fetchAssetsByZone(selectedZone);
      const resetData = mapAssets(raw, selectedZone); 
      setTableData(resetData);
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!workOrder) return;

    try {
      setLoading(true);

      const scanSeq = scanType === "firstScan"
          ? 1
          : scanType === "secondScan"
          ? 2
          : 1;

      const payloadAssets = tableData.map((asset) => {
        const isNewWithoutCode = !asset.assetCode || asset.assetCode === "NEW ASSET";

        return {
          assetCode: isNewWithoutCode
            ? ""
            : asset.assetCode,
          assetStatus: asset.scanStatus,
          scanSeq,
          rfidCode: asset.rfidCode,
        };
      });

      await saveWorkOrderScanResult({
        workOrderId: workOrder.id,
        zone: selectedZone,
        assets: payloadAssets,
        initiatedBy: getLoggedInUsername()
      });

      const refreshed = await fetchWorkOrderById(
        workOrder.id
      );

      setWorkOrder(refreshed);

      const allZonesDone = refreshed.zone.every(
        (z) =>
          Number(z.status) >=
          (scanType === "firstScan" ? 1 : 2)
      );

      if (allZonesDone) {
        const finalStatus = scanType === "firstScan"
          ? WorkOrderStatus.FIRST_SCAN_COMPLETED
          : WorkOrderStatus.SECOND_SCAN_COMPLETED;

        const deviceName = getDeviceName();

        await createWorkOrderScan({
          workOrderId: workOrder.id,
          status: finalStatus,
          deviceName,
          deviceIp: null,
          remark: "",
          initiatedBy: getLoggedInUsername()
        });

        navigate(`/inventory/summary/${workOrder.id}`);

        return;
      }

      const nextZone = refreshed.zone.find(
        (z) =>
          Number(z.status) <
          (scanType === "firstScan" ? 1 : 2)
      );

      if (nextZone) {
        setSelectedZone(nextZone.id);
      }

    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshSingleRFID = async (rfidCode) => {
    try {
      const res = await scanAssetsByRfid([rfidCode]);
      const resolved = res || [];

      if (resolved.length === 0) return;

      const updatedAsset = resolved[0];
      const code = rfidCode.toUpperCase();

      setTableData((prev) => {
        const map = new Map(
          prev.map((a) => [
            a.rfidCode?.toUpperCase(),
            a,
          ])
        );

        const existing = map.get(code);

        const merged = {
          ...existing,
          ...updatedAsset,

          scanStatus:
            updatedAsset.zone === selectedZone
              ? ASSET_SCAN_STATUS.MATCHED
              : ASSET_SCAN_STATUS.NEW,
        };

        map.set(code, merged);

        return Array.from(map.values());
      });

    } catch (err) {
      console.error("Failed to refresh RFID:", err);
    }
  };

  const toggleFilter = (status) => {
    setStatusFilter((prev) =>
      prev === status ? null : status
    );
  };

  if (!workOrder) {
    return (
      <Typography>
        Loading work order...
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 1 }}>

      <Typography
        variant="h5"
        fontWeight="bold"
        mb={2}
      >
        Perform Inventory Check
      </Typography>

      <Typography variant="body1">
        <strong>Work Order: </strong> {workOrder.id}
      </Typography>

      <Typography variant="body1">
        <strong>Status: </strong> {workOrder.status}
      </Typography>

      <FormControl
        fullWidth
        size="small"
        sx={{ mt: 2, mb: 2 }}
      >
        <InputLabel>Zone</InputLabel>

        <Select
          value={selectedZone}
          label="Zone"
          disabled={loading}
          onChange={(e) => setSelectedZone(e.target.value)}
        >
          {allZones.map((zone) => {
            const statusNum = Number(zone.status);
            const isFirstScanDone = statusNum >= 1;
            const isSecondScanDone = statusNum >= 2;
            return (
              <MenuItem
                key={zone.id}
                value={zone.id}
                disabled={
                  scanType === "firstScan"
                    ? isFirstScanDone
                    : scanType === "secondScan"
                    ? isSecondScanDone
                    : false
                }
              >
                {zone.id}
                {scanType === "firstScan" && isFirstScanDone && " ✔"}
                {scanType === "secondScan" && isSecondScanDone && " ✔"}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          disabled={loading}
          onClick={handleReset}
        >
          <RestartAltIcon sx={{ mr: 1 }} />
          Reset
        </Button>

        <Button
          fullWidth
          variant="contained"
          disabled={loading}
          onClick={handleSave}
        >
          <SaveIcon sx={{ mr: 1 }} />
          Save Result
        </Button>
      </Box>

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

      <Typography variant="body1" sx={{ mt: 2 }} fontWeight="bold">
        {loading ? <Skeleton width="50%" /> : `Total Scanned: ${stats.totalFound ?? "-"}`}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <StatsSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <Box
              onClick={() =>
                toggleFilter(
                  ASSET_SCAN_STATUS.MATCHED
                )
              }
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                textAlign: "center",
                backgroundColor: statusFilter === ASSET_SCAN_STATUS.MATCHED ? ASSET_STATUS_UI[ASSET_SCAN_STATUS.MATCHED].bg : "#fff",
                cursor: "pointer",
                boxShadow: 1,
              }}
            >
              <Typography variant="caption">
                Matched
              </Typography>

              <Typography fontWeight="bold" color="success.main">
                {stats.matched}
              </Typography>
            </Box>

            <Box
              onClick={() =>
                toggleFilter(
                  ASSET_SCAN_STATUS.MISSING
                )
              }
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                textAlign: "center",
                backgroundColor: statusFilter === ASSET_SCAN_STATUS.MISSING ? ASSET_STATUS_UI[ASSET_SCAN_STATUS.MISSING].bg : "#fff",
                cursor: "pointer",
                boxShadow: 1,
              }}
            >
              <Typography variant="caption">
                Missing
              </Typography>

              <Typography
                fontWeight="bold"
                color="warning.main"
              >
                {stats.missing}
              </Typography>
            </Box>

            <Box
              onClick={() => toggleFilter(ASSET_SCAN_STATUS.NEW)}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                textAlign: "center",
                backgroundColor: statusFilter === ASSET_SCAN_STATUS.NEW ? ASSET_STATUS_UI[ASSET_SCAN_STATUS.NEW].bg : "#fff",
                cursor: "pointer",
                boxShadow: 1,
              }}
            >
              <Typography variant="caption">
                New
              </Typography>

              <Typography fontWeight="bold" color="error.main">
                {stats.new}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {loading ? (
          Array.from({ length: 5 }).map(
            (_, i) => (
              <AssetCardSkeleton key={i} />
            )
          )
        ) : visibleAssets.length === 0 ? (
          <Typography>No data</Typography>
        ) : (
          visibleAssets.map((asset) => {
            const assetUI = ASSET_STATUS_UI[asset.scanStatus];
            return (
              <Card
                key={asset.id}
                sx={{
                  borderRadius: 3,
                  boxShadow: 3,
                  borderLeft: `6px solid ${assetUI.color}`,
                  backgroundColor: assetUI.cardColor,
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={0.5} sx={{ width: "100%" }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TagIcon fontSize="small" color={assetUI.iconColor} />
                      <Typography fontWeight="bold" fontSize={16} >
                        {asset.assetCode || "NEW ASSET"}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                      <DescriptionIcon fontSize="small" color={assetUI.iconColor} />
                      <Typography variant="caption" color="text.secondary">
                        {asset.assetCode ? asset.description : asset.rfidCode}
                      </Typography>
                    </Box>

                    {asset.zone && asset.zone === selectedZone && (
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                        <LocationOnIcon fontSize="small" color={assetUI.iconColor} />
                        <Typography variant="caption">
                          {asset.zone}
                        </Typography>
                      </Box>
                    )}

                    {asset.zone && asset.zone !== selectedZone && (
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                        <LocationOnIcon fontSize="small" color={assetUI.iconColor} />
                        <Typography variant="body2" color={assetUI.iconColor}>
                          <strong>Belongs to {asset.zone}</strong>
                        </Typography>
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
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {asset.assetCode === undefined ? (
                    <IconButton
                      onClick={() => {
                        setPendingRFID(asset.rfidCode);
                        setOpenNewAsset(true);
                      }}
                    >
                      <AddIcon color={assetUI.iconColor}/>
                    </IconButton>
                  ) : (
                    <IconButton 
                      onClick={() => {
                        setSelectedAsset(asset);
                        setOpenAssetModal(true);
                      }}
                    >
                      <SearchIcon
                        color={assetUI.iconColor}
                      />
                    </IconButton>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </Box>

      <AssetDetailsModal
        open={openAssetModal}
        asset={selectedAsset}
        onClose={() =>setOpenAssetModal(false)}
      />

      <NewAssetModal
        open={openNewAsset}
        rfidCode={pendingRFID}
        onClose={() =>setOpenNewAsset(false)}
        onSuccess={async () => {
          setOpenNewAsset(false);
          setPendingRFID(null);

          if (pendingRFID) {
            await refreshSingleRFID(
              pendingRFID
            );
          }
        }}
      />
    </Box>
  );
};

export default PerformInventoryCheck;