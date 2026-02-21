import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const config = {
  success: { icon: CheckCircle, class: 'bg-green-50 border-green-200 text-green-800' },
  error: { icon: XCircle, class: 'bg-red-50 border-red-200 text-red-800' },
  warning: { icon: AlertCircle, class: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
};

const Alert = ({ type, message }: AlertProps) => {
  const { icon: Icon, class: cls } = config[type];
  return (
    <div className={cn('flex items-center gap-2 p-3 rounded-lg border text-sm', cls)}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default Alert;