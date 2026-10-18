import React from 'react';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

export interface SegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  className?: string;
  ariaLabel?: string;
}

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className = '',
  ariaLabel = 'Opciones de selección',
}: SegmentedControlProps<T>) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = options.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    onChange(options[nextIndex].id);
    const buttons = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center p-1 rounded-xl bg-[var(--chip)] select-none max-w-full overflow-x-auto ${className}`}
    >
      {options.map((option, idx) => {
        const isSelected = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] whitespace-nowrap ${
              isSelected
                ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs'
                : 'text-[var(--ink2)] hover:text-[var(--ink)] font-normal'
            }`}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-md font-medium transition-colors ${
                  isSelected
                    ? 'bg-[var(--chip)] text-[var(--ink2)]'
                    : 'text-[var(--ink3)]'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
