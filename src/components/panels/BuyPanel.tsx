import { MODE_LABEL } from '@/engine';
import { PanelShell } from '@/components/PanelShell';
import { WhatToBuyPane } from '@/components/WhatToBuyPane';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';

/** "Colours to buy" as a side-menu panel (was a top tab). Reflects the active gender×mode. */
export function BuyPanel() {
  const closePanel = useUiStore((s) => s.closePanel);
  const mode = useStore((s) => s.mode);
  return (
    <PanelShell title={`Colours to buy · ${MODE_LABEL[mode]}`} onClose={closePanel}>
      <WhatToBuyPane />
    </PanelShell>
  );
}
