import { eamClient } from "../lib/axios.js";
import { safeRequest } from "../utils/httpClient.js";
import { eamRequest } from "../lib/eamRequest.js";

import { executeGrid, createFilter, mapGridRecords } from "./grid.service.js";
import { HXGN_STATUS } from "../constants/hxgnStatus.js";
import { ENV } from "../config/env.js";

function transformAsset(data) {
  const asset = data?.Result?.ResultData?.AssetEquipment;

  if (!asset) return null;

  const customFields = asset?.USERDEFINEDAREA?.CUSTOMFIELD || [];

  const primarySystemField = customFields.find(
    (f) => f.PROPERTYCODE === "PS"
  );

  const primarySystem = primarySystemField
    ? primarySystemField.CLASSID?.DESCRIPTION
    : null;

  return {
    equipmentCode: asset.ASSETID?.EQUIPMENTCODE,
    organizationCode: asset.ASSETID?.ORGANIZATIONID?.ORGANIZATIONCODE,
    organizationDescription: asset.ASSETID?.ORGANIZATIONID?.DESCRIPTION,
    organizationEntity: asset.ASSETID?.ORGANIZATIONID?.entity,
    description: asset.ASSETID?.DESCRIPTION,
    classDescription: asset.CLASSID?.DESCRIPTION,

    primarySystem,

    status: asset.STATUS?.DESCRIPTION,
    department: asset.DEPARTMENTID?.DESCRIPTION,

    commissionDate: parseHxgnDate(asset.COMMISSIONDATE),
    originalInstallDate: parseHxgnDate(asset.ORIGINALINSTALLDATE),

    profilePicture: asset.PROFILEPICTURE?.DOCUMENTCODE,

    manufacturer: {
      code: asset.ManufacturerInfo?.MANUFACTURERCODE,
      serialNumber: asset.ManufacturerInfo?.SERIALNUMBER,
      model: asset.ManufacturerInfo?.MODEL
    }
  };
}

function parseHxgnDate(dateObj) {
  if (!dateObj) return null;
  return new Date(dateObj.YEAR).toISOString();
}

export async function getAssetService({ assetCode, orgCode }, context) {
  const raw = `${assetCode}#${orgCode}`;
  const encodedId = encodeURIComponent(encodeURIComponent(raw));

  const res = await safeRequest(
    eamClient.get(
      `/assets/${encodedId}`,
      eamRequest(context)
    )
  );

  return transformAsset(res.data);
}

function transformAssetList(rawData) {
  const records = rawData?.Result?.ResultData?.DATARECORD || [];

  return records.map((record) => {
    const fields = record.DATAFIELD.reduce((acc, field) => {
      acc[field.FIELDNAME] = field.FIELDVALUE;
      return acc;
    }, {});

    return {
      assetCode: fields.ass_code,
      description: fields.ass_desc,
      organization: fields.ass_org,
      organizationDescription: fields.org_desc,
      status: fields.ass_status,
      class: fields.cls_desc,
      primarySystem: fields.obj_primarysystem,
      commissionDate: fields.ass_commiss,
      document: fields.dae_document
    };
  });
}

export async function getAssetsByLocationService({ primarySystem }, context) {
  const payload = {
    GRID_TYPE: { TYPE: "LIST" },
    GRID: {
      CURRENT_TAB_NAME: "LST",
      GRID_ID: ENV.ASSET_DETAILS_GRID_ID,
      GRID_NAME: ENV.ASSET_DETAILS_GRID_NAME,
      USER_FUNCTION_NAME: ENV.ASSET_DETAILS_GRID_NAME,
      NUMBER_OF_ROWS_FIRST_RETURNED: 100
    },
    MULTIADDON_FILTERS: {
      MADDON_FILTER: [
        {
          ALIAS_NAME: "OBJ_PRIMARYSYSTEM",
          OPERATOR: "=",
          VALUE: primarySystem,
          JOINER: "AND",
          LPAREN: "",
          RPAREN: "",
          SEQNUM: 0
        }
      ]
    },
    REQUEST_TYPE: "LIST.HEAD_DATA.STORED"
  };

  const res = await safeRequest(
    eamClient.post("/grids", payload, eamRequest(context))
  );

  return transformAssetList(res.data);
}

export async function searchAssetsService(filtersInput, context) {
  const {
    zone,
    orgCode,
    assetCode,
    rfidCode
  } = filtersInput;

  const filters = [];

  if (rfidCode) {
    filters.push(createFilter({
      alias: "ass_rfid_code",
      value: rfidCode
    }));
  } 

  if (zone) {
    filters.push(createFilter({
      alias: "ass_zone",
      value: zone
    }));
  }

  if (orgCode) {
    filters.push(createFilter({
      alias: "ass_org_code",
      value: orgCode
    }));
  }

  if (assetCode) {
    filters.push(createFilter({
      alias: "ASS_CODE",
      value: `${assetCode}`
    }));
  }

  const raw = await executeGrid({
    gridId: ENV.ASSET_DETAILS_GRID_ID,
    gridName: ENV.ASSET_DETAILS_GRID_NAME,
    userFunctionName: ENV.ASSET_DETAILS_GRID_NAME,
    filters
  }, context);

  const mapped = mapGridRecords(raw);

  return mapped.map(fields => ({
    assetCode: fields.ass_code,
    description: fields.ass_desc,
    organization: fields.ass_org_code,
    organizationDescription: fields.ass_org,
    location: fields.ass_loc,
    department: fields.ass_dept,
    status: HXGN_STATUS[fields.ass_status] ?? fields.ass_status,
    zone: fields.ass_zone,
    commissionDate: fields.ass_commiss,
    profilePicture: fields.ass_profile_pic,
    rfidCode: fields.ass_rfid_code
  }));
}

