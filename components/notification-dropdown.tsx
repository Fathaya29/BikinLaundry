"use client";

import { Bell, CalendarClock, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeadlineNotification } from "@/lib/notifications";

type ActivityItem = { id: string; title: string; timestamp: string };

type NotificationDropdownProps = {
  open: boolean;
  onToggle: () => void;
  unreadCount?: number;
  activities?: ActivityItem[];
  deadlines?: DeadlineNotification[];
  error?: string;
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function NotificationDropdown({ open, onToggle, unreadCount, activities = [], deadlines = [], error }: NotificationDropdownProps) {
  const visibleCount = activities.length + deadlines.length;
  const count = unreadCount ?? visibleCount;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label="Notifikasi" aria-expanded={open} onClick={onToggle} className="relative">
        <Bell />
        {count > 0 && <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-semibold leading-4 text-background">{count > 9 ? "9+" : count}</span>}
      </Button>
      {open && (
        <Card className="absolute right-0 top-12 z-20 w-[min(24rem,calc(100vw-2rem))] overflow-hidden border-zinc-200 bg-white text-zinc-950 shadow-md dark:border-border dark:bg-popover dark:text-popover-foreground">
          <CardHeader className="border-b border-zinc-100 px-4 py-3 dark:border-border">
            <div className="flex items-center justify-between gap-3"><CardTitle className="text-sm tracking-tight">Notifications</CardTitle><span className="text-xs text-zinc-500">{visibleCount} total</span></div>
          </CardHeader>
          <CardContent className="max-h-[min(28rem,70vh)] overflow-y-auto p-0">
            {error ? <p className="p-4 text-xs text-rose-600" role="alert">{error}</p> : visibleCount === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center"><Inbox className="size-5 text-zinc-400" aria-hidden="true" /><p className="mt-3 text-sm font-medium text-zinc-900 dark:text-foreground">All caught up</p><p className="mt-1 text-xs text-zinc-500">Belum ada notifikasi baru.</p></div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-border">
                {deadlines.map((notification) => <div key={notification.id} className="p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-muted/50"><div className="flex gap-3"><CalendarClock className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" /><div className="min-w-0"><p className="text-sm font-medium text-amber-600">{notification.title}</p><p className="mt-1 text-xs text-zinc-500">{notification.message}</p><p className="mt-2 text-[11px] text-zinc-400">{formatTimestamp(notification.timestamp)}</p></div></div></div>)}
                {activities.map((activity) => <div key={activity.id} className="p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-muted/50"><div className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden="true" /><div className="min-w-0"><p className="text-sm font-medium text-zinc-900 dark:text-foreground">{activity.title}</p><p className="mt-2 text-[11px] text-zinc-400">{formatTimestamp(activity.timestamp)}</p></div></div></div>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
