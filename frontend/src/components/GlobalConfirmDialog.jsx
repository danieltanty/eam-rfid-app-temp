import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

import { useUIStore } from "../store";

export default function GlobalConfirmDialog() {
  const confirmDialog = useUIStore(
    (state) => state.confirmDialog
  );

  return (
    <Dialog
      open={confirmDialog.open}
      onClose={confirmDialog.onCancel}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        {confirmDialog.title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{ whiteSpace: "pre-line" }}
        >
          {confirmDialog.message}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={confirmDialog.onCancel}
          color="inherit"
        >
          {confirmDialog.cancelText}
        </Button>

        <Button
          variant="contained"
          onClick={confirmDialog.onConfirm}
        >
          {confirmDialog.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}