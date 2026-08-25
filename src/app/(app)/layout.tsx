import { GscWorkspaceProvider } from '@/components/application/gsc-context';
import { AppShell } from '@/components/layout/AppShell';

export default function ApplicationLayout({ children }: { children: React.ReactNode }) {
  return <GscWorkspaceProvider><AppShell>{children}</AppShell></GscWorkspaceProvider>;
}
