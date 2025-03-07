export type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarMessage {
  message: string;
  severity: SnackbarSeverity;
  open: boolean;
}

export interface SnackbarContextData {
  snackbar: SnackbarMessage;
  showSnackbar: (message: string, severity: SnackbarSeverity) => void;
  hideSnackbar: () => void;
} 