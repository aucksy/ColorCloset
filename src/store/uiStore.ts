/**
 * Transient UI state — never persisted. Drives the in-tree overlays (drawer,
 * panels, toast) and the main-screen pane so the navigation library only owns the
 * route tree. `pane` lives here (not in main.tsx) so panels can switch to "Style me"
 * after loading a combo from the rotation/saved lists.
 */
import { create } from 'zustand';

export type PanelId = 'skin' | 'about' | 'combos' | 'saved' | 'reminder' | 'backup' | 'sources' | null;
export type Pane = 'rec' | 'shop';

interface UiState {
  drawerOpen: boolean;
  panel: PanelId;
  pane: Pane;
  toast: { msg: string; n: number };
  openDrawer: () => void;
  closeDrawer: () => void;
  openPanel: (p: Exclude<PanelId, null>) => void;
  closePanel: () => void;
  setPane: (p: Pane) => void;
  showToast: (msg: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  drawerOpen: false,
  panel: null,
  pane: 'rec',
  toast: { msg: '', n: 0 },
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  openPanel: (p) => set({ panel: p, drawerOpen: false }),
  closePanel: () => set({ panel: null }),
  setPane: (p) => set({ pane: p }),
  showToast: (msg) => set({ toast: { msg, n: get().toast.n + 1 } }),
}));
