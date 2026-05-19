import { eamClient } from "../lib/axios.js";
import { safeRequest } from "../utils/httpClient.js";
import { eamRequest } from "../lib/eamRequest.js";
import { buildUDSRequest, UDSField } from "../lib/userDefinedScreenBuilder.js";
import { chunkArray, sleep } from "../utils/batch.util.js";
import { executeGrid, createFilter, mapGridRecords } from "./grid.service.js";
import { HXGN_STATUS } from "../constants/hxgnStatus.js";
import { ENV } from "../config/env.js";
import { sendIntegrationLog } from "./integrationLog.service.js";

const CHUNK_SIZE = 10;
const BATCH_DELAY = 200;

function buildPayload(scan) {
  const {
    workOrderScanUuid,
    workOrderId,
    locationId,
    zoneCode,
    assetCode,
    rfidCode,
    newRfidCode,
    assetStatus,
    scanSeq,
    remark
  } = scan;

  const rfid = (newRfidCode === "" || newRfidCode === undefined || newRfidCode === null) ? rfidCode : newRfidCode;

  return buildUDSRequest({
    screenName: "UUASSC",
    action: "ADD",
    fields: [
      UDSField.uuid("UUID"),
      UDSField.text("WORKORDERSCANUUID", workOrderScanUuid),
      UDSField.text("WORKORDERID", workOrderId),
      UDSField.text("LOCATIONID", ""),
      UDSField.text("ZONECODE", zoneCode),
      UDSField.text("ASSETCODE", assetCode),
      UDSField.text("RFIDCODE", rfid),
      UDSField.text("ASSETSTATUS", assetStatus || ""),
      UDSField.text("REASON", remark),
      UDSField.number("SCANSEQ", scanSeq ?? 0)
    ]
  });
}

export async function saveWorkOrderScanResultService(scans, context) {
  try {
    await sendIntegrationLog({
      batch: context.batch,
      batchSeq: context.sequence?.value ?? 0,
      method: "POST",
      url: "/userdefinedscreenservices",
      // headers: JSON.stringify({ isScanResult: true }),
      requestBody: "ASSET SCAN DATA",
      processedBody: scans
    });
  } catch (err) {
    console.error("Final integration log failed:", err.message);
  }

  return null;
}

export async function getWorkOrderScanAssetsService(
  { workOrderId, scanSeq },
  context
) {
  const filters = [];

  if (workOrderId) {
    filters.push(createFilter({
      alias: "WO_CODE",
      value: workOrderId
    }));
  }

  if (scanSeq) {
    filters.push(createFilter({
      alias: "ASS_SCAN_SEQ",
      value: scanSeq
    }));
  }

  const raw = await executeGrid({
    gridId: ENV.ASSET_SCAN_GRID_ID,
    gridName: ENV.ASSET_SCAN_GRID_NAME,
    userFunctionName: ENV.ASSET_SCAN_GRID_NAME,
    filters,
    rowLimit: 1000
  }, context);

  const records = mapGridRecords(raw);

  return records.map(fields => ({
    assetCode: fields.ass_code,
    description: fields.ass_desc,
    organization: fields.ass_org,
    organizationCode: fields.ass_org_code,
    location: fields.ass_loc,
    department: fields.ass_dept,

    zone: fields.ass_zone,
    zoneCode: fields.ass_zone_code,
    currentZoneCode: fields.ass_c_zone_code,

    status: HXGN_STATUS[fields.ass_status],
    scanStatus: fields.ass_scan_status,
    scanSeq: Number(fields.ass_scan_seq),

    rfidCode: fields.ass_rfid_code,
    newRfidCode: fields.assc_rfid_code,
    remark: fields.ass_reason,

    commissionDate: fields.ass_commiss,
    profilePicture: fields.ass_profile_pic,

    workOrderId: fields.wo_code,
    workOrderScanUuid: fields.wo_uuid
  }));
}