'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  FileText,
  Gauge,
  Search,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Unlink2,
} from 'lucide-react';
import { HeaderActions } from './HeaderActions';

const primaryNav = [
  { href: '/dashboard', label: 'ダッシュボード', icon: Gauge },
  { href: '/queries', label: 'クエリ分析', icon: Search },
  { href: '/pages', label: 'ページ分析', icon: FileText },
  { href: '/opportunities', label: '改善機会', icon: Sparkles },
];

const analysisNav = [
  { href: '/anomalies', label: '異常検知', icon: AlertTriangle },
  { href: '/movements', label: 'クエリ変動', icon: ArrowRightLeft },
  { href: '/growth', label: '急上昇', icon: TrendingUp },
  { href: '/declines', label: '急落', icon: TrendingDown },
  { href: '/ctr', label: 'CTR改善', icon: Activity },
  { href: '/cannibalization', label: 'カニバリ', icon: Unlink2 },
  { href: '/reports', label: 'レポート', icon: BarChart3 },
];

const systemNav = [
  { href: '/settings', label: '設定', icon: Settings },
];

const allNav = [...primaryNav, ...analysisNav, ...systemNav];

function NavLink({ href, label, icon: Icon }: (typeof allNav)[number]) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
  return (
    <Link className={`app-nav__link${active ? ' is-active' : ''}`} href={href}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = allNav.find(
    (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)),
  );
  const mobileNav = [primaryNav[0], primaryNav[1], primaryNav[2], primaryNav[3], analysisNav[6]];

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="メインナビゲーション">
        <Link href="/dashboard" className="app-brand">
          <span className="app-brand__mark">SC</span>
          <span>
            <span className="app-brand__name">GSC Analyzer</span>
            <span className="app-brand__sub">Search Intelligence</span>
          </span>
        </Link>

        <nav className="app-nav">
          <div className="app-nav__section">Workspace</div>
          {primaryNav.map((item) => <NavLink key={item.href} {...item} />)}
          <div className="app-nav__section">Analysis</div>
          {analysisNav.map((item) => <NavLink key={item.href} {...item} />)}
          <div className="app-nav__section">System</div>
          {systemNav.map((item) => <NavLink key={item.href} {...item} />)}
        </nav>

        <div className="app-sidebar__footer">
          <div className="app-sidebar__status">
            <div className="app-sidebar__status-title">
              <span className="app-sidebar__status-dot" />
              Phase 6 Query Movement
            </div>
            <div className="app-sidebar__status-text">New / Lost・TOP10出入り・Web/画像/動画</div>
          </div>
        </div>
      </aside>

      <header className="app-header">
        <div className="app-header__left">
          <div className="app-header__crumbs" aria-label="パンくず">
            <span>GSC Analyzer</span>
            <span>/</span>
            <span className="app-header__crumb-current">{current?.label ?? '分析'}</span>
          </div>
        </div>
        <div className="app-header__right"><HeaderActions /></div>
      </header>

      <main className="app-main"><div className="app-content">{children}</div></main>

      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} className={`mobile-nav__link${active ? ' is-active' : ''}`} href={href}>
              <Icon aria-hidden="true" />
              <span>{label.replace('ダッシュボード', '概要').replace('改善機会', '改善')}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
