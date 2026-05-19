import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  TextField
} from "@mui/material";

import TagIcon from '@mui/icons-material/Tag';
import DescriptionIcon from "@mui/icons-material/Description"; 
import LocationOnIcon from "@mui/icons-material/LocationOn"; 
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

import AssetDetailsModal from "../components/AssetDetailsModal";
import AssetCard from "../components/AssetCard";
import { AssetCardSkeleton, StatsSkeleton } from "../components/Skeletons";

import { useUIStore } from "../store";
import { ASSET_SCAN_STATUS, WorkOrderStatus } from "../constants";
import { fetchWorkOrderScanAssets, saveWorkOrderScanResult } from "../api/workOrderScan";
import { createWorkOrderScan } from "../api/workOrder";
import { fetchWorkOrderById } from "../api/workOrder";
import { getDeviceName } from "../utils/device";
import { ASSET_STATUS_UI } from "../utils/assetStatusUI";
import { getLoggedInUsername } from "../utils/auth";

const InventorySummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const showSnackbar=useUIStore((state) =>state.showSnackbar);
  const showConfirmDialog = useUIStore((state) => state.showConfirmDialog);

  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("NON_MATCHED");
  const [editedAssets, setEditedAssets] = useState({});
  const [originalAssets, setOriginalAssets] = useState([]);
  const [apiAssets, setApiAssets] = useState([]);
  const allAssets = apiAssets;

  const workOrderId = id || "";

  useEffect(() => {
    const loadWorkOrder = async () => {
      try {
        setLoading(true);

        const data = await fetchWorkOrderById(id);

        setWorkOrder(data);
      } catch (err) {
        console.error("Failed to load work order:", err);
      }
    };
    loadWorkOrder();
  }, [id]);

  const isSecondScan =
    workOrder?.status === WorkOrderStatus.SECOND_SCAN_COMPLETED ||
    workOrder?.status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS;

  const scanSeq = isSecondScan ? 2 : 1;

  const reloadAssets = useCallback(async () => {
    if (!workOrderId || !workOrder) return;

    setLoading(true);

    try {
      const data = await fetchWorkOrderScanAssets({
        workOrderId: workOrderId,
        scanSeq
      });

      const mapped = data.map(a => ({
        id: a.assetCode,
        assetCode: a.assetCode,
        description: a.description,
        organization: a.organization,
        organizationDescription: a.organizationDescription,
        location: a.location,
        department: a.department,
        commissionDate: a.commissionDate,
        zone: a.zone,
        zoneCode: a.zoneCode,
        currentZoneCode: a.currentZoneCode,
        rfidCode: a.rfidCode,
        newRfidCode: a.newRfidCode,
        status: a.status,
        scanStatus: a.scanStatus,
        scanSeq: a.scanSeq,
        workOrderId: a.workOrderId,
        workOrderScanUuid: a.workOrderScanUuid,
        remark: a.remark || "",
        isEdited: false
      }));

      const cloned = JSON.parse(JSON.stringify(mapped));

      setApiAssets(cloned);
      setOriginalAssets(structuredClone(mapped));

      const initialRemarks = {};
      mapped.forEach(a => {
        if (a.remark) initialRemarks[a.assetCode] = a.remark;
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [workOrderId, workOrder?.status]);

  useEffect(() => {
    reloadAssets();
  }, [reloadAssets]);

  const handleMarkAsMatched = useCallback((asset) => {
    setApiAssets((prev) =>
      prev.map((a) =>
        a.id === asset.id
          ? { ...a, scanStatus: ASSET_SCAN_STATUS.MATCHED }
          : a
      )
    );

    setEditedAssets((prev) => ({
      ...prev,
      [asset.assetCode]: ASSET_SCAN_STATUS.MATCHED
    }));
  }, []);

  const getAssetKey = (asset) => asset.assetCode || asset.newRfidCode;

  const handleRemarkChange = useCallback((asset, value) => {
    const key = getAssetKey(asset);

    setApiAssets(prev =>
      prev.map(a =>
        getAssetKey(a) === key
          ? { ...a, remark: value, isEdited: true }
          : a
      )
    );

    setEditedAssets(prev => ({
      ...prev,
      [key]: true
    }));
  }, []);

  const handleReset = useCallback(async () => {
    if (originalAssets.length === 0) return;

    const confirmed = await showConfirmDialog({
      title: "Reset Changes",
      message:
        "Reset all changes? This will discard unsaved edits.",
      confirmText: "Reset",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setLoading(true);

    setApiAssets(structuredClone(originalAssets));

    setEditedAssets({});

    setLoading(false);
  }, [originalAssets, showConfirmDialog]);

  const toggleFilter = useCallback((status) => {
    setStatusFilter((prev) =>
      prev === status ? "NON_MATCHED" : status
    );
  }, []);

  const handleSaveChanges = async () => {
    if (!workOrderId) return;

    setLoading(true);
    document.activeElement?.blur();

    const changedList = Object.entries(editedAssets);
    console.log('changedList: ', changedList)

    if (changedList.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const changedAssetObjects = allAssets.filter(a => editedAssets[getAssetKey(a)]);

      if (changedAssetObjects.length === 0) return;

      const workOrderId = changedAssetObjects[0]?.workOrderId;

      if (!workOrderId) {
        console.error("Missing workOrderId");
        return;
      }

      const groupedByZone = changedAssetObjects.reduce((acc, asset) => {
        const zone = asset.zoneCode === "" ? "-" : asset.zoneCode;

        if (!zone) return acc;

        if (!acc[zone]) acc[zone] = [];

        acc[zone].push({
          assetCode: asset.assetCode,
          assetStatus: asset.scanStatus,
          scanSeq,
          remark: asset.remark || "",
          rfidCode: asset.rfidCode,
          // TO DO: Check if this is still needed?
          // newRfidCode: asset.newRfidCode,
        });

        return acc;
      }, {});

      const promises = Object.entries(groupedByZone).map(
        ([zone, assets]) =>
        {
          saveWorkOrderScanResult({
            workOrderId: workOrderId,
            zone,
            assets,
            initiatedBy: getLoggedInUsername(),
          })
        }
      );

      await Promise.all(promises);

      setEditedAssets({});
      await reloadAssets();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSecondScan = async () => {
    if (!workOrderId) return;

    try {
      await handleSaveChanges();
      setLoading(true);

      const deviceName = getDeviceName();

      await createWorkOrderScan({
        workOrderId: workOrderId,
        status: WorkOrderStatus.SECOND_SCAN_IN_PROGRESS,
        deviceName,
        deviceIp: null,
        remark: "",
        initiatedBy: getLoggedInUsername()
      });

      navigate(`/inventory/perform/${workOrderId}`);
    } catch (err) {
      console.error("Failed to start 2nd scan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!workOrderId) return;

    setLoading(true);

    const hasChanges = Object.keys(editedAssets).length > 0;
    if (hasChanges) {
      await handleSaveChanges();
    }

    try {
      const deviceName = getDeviceName();

      await createWorkOrderScan({
        workOrderId: workOrderId,
        status: WorkOrderStatus.COMPLETED,
        deviceName,
        deviceIp: null,
        remark: "",
        initiatedBy: getLoggedInUsername()
      });

      showSnackbar("Work Order submitted successfully","success");
      navigate("/work-orders")
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSecondScanButtonIcon = () => {
    switch (workOrder?.status) {
      case WorkOrderStatus.SECOND_SCAN_COMPLETED:
        return <CloudUploadIcon sx={{ mr: 1 }} />;
      default:
        return <ArrowRightIcon sx={{ mr: 1 }} fontSize="large" />;
    }
  }

  const getSecondScanButtonText = () => {
    if (!workOrder) return "Start 2nd Scan";

    switch (workOrder.status) {
      case WorkOrderStatus.SECOND_SCAN_COMPLETED:
        return "Submit";

      case WorkOrderStatus.SECOND_SCAN_IN_PROGRESS:
        return "Continue 2nd Scan";

      case WorkOrderStatus.FIRST_SCAN_COMPLETED:
      default:
        return "Start 2nd Scan";
    }
  };

  const filteredAssets = useMemo(() => {
    let data = allAssets;

    if (statusFilter === "NON_MATCHED") {
      data = data.filter(
        (a) => a.scanStatus !== ASSET_SCAN_STATUS.MATCHED
      );
    }

    if (
      statusFilter &&
      statusFilter !== "NON_MATCHED"
    ) {
      data = data.filter(
        (a) => a.scanStatus === statusFilter
      );
    }

    const priority = {
      [ASSET_SCAN_STATUS.NEW]: 0,
      [ASSET_SCAN_STATUS.MISSING]: 1,
      [ASSET_SCAN_STATUS.MATCHED]: 2,
    };

    return [...data].sort(
      (a, b) =>
        (priority[a.scanStatus] ?? 99) -
        (priority[b.scanStatus] ?? 99)
    );
  }, [allAssets, statusFilter]);

  const stats = useMemo(() => {
    const total = allAssets.length;
    const matched = allAssets.filter(
      (a) => a.scanStatus === ASSET_SCAN_STATUS.MATCHED
    ).length;
    const missing = allAssets.filter(
      (a) => a.scanStatus === ASSET_SCAN_STATUS.MISSING
    ).length;
    const newCount = allAssets.filter(
      (a) => a.scanStatus === ASSET_SCAN_STATUS.NEW
    ).length;

    return { total, matched, missing, newCount };
  }, [allAssets]);

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" fontWeight="bold" mb={1}>
        Inventory Summary
      </Typography>

      <Typography variant="body2">
        <strong>Work Order: </strong> {workOrder?.id}
      </Typography>

      <Typography variant="body2" sx={{ mt: 0.5 }}>
        <strong>Work Order Status: </strong> {workOrder?.status}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
      
        <Button 
          sx={{ height: 40 }}
          fullWidth 
          variant="outlined" 
          color="error"
          disabled={loading}
          onClick={handleReset}
        >
          <RestartAltIcon sx={{ mr: 1 }} /> Reset
        </Button>

        <Button 
          sx={{ height: 40 }}
          fullWidth 
          variant="contained" 
          disabled={loading}
          onClick={handleSaveChanges}
        >
          <SaveIcon sx={{ mr: 1 }} /> Save
        </Button>

      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <Button 
          sx={{
            height: 50,
            fontSize: 16,
            fontWeight: "bold"
          }}
          fullWidth 
          variant="contained"
          disabled={workOrder?.status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS || loading}
          onClick={() => {
            if (workOrder?.status === WorkOrderStatus.SECOND_SCAN_COMPLETED) {
              handleSubmitFinal();
            } else if (workOrder?.status === WorkOrderStatus.SECOND_SCAN_IN_PROGRESS) {
              navigate(`/inventory/perform/${workOrderId}`);
            } else {
              handleStartSecondScan();
            }
          }}
        >
          {getSecondScanButtonIcon()} {getSecondScanButtonText()}
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 2, mb: 2 }}>
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <StatsSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <Box
              onClick={() => toggleFilter(ASSET_SCAN_STATUS.MATCHED)}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                textAlign: "center",
                backgroundColor: statusFilter === ASSET_SCAN_STATUS.MATCHED ? ASSET_STATUS_UI[ASSET_SCAN_STATUS.MATCHED].bg : "#fff",
                cursor: "pointer",
                boxShadow: 1,
                position: "sticky", top: 0, zIndex: 2
              }}
            >
              <Typography variant="caption">Matched</Typography>
              <Typography fontWeight="bold" color="success.main">
                {stats.matched}
              </Typography>
            </Box>

            <Box
              onClick={() => toggleFilter(ASSET_SCAN_STATUS.MISSING)}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                textAlign: "center",
                backgroundColor:
                  statusFilter === ASSET_SCAN_STATUS.MISSING ? ASSET_STATUS_UI[ASSET_SCAN_STATUS.MISSING].bg : "#fff",
                cursor: "pointer",
                boxShadow: 1
              }}
            >
              <Typography variant="caption">Missing</Typography>
              <Typography fontWeight="bold" color="warning.main">
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
                backgroundColor:
                  statusFilter === ASSET_SCAN_STATUS.NEW ? ASSET_STATUS_UI[ASSET_SCAN_STATUS.NEW].bg : "#fff",
                cursor: "pointer",
                boxShadow: 1
              }}
            >
              <Typography variant="caption">New</Typography>
              <Typography fontWeight="bold" color="error.main">
                {stats.newCount}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <AssetCardSkeleton key={i} />
          ))
        ) : filteredAssets.length === 0 ? (
          <Typography>No data</Typography>
        ) : (
          filteredAssets.map((asset) => (
            <AssetCard
              key={getAssetKey(asset)}
              asset={asset}
              isSecondScan={isSecondScan}
              onRemarkChange={handleRemarkChange}
              onMarkAsMatched={handleMarkAsMatched}
              onOpenModal={(asset) => {
                setSelectedAsset(asset);
                setOpenModal(true);
              }}
            />
          ))
        )}
        
      </Box>

      <AssetDetailsModal
        open={openModal}
        asset={selectedAsset}
        onClose={() => setOpenModal(false)}
      />
    </Box>
  );
};

export default InventorySummary;