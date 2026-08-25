'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpenCheck,
  FileText,
  Gauge,
  HelpCircle,
  Layers3,
  Search,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

const primaryNav = [
  { href: '/dashboard', label: 'ダッシュボード', icon: Gauge },
  { href: '/queries', label: 'クエリ分析', icon: Search },
  { href: '/pages', label: 'ページ分析', icon: FileText },
  { href: '/opportunities', label: '改善機会', icon: Sparkles },
  { href: '/design-system', label: 'UIシステム', icon: Layers3 },
];

const analysisNav = [
  { href: '/growth', label: '急上昇', icon: TrendingUp },
  { href: '/declines', label: '急落', icon: TrendingDown },
  { href: '/ctr', label: 'CTR改善', icon: Activity },
  { href: '/reports', label: 'レポート', icon: BarChart3 },
];

function NavLink({ href, label, icon: Icon }: (typeof primaryNav)[number]) {
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
  const current = [...primaryNav, ...analysisNav].find(
    (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)),
  );

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
          {primaryNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          <div className="app-nav__section">Analysis</div>
          {analysisNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          <div className="app-nav__section">System</div>
          <NavLink href="/settings" label="設定" icon={Settings} />
        </nav>

        <div className="app-sidebar__footer">
          <div className="app-sidebar__status">
            <div className="app-sidebar__status-title">
              <span className="app-sidebar__status-dot" />
              Phase 1 Foundation
            </div>
            <div className="app-sidebar__status-text">UI基盤・ダミーデータ環境</div>
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

        <div className="app-header__right">
          <div className="app-header__search" role="search">
            <Search aria-hidden="true" />
            <span>クエリ・ページを検索...</span>
          </div>
          <button className="ui-icon-button" type="button" aria-label="通知">
            <Bell size={14} />
          </button>
          <button className="ui-icon-button" type="button" aria-label="ヘルプ">
            <HelpCircle size={14} />
          </button>
          <div className="app-user">
            <span className="app-user__avatar">SO</span>
            <span className="app-user__name">Shunsuke Ota</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>

      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        {primaryNav.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} className={`mobile-nav__link${active ? ' is-active' : ''}`} href={href}>
              <Icon aria-hidden="true" />
              <span>{label.replace('ダッシュボード', '概要').replace('UIシステム', 'UI')}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
