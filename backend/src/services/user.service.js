import { eamClient } from "../lib/axios.js";
import { ApiError } from "../utils/apiError.js";
import { ENV } from "../config/env.js";
import logger from "../config/logger.js";
import { safeRequest } from "../utils/httpClient.js";
import { eamRequest } from "../lib/eamRequest.js";

function buildPayload(username) {
  return {
    GRID_TYPE: { TYPE: "LIST" },
    GRID: {
      CURRENT_TAB_NAME: "LST",
      GRID_ID: ENV.USER_INFO_GRID_ID,
      GRID_NAME: ENV.USER_INFO_GRID_NAME,
      USER_FUNCTION_NAME: ENV.USER_INFO_GRID_NAME,
      NUMBER_OF_ROWS_FIRST_RETURNED: 1
    },
    MULTIADDON_FILTERS: {
      MADDON_FILTER: [
        {
          ALIAS_NAME: "USR_CODE",
          OPERATOR: "=",
          VALUE: username,
          JOINER: "AND",
          LPAREN: "",
          RPAREN: "",
          SEQNUM: 0
        }
      ]
    },
    REQUEST_TYPE: "LIST.HEAD_DATA.STORED"
  };
}

function transformUser(record) {
  const fields = record.DATAFIELD.reduce((acc, field) => {
    acc[field.FIELDNAME] = field.FIELDVALUE;
    return acc;
  }, {});

  return {
    username: fields.usr_code,
    description: fields.usr_desc,
    password: fields.usr_udfchar01,
    passExpire: fields.usr_exppass,
    userExpire: fields.usr_expuser,
    lockedDate: fields.usr_datelocked,
    loginAttempts: Number(fields.usr_udfnum03 || 0),
    maxLoginAttempts: Number(fields.ins_desc || 0)
  };
}

function buildUpdatePayload({ attempts, lock }) {
  const payload = {
    StandardUserDefinedFields: {
      UDFNUM03: {
        VALUE: attempts,
        NUMOFDEC: 0,
        SIGN: "+",
        UOM: "XXX",
        qualifier: "OTHER"
      }
    }
  };

  if (lock) {
    const now = new Date();

    payload.DATELOCKED = {
      YEAR: now.getTime(),
      MONTH: now.getUTCMonth() + 1,
      DAY: now.getUTCDate(),
      HOUR: now.getUTCHours(),
      MINUTE: now.getUTCMinutes(),
      SECOND: now.getUTCSeconds(),
      SUBSECOND: 0,
      TIMEZONE: "+0000",
      qualifier: "OTHER"
    };
  }

  return payload;
}

export async function updateLoginAttempts(
  username,
  { attempts, lock = false },
  context
) {
  const payload = buildUpdatePayload({ attempts, lock });

  try  {
    await eamClient.patch(`/usersetup/${username}`, payload, eamRequest(context));
  } catch (err) {
    console.error("HXGN ERROR DATA:", JSON.stringify(err.response?.data, null, 2));
    logger.error("Update Login Attempts Failed", {
      username,
      error: err.message
    });
  }
}

export async function getUserFromGrid(username, context) {
  const payload = buildPayload(username);

  const res = await safeRequest(
    eamClient.post("/grids", payload, eamRequest(context))
  );

  const result = res.data?.Result;
  const errorAlerts = result?.ErrorAlert;
  const records = result?.ResultData?.DATARECORD;

  if (errorAlerts?.length) {
    throw new ApiError(res.status, errorAlerts[0]?.Message);
  }

  if (!records || records.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return transformUser(records[0]);
}