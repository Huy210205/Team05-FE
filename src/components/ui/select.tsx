import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectContextValue {
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

const useSelectContext = () => {
    const context = React.useContext(SelectContext);
    if (!context) {
        throw new Error('Select components must be used within Select');
    }
    return context;
};

interface SelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children, disabled }) => {
    const [open, setOpen] = React.useState(false);

    const handleValueChange = React.useCallback(
        (newValue: string) => {
            if (disabled) return;
            onValueChange?.(newValue);
            setOpen(false);
        },
        [onValueChange, disabled],
    );

    return (
        <SelectContext.Provider
            value={{
                value: value || '',
                onValueChange: handleValueChange,
                open,
                onOpenChange: disabled ? () => {} : setOpen,
            }}
        >
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useSelectContext();

    return (
        <button
            ref={ref}
            type="button"
            className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
                className,
            )}
            onClick={() => onOpenChange(!open)}
            {...props}
        >
            {children}
            <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-180')} />
        </button>
    );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }>(
    ({ className, placeholder, children, ...props }, ref) => {
        const { value } = useSelectContext();

        // If children are provided, use them (for custom display)
        // Otherwise, show value or placeholder
        const displayText = children ? children : value || placeholder || 'Select...';

        return (
            <span ref={ref} className={cn('block truncate', className)} {...props}>
                {displayText}
            </span>
        );
    },
);
SelectValue.displayName = 'SelectValue';

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const { open, onOpenChange } = useSelectContext();

        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) {
                    onOpenChange(false);
                }
            };

            if (open) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [open, onOpenChange, ref]);

        if (!open) return null;

        return (
            <div
                ref={ref}
                className={cn(
                    'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
                    className,
                )}
                {...props}
            >
                <div className="p-1">{children}</div>
            </div>
        );
    },
);
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }
>(({ className, children, value: itemValue, disabled, ...props }, ref) => {
    const { value, onValueChange } = useSelectContext();
    const isSelected = value === itemValue;

    return (
        <div
            ref={ref}
            className={cn(
                'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                isSelected && 'bg-accent',
                disabled && 'pointer-events-none opacity-50',
                className,
            )}
            onClick={() => !disabled && onValueChange(itemValue)}
            {...props}
        >
            {isSelected && <Check className="absolute left-2 h-4 w-4" />}
            {children}
        </div>
    );
});
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
