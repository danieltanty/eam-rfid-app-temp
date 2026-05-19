import { Box, Card, CardContent, Typography, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function CardList({
  data,
  renderContent,
  onInspect
}) {
  if (!data || data.length === 0) {
    return <Typography>No data available</Typography>;
  }

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {data.map((item) => (
        <Card
          key={item.id}
          sx={{
            borderRadius: 2,
            boxShadow: 2,
            transition: "0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: 4
            }
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Box flex={1}>
              {renderContent(item)}
            </Box>

            {onInspect && (
              <IconButton onClick={() => onInspect(item)}>
                <SearchIcon />
              </IconButton>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}