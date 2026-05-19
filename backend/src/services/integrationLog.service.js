import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { ENV } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import logger from "../config/logger.js";

const hxgnLoggerClient = axios.create({
  baseURL: ENV.EAM_BASE_URL,
  timeout: 10000,
  headers: {
    accept: "application/json",
    "content-type": "application/json",
    tenant: ENV.EAM_TENANT,
    organization: ENV.EAM_ORG
  },
  auth: {
    username: ENV.EAM_USERNAME,
    password: ENV.EAM_PASSWORD
  }
});

function buildPayload(log) {
  const field = (name, value) => ({
    USERDEFINEDSCREENFIELDNAME: name,
    USERDEFINEDSCREENFIELDVALUE: value
  });

  const text = (val) => ({ TEXTDATA: val || "" });

  const numeric = (val) => ({
    NUMERICDATA: {
      VALUE: val,
      NUMOFDEC: 0,
      SIGN: "+",
      CURRENCY: "xxx",
      DRCR: "D",
      qualifier: "OTHER"
    }
  });

  return {
    USERDEFINEDSCREENNAME: "UUINTL",
    USERDEFINEDSERVICEACTION: "ADD",
    USERDEFINEDSCREENFIELDVALUELIST: {
      USERDEFINEDSCREENFIELDVALUEPAIR: [
        field("UUID", text(uuidv4().toUpperCase())),
        field("SYSTEM", text("HxGNEAM")),
        field("BATCH", text(log.batch)),
        field("BATCHSEQ", numeric(log.batchSeq)),
        field("PROCESSCOUNT", numeric(0)),
        field("REQMETHOD", text(log.method)),
        field("REQURL", text(log.url)),
        field("REQHEADER", text(JSON.stringify(log.headers))),
        field("REQBODY", text(log.requestBody)),
        field("RESBODY", text(JSON.stringify(log.responseBody))),
        field("PROCESSEDBODY", text(JSON.stringify(log.processedBody))),
        field("ERRORCODE", text(
          log.errorCode >= 400 ? String(log.errorCode) : null
        ))
      ]
    }
  };
}

export async function sendIntegrationLog(log) {
  try {
    const payload = buildPayload(log);

    await hxgnLoggerClient.post(
      "/userdefinedscreenservices",
      payload
    );
  } catch (err) {
    logger.error(`Send Integration Log Failed for Batch (${log.batch}): `, {
      message: err.response?.data?.ErrorAlert?.[0]?.Message || err.message
    });
  }
}