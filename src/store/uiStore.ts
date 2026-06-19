/**
 * Transient UI state — never persisted. Drives the in-tree overlays (drawer,
 * panels, toast) so the navigation library only owns the route tree.
 */
import { create } from 'zustand';

export type PanelId = 'skin' | 'about' | 'combos' | 'saved' | 'reminder' | null;

interface UiState {
  drawerOpen: boolean;
  panel: PanelId;
  toast: { msg: string; n: number };
  openDrawer: () => void;
  closeDrawer: () => void;
  openPanel: (p: Exclude<PanelId, null>) => void;
  closePanel: () => void;
  showToast: (msg: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  drawerOpen: false,
  panel: null,
  toast: { msg: '', n: 0 },
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  openPanel: (p) => set({ panel: p, drawerOpen: false }),
  closePanel: () => set({ panel: null }),
  showToast: (msg) => set({ toast: { msg, n: get().toast.n + 1 } }),
}));
