import { Box, Card, CardContent, Divider, Skeleton } from "@mui/material";

export const AssetCardSkeleton = () => {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, borderLeft: "6px solid #d8d8d8" }}>
      <CardContent
        sx={{ display: "flex", justifyContent: "space-between" }}
      >
        <Box display="flex" flexDirection="column" gap={1} sx={{ width: "100%" }}>
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="rounded" width={80} height={24} />
        </Box>

        <Box display="flex" alignItems="center">
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </CardContent>
    </Card>
  );
};

export const StatsSkeleton = (key) => (
  <Box
    key={key}
    sx={{
      flex: 1,
      p: 1.5,
      borderRadius: 2,
      boxShadow: 1,
      justifyItems: "center"
    }}
  >
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="circular" width={24} height={24} />
  </Box>
);

export const WorkOrderSkeleton = () => {
  return (
    <Card 
      sx={{ 
        borderRadius: 2, 
        boxShadow: 2,
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Skeleton variant="text" width={80} height={28} />
          <Skeleton variant="rounded" width={70} height={24} />
        </Box>

        <Skeleton variant="text" width="60%" sx={{ mt: 3 }} />
        <Skeleton variant="text" width="40%" sx={{ mt: 1 }} />
        <Skeleton variant="text" width={60} sx={{ mt: 2 }} />

        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 1
            }}
          >
            <Skeleton variant="text" width={80} />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="circular" width={20} height={20} />
            </Box>
          </Box>
        ))}

        <Divider sx={{ mt: 2 }} />

        <Skeleton
          variant="rounded"
          height={36}
          sx={{ mt: 2, borderRadius: 1 }}
        />

      </CardContent>
    </Card>
  );
};