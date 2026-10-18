import React from 'react';

export interface MetricStatProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  secondaryText?: string;
  valueColor?: string;
  highlightWarn?: boolean;
  className?: string;
}

export default function MetricStat({
  label,
  value,
  prefix,
  suffix,
  secondaryText,
  valueColor,
  highlightWarn = false,
  className = '',
}: MetricStatProps) {
  const resolvedValueColor = valueColor || (highlightWarn ? 'var(--warn)' : 'var(--ink)');

  return (
    <div
      className={`flex flex-col gap-0.5 select-none ${className}`}
      role="group"
      aria-label={`${label}: ${prefix ? prefix + ' ' : ''}${value}${suffix ? ' ' + suffix : ''}${secondaryText ? ', ' + secondaryText : ''}`}
    >
      <span className="apple-metric-label text-xs sm:text-[13px] text-[var(--ink2)] font-normal">{label}</span>
      <div className="flex items-baseline gap-1">
        {prefix && (
          <span
            className="text-xs sm:text-sm font-medium tracking-normal text-[var(--ink2)]"
          >
            {prefix}
          </span>
        )}
        <span
          className="apple-metric-value text-2xl sm:text-[28px] font-semibold tracking-tight"
          style={{ color: resolvedValueColor }}
        >
          {value}
        </span>
        {suffix && (
          <span
            className="text-xs font-normal text-[var(--ink2)]"
          >
            {suffix}
          </span>
        )}
      </div>
      {secondaryText && (
        <span className="text-xs font-normal text-[var(--ink2)] tracking-normal mt-0.5">
          {secondaryText}
        </span>
      )}
    </div>
  );
}
