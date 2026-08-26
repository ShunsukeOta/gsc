'use client';

import { RefreshCw, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { useGscWorkspace } from './gsc-context';

export function RefreshAnalysisButton({ label = '再分析', icon }: { label?: string; icon?: ReactNode }) {
  const workspace = useGscWorkspace();
  return (
    <Button
      icon={icon ?? <RefreshCw />}
      disabled={!workspace.session.authenticated || !workspace.selectedSite || workspace.analysisLoading}
      onClick={() => void workspace.refresh(true)}
    >
      {workspace.analysisLoading ? '分析中...' : label}
    </Button>
  );
}

export function AnalysisConditionsButton({ label = '分析条件' }: { label?: string }) {
  const focusConditions = () => {
    const target = document.getElementById('workspace-filters');
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('is-attention');
    window.setTimeout(() => target.classList.remove('is-attention'), 1200);
    window.setTimeout(() => target.querySelector<HTMLElement>('select, input, button')?.focus(), 350);
  };
  return <Button icon={<SlidersHorizontal />} onClick={focusConditions}>{label}</Button>;
}
