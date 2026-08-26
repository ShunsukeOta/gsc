'use client';

import { useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';

type TooltipLine = { label: string; value: string };
type PointDetail = { label?: string; lines?: TooltipLine[]; note?: string };

type SeriesInteractionProps = {
  values: number[];
  details?: PointDetail[];
  valueLabel?: string;
  note?: string;
};

const LONG_PRESS_MS = 250;
const MOVE_CANCEL_PX = 9;

function formatValue(value: number) {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(value);
}

function useLinearInteraction(length: number) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const holdingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const indexFromX = (element: HTMLElement, clientX: number) => {
    if (length <= 1) return 0;
    const rect = element.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(rect.width, 1)));
    return Math.round(ratio * (length - 1));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!length) return;
    if (event.pointerType === 'mouse') {
      setActiveIndex(indexFromX(event.currentTarget, event.clientX));
      return;
    }
    clearTimer();
    holdingRef.current = false;
    startRef.current = { x: event.clientX, y: event.clientY };
    const element = event.currentTarget;
    const clientX = event.clientX;
    timerRef.current = setTimeout(() => {
      holdingRef.current = true;
      setActiveIndex(indexFromX(element, clientX));
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!length) return;
    if (event.pointerType === 'mouse') {
      setActiveIndex(indexFromX(event.currentTarget, event.clientX));
      return;
    }
    if (!holdingRef.current) {
      const start = startRef.current;
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > MOVE_CANCEL_PX) clearTimer();
      return;
    }
    setActiveIndex(indexFromX(event.currentTarget, event.clientX));
  };

  const finishTouch = (event: ReactPointerEvent<HTMLDivElement>) => {
    clearTimer();
    if (event.pointerType !== 'mouse') setActiveIndex(null);
    holdingRef.current = false;
    startRef.current = null;
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setActiveIndex(null);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!length || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const current = activeIndex ?? 0;
    const next = event.key === 'ArrowLeft' ? Math.max(0, current - 1) : Math.min(length - 1, current + 1);
    setActiveIndex(next);
  };

  return {
    activeIndex,
    setActiveIndex,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishTouch,
      onPointerCancel: finishTouch,
      onPointerLeave,
      onFocus: () => { if (length) setActiveIndex((current) => current ?? 0); },
      onBlur: () => setActiveIndex(null),
      onKeyDown,
    },
  };
}

function ChartTooltip({ index, count, value, detail, valueLabel = '値', note }: { index: number; count: number; value: number; detail?: PointDetail; valueLabel?: string; note?: string }) {
  const position = count <= 1 ? 50 : (index / (count - 1)) * 100;
  const left = Math.min(90, Math.max(10, position));
  return (
    <div className="p6-chart-tooltip" style={{ left: `${left}%` }} role="status">
      <strong>{detail?.label || `ポイント ${index + 1} / ${count}`}</strong>
      <div><span>{valueLabel}</span><b>{formatValue(value)}</b></div>
      {detail?.lines?.map((line) => <div key={`${line.label}:${line.value}`}><span>{line.label}</span><b>{line.value}</b></div>)}
      {(detail?.note || note) && <small>{detail?.note || note}</small>}
    </div>
  );
}

