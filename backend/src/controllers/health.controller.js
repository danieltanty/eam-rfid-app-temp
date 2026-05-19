import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { eamClient } from "../lib/axios.js";

export const getEamHealth = asyncHandler(async (req, res) => {
  const start = Date.now();

  try {
    const response = await eamClient.get("/organization");
    const duration = Date.now() - start;

    res.json(
      new ApiResponse({
        data: {
          status: "UP",
          eam: {
            reachable: true,
            statusCode: response.status,
            responseTimeMs: duration
          }
        },
        message: "HxGN EAM is available"
      })
    );
  } catch (err) {
    const duration = Date.now() - start;

    res.status(503).json({
      success: false,
      data: {
        status: "DOWN",
        eam: {
          reachable: false,
          responseTimeMs: duration,
          error:
            err.response?.data?.ErrorAlert?.[0]?.Message ||
            err.message
        }
      },
      message: "HxGN EAM is unavailable"
    });
  }
});