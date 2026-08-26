'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Info,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, className, children, ...props }: ButtonProps) {
  return (
    <button className={cx('ui-button', `ui-button--${variant}`, size !== 'md' && `ui-button--${size}`, className)} {...props}>
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={cx('ui-icon-button', className)} type="button" aria-label={label} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, padded = true, className, ...props }: HTMLAttributes<HTMLElement> & { padded?: boolean }) {
  return <section className={cx('ui-card', padded && 'ui-card--padded', className)} {...props}>{children}</section>;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="ui-card__head">
      <div>
        <div className="ui-card__title">{title}</div>
        {description && <div className="ui-card__description">{description}</div>}
      </div>
      {action}
    </div>
  );
}

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}

export function Chip({ children, removable = false }: { children: ReactNode; removable?: boolean }) {
  return (
    <span className="ui-chip">
      {children}
      {removable && <X size={10} aria-hidden="true" />}
    </span>
  );
}

function FieldLabel({ label, hint }: { label?: string; hint?: string }) {
  if (!label) return null;
  return (
    <span className="ui-label">
      <span>{label}</span>
      {hint && <span className="ui-label__hint">{hint}</span>}
    </span>
  );
}

export function InputField({ label, hint, icon = false, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; icon?: boolean }) {
  return (
    <label className="ui-field">
      <FieldLabel label={label} hint={hint} />
      <span className="ui-input-wrap">
        {icon && <Search className="ui-input-icon" aria-hidden="true" />}
        <input className={cx('ui-input', icon && 'ui-input--icon')} {...props} />
      </span>
    </label>
  );
}

export function SelectField({ label, hint, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string }) {
  return (
    <label className="ui-field">
      <FieldLabel label={label} hint={hint} />
      <select className="ui-select" {...props}>{children}</select>
    </label>
  );
}

export function TextareaField({ label, hint, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <label className="ui-field">
      <FieldLabel label={label} hint={hint} />
      <textarea className="ui-textarea" {...props} />
    </label>
  );
}

export function Checkbox({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="ui-check">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

export function Radio({ label, name, defaultChecked = false }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="ui-radio">
      <input type="radio" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

export function Switch({ label, initial = false, checked, onChange }: { label: string; initial?: boolean; checked?: boolean; onChange?: (checked: boolean) => void }) {
  const [internal, setInternal] = useState(initial);
  const controlled = typeof checked === 'boolean';
  const enabled = controlled ? checked : internal;
  const toggle = () => {
    const next = !enabled;
    if (!controlled) setInternal(next);
    onChange?.(next);
  };
  return (
    <span className={cx('ui-switch', enabled && 'is-on')}>
      <button
        type="button"
        className="ui-switch__track"
        aria-pressed={enabled}
        aria-label={`${label}を${enabled ? 'オフ' : 'オン'}にする`}
        onClick={toggle}
      />
      <span>{label}</span>
    </span>
  );
}

export function Tabs({ items, initial = 0 }: { items: string[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  return (
    <div className="ui-tabs" role="tablist">
      {items.map((item, index) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={active === index}
          className={cx('ui-tabs__item', active === index && 'is-active')}
          onClick={() => setActive(index)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

const alertIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} as const;

export function Alert({ tone = 'info', children }: { tone?: Exclude<Tone, 'neutral'>; children: ReactNode }) {
  const Icon = alertIcons[tone];
  return (
    <div className={`ui-alert ui-alert--${tone}`} role="status">
      <Icon aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Skeleton({ width = '100%', height = 12 }: { width?: string | number; height?: number }) {
  return <div className="ui-skeleton" style={{ width, height }} aria-hidden="true" />;
}

export function EmptyState({ title = 'データがありません', text = '条件を変更してもう一度お試しください。', action }: { title?: string; text?: string; action?: ReactNode }) {
  return (
    <div className="ui-empty">
      <div>
        <div className="ui-empty__icon"><Inbox aria-hidden="true" /></div>
        <div className="ui-empty__title">{title}</div>
        <div className="ui-empty__text">{text}</div>
        {action && <div style={{ marginTop: 10 }}>{action}</div>}
      </div>
    </div>
  );
}

export function Pagination({ current = 1, pages = 1, onChange }: { current?: number; pages?: number; onChange?: (page: number) => void }) {
  if (pages <= 1) return null;
  const move = (page: number) => onChange?.(Math.max(1, Math.min(pages, page)));
  const visiblePages = Array.from({ length: pages }, (_, index) => index + 1).filter((page) => pages <= 7 || page === 1 || page === pages || Math.abs(page - current) <= 2);
  return (
    <nav className="ui-pagination" aria-label="ページネーション">
      <button className="ui-pagination__item" type="button" aria-label="前のページ" disabled={current <= 1} onClick={() => move(current - 1)}><ChevronLeft size={12} /></button>
      {visiblePages.map((page, index) => {
        const previous = visiblePages[index - 1];
        return (
          <span key={page} style={{ display: 'contents' }}>
            {previous && page - previous > 1 && <span className="ui-pagination__ellipsis">…</span>}
            <button type="button" className={cx('ui-pagination__item', page === current && 'is-active')} aria-current={page === current ? 'page' : undefined} onClick={() => move(page)}>{page}</button>
          </span>
        );
      })}
      <button className="ui-pagination__item" type="button" aria-label="次のページ" disabled={current >= pages} onClick={() => move(current + 1)}><ChevronRight size={12} /></button>
    </nav>
  );
}

export function PageHead({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="page-head__eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  );
}
