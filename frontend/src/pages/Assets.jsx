import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Skeleton
} from "@mui/material";
import AssetDetailsModal from "../components/AssetDetailsModal.jsx";
import { fetchAssetMetadata, fetchAssetsByZone, mapAssets } from "../api/asset.js";

import TagIcon from "@mui/icons-material/Tag";
import DescriptionIcon from "@mui/icons-material/Description";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import { AssetCardSkeleton } from "../components/Skeletons.jsx";

export default function Assets() {
  const [metadata, setMetadata] = useState([]);

  const [locations, setLocations] = useState([]);
  const [zones, setZones] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedZone, setSelectedZone] = useState("");

  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchMetadata = async () => {
    try {
      const data = await fetchAssetMetadata();

      setMetadata(data);

      const uniqueLocations = [
        ...new Set(data.map(d => d.location).filter(Boolean))
      ];

      setLocations(uniqueLocations);

    } catch (err) {
      console.error("Failed to fetch metadata:", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (!selectedLocation) {
      setZones([]);
      setSelectedZone("");
      return;
    }

    const filteredZones = metadata
      .filter(d => d.location === selectedLocation)
      .map(d => d.zone)
      .filter(Boolean);

    const uniqueZones = [...new Set(filteredZones)];

    setZones(uniqueZones);
    setSelectedZone("");
    setAssets([]);
  }, [selectedLocation, metadata]);

  useEffect(() => {
    let active = true;

    const loadAssets = async () => {
      if (!selectedZone) return;

      setLoading(true);

      try {
        const raw = await fetchAssetsByZone(selectedZone);

        if (!active) return;

        const mapped = mapAssets(raw, selectedZone);
        setAssets(mapped);
      } catch (err) {
        console.error("Failed to fetch assets:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAssets();

    return () => {
      active = false;
    };
  }, [selectedZone]);

  const handleInspect = (asset) => {
    setSelectedAsset(asset);
    setOpenModal(true);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" fontWeight="bold">
        Assets
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mt: 3, flexWrap: "wrap" }}>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>location</InputLabel>
          <Select
            value={selectedLocation}
            label="location"
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            {locations.map((b) => (
              <MenuItem key={b} value={b}>
                {b}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Zone</InputLabel>
          <Select
            value={selectedZone}
            label="Zone"
            onChange={(e) => setSelectedZone(e.target.value)}
            disabled={!selectedLocation}
          >
            {zones.map((z) => (
              <MenuItem key={z} value={z}>
                {z}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <AssetCardSkeleton key={i} />
          ))
        ) : (
          <>
            <Typography variant="body1" fontWeight="bold">
              Total Assets: {loading ? <Skeleton width={40} /> : assets.length}
            </Typography>

            {assets.map((asset) => (
              <Card
                key={asset.id}
                sx={{
                  borderRadius: 3,
                  boxShadow: 3,
                  borderLeft: "6px solid #004b8f",
                  backgroundColor: "#ffffff",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4
                  },
                  "&:active": {
                    transform: "scale(0.98)"
                  }
                }}
              >
                <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box display="flex" flexDirection="column" gap={0.5} sx={{ width: "100%" }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TagIcon fontSize="small" color="primary" />
                      <Typography fontWeight="bold">
                        {asset.assetCode}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <DescriptionIcon fontSize="small" color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        {asset.description}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOnIcon fontSize="small" color="primary" />
                      <Typography variant="caption">
                        {asset.zone || "-"}
                      </Typography>
                    </Box>
                  </Box>

                  <IconButton onClick={() => handleInspect(asset)}>
                    <SearchIcon color="primary" />
                  </IconButton>
                </CardContent>
              </Card>
            ))}
          </>
        )}

      </Box>

      <AssetDetailsModal
        open={openModal}
        asset={selectedAsset}
        onClose={() => setOpenModal(false)}
      />
    </Box>
  );
}