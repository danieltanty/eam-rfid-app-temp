import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Divider,
  useMediaQuery
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useRef, useEffect } from "react";
import { useTheme } from "@mui/material/styles";

const RfidScanModal = ({ open, onClose, onProcess }) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const inputRef = useRef(null);
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleProcess = () => {
    const raw = inputRef.current?.value || "";

    const parsedCodes = [
      ...new Set(
        raw
          .split(/[\n\r,]+/)
          .map(code => code.trim().toUpperCase())
          .filter(code => code !== "")
      )
    ];

    console.log('parsedCodes: ', parsedCodes);

    onProcess(parsedCodes);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      fullScreen={fullScreen}
      sx={{ margin: 1 }}
      maxWidth="sm"
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold"
        }}
      >
        RFID Scan Input

        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Scan or insert asset codes here (Separate by newline)
        </Typography>

        <TextField
          inputRef={inputRef}
          multiline
          rows={6}
          fullWidth
          autoFocus
          inputProps={{ inputMode: 'none' }}
          placeholder="Scan RFID tags here."
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleClose}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleProcess}
        >
          Process Scan
        </Button>

      </DialogActions>
    </Dialog>
  );
};

export default RfidScanModal;