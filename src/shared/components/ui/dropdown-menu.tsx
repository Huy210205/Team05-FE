import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface DropdownMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

const useDropdownMenu = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
};

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  asChild, 
  children, 
  className 
}) => {
  const { setOpen, open } = useDropdownMenu();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        children.props.onClick?.(e);
        setOpen(!open);
      },
      className: cn(children.props.className, className),
    });
  }

  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
        className
      )}
    >
      {children}
    </button>
  );
};

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  sideOffset?: number;
  alignOffset?: number;
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  className,
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
  alignOffset = 0
}) => {
  const { open, setOpen } = useDropdownMenu();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const getAlignmentClasses = () => {
    switch (align) {
      case 'start':
        return 'left-0';
      case 'end':
        return 'right-0';
      case 'center':
      default:
        return 'left-1/2 -translate-x-1/2';
    }
  };

  const getSideClasses = () => {
    switch (side) {
      case 'top':
        return 'bottom-full mb-2';
      case 'bottom':
      default:
        return 'top-full mt-2';
    }
  };

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        getAlignmentClasses(),
        getSideClasses(),
        className
      )}
      style={{
        marginTop: side === 'bottom' ? sideOffset : undefined,
        marginBottom: side === 'top' ? sideOffset : undefined,
        marginLeft: align === 'end' ? alignOffset : undefined,
        marginRight: align === 'start' ? alignOffset : undefined,
      }}
    >
      {children}
    </div>
  );
};

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'destructive'; // Added variant support
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  className, 
  disabled,
  onClick,
  variant = 'default'
}) => {
  const { setOpen } = useDropdownMenu();

  const variantClasses = {
    default: "focus:bg-accent focus:text-accent-foreground",
    destructive: "focus:bg-destructive focus:text-destructive-foreground text-destructive"
  };

  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        variantClasses[variant],
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={() => {
        if (!disabled) {
          onClick?.();
          setOpen(false);
        }
      }}
    >
      {children}
    </div>
  );
};

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
      {children}
    </div>
  );
};

interface DropdownMenuSeparatorProps {
  className?: string;
}

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ 
  className 
}) => {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />;
};

interface DropdownMenuShortcutProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({ 
  children, 
  className 
}) => {
  return (
    <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)}>
      {children}
    </span>
  );
};

interface DropdownMenuGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuGroup: React.FC<DropdownMenuGroupProps> = ({ 
  children, 
  className 
}) => {
  return <div className={cn("p-1", className)}>{children}</div>;
};

interface DropdownMenuSubProps {
  children: React.ReactNode;
}

export const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({ children }) => {
  return <>{children}</>;
};

interface DropdownMenuSubTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      className
    )}>
      {children}
    </div>
  );
};

interface DropdownMenuSubContentProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
      className
    )}>
      {children}
    </div>
  );
};

interface DropdownMenuPortalProps {
  children: React.ReactNode;
}

export const DropdownMenuPortal: React.FC<DropdownMenuPortalProps> = ({ children }) => {
  return <>{children}</>;
};
