import api from "./axios";

export const saveWorkOrderScanResult = async ({
  workOrderId,
  zone,
  assets,
  initiatedBy
}) => {
  const res = await api.post(
    `/work-order-scan/work-order/${workOrderId}/zone/${zone}/save-result`,
    { assets, initiatedBy }
  );

  return res.data;
};

export const fetchWorkOrderScanAssets = async ({ workOrderId, scanSeq }) => {
  const res = await api.get(
    `/work-order-scan/assets?workOrderId=${workOrderId}&scanSeq=${scanSeq}`
  );

  return res.data?.data || [];
};