import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { useNavigate } from "react-router-dom";
import { formatLocalDateTime } from "../utils/dateFormatter";
import { WorkOrderStatus } from "../constants";
import { createWorkOrderScan } from "../api/workOrder";
import { useEffect, useState } from "react";
import { getDeviceName } from "../utils/device";
import { WorkOrderSkeleton } from "../components/Skeletons";
import { fetchWorkOrders as fetchWOApi } from "../api/workOrder";
import { getLoggedInUsername } from "../utils/auth";

const WorkOrder = () => {
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const workOrderData = await fetchWOApi();
      setWorkOrders(workOrderData)
      setLoading(false);
    };

    load();
  }, []);

  const handleAction = async (wo) => {
    switch (wo.status) {
      case WorkOrderStatus.RELEASED:
        try {
          setLoadingId(wo.id);

          const deviceName = getDeviceName();
          await createWorkOrderScan({
            workOrderId: wo.id,
            status: WorkOrderStatus.FIRST_SCAN_IN_PROGRESS,
            deviceName,
            deviceIp: null,
            remark: "",
            initiatedBy: getLoggedInUsername()
          });

          navigate(`/inventory/perform/${wo.id}`);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingId(null);
        }
        break;

      case WorkOrderStatus.FIRST_SCAN_IN_PROGRESS:
      case WorkOrderStatus.SECOND_SCAN_IN_PROGRESS:
        navigate(`/inventory/perform/${wo.id}`);
        break;

      case WorkOrderStatus.FIRST_SCAN_COMPLETED:
      case WorkOrderStatus.SECOND_SCAN_COMPLETED:
        navigate(`/inventory/summary/${wo.id}`);
        break;

      default:
        break;
    }
  };

  const getActionText = (status) => {
    switch (status) {
      case WorkOrderStatus.RELEASED:
        return "Start Work Order";

      case WorkOrderStatus.FIRST_SCAN_IN_PROGRESS:
        return "Continue 1st Scan";

      case WorkOrderStatus.FIRST_SCAN_COMPLETED:
        return "View Summary";

      case WorkOrderStatus.SECOND_SCAN_IN_PROGRESS:
        return "Continue 2nd Scan";

      case WorkOrderStatus.SECOND_SCAN_COMPLETED:
        return "View Summary";

      case WorkOrderStatus.COMPLETED:
        return "Completed";

      default:
        return "Open";
    }
  };

  const renderScanIcon = (done) =>
    done ? (
      <CheckCircleIcon color="success" fontSize="small" />
    ) : (
      <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
    );

  const getZoneScanStatus = (zoneStatus) => {
    const status = Number(zoneStatus);

    return {
      firstScanDone: status >= 1,
      secondScanDone: status >= 2,
    };
  };

  const getCardColor = (status) => {
    if (status === WorkOrderStatus.COMPLETED) return "#f0fff1";
    if (status === WorkOrderStatus.RELEASED) return "white";
    return "#fff8e1";
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Work Orders
      </Typography>

      <Stack spacing={2}>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <WorkOrderSkeleton key={i} />
            ))
          : workOrders.map((wo) => {
              const formatted = formatLocalDateTime(wo.startDate);

              return (
                <Card
                  key={wo.id}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: getCardColor(wo.status),
                    boxShadow: 2
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        # {wo.id}
                      </Typography>

                      <Chip
                        label={wo.status}
                        size="small"
                        color={
                          wo.status === WorkOrderStatus.RELEASED
                            ? "inactive"
                            : wo.status === WorkOrderStatus.COMPLETED
                            ? "success"
                            : "warning"
                        }
                      />
                    </Box>

                    <Typography variant="body2" sx={{ mt: 3 }}>
                      <strong>Start Date: </strong>
                      {formatted.date} • {formatted.time}
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>PM: </strong> {wo.PM || "-"}
                    </Typography>

                    <Typography variant="body2" fontWeight="bold" sx={{ mt: 2 }}>
                      Zones
                    </Typography>

                    {wo.zone?.map((zone, idx) => {
                      const { firstScanDone, secondScanDone } = getZoneScanStatus(zone.status);

                      return (
                        <Box
                          key={`${zone.id}-${idx}`}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mt: 1
                          }}
                        >
                          <Typography variant="body2">
                            {zone.id}
                          </Typography>

                          <Box sx={{ display: "flex", gap: 1 }}>
                            {renderScanIcon(firstScanDone)}
                            {renderScanIcon(secondScanDone)}
                          </Box>
                        </Box>
                      );
                    })}

                    <Divider sx={{ mt: 2 }} />

                    {wo.status !== WorkOrderStatus.COMPLETED && (
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => handleAction(wo)}
                        disabled={loadingId === wo.id}
                      >
                        {getActionText(wo.status)}{loadingId === wo.id ? "..." : ""}
                      </Button>
                    )}

                  </CardContent>
                </Card>
              );
            })}
      </Stack>
    </Box>
  );
};

export default WorkOrder;