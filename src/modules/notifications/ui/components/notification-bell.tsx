"use client";

import { useLocale, useTranslations } from "next-intl";
import { BellIcon, CheckIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS, ja, ko, zhCN, es, fr, de } from "date-fns/locale";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const locales: Record<string, any> = {
  vi,
  en: enUS,
  ja,
  ko,
  zh: zhCN,
  es,
  fr,
  de,
};

export const NotificationBell = () => {
  const locale = useLocale();
  const t = useTranslations("Notifications");
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 30000 } // Poll every 30 seconds
  );
  const { data: notifications, isLoading } = trpc.notifications.getMany.useQuery({
    limit: 5,
  });

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getMany.invalidate();
    },
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getMany.invalidate();
    },
  });

  const handleNotificationClick = (id: string, type: string, videoId?: string | null, postId?: string | null) => {
    markAsRead.mutate({ id });
    
    if (videoId) {
      router.push(`/videos/${videoId}`);
    } else if (postId) {
      router.push(`/posts/${postId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <BellIcon className="size-5" />
          {unreadCount && unreadCount.count > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white border-none text-[10px]"
            >
              {unreadCount.count > 9 ? "9+" : unreadCount.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden shadow-xl border-neutral-200 dark:border-neutral-800">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-black">
          <h3 className="font-bold text-lg">{t("title")}</h3>
          {unreadCount && unreadCount.count > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-blue-600 hover:text-blue-700"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckIcon className="size-3 mr-1" />
              {t("markAllAsRead")}
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications?.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center p-6">
              <div className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-full mb-4">
                <BellIcon className="size-8 text-neutral-400" />
              </div>
              <p className="font-medium">{t("noNotifications")}</p>
              <p className="text-sm text-neutral-500 mt-1">{t("noNotificationsDesc")}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications?.items.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 flex gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer transition-colors relative group ${
                    !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.type, notification.videoId, notification.postId)}
                >
                  <UserAvatar 
                    imageUrl={notification.actor.imageUrl} 
                    name={notification.actor.name} 
                    className="size-10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-tight mb-1">
                      <span className="font-bold">{notification.actor.name}</span>{" "}
                      {t(notification.type as any) || t("default")}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: locales[locale] || enUS })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="size-2 bg-blue-600 rounded-full absolute right-4 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
          <Link href="/notifications" className="w-full">
            <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 font-bold">
              {t("seeAll")}
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
