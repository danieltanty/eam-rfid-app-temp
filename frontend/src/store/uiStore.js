import { create } from "zustand";

export const useUIStore = create((set) => ({
  loadingCount: 0,

  startLoading: () =>
    set((state) => ({
      loadingCount: state.loadingCount + 1,
    })),

  stopLoading: () =>
    set((state) => ({
      loadingCount: Math.max(0, state.loadingCount - 1),
    })),

  snackbar: {
    open: false,
    message: "",
    severity: "info",
  },

  showSnackbar: (message, severity = "info") =>
    set({
      snackbar: {
        open: true,
        message,
        severity,
      },
    }),

  closeSnackbar: () =>
    set((state) => ({
      snackbar: { ...state.snackbar, open: false },
    })),

  confirmDialog: {
    open: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    onCancel: null,
  },

  showConfirmDialog: ({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
  }) =>
    new Promise((resolve) => {
      set({
        confirmDialog: {
          open: true,
          title,
          message,
          confirmText,
          cancelText,

          onConfirm: () => {
            resolve(true);

            set((state) => ({
              confirmDialog: {
                ...state.confirmDialog,
                open: false,
              },
            }));
          },

          onCancel: () => {
            resolve(false);

            set((state) => ({
              confirmDialog: {
                ...state.confirmDialog,
                open: false,
              },
            }));
          },
        },
      });
    }),
}));