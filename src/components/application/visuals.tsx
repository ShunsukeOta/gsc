'use client';

import { useId } from 'react';

export function Sparkline({ values, positive = true }: { values: number[]; positive?: boolean }) {
  const width = 112;
  const height = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => `${(index / Math.max(values.length - 1, 1)) * width},${height - ((value - min) / range) * (height - 4) - 2}`)
    .join(' ');

  return (
    <svg className={`p2-sparkline ${positive ? 'is-positive' : 'is-negative'}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="推移">
      <polyline points={points} />
    </svg>
  );
}

export function DonutChart({ items }: { items: Array<{ label: string; value: number; clicks?: number }> }) {
  const gradientId = useId();
  let cursor = 0;
  const segments = items.map((item, index) => {
    const start = cursor;
    cursor += item.value;
    const tones = ['var(--c-primary-600)', 'var(--c-primary-300)', 'var(--c-primary-100)'];
    return `${tones[index % tones.length]} ${start}% ${cursor}%`;
  });
  const total = items.reduce((sum, item) => sum + (item.clicks ?? 0), 0);

  return (
    <div className="p2-donut-wrap">
      <div className="p2-donut" style={{ background: `conic-gradient(${segments.join(',')})` }} aria-label="デバイス構成比">
        <div className="p2-donut__inner">
          <strong>{total ? total.toLocaleString() : '100%'}</strong>
          <span>{total ? 'クリック' : '構成比'}</span>
        </div>
      </div>
      <div className="p2-donut-legend" id={gradientId}>
        {items.map((item, index) => (
          <div className="p2-donut-legend__row" key={item.label}>
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
  return (
    <div className="p2-bars">
      {items.map((item) => (
        <div className="p2-bars__row" key={item.label}>
          <div className="p2-bars__label"><span>{item.label}</span><strong>{item.count}</strong></div>
          <div className="p2-bars__track"><span style={{ width: `${item.value}%` }} /></div>
          <div className="p2-bars__value">{item.value}%</div>
        </div>
      ))}
    </div>
  );
}

export function MicroBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="p2-micro-bars" aria-label="期間推移">
      {values.map((value, index) => <span key={`${index}-${value}`} style={{ height: `${Math.max((value / max) * 100, 7)}%` }} />)}
    </div>
  );
}
