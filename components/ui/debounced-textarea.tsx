import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

export interface DebouncedTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

const DebouncedTextarea = React.forwardRef<HTMLTextAreaElement, DebouncedTextareaProps>(
  ({ className, value, onChange, debounceMs = 500, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const debouncedValue = useDebounce(localValue, debounceMs);

    React.useEffect(() => {
      if (debouncedValue !== value) {
        onChange(debouncedValue);
      }
    }, [debouncedValue, onChange, value]);

    return (
      <Textarea
        ref={ref}
        value={localValue}
        className={cn('resize-none', className)}
        onChange={e => {
          setLocalValue(e.target.value);
        }}
        {...props}
      />
    );
  }
);

DebouncedTextarea.displayName = 'DebouncedTextarea';

export { DebouncedTextarea };