const CHUNK_SIZE = 20;

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function buildRFIDFilters(rfidCodes) {
  return rfidCodes.map((rfid) =>
    createFilter({
      alias: "ass_rfid_code",
      operator: "=",
      value: rfid,
      joiner: "OR"
    })
  );
}

export async function scanAssetsByRFIDService(input, context) {
  const { rfidCodes, org } = input;
  const chunks = chunkArray(rfidCodes, CHUNK_SIZE);

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const filters = buildRFIDFilters(chunk);

      const raw = await executeGrid({
        gridId: ENV.ASSET_DETAILS_GRID_ID,
        gridName: ENV.ASSET_DETAILS_GRID_NAME,
        userFunctionName: ENV.ASSET_DETAILS_GRID_NAME,
        filters
      }, context);

      return mapGridRecords(raw);
    })
  );

  const allRecords = results.flat();
  const uniqueMap = new Map();

  for (const fields of allRecords) {
    uniqueMap.set(fields.ass_rfid_code, fields);
  }

  let records = Array.from(uniqueMap.values());

  if (org) {
    records = records.filter(
      (fields) => fields.ass_org_code === org
    );
  }

  const assets = records.map(fields => ({
    assetCode: fields.ass_code,
    description: fields.ass_desc,
    organization: fields.ass_org_code,
    organizationDescription: fields.ass_org,
    location: fields.ass_loc,
    department: fields.ass_dept,
    status: HXGN_STATUS[fields.ass_status] ?? fields.ass_status,
    zone: fields.ass_zone,
    commissionDate: fields.ass_commiss,
    profilePicture: fields.ass_profile_pic,
    rfidCode: fields.ass_rfid_code
  }));

  return {
    assets
  };
}

export async function getAssetMetadataService(context) {
  const raw = await executeGrid({
    gridId: ENV.ASSET_METADATA_GRID_ID,
    gridName: ENV.ASSET_METADATA_GRID_NAME,
    userFunctionName: ENV.ASSET_METADATA_GRID_NAME,
    rowLimit: 100
  }, context);

  const records = mapGridRecords(raw);

  return records.map(fields => ({
    location: fields.loc_desc,
    zone: fields.obj_code,
    id: fields.id,
    zoneDescription: fields.obj_desc
  }));
}

export async function updateAssetRFIDService(
  {
    assetCode,
    orgCode,
    location,
    zone,
    rfidCode
  },
  context
) {
  if (!assetCode || !orgCode || !rfidCode) {
    throw new Error("assetCode, orgCode and rfidCode are required");
  }

  const formattedAssetCode = assetCode.trim().toUpperCase();
  const raw = `${formattedAssetCode}#${orgCode}`;
  const encodedId = encodeURIComponent(encodeURIComponent(raw));

  const payload = {
    AssetParentHierarchy: {
      LocationDependency: {
        DEPENDENTLOCATION: {
          LOCATIONID: {
            LOCATIONCODE: location,
            ORGANIZATIONID: {
              ORGANIZATIONCODE: orgCode
            }
          },
          TYPE: {
            TYPECODE: "L"
          },
          COSTROLLUP: "false",
          DEPARTMENTID: {
            DEPARTMENTCODE: "*",
            ORGANIZATIONID: {
              ORGANIZATIONCODE: orgCode
            }
          },
          OUTOFSERVICE: "-"
        },
        NONDEPENDENTPRIMARYSYSTEM: {
          SYSTEMID: {
            EQUIPMENTCODE: zone,
            ORGANIZATIONID: {
              ORGANIZATIONCODE: orgCode
            }
          },
          TYPE: {
            TYPECODE: "S"
          },
          COSTROLLUP: "false",
          LOANEDTODEPARTMENTID: null,
          OUTOFSERVICE: "-"
        },
        NONDEPENDENTSYSTEM: null
      }
    },
    UserDefinedFields: {
      UDFCHAR04: rfidCode
    }
  };

  const res = await safeRequest(
    eamClient.patch(
      `/assets/${encodedId}`,
      payload,
      eamRequest(context)
    )
  );

  return {
    message: res.data?.Result?.InfoAlert?.Message || "Asset updated",
    rfidCode: res.data?.Result?.ResultData?.AssetEquipment?.UserDefinedFields?.UDFCHAR04
  };
}