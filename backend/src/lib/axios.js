import axios from "axios";
import { ENV } from "../config/env.js";
import { sendIntegrationLog } from "../services/integrationLog.service.js";
import { HTTP_EVENT_TYPES } from "../constants/httpEventTypes.js";
import logger from "../config/logger.js";

export const eamClient = axios.create({
  baseURL: ENV.EAM_BASE_URL,
  timeout: 10000,
  headers: {
    tenant: ENV.EAM_TENANT,
    organization: ENV.EAM_ORG
  },
  auth: {
    username: ENV.EAM_USERNAME,
    password: ENV.EAM_PASSWORD
  }
});

eamClient.interceptors.request.use((config) => {
  config.metadata = config.metadata || {};
  config.metadata.startTime = Date.now();

  const context = config.metadata;
  logger.info(HTTP_EVENT_TYPES.REQ_OUT, {
    method: config.method?.toUpperCase(),
    path: config.url,
    batch: context?.batch,
    batchSeq: context?.batchSeq,
    username: context?.username
  })

  return config;
});

eamClient.interceptors.response.use(
  async (response) => {
    const config = response.config || {};
    const context = config.metadata || {};

    const startTime = context.startTime || Date.now();
    const duration = Date.now() - startTime;

    logger.info(HTTP_EVENT_TYPES.RES_IN, {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      status: response.status,
      duration,
      batch: context?.batch,
      batchSeq: context?.batchSeq,
      username: context?.username
    })

    sendIntegrationLog({
      batch: context.batch,
      batchSeq: context.batchSeq,
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      headers: config.headers,
      requestBody: config.data,
      responseBody: response?.data,
      errorCode: response?.status
    });

    return response;
  },
  async (error) => {
    const config = error.config || {};
    const response = error.response;
    const context = config.metadata;

    const startTime = context.startTime || Date.now();
    const duration = Date.now() - startTime;
    
    logger.info(HTTP_EVENT_TYPES.RES_IN, {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      status: response?.status,
      duration,
      error: true,
      batch: context?.batch,
      batchSeq: context?.batchSeq,
      username: context?.username
    })

    sendIntegrationLog({
      batch: context.batch,
      batchSeq: context.batchSeq,
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      headers: config.headers,
      requestBody: config.data,
      responseBody: response?.data,
      errorCode: response?.status
    });

    return Promise.reject(error);
  }
);