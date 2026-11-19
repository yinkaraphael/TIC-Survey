import React from 'react';
import clsx from 'clsx';

export type ButtonVariant =
  | 'dark'
  | 'outline'
  | 'teal'
  | 'teal-outline'
  | 'yellow'
  | 'danger-outline';

export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = 'dark',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-2.5 rounded-[10px] font-medium whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer',
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' && 'h-10 px-4 text-sm',
        size === 'md' && 'h-12 px-6 text-base',
        size === 'lg' && 'h-14 px-8 text-lg',
        variant === 'dark' && 'bg-[#151515] text-white hover:bg-[#373737]',
        variant === 'outline' &&
          'border border-[#151515] bg-white text-[#151515] hover:bg-[#F4F4F4]',
        variant === 'teal' &&
          'bg-[#034C58] text-white shadow-sm hover:bg-[#023A44]',
        variant === 'teal-outline' &&
          'border border-[#034C58] bg-white/80 text-[#034C58] hover:bg-[#E6F1F6]',
        variant === 'yellow' &&
          'bg-[#F2BE3A] text-[#151515] hover:brightness-95',
        variant === 'danger-outline' &&
          'border border-[#DC2626] bg-white text-[#DC2626] hover:bg-red-50',
        className
      )}
    />
  );
}
