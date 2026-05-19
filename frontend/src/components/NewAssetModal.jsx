import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent,
  Autocomplete,
  TextField
} from "@mui/material";

import { fetchAssetMetadata, fetchAssetsByZone, patchAssetRfidCode } from "../api/asset";
import { useUIStore } from "../store";

export default function NewAssetModal({
  open,
  onClose,
  rfidCode,
  onSuccess
}) {
  const showSnackbar = useUIStore((state) =>state.showSnackbar);
  const showConfirmDialog = useUIStore((state) => state.showConfirmDialog);

  const [metadata, setMetadata] = useState([]);
  const [location, setLocation] = useState("");
  const [zone, setZone] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        const res = await fetchAssetMetadata();
        setMetadata(res || []);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [open]);

  const locations = [...new Set(metadata.map(m => m.location).filter(Boolean))];

  const zones = metadata
    .filter(m => m.location === location)
    .map(m => m.zone)
    .filter(Boolean);

  const handleSave = async () => {
    const orgCode = "TSUSHO";
    const location = "S686";

    if (!assetCode || !rfidCode || !orgCode || !location) {
      showSnackbar("Missing required fields", "error");
      return;
    }

    if (selectedAsset?.rfidCode) {
      const confirmOverwrite =
        await showConfirmDialog({
          title: "Overwrite RFID?",
          message:
            `This asset already has an RFID Code.\n\n` +
            `Do you want to overwrite it?`,
          confirmText: "Overwrite",
          cancelText: "Cancel",
        });

      if (!confirmOverwrite) {
        return;
      }
    }

    try {
      setLoading(true);

      const res = await patchAssetRfidCode(assetCode, orgCode, location, zone, rfidCode);

      if (!res?.success) {
        throw new Error(res?.message || "Update failed");
      }

      showSnackbar(
        res?.data?.message || "RFID updated successfully",
        "success"
      );

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("Save asset RFID failed:", err);

      const msg =
        err?.response?.data?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save RFID";

      showSnackbar(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLocation("");
    setZone("");
    setAssetCode("");
    setAssets([]);
    onClose();
  };

  const selectedAsset = assets?.find(a => a.assetCode === assetCode);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign Asset RFID Code</DialogTitle>
      <DialogContent>
        <Card sx={{ mb: 2, background: "#e0e0e0" }}>
          <CardContent>
            <Typography fontWeight="bold" variant="body2">RFID Code</Typography>
            <Typography variant="body2">{rfidCode}</Typography>

            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>Assign To:</Typography>
            {(assetCode)
              ?
                <>
                  <Typography variant="caption" sx={{ mt: 1 }} component="div">{assetCode ?? "-"}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }} component="div">{selectedAsset?.description}</Typography>
                  <Typography 
                    variant="caption" 
                    color={(selectedAsset?.rfidCode !== "") ? "error" : "textSecondary"}
                    fontWeight={(selectedAsset?.rfidCode !== "") ? "bold" : "normal"}
                    sx={{ mt: 0.5 }}
                    component="div"
                  >{selectedAsset?.rfidCode || "-"}</Typography>
                </>
              : null
            }
          </CardContent>
        </Card>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Location</InputLabel>
          <Select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setZone("");
              setAssetCode("");
            }}
          >
            {locations.map(b => (
              <MenuItem key={b} value={b}>{b}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={!location}>
          <InputLabel>Zone</InputLabel>
          <Select
            value={zone}
            onChange={async (e) => {
                const selectedZone = e.target.value;

                setZone(selectedZone);
                setAssetCode("");
                setAssets([]);

                if (!selectedZone) return;

                setLoadingAssets(true);

                try {
                    const raw = await fetchAssetsByZone(selectedZone);
                    setAssets(raw || []);
                } catch (err) {
                    console.error("Failed to load assets by zone:", err);
                } finally {
                    setLoadingAssets(false);
                }
            }}
          >
            {[...new Set(zones)].map(z => (
              <MenuItem key={z} value={z}>{z}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" disabled={!zone || loadingAssets}>
            <Autocomplete
              options={assets}
              open={assetDropdownOpen}
              onOpen={() => setAssetDropdownOpen(true)}
              onClose={() => setAssetDropdownOpen(false)}
              getOptionLabel={(option) => option.assetCode}
              value={assets.find(a => a.assetCode === assetCode) || null}
              onChange={(e, newValue) => {
                setAssetCode(newValue?.assetCode || "");
                setAssetDropdownOpen(false);
              }}
              disabled={zone === ""}
              renderOption={(props, option) => {
                const { key, ...rest } = props;

                return (
                  <Box component="li" key={key} {...rest}>
                    <Box>
                      <Typography fontWeight="bold" variant="body1">
                        {option.assetCode}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Asset"
                  size="small"
                  onClick={() => setAssetDropdownOpen(true)}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true,
                  }}
                />
              )}
            />
        </FormControl>

      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={!assetCode || loading}
          onClick={handleSave}
        >
          {loading ? "Saving..." : "Assign"}
        </Button>
      </DialogActions>

    </Dialog>
  );
}