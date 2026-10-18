import React from 'react';
import { RequestStatus } from '../../types';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  // Return clean, unboxed styling matching Zero-Pill & University SaaS design
  const getStatusConfig = (st: RequestStatus) => {
    switch (st) {
      case 'Draft':
        return {
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-100',
          borderColor: 'border-slate-300',
          dotColor: 'bg-slate-400',
          label: 'Draft',
        };
      case 'Submitted':
        return {
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          dotColor: 'bg-blue-500',
          label: 'Submitted',
        };
      case 'Under Verification':
        return {
          textColor: 'text-amber-800',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          dotColor: 'bg-amber-500 animate-pulse',
          label: 'Under Verification',
        };
      case 'Additional Information Required':
        return {
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          dotColor: 'bg-rose-600 animate-ping',
          label: 'Action Needed: More Info',
        };
      case 'Verified':
        return {
          textColor: 'text-indigo-700',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          dotColor: 'bg-indigo-500',
          label: 'Verified',
        };
      case 'Pending Approval':
        return {
          textColor: 'text-violet-700',
          bgColor: 'bg-violet-50',
          borderColor: 'border-violet-200',
          dotColor: 'bg-violet-500',
          label: 'Pending Approval',
        };
      case 'Approved':
        return {
          textColor: 'text-teal-800',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
          dotColor: 'bg-teal-500',
          label: 'Approved',
        };
      case 'Completed':
        return {
          textColor: 'text-emerald-800',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          dotColor: 'bg-emerald-500',
          label: 'Completed',
        };
      case 'Rejected':
        return {
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          dotColor: 'bg-red-500',
          label: 'Rejected',
        };
      default:
        return {
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-100',
          borderColor: 'border-slate-300',
          dotColor: 'bg-slate-400',
          label: status,
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'text-[11px] py-0.5 px-2 font-medium',
    md: 'text-xs py-1 px-2.5 font-medium',
    lg: 'text-sm py-1.5 px-3 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${config.bgColor} ${config.borderColor} ${config.textColor} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};
