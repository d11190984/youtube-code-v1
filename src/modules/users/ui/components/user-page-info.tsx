import { Link } from "@/i18n/routing";
import { useClerk, useAuth } from "@clerk/nextjs";
import { 
  GlobeIcon, 
  InfoIcon, 
  TrendingUpIcon, 
  Share2Icon, 
  YoutubeIcon, 
  CalendarIcon, 
  UsersIcon, 
  VideoIcon,
  ChevronRightIcon,
  FlagIcon,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { enUS, vi, ja, ko, zhCN, de, es, fr } from "date-fns/locale";

const dateFnsLocales = {
  en: enUS,
  vi: vi,
  ja: ja,
  ko: ko,
  zh: zhCN,
  de: de,
  es: es,
  fr: fr,
};

import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { UserGetOneOutput } from "../../types";

import { useSubscription } from "@/modules/subscriptions/hooks/use-subscription";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { ReportModal } from "@/modules/reports/ui/components/report-modal";
import { useState } from "react";

interface UserPageInfoProps {
  user: UserGetOneOutput & { viewCount?: number };
}

export const UserPageInfoSkeleton = () => {
  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row items-start gap-4">
        <Skeleton className="h-[80px] w-[80px] md:h-[160px] md:w-[160px] rounded-full" />
        <div className="flex-1 min-w-0 space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-[400px]" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const UserPageInfo = ({ user }: UserPageInfoProps) => {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const dateLocale = dateFnsLocales[locale as keyof typeof dateFnsLocales] || vi;

  const { userId, isLoaded } = useAuth();
  const clerk = useClerk();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { isPending, onClick } = useSubscription({
    userId: user.id,
    isSubscribed: user.viewerSubscribed,
  });

  const isOwner = userId === user.clerkId;

  const handleCopyChannelLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success(t("copySuccess"));
  };

  const userHandle = user.handle ? `@${user.handle}` : `@${user.name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <UserAvatar
            size="xl"
            imageUrl={user.imageUrl}
            name={user.name}
            className={cn(
              "h-[80px] w-[80px] md:h-[160px] md:w-[160px]",
              isOwner && "cursor-pointer hover:opacity-80 transition-opacity duration-300",
            )}
            onClick={() => {
              if (isOwner) clerk.openUserProfile();
            }}
          />
        </div>

        {/* Info Area */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-4xl font-bold">{user.name}</h1>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground mt-2 font-medium">
            <span className="text-foreground font-semibold">{userHandle}</span>
            <span>&bull;</span>
            <span>{t("subscribers", { count: user.subscriberCount })}</span>
            <span>&bull;</span>
            <span>{t("videos", { count: user.videoCount })}</span>
          </div>

          {/* Bio / About Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <div className="group cursor-pointer mt-3 max-w-[600px]">
                 <p className="text-sm text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors flex items-center gap-1">
                    {user.bio || t("learnMore")}
                    <ChevronRightIcon className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </p>
                 <span className="text-sm font-bold text-foreground">{t("showMore")}</span>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl border-none bg-neutral-100 dark:bg-neutral-900 p-0 overflow-hidden">
               <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                     <h2 className="text-xl font-bold">{t("about")}</h2>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-1">
                        <h3 className="text-base font-bold">{t("description")}</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                           {user.bio || t("noDescription")}
                        </p>
                     </div>

                     <div className="space-y-3">
                        <h3 className="text-base font-bold">{t("channelDetails")}</h3>
                        <div className="space-y-4">
                           <div className="flex items-center gap-3 text-sm min-w-0">
                              <GlobeIcon className="size-5 text-muted-foreground shrink-0" />
                              <a 
                                 href={typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}/users/${user.id}` : "#"}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="break-all text-blue-500 font-medium hover:underline"
                              >
                                 {typeof window !== "undefined" ? `${window.location.host}/users/${user.id}` : `domain/users/${user.id}`}
                              </a>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <UsersIcon className="size-5 text-muted-foreground shrink-0" />
                              <span>{t("subscribers", { count: user.subscriberCount })}</span>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <VideoIcon className="size-5 text-muted-foreground shrink-0" />
                              <span>{t("videos", { count: user.videoCount })}</span>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <TrendingUpIcon className="size-5 text-muted-foreground shrink-0" />
                              <span>{t("views", { count: user.viewCount || 0 })}</span>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <CalendarIcon className="size-5 text-muted-foreground shrink-0" />
                              <span>{t("joinedDate", { date: format(new Date(user.createdAt), "d 'thg' M, yyyy", { locale: dateLocale }) })}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="px-6 pb-6 mt-auto">
                    <Button 
                       variant="secondary" 
                       className="w-full rounded-full gap-2 font-bold h-11 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                       onClick={handleCopyChannelLink}
                    >
                       <Share2Icon className="size-5" />
                       {t("shareChannel")}
                    </Button>
                  </div>
               </div>
            </DialogContent>
          </Dialog>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            {isOwner ? (
              <>
                <Button variant="secondary" asChild className="rounded-full font-bold px-6">
                  <Link prefetch href="/studio/customization" target="_blank">
                    {t("customizeChannel")}
                  </Link>
                </Button>
                <Button variant="secondary" asChild className="rounded-full font-bold px-6">
                  <Link prefetch href="/studio" target="_blank">
                    {t("manageVideos")}
                  </Link>
                </Button>
              </>
            ) : (
              <SubscriptionButton
                disabled={isPending || !isLoaded}
                isSubscribed={user.viewerSubscribed}
                onClick={onClick}
                className="rounded-full px-6"
              />
            )}
            {!isOwner && (
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-full"
                onClick={() => setIsReportModalOpen(true)}
                title={t("reportUser")}
              >
                <FlagIcon className="size-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <ReportModal
        targetId={user.id}
        targetType="user"
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
