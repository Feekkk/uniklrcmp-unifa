import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-slate-600 hover:text-blue-600 transition-colors" />
      {count > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center 
          px-2 py-0.5 text-xs font-bold leading-none text-white transform 
          translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-pulse">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
}
