import React from 'react';

interface ProductInitialProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-full aspect-square text-3xl',
};

export function getProductInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export default function ProductInitial({ name, size = 'sm', className = '' }: ProductInitialProps) {
  return (
    <div
      className={`rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 select-none ${sizeClasses[size]} ${className}`}
      aria-hidden="true"
      title={name}
    >
      {getProductInitial(name)}
    </div>
  );
}
