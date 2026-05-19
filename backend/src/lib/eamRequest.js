import { getNextBatchSeq } from "../utils/context.util.js";

export function eamRequest(context, config = {}) {
  return {
    ...config,
    metadata: {
      ...context,
      batchSeq: getNextBatchSeq(context)
    }
  };
}