import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type NumberInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
};

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  className,
  inputClassName,
  disabled,
  ...props
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? min : parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.min(Math.max(newValue, min), max));
    }
  };

  const increment = () => {
    onChange(Math.min(value + step, max));
  };

  const decrement = () => {
    onChange(Math.max(value - step, min));
  };

  return (
    <div className={cn('flex items-center', className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 min-w-6 max-w-6 rounded-r-none"
        onClick={decrement}
        disabled={disabled || value <= min}
        type="button"
      >
        <Minus className="h-3 w-3" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        className={cn(
          'px-0 min-w-8 h-8 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          inputClassName
        )}
        disabled={disabled}
        {...props}
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 min-w-6 max-w-6 rounded-l-none"
        onClick={increment}
        disabled={disabled || value >= max}
        type="button"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
