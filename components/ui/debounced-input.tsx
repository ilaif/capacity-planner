import * as React from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

export interface DebouncedInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

export const DebouncedInput = React.forwardRef<HTMLInputElement, DebouncedInputProps>(
  ({ className, value, onChange, delay = 500, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(value);
    const debouncedValue = useDebounce(localValue, delay);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    React.useEffect(() => {
      if (debouncedValue !== value) {
        onChange(debouncedValue);
      }
    }, [debouncedValue, onChange, value]);

    return (
      <Input
        {...props}
        ref={ref}
        className={cn(className)}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
      />
    );
  }
);

DebouncedInput.displayName = 'DebouncedInput';