export function Sparkline({ values, positive = true, details, valueLabel = '推移目安', note = '期間比較から生成した補助トレンドです。実日次値ではありません。' }: SeriesInteractionProps & { positive?: boolean }) {
  const width = 112;
  const height = 34;
  const safeValues = values.length ? values : [0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = Math.max(max - min, 1);
  const coordinates = values.map((value, index) => ({
    x: (index / Math.max(values.length - 1, 1)) * width,
    y: height - ((value - min) / range) * (height - 4) - 2,
  }));
  const points = coordinates.map((point) => `${point.x},${point.y}`).join(' ');
  const interaction = useLinearInteraction(values.length);
  const activePoint = interaction.activeIndex == null ? null : coordinates[interaction.activeIndex];

  return (
    <div className="p6-interactive-chart p6-interactive-chart--spark" tabIndex={0} aria-label="推移グラフ。マウスホバー、長押し、左右キーで数値を確認できます。" {...interaction.handlers}>
      <svg className={`p2-sparkline ${positive ? 'is-positive' : 'is-negative'}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="推移">
        <polyline points={points} />
        {activePoint && <><line className="p6-chart-guide" x1={activePoint.x} x2={activePoint.x} y1="1" y2={height - 1} /><circle className="p6-chart-point" cx={activePoint.x} cy={activePoint.y} r="3.5" /></>}
      </svg>
      {interaction.activeIndex != null && values[interaction.activeIndex] != null && <ChartTooltip index={interaction.activeIndex} count={values.length} value={values[interaction.activeIndex]} detail={details?.[interaction.activeIndex]} valueLabel={valueLabel} note={note} />}
    </div>
  );
}

export function DonutChart({ items }: { items: Array<{ label: string; value: number; clicks?: number }> }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = items.reduce((sum, item) => sum + (item.clicks ?? 0), 0);
  let cursor = 0;
  const ranges = items.map((item) => {
    const start = cursor;
    cursor += item.value;
    return { start, end: cursor };
  });
  const segments = items.map((item, index) => {
    const tones = ['var(--c-primary-600)', 'var(--c-primary-300)', 'var(--c-primary-100)'];
    return `${tones[index % tones.length]} ${ranges[index].start}% ${ranges[index].end}%`;
  });

  const indexFromPointer = (element: HTMLElement, clientX: number, clientY: number) => {
    const rect = element.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const radius = Math.min(rect.width, rect.height) / 2;
    const distance = Math.hypot(dx, dy);
    if (distance < radius * .52 || distance > radius * 1.05) return null;
    const angle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    const percent = angle / 3.6;
    return ranges.findIndex((range) => percent >= range.start && percent < range.end);
  };

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const index = indexFromPointer(event.currentTarget, event.clientX, event.clientY);
    setActiveIndex(index != null && index >= 0 ? index : null);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    clearTimer();
    const element = event.currentTarget;
    const { clientX, clientY } = event;
    timerRef.current = setTimeout(() => {
      const index = indexFromPointer(element, clientX, clientY);
      setActiveIndex(index != null && index >= 0 ? index : null);
    }, LONG_PRESS_MS);
  };

  const active = activeIndex == null ? null : items[activeIndex];
  return (
    <div className="p2-donut-wrap">
      <div className="p6-donut-interactive">
        <div
          className="p2-donut"
          style={{ background: `conic-gradient(${segments.join(',')})` }}
          aria-label="デバイス構成比。ホバーまたは長押しで詳細を表示します。"
          tabIndex={0}
          onPointerMove={onPointerMove}
          onPointerLeave={(event) => { if (event.pointerType === 'mouse') setActiveIndex(null); }}
          onPointerDown={onPointerDown}
          onPointerUp={(event) => { clearTimer(); if (event.pointerType !== 'mouse') setActiveIndex(null); }}
          onPointerCancel={() => { clearTimer(); setActiveIndex(null); }}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={(event) => {
            if (!items.length || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
            event.preventDefault();
            const current = activeIndex ?? 0;
            setActiveIndex(event.key === 'ArrowLeft' ? Math.max(0, current - 1) : Math.min(items.length - 1, current + 1));
          }}
          onFocus={() => { if (items.length) setActiveIndex((current) => current ?? 0); }}
        >
          <div className="p2-donut__inner">
            <strong>{active ? `${active.value.toFixed(1)}%` : total ? total.toLocaleString() : '100%'}</strong>
            <span>{active ? active.label : total ? 'クリック' : '構成比'}</span>
          </div>
        </div>
        {active && <div className="p6-donut-tooltip"><strong>{active.label}</strong><div><span>構成比</span><b>{active.value.toFixed(1)}%</b></div><div><span>クリック</span><b>{(active.clicks ?? 0).toLocaleString()}</b></div></div>}
      </div>
      <div className="p2-donut-legend">
        {items.map((item, index) => (
          <div className={`p2-donut-legend__row${activeIndex === index ? ' is-active' : ''}`} key={item.label} tabIndex={0} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onBlur={() => setActiveIndex(null)}>
            <span className={`p2-dot p2-dot--${index + 1}`} />
            <span>{item.label}</span>
            <strong>{item.value.toFixed(1)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarDistribution({ items }: { items: Array<{ label: string; value: number; count: number }> }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = null; };
  return (
    <div className="p2-bars">
      {items.map((item, index) => (
        <div
          className={`p2-bars__row p6-bar-row${activeIndex === index ? ' is-active' : ''}`}
          key={item.label}
          tabIndex={0}
          onPointerEnter={(event) => { if (event.pointerType === 'mouse') setActiveIndex(index); }}
          onPointerLeave={(event) => { if (event.pointerType === 'mouse') setActiveIndex(null); }}
          onPointerDown={(event) => {
            if (event.pointerType === 'mouse') return;
            clearTimer();
            timerRef.current = setTimeout(() => setActiveIndex(index), LONG_PRESS_MS);
          }}
          onPointerUp={(event) => { clearTimer(); if (event.pointerType !== 'mouse') setActiveIndex(null); }}
          onPointerCancel={() => { clearTimer(); setActiveIndex(null); }}
          onFocus={() => setActiveIndex(index)}
          onBlur={() => setActiveIndex(null)}
        >
          <div className="p2-bars__label"><span>{item.label}</span><strong>{item.count}</strong></div>
          <div className="p2-bars__track"><span style={{ width: `${item.value}%` }} /></div>
          <div className="p2-bars__value">{item.value}%</div>
          {activeIndex === index && <div className="p6-bar-tooltip"><strong>{item.label}</strong><div><span>クエリ数</span><b>{item.count.toLocaleString()}</b></div><div><span>構成比</span><b>{item.value.toFixed(1)}%</b></div></div>}
        </div>
      ))}
    </div>
  );
}

export function MicroBars({ values, details, valueLabel = '値', note }: SeriesInteractionProps) {
  const max = Math.max(...values, 1);
  const interaction = useLinearInteraction(values.length);
  return (
    <div className="p6-interactive-chart p6-interactive-chart--bars" tabIndex={0} aria-label="期間推移。マウスホバー、長押し、左右キーで数値を確認できます。" {...interaction.handlers}>
      <div className="p2-micro-bars" aria-label="期間推移">
        {values.map((value, index) => <span className={interaction.activeIndex === index ? 'is-active' : ''} key={`${index}-${value}`} style={{ height: `${Math.max((value / max) * 100, 7)}%` }} />)}
      </div>
      {interaction.activeIndex != null && values[interaction.activeIndex] != null && <ChartTooltip index={interaction.activeIndex} count={values.length} value={values[interaction.activeIndex]} detail={details?.[interaction.activeIndex]} valueLabel={valueLabel} note={note} />}
    </div>
  );
}
