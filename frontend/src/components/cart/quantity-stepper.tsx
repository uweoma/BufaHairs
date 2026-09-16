'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  size = 'default',
}: QuantityStepperProps) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className={cn('inline-flex items-center rounded-full border bg-background', disabled && 'opacity-50')}>
      <button
        type="button"
        aria-label="Decrease quantity"
        className={cn('flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40', dim)}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[2ch] text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={cn('flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40', dim)}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
