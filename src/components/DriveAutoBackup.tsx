/**
 * Invisible component: when the user has Drive auto-backup on and is signed in,
 * push a fresh backup a few seconds after the wardrobe changes (debounced, and
 * silent — auto-backups never toast). Mounted once near the app root.
 */
import { useEffect, useRef } from 'react';
import { backupToDrive } from '@/lib/drive';
import { useStore } from '@/store/useStore';

const DEBOUNCE_MS = 5000;

export function DriveAutoBackup(): null {
  const auto = useStore((s) => s.drive.auto);
  const email = useStore((s) => s.drive.email);
  // Watch every slice that exportData() captures (the whole wardrobes map ref changes
  // on any bucket edit, so it covers tops/bottoms/shades/worn/saved/dismissed for all 4).
  const wardrobes = useStore((s) => s.wardrobes);
  const gender = useStore((s) => s.gender);
  const mode = useStore((s) => s.mode);
  const mst = useStore((s) => s.mst);
  const style = useStore((s) => s.style);

  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return; // don't fire on initial mount/hydration
    }
    if (!auto || !email) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (running.current) return;
      running.current = true;
      try {
        const iso = await backupToDrive(useStore.getState().exportData());
        useStore.getState().setDriveLastBackup(iso);
      } catch {
        // Stay quiet — the user can still back up manually from the panel.
      } finally {
        running.current = false;
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [auto, email, wardrobes, gender, mode, mst, style]);

  return null;
}
