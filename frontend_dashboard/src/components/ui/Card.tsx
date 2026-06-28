import * as React from 'react';
import { cn } from '../../utils/cn';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-white/20 bg-white/70 p-6 text-slate-900 shadow-xl backdrop-blur-md dark:border-slate-800/40 dark:bg-slate-900/70 dark:text-slate-100',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export { Card };
