import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = ({ className, ...props }: CardProps) => (
  <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)} {...props} />
);

export const CardHeader = ({ className, ...props }: CardProps) => (
  <div className={cn('px-6 py-4 border-b border-gray-200', className)} {...props} />
);

export const CardBody = ({ className, ...props }: CardProps) => (
  <div className={cn('px-6 py-4', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: CardProps) => (
  <div className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl', className)} {...props} />
);