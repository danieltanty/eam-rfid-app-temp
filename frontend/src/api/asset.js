import api from "./axios";

export const fetchAssetImage = async (documentCode) => {
  if (!documentCode) return null;

  const res = await api.get(
    `/asset/profile-picture?documentCode=${encodeURIComponent(documentCode)}`
  );

  return res.data?.data || null;
};

export const fetchAssetsByZone = async (zone) => {
  const res = await api.get(`/asset/zone/${zone}`);
  return res.data?.data || [];
};

export const mapAssets = (data, zone) => {
  return data.map((a) => ({
    id: `${a.assetCode}-${zone}`,
    assetCode: a.assetCode,
    description: a.description,
    zone: a.zone,
    zoneDescription: a.zoneDescription,
    organization: a.organizationDescription,
    location: a.location,
    department: a.department,
    commissionDate: a.commissionDate,
    status: a.status,
    profilePicture: a.profilePicture || null,
    rfidCode: a.rfidCode,
    scanStatus: "MISSING"
  }));
};

export const scanAssetsByRfid = async (rfidCodes) => {
  const res = await api.post("/asset/rfid/scan", {
    rfidCodes,
  });

  return res.data?.data || [];
};

export const fetchAssetMetadata = async () => {
  const res = await api.get("/asset/metadata");
  return res.data?.data || [];
};

export const patchAssetRfidCode = async (assetCode, orgCode, location, zone, rfidCode) => {
  const res = await api.patch(`/asset/rfid?assetCode=${assetCode}&orgCode=${orgCode}`,
    {
      rfidCode: rfidCode.trim().toUpperCase(),
      location,
      zone
    }
  );
  return res?.data;
};