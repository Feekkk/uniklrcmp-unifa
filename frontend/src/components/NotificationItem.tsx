import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Check, 
  CheckCircle, 
  XCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notification } from '@/hooks/use-notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const notificationConfig = {
  APPLICATION_APPROVED: {
    icon: CheckCircle,
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    accentColor: 'border-l-green-500',
    titleColor: 'text-green-900',
    textColor: 'text-green-700',
    subtleColor: 'text-green-600',
    iconColor: 'text-green-600',
    badgeBg: 'bg-green-100',
    hoverBg: 'hover:bg-green-100'
  },
  APPLICATION_REJECTED: {
    icon: XCircle,
    bgColor: 'bg-gradient-to-br from-red-50 to-rose-50',
    borderColor: 'border-red-200',
    accentColor: 'border-l-red-500',
    titleColor: 'text-red-900',
    textColor: 'text-red-700',
    subtleColor: 'text-red-600',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-100',
    hoverBg: 'hover:bg-red-100'
  },
  COMMITTEE_APPROVED: {
    icon: ThumbsUp,
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    accentColor: 'border-l-blue-500',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-700',
    subtleColor: 'text-blue-600',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    hoverBg: 'hover:bg-blue-100'
  },
  COMMITTEE_REJECTED: {
    icon: ThumbsDown,
    bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
    borderColor: 'border-orange-200',
    accentColor: 'border-l-orange-500',
    titleColor: 'text-orange-900',
    textColor: 'text-orange-700',
    subtleColor: 'text-orange-600',
    iconColor: 'text-orange-600',
    badgeBg: 'bg-orange-100',
    hoverBg: 'hover:bg-orange-100'
  }
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isLoading = false
}: NotificationItemProps) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={`relative group p-4 rounded-xl border border-l-4 transition-all duration-300 
        ${config.bgColor} ${config.borderColor} ${config.accentColor}
        ${!notification.isRead ? 'shadow-md hover:shadow-lg' : 'shadow-sm'}
        hover:border-opacity-100 border-opacity-60`}
    >
      {/* Unread indicator badge */}
      {!notification.isRead && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full -mt-1 -mr-1 animate-pulse" />
      )}

      <div className="flex gap-4 items-start">
        {/* Icon Badge */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.badgeBg} 
          flex items-center justify-center shadow-sm transition-transform duration-300
          group-hover:scale-110`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Header: Title */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h4 className={`font-bold text-sm leading-tight ${config.titleColor} break-words`}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className={`flex-shrink-0 inline-block px-2.5 py-0.5 text-xs font-semibold 
                rounded-full ${config.badgeBg} ${config.subtleColor} whitespace-nowrap`}>
                New
              </span>
            )}
          </div>

          {/* Message */}
          <p className={`text-sm leading-relaxed ${config.textColor} line-clamp-3 mb-2.5`}>
            {notification.message}
          </p>

          {/* Footer: Timestamp */}
          <div className="flex items-center gap-2 text-xs">
            <time className="text-slate-500 font-medium">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true
              })}
            </time>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className={`${config.subtleColor} font-medium`}>
              {notification.type === 'APPLICATION_APPROVED' && 'Application'}
              {notification.type === 'APPLICATION_REJECTED' && 'Application'}
              {notification.type === 'COMMITTEE_APPROVED' && 'Committee'}
              {notification.type === 'COMMITTEE_REJECTED' && 'Committee'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!notification.isRead && (
            <Button
              size="sm"
              variant="ghost"
              className={`h-8 w-8 p-0 rounded-lg transition-all duration-200 
                ${config.hoverBg} ${config.iconColor}`}
              onClick={() => onMarkAsRead(notification.notificationId)}
              disabled={isLoading}
              title="Mark as read and remove"
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Optional: Show action indicator on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}
