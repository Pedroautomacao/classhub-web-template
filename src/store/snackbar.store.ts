import { create } from 'zustand'

type Severity = 'success' | 'error' | 'warning' | 'info'

interface SnackbarState {
  open: boolean
  message: string
  severity: Severity
  show: (message: string, severity?: Severity) => void
  close: () => void
}

export const useSnackbarStore = create<SnackbarState>((set) => ({
  open: false,
  message: '',
  severity: 'success',
  show: (message, severity = 'success') => set({ open: true, message, severity }),
  close: () => set({ open: false }),
}))
