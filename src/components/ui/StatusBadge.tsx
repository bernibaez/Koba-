import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  dot?: boolean;
}

export default function StatusBadge({ variant, label, dot = true }: StatusBadgeProps) {
  const classes: Record<BadgeVariant, string> = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
  };

  const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    neutral: 'bg-muted-foreground',
  };

  return (
    <span className={`${classes[variant]} shadow-sm`}>
      {dot && <span className={`w-2 h-2 rounded-full ${dotColors[variant]} flex-shrink-0 animate-pulse`} />}
      <span className="font-bold">{label}</span>
    </span>
  );
}