import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck,
  Loader2,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/hooks/use-notifications';
import { Separator } from '@/components/ui/separator';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
    isMarkingAsRead,
    isDeletingNotification
  } = useNotifications();

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  if (error) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-10 w-10 p-0">
            <Bell className="w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">Failed to load notifications</p>
            <p className="text-sm text-slate-600 mt-2">{error?.message}</p>
            <Button 
              onClick={() => setOpen(false)}
              className="mt-4"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-10 w-10 p-0 hover:bg-slate-100"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center 
              px-1.5 py-0.5 text-xs font-bold leading-none text-white 
              bg-red-500 rounded-full animate-pulse min-w-5 h-5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Notifications
              </DialogTitle>
              <p className="text-xs text-slate-600 mt-0.5">
                {unreadCount > 0 
                  ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` 
                  : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-sm text-slate-600 font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-900">No notifications yet</p>
              <p className="text-xs text-slate-600 mt-1.5">
                You'll see updates here when your applications are reviewed
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification, index) => (
                <div key={notification.notificationId} className="p-4 hover:bg-slate-50 transition-colors duration-150">
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={() => {}}
                    isLoading={isMarkingAsRead || isDeletingNotification}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <>
            <Separator className="m-0" />
            <div className="bg-slate-50 px-6 py-4 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 font-medium"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {isMarkingAllAsRead ? 'Clearing...' : 'Clear all notifications'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
