"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/trpc/client";
import { EyeIcon, ThumbsUpIcon, MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { enUS, vi, ja, ko, zhCN, de, es, fr } from "date-fns/locale";
import { Link } from "@/i18n/routing";

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

import { Skeleton } from "@/components/ui/skeleton";

export const StudioDashboardSkeleton = () => {
  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full min-h-screen">
      {/* CỘT TRÁI SKELETON */}
      <div className="flex flex-col gap-6 w-full xl:w-[500px] flex-shrink-0">
        {/* Latest Video Skeleton */}
        <Card className="shadow-md rounded-lg overflow-hidden">
          <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-md" />
            <Skeleton className="h-5 w-full" />
            <div className="grid grid-cols-2 gap-4">
               {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="space-y-2">
                   <Skeleton className="h-3 w-1/2" />
                   <Skeleton className="h-6 w-3/4" />
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
        {/* Latest Post Skeleton */}
        <Card className="shadow-md rounded-lg overflow-hidden">
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
               <Skeleton className="size-6 rounded-full" />
               <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="aspect-video w-full rounded-md" />
          </CardContent>
        </Card>
      </div>

      {/* CỘT PHẢI SKELETON */}
      <div className="flex flex-col gap-6 flex-1 min-w-0">
        <Card className="shadow-md rounded-lg">
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card className="shadow-md rounded-lg flex-1">
          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="flex gap-3">
                 <Skeleton className="size-10 rounded" />
                 <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                 </div>
               </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const StudioDashboard = () => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const dateLocale = dateFnsLocales[locale as keyof typeof dateFnsLocales] || vi;

  const { data: videoData, isLoading: isVideosLoading } = trpc.studio.getMany.useQuery({ limit: 10 });
  const { data: statsData, isLoading: isStatsLoading } = trpc.studio.getStats.useQuery();

  if (isVideosLoading || isStatsLoading) return <StudioDashboardSkeleton />;
  if (!videoData || !videoData.items)
    return <div>{t("noData")}</div>;

  const latestVideo = videoData.items[0];
  const totalViews = videoData.items.reduce((acc, v) => acc + (v.viewsCount || 0), 0);
  const averageViewPercent = latestVideo?.averageViewPercent ?? 0;
  const latestPost = statsData?.latestPost;

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full min-h-screen">
      {/* CỘT TRÁI: Video & Bài đăng mới nhất */}
      <div className="flex flex-col gap-6 w-full xl:w-[500px] flex-shrink-0">
        {/* Card video mới nhất */}
        {latestVideo && (
          <Card className="shadow-md rounded-lg overflow-hidden border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">{t("latestPerformance")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800 group cursor-pointer">
                <img
                  src={latestVideo.thumbnailUrl || "/fallback-thumbnail.jpg"}
                  alt={latestVideo.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                   <Link href={`/studio/videos/${latestVideo.id}`} className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full shadow-lg">
                      {t("videoDetails")}
                   </Link>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold line-clamp-2">{latestVideo.title}</p>
                <p className="text-[11px] text-muted-foreground italic">
                  {formatDistanceToNow(new Date(latestVideo.createdAt), { addSuffix: true, locale: dateLocale })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-0.5 border-r border-neutral-100 dark:border-neutral-800 pr-2">
                  <p className="text-xs text-muted-foreground">{t("views")}</p>
                  <p className="text-lg font-bold">{latestVideo.viewsCount || 0}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">{t("avgViewPercent")}</p>
                  <p className="text-lg font-bold">{averageViewPercent}%</p>
                </div>
                <div className="space-y-0.5 border-r border-neutral-100 dark:border-neutral-800 pr-2">
                  <p className="text-xs text-muted-foreground">{t("likes")}</p>
                  <p className="text-lg font-bold">{latestVideo.likeCount || 0}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">{t("comments")}</p>
                  <p className="text-lg font-bold">{latestVideo.commentCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card Bài đăng mới nhất */}
        <Card className="shadow-md rounded-lg overflow-hidden border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">{t("latestPost")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestPost ? (
              <>
                <div className="flex items-center gap-x-2">
                  <img src={statsData?.userAvatar || "/avatar.png"} alt="User" className="size-6 rounded-full" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{statsData?.userName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(latestPost.createdAt), "d 'thg' M, yyyy", { locale: dateLocale })}
                    </span>
                  </div>
                </div>

                <div className="text-sm line-clamp-3">
                  {latestPost.content || t("noData")}
                </div>

                {latestPost.images?.[0] && (
                  <div className="aspect-video relative rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <img src={latestPost.images[0].imageUrl} alt="Post" className="w-full h-full object-cover" />
                  </div>
                )}

                {latestPost.poll && (
                  <div className="space-y-1 mt-2">
                    {latestPost.poll.options.slice(0, 2).map((opt: any) => {
                       const totalVotes = latestPost.poll?.options.reduce((acc: number, o: any) => acc + (o.voteCount || 0), 0) || 0;
                       const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                       return (
                         <div key={opt.id} className="relative h-7 border rounded overflow-hidden flex items-center px-3 group">
                            <div className="absolute inset-y-0 left-0 bg-neutral-100 dark:bg-neutral-800" style={{ width: `${percentage}%` }} />
                            <span className="relative text-xs font-medium flex-1 truncate">{opt.text}</span>
                            <span className="relative text-[10px] font-bold">{percentage}%</span>
                         </div>
                       );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase">{t("votes")}</p>
                    <p className="text-base font-bold">
                       {latestPost.poll?.options.reduce((acc: number, o: any) => acc + (o.voteCount || 0), 0) || 0}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase">{t("comments")}</p>
                    <p className="text-base font-bold">{latestPost.commentCount || 0}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase">{t("likes")}</p>
                    <p className="text-base font-bold">{latestPost.likeCount || 0}</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full text-xs font-bold h-9 rounded-full mt-2" asChild>
                   <Link href="/studio?tab=posts">
                      {t("goToPosts")}
                   </Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">{t("noPosts")}</p>
                <Button variant="link" className="text-xs font-bold" asChild>
                   <Link href="/studio?tab=posts">{t("createFirstPost")}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CỘT PHẢI: Analytics, Bình luận, Người đăng ký */}
      <div className="flex flex-col gap-6 flex-1 min-w-0">
        {/* Card tổng quan kênh */}
        <Card className="shadow-md rounded-lg border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">{t("channelAnalytics")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("currentSubscribers")}</p>
              <p className="text-4xl font-extrabold">{statsData?.totalSubscribers || 0}</p>
            </div>

            <div className="pt-2 pb-2 border-y border-neutral-100 dark:border-neutral-800">
               <p className="text-xs font-bold mb-3 uppercase text-neutral-500">{t("summary28Days")}</p>
               <div className="flex justify-between items-center text-sm py-1">
                  <span>{t("views")}</span>
                  <span className="font-bold">{totalViews}</span>
               </div>
               <div className="flex justify-between items-center text-sm py-1">
                  <span>{t("watchTime")}</span>
                  <span className="font-bold">{(totalViews / 60).toFixed(1)}</span>
               </div>
            </div>

            <div>
               <p className="text-xs font-bold mb-3 uppercase text-neutral-500">{t("topContent48Hours")}</p>
               {latestVideo && (
                 <div className="flex items-center justify-between text-sm group cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-1 rounded transition-colors">
                    <span className="truncate flex-1">{latestVideo.title}</span>
                    <span className="font-bold ml-2">{latestVideo.viewsCount || 0}</span>
                 </div>
               )}
            </div>

            <Button variant="secondary" className="w-full text-xs font-bold h-9 rounded-full" asChild>
              <Link href="/studio?tab=analytics">{t("goToAnalytics")}</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card Bình luận */}
        <Card className="shadow-md rounded-lg border-neutral-200 dark:border-neutral-800 flex-1">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">{t("latestComments")}</CardTitle>
            <Button variant="link" size="sm" className="text-blue-500 font-bold p-0" asChild>
               <Link href="/studio?tab=comments">{t("seeAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {statsData?.latestComments && statsData.latestComments.length > 0 ? (
              statsData.latestComments.map((c: any) => (
                <div key={c.id} className="flex gap-x-3 items-start p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors group">
                  <img src={c.userAvatar} alt={c.userName} className="size-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-x-1.5 mb-0.5">
                      <span className="text-xs font-bold truncate">{c.userName}</span>
                      <span className="text-[10px] text-muted-foreground">• {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: dateLocale }) : t("justNow")}</span>
                    </div>
                    <p className="text-sm line-clamp-2">{c.value}</p>
                  </div>
                  {c.videoThumbnail && (
                    <img src={c.videoThumbnail} alt="video" className="size-12 rounded object-cover flex-shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-10">{t("noComments")}</p>
            )}
          </CardContent>
        </Card>

        {/* Card Người đăng ký gần đây */}
        <Card className="shadow-md rounded-lg border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">{t("recentSubscribers")}</CardTitle>
            <Button variant="link" size="sm" className="text-blue-500 font-bold p-0">{t("seeAll")}</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {statsData?.recentSubscribers?.map((s: any) => (
                 <div key={s.viewerId} className="flex flex-col items-center text-center gap-y-1.5">
                    <img src={s.avatarUrl} alt={s.name} className="size-10 rounded-full border dark:border-neutral-700" />
                    <div className="w-full">
                       <p className="text-[11px] font-bold truncate">{s.name}</p>
                       <p className="text-[9px] text-muted-foreground">{t("subscribers", { count: s.subscriberCount || 0 })}</p>
                    </div>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
