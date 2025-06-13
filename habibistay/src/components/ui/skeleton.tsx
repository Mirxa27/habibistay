import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * If true, the skeleton will animate with a shimmer effect
   * @default true
   */
  shimmer?: boolean;
  /**
   * Custom class name for the shimmer effect
   */
  shimmerClassName?: string;
  /**
   * If true, the skeleton will be a circle
   * @default false
   */
  circle?: boolean;
  /**
   * Custom height for the skeleton
   */
  height?: number | string;
  /**
   * Custom width for the skeleton
   */
  width?: number | string;
}

/**
 * A simple loading skeleton component that can be used as a placeholder
 * while content is loading.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      shimmer = true,
      shimmerClassName,
      circle = false,
      style,
      height,
      width,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden bg-gray-200 dark:bg-gray-700',
          circle ? 'rounded-full' : 'rounded-md',
          className
        )}
        style={{
          height: height ? (typeof height === 'number' ? `${height}px` : height) : '1.25rem',
          width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
          ...style,
        }}
        {...props}
      >
        {shimmer && (
          <div
            className={cn(
              'absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent',
              'animate-[shimmer_2s_infinite]',
              shimmerClassName
            )}
          />
        )}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Add the shimmer animation to the global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }
  `;
  document.head.appendChild(style);
}
