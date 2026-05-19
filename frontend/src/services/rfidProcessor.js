import { ASSET_SCAN_STATUS } from "../constants";

export async function processRFIDScanWithBackend({
  existingTableData,
  scannedCodes,
  selectedZone,
  scanAssetsByRfid
}) {
  let updated = processRFIDScan(
    existingTableData,
    scannedCodes,
    selectedZone
  );

  try {
    const resolvedAssets = await scanAssetsByRfid(scannedCodes);

    updated = mergeBackendAssets(
      updated,
      resolvedAssets,
      selectedZone
    );
  } catch (err) {
    console.error("RFID resolve failed:", err);
  }

  return updated;
}

export function processRFIDScan(existingTableData, scannedCodes, selectedZone) {
  const normalizedCodes = scannedCodes
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);

  const scannedSet = new Set(normalizedCodes);

  const updatedExistingAssets = existingTableData
    .filter(asset => asset.scanStatus !== ASSET_SCAN_STATUS.NEW)
    .map(asset => {
      const code = asset.rfidCode?.trim()?.toUpperCase();

      if (asset.scanStatus === ASSET_SCAN_STATUS.MATCHED) {
        return asset;
      }

      if (scannedSet.has(code)) {
        return { ...asset, scanStatus: ASSET_SCAN_STATUS.MATCHED };
      }

      return asset;
    });

  const existingNewAssets = existingTableData.filter(
    asset => asset.scanStatus === ASSET_SCAN_STATUS.NEW
  );

  const existingCodes = new Set([
    ...existingTableData.map(a => a.rfidCode?.trim()?.toUpperCase())
  ]);

  const newlyDetectedAssets = [...scannedSet]
    .filter(code => !existingCodes.has(code))
    .map(code => ({
      id: `new-${code}-${selectedZone}`,
      rfidCode: code,
      scanStatus: ASSET_SCAN_STATUS.NEW
    }));

  return [
    ...updatedExistingAssets,
    ...existingNewAssets,
    ...newlyDetectedAssets
  ];
}

export function mergeBackendAssets(
  existingTableData,
  resolvedAssets,
  selectedZone
) {
  const existingMap = new Map(
    existingTableData.map((a) => [
      a.rfidCode?.trim().toUpperCase(),
      a
    ])
  );

  const merged = [...existingTableData];

  resolvedAssets.forEach((asset) => {
    const code = asset.rfidCode?.trim().toUpperCase();

    const mapped = {
      ...asset,
      id: `${asset.assetCode}-${asset.zone}`,
      scanStatus:
        asset.zone === selectedZone
          ? ASSET_SCAN_STATUS.MATCHED
          : ASSET_SCAN_STATUS.NEW,
    };

    if (existingMap.has(code)) {
      const idx = merged.findIndex(
        (a) => a.rfidCode?.trim().toUpperCase() === code
      );
      merged[idx] = mapped;
    } else {
      merged.push(mapped);
    }
  });

  return merged;
}