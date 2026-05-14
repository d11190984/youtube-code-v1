"use client";

import { Suspense, useState, useTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { formatDistanceToNow, format } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
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

import { VideoPlayer } from "@/modules/videos/ui/components/video-player";
import { 
  BarChart,
  Bar,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { 
  EyeIcon, 
  UsersIcon, 
  TrendingUpIcon,
  PlayCircleIcon,
  ChevronDownIcon,
  InfoIcon,
  ExternalLinkIcon,
  ImageIcon,
  BarChart2Icon,
  MessageCircleIcon,
  TypeIcon,
  PlayIcon,
  MinusIcon,
  TrendingDownIcon
} from "lucide-react";

import { trpc } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorFallback } from "@/components/error-fallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { CheckIcon } from "lucide-react";
import { AdvancedAnalyticsModal } from "../components/advanced-analytics-modal";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

// --- SUB-COMPONENTS (SECTIONS) ---

const AnalyticsLoading = () => {
  const t = useTranslations("Studio");
  return <div className="p-8">{t("loading")}</div>;
};

const AllContentSection = ({ data, days, videoId }: { data: any, days: number, videoId?: string }) => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const viewsBreakdown = data.contentBreakdown.views;
  const totalViews = viewsBreakdown.shorts + viewsBreakdown.video + viewsBreakdown.posts;
  const getPercentage = (val: number) => totalViews > 0 ? ((val / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* NEW VIEWERS */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("newViewers")}</CardTitle>
               <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("last28Days")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                   <span>{t("shorts")}</span>
                   <span className="font-bold">{data.contentBreakdown.newViewers.shorts}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span>{t("video")}</span>
                   <span className="font-bold">{data.contentBreakdown.newViewers.video}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span>{t("posts")}</span>
                    <span className="font-bold">{data.contentBreakdown.newViewers.posts}</span>
                 </div>
               <Button variant="secondary" className="w-full text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">
                  {t("seeMore")}
               </Button>
            </CardContent>
         </Card>

         {/* RETURNING VIEWERS */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("returningViewers")}</CardTitle>
               <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("last28Days")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                   <span>Shorts</span>
                   <span className="font-bold">{data.contentBreakdown.returningViewers.shorts}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span>{t("video")}</span>
                   <span className="font-bold">{data.contentBreakdown.returningViewers.video}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span>{t("posts")}</span>
                   <span className="font-bold">{data.contentBreakdown.returningViewers.posts}</span>
                </div>
               <Button variant="secondary" className="w-full text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">
                  {t("seeMore")}
               </Button>
            </CardContent>
         </Card>

         {/* SUBSCRIBERS */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("subscribers")}</CardTitle>
               <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("last28Days")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between items-center text-xs">
                  <span>Shorts</span>
                  <span className="font-bold">{data.contentBreakdown.subscribers.shorts}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span>{t("video")}</span>
                  <span className="font-bold">{data.contentBreakdown.subscribers.video}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span>{t("posts")}</span>
                  <span className="font-bold">{data.contentBreakdown.subscribers.posts}</span>
               </div>
               <Button variant="secondary" className="w-full text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">
                  {t("seeMore")}
               </Button>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         {/* VIEWS BREAKDOWN */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">{t("views")}</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">{t("last28Days")}</p>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-4">
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs mb-1">
                        <span>Shorts</span>
                        <span className="font-bold">{viewsBreakdown.shorts} ({getPercentage(viewsBreakdown.shorts)}%)</span>
                     </div>
                     <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400" style={{ width: `${getPercentage(viewsBreakdown.shorts)}%` }} />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs mb-1">
                        <span>{t("video")}</span>
                        <span className="font-bold">{viewsBreakdown.video} ({getPercentage(viewsBreakdown.video)}%)</span>
                     </div>
                     <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${getPercentage(viewsBreakdown.video)}%` }} />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs mb-1">
                        <span>{t("posts")}</span>
                        <span className="font-bold">{viewsBreakdown.posts} ({getPercentage(viewsBreakdown.posts)}%)</span>
                     </div>
                     <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${getPercentage(viewsBreakdown.posts)}%` }} />
                     </div>
                  </div>
               </div>
               <Button variant="secondary" className="text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4">{t("seeMore")}</Button>
            </CardContent>
         </Card>

         {/* PUBLISHED CONTENT */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold flex items-center gap-x-2">
                  {t("publishedContent")} <InfoIcon className="size-3 text-muted-foreground" />
               </CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">{t("last28Days")}</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
               {data.contentBreakdown.publishedCount.videos > 0 || data.contentBreakdown.publishedCount.posts > 0 ? (
                 <div className="w-full space-y-4">
                    <div className="flex items-center justify-around w-full">
                       <div className="text-center">
                          <p className="text-2xl font-bold">{data.contentBreakdown.publishedCount.videos}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("video")}</p>
                       </div>
                       <div className="text-center">
                           <p className="text-2xl font-bold">{data.contentBreakdown.publishedCount.posts}</p>
                           <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("posts")}</p>
                        </div>
                    </div>
                 </div>
               ) : (
                 <p className="text-xs text-muted-foreground">{t("noData")}</p>
               )}
               <Button variant="secondary" className="text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">{t("seeMore")}</Button>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         {/* DISCOVERY FUNNEL */}
         <Card className="rounded-xl shadow-sm overflow-hidden bg-white dark:bg-neutral-900">
            <CardHeader>
               <CardTitle className="text-base font-bold">{t("discoveryFunnelTitle")}</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">{t("discoveryDataAvailable")} ({days === 3650 ? t("allTime") : t("daysCount", { days })})</p>
            </CardHeader>
            <CardContent className="p-0">
               <div className="flex flex-col items-center bg-neutral-50 dark:bg-neutral-900/50 p-6">
                  <div className="w-full max-w-[400px] flex flex-col gap-y-0.5">
                     <div className="bg-neutral-800 text-white p-4 text-center">
                        <p className="text-[10px] text-neutral-400 uppercase font-bold">{t("impressions")}</p>
                        <p className="text-2xl font-bold">{data.contentBreakdown.discovery.impressions}</p>
                        <p className="text-[9px] text-neutral-400 mt-1 flex items-center justify-center gap-x-1">
                           {t("discoveryCTRInfo", { ctr: (data.contentBreakdown.discovery.ctr).toFixed(1) })} <InfoIcon className="size-2" />
                        </p>
                     </div>
                     <div className="flex justify-center -my-1 relative z-10">
                        <div className="w-0 h-0 border-l-[200px] border-l-transparent border-r-[200px] border-r-transparent border-t-[20px] border-t-neutral-800" />
                     </div>
                     <div className="bg-neutral-800/90 text-white p-3 text-center">
                        <p className="text-[10px] text-neutral-400 font-bold">{t("clickThroughRate")}: {(data.contentBreakdown.discovery.ctr).toFixed(1)}%</p>
                     </div>
                     <div className="flex justify-center -my-1 relative z-10">
                        <div className="w-0 h-0 border-l-[200px] border-l-transparent border-r-[200px] border-r-transparent border-t-[20px] border-t-neutral-800/90" />
                     </div>
                     <div className="bg-neutral-800/80 text-white p-4 text-center">
                        <p className="text-[10px] text-neutral-400 uppercase font-bold">{t("viewsFromImpressions")}</p>
                        <p className="text-2xl font-bold">{data.contentBreakdown.discovery.viewsFromImpressions}</p>
                     </div>
                     <div className="flex justify-center -my-1 relative z-10">
                        <div className="w-0 h-0 border-l-[200px] border-l-transparent border-r-[200px] border-r-transparent border-t-[20px] border-t-neutral-800/80" />
                     </div>
                     <div className="bg-neutral-800/70 text-white p-3 text-center">
                        <p className="text-[10px] text-neutral-400 font-bold">{(data.contentBreakdown.discovery.avgViewDuration)} {t("avgViewDurationLabel")}</p>
                     </div>
                     <div className="flex justify-center -my-1 relative z-10">
                        <div className="w-0 h-0 border-l-[200px] border-l-transparent border-r-[200px] border-r-transparent border-t-[20px] border-t-neutral-800/70" />
                     </div>
                     <div className="bg-neutral-800/60 text-white p-4 text-center">
                        <p className="text-[10px] text-neutral-400 uppercase font-bold">{t("watchTimeFromImpressionsLabel")}</p>
                        <p className="text-2xl font-bold">{data.contentBreakdown.discovery.watchTimeFromImpressions}</p>
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* TRAFFIC SOURCES */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">{t("trafficSourcesTitle")}</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">{t("trafficSourcesSub")}</p>
            </CardHeader>
            <CardContent className="space-y-8">
               <div className="flex items-center justify-center py-4">
                  <div className="size-32 rounded-full border-[16px] border-blue-500/20 relative flex items-center justify-center">
                     <div className="absolute inset-[-16px] rounded-full border-[16px] border-blue-500 border-t-transparent border-r-transparent rotate-[-45deg]" />
                     <p className="text-[10px] text-center font-bold max-w-[60px] leading-tight">{t("trafficSourcesChartCenter")}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  {data.contentBreakdown.trafficSources.map((s: any, idx: number) => (
                    <div key={s.label} className="space-y-1">
                       <div className="flex justify-between text-xs">
                          <span>{s.label}</span>
                          <span className="font-bold">{s.percentage}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full", 
                              idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-blue-400" : idx === 2 ? "bg-indigo-400" : "bg-neutral-300"
                            )} 
                            style={{ width: `${s.percentage}%` }} 
                          />
                       </div>
                    </div>
                  ))}
               </div>
               <Button variant="secondary" className="text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4">{t("seeMore")}</Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

const VideoContentSection = ({ data, days, videoId }: { data: any, days: number, videoId?: string }) => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(data.topVideos[0]?.id || null);
  const selectedVideo = data.topVideos.find((v: any) => v.id === selectedVideoId) || data.topVideos[0];

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm border-none bg-white dark:bg-neutral-900 overflow-hidden">
         <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-x dark:divide-neutral-800">
            {[
              { label: t("videoViews"), val: data.contentBreakdown.views.video, sub: "" },
              { label: t("impressions"), val: data.contentBreakdown.discovery.impressions, sub: t("vsPreviousDays", { percent: "8%", days }) },
              { label: t("clickThroughRate"), val: `${data.contentBreakdown.discovery.ctr}%`, sub: "—" },
              { label: t("avgViewDuration"), val: data.contentBreakdown.discovery.avgViewDuration, sub: "" },
            ].map((m, i) => (
              <div key={i} className="p-4 flex flex-col items-center justify-center text-center">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{m.label}</p>
                 <p className="text-xl font-bold">{m.val}</p>
                 {m.sub && <p className="text-[9px] text-muted-foreground mt-1">{m.sub}</p>}
              </div>
            ))}
         </div>
         <CardContent className="p-0 pt-6">
            <div className="h-[250px] w-full px-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.viewsByDay} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="0" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    dy={10}
                    interval="preserveStartEnd"
                    ticks={[data.viewsByDay[0]?.date, data.viewsByDay[Math.floor(data.viewsByDay.length / 2)]?.date, data.viewsByDay[data.viewsByDay.length - 1]?.date].filter(Boolean)}
                  />
                  <YAxis 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    dx={10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fill="#8b5cf6" 
                    fillOpacity={0.1} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 flex justify-start px-6">
               <Button variant="secondary" size="sm" className="text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 h-8">
                  {t("seeMore")}
               </Button>
            </div>
         </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
         <CardHeader className="flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-base font-bold">{t("retentionMomentsTitle")}</CardTitle>
               <p className="text-xs text-muted-foreground">{t("retentionMomentsSub")}</p>
            </div>
            <div className="flex gap-x-1">
               {[t("intro"), t("topMoments"), t("spikes"), t("dips")].map((txt, i) => (
                 <Button key={i} variant={i === 0 ? "default" : "secondary"} size="sm" className="text-[10px] h-7 px-3 rounded-lg font-bold">
                    {txt}
                 </Button>
               ))}
            </div>
         </CardHeader>
         <CardContent className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
               <div className="flex justify-between text-[11px] text-muted-foreground uppercase font-bold border-b pb-2">
                  <span>{t("content")}</span>
                  <span>{t("avgRetention")}</span>
               </div>
               {data.topVideos.slice(0, 3).map((v: any) => (
                 <div 
                   key={v.id} 
                   onClick={() => setSelectedVideoId(v.id)}
                   className={cn(
                     "flex items-center justify-between group cursor-pointer p-2 rounded-lg transition-colors",
                     selectedVideoId === v.id ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                   )}
                 >
                    <div className="flex items-center gap-x-3 min-w-0">
                       <img src={v.thumbnailUrl || "/fallback.jpg"} alt="thumb" className="size-10 rounded shrink-0 object-cover" />
                       <span className="text-xs font-medium truncate">{v.title}</span>
                    </div>
                    <span className="text-xs font-bold ml-2">{v.averageViewPercent}%</span>
                 </div>
               ))}
            </div>
            <div className="w-full lg:w-[400px] space-y-3">
               <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                  {selectedVideo ? (
                    <VideoPlayer 
                       videoId={selectedVideo.id}
                       playbackId={selectedVideo.muxPlaybackId}
                       title={selectedVideo.title}
                       thumbnailUrl={selectedVideo.thumbnailUrl}
                       component="studio"
                       trackingEnabled={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <PlayCircleIcon className="size-12 text-white/20" />
                    </div>
                  )}
               </div>
               <div className="flex items-center justify-between px-2 mb-2">
                  <div className="flex items-center gap-x-4">
                     <div className="flex items-center gap-x-1.5">
                        <div className="size-2 rounded-full bg-indigo-500" />
                        <span className="text-[10px] font-medium">{t("thisVideo")}</span>
                     </div>
                     <div className="flex items-center gap-x-1.5 opacity-50">
                        <div className="size-2 rounded-full bg-neutral-400" />
                        <span className="text-[10px]">{t("typicalRetention")}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-x-1 text-muted-foreground cursor-help">
                     <span className="text-[10px]">{t("chartGuide")}</span>
                     <InfoIcon className="size-3" />
                  </div>
               </div>

               <div className="h-40 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={(() => {
                        const duration = (selectedVideo?.duration || 30000) / 1000;
                        const points = 8;
                        const step = duration / (points - 1);
                        return Array.from({ length: points }).map((_, i) => {
                          const time = Math.floor(i * step);
                          // Generate a realistic decay curve: 100% -> avgViewPercent
                          const target = selectedVideo?.averageViewPercent || 50;
                          const val = 100 - (100 - target) * (time / duration);
                          return { time, val };
                        });
                      })()} 
                      margin={{ top: 5, right: 30, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid vertical={false} stroke="#eee" className="dark:stroke-neutral-800" />
                      <XAxis 
                        dataKey="time" 
                        type="number"
                        domain={[0, (selectedVideo?.duration || 30000) / 1000]}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#888' }}
                        tickFormatter={(v) => `${Math.floor(v/60)}:${(v%60).toString().padStart(2, '0')}`}
                        ticks={[0, Math.floor((selectedVideo?.duration || 30000) / 2000), (selectedVideo?.duration || 30000) / 1000]}
                      />
                      <YAxis 
                        domain={[0, 120]} 
                        ticks={[0, 40, 80, 120]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#888' }}
                        orientation="right"
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="val" 
                        stroke="#8b5cf6" 
                        strokeWidth={2} 
                        dot={false}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Highlight area mock */}
                  <div className="absolute top-0 left-[20px] bottom-[40px] w-[20%] bg-indigo-500/10 border-l border-indigo-500/30 pointer-events-none" />
               </div>
               <p className="text-[10px] text-muted-foreground text-center mt-2 italic">{t("retentionChartTitle")}</p>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">{t("howViewersFoundYourVideo")}</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">{t("trafficSourcesSub")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex gap-x-2">
                  {[t("overview"), t("external"), t("youtubeSearch"), t("suggestedVideos")].map((txt, i) => (
                    <Button key={i} variant={i === 0 ? "default" : "secondary"} size="sm" className="text-[10px] h-7 px-3 rounded-lg font-bold">
                       {txt}
                    </Button>
                  ))}
               </div>
               <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs">
                        <span>{t("otherYoutubeFeatures")}</span>
                        <span className="font-bold">100,0%</span>
                     </div>
                     <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: "100%" }} />
                     </div>
                  </div>
               </div>
               <Button variant="secondary" size="sm" className="text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 mt-2">{t("seeMore")}</Button>
            </CardContent>
         </Card>

         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">{t("topVideos")}</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">{t("trafficSourcesSub")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
               {data.topVideos.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between group">
                     <div className="flex items-center gap-x-3 min-w-0 flex-1">
                        <img src={v.thumbnailUrl || "/fallback.jpg"} alt="thumb" className="size-10 rounded shrink-0 object-cover" />
                        <span className="text-xs truncate max-w-[200px]">{v.title}</span>
                     </div>
                     <div className="flex items-center gap-x-3 flex-1">
                        <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-400" style={{ width: "60%" }} />
                        </div>
                        <span className="text-xs font-bold">{v.viewsCount}</span>
                     </div>
                  </div>
               ))}
               <Button variant="secondary" size="sm" className="text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 mt-2">{t("seeMore")}</Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

const ShortsContentSection = ({ data, days, videoId }: { data: any, days: number, videoId?: string }) => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const hasShorts = data.contentBreakdown.views.shorts > 0 || data.contentBreakdown.shorts.topShorts.length > 0;

  if (!hasShorts) {
    return (
      <div className="py-20 text-center border rounded-xl bg-white dark:bg-neutral-900 flex flex-col items-center justify-center space-y-4">
        <div className="size-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
           <PlayCircleIcon className="size-10 text-muted-foreground opacity-20" />
        </div>
        <div className="space-y-1">
           <p className="font-bold text-lg">{t("noShortsDataTitle")}</p>
           <p className="text-sm text-muted-foreground">{t("noShortsDataSub")}</p>
        </div>
        <Button variant="secondary" className="rounded-full font-bold h-9 px-6 bg-neutral-100 dark:bg-neutral-800 border-none">
           {t("createShorts")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm border-none bg-white dark:bg-neutral-900 overflow-hidden">
         <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-x dark:divide-neutral-800">
            {[
              { label: t("videoViews"), val: data.contentBreakdown.views.shorts, sub: t("vsPreviousDays", { percent: "74%", days }) },
              { label: t("intentionalViews"), val: data.contentBreakdown.shorts.intentionalViews, sub: t("vsPreviousDays", { percent: "69%", days }) },
              { label: t("likes"), val: data.contentBreakdown.shorts.likes, sub: t("vsPreviousDays", { percent: "100%", days }) },
              { label: t("subscribers"), val: data.contentBreakdown.subscribers.shorts, sub: "—" },
            ].map((m, i) => (
              <div key={i} className="p-4 flex flex-col items-center justify-center text-center">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{m.label}</p>
                 <p className="text-xl font-bold">{m.val}</p>
                 {m.sub && <p className="text-[9px] text-muted-foreground mt-1">{m.sub}</p>}
              </div>
            ))}
         </div>
         <CardContent className="p-0 pt-6">
            <div className="h-[250px] w-full px-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.viewsByDay} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="0" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    dy={10}
                    interval="preserveStartEnd"
                    ticks={[data.viewsByDay[0]?.date, data.viewsByDay[Math.floor(data.viewsByDay.length / 2)]?.date, data.viewsByDay[data.viewsByDay.length - 1]?.date].filter(Boolean)}
                  />
                  <YAxis 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    dx={10}
                  />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fill="#8b5cf6" 
                    fillOpacity={0.1} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 flex justify-start px-6">
               <Button variant="secondary" size="sm" className="text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 h-8">
                  {t("seeMore")}
               </Button>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">{t("howViewersFoundYourVideo")}</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">{t("trafficSourcesSub")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex flex-wrap gap-2">
                  {[t("overview"), t("external"), t("youtubeSearch"), t("suggestedVideos")].map((txt, i) => (
                    <Button key={i} variant={i === 0 ? "default" : "secondary"} size="sm" className="text-[10px] h-7 px-3 rounded-lg font-bold">
                       {txt}
                    </Button>
                  ))}
               </div>
               <div className="space-y-4 pt-4">
                  {[
                    { label: t("youtubeSearch"), percentage: 86.7 },
                    { label: t("otherYoutubeFeatures"), percentage: 13.3 },
                    { label: t("noData"), percentage: 0.0 },
                  ].map((s, idx) => (
                    <div key={idx} className="space-y-1">
                       <div className="flex justify-between text-xs">
                          <span>{s.label}</span>
                          <span className="font-bold">{s.percentage.toFixed(1)}%</span>
                       </div>
                       <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full", 
                              idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-indigo-400" : "bg-neutral-300"
                            )} 
                            style={{ width: `${s.percentage}%` }} 
                          />
                       </div>
                    </div>
                  ))}
               </div>
               <Button variant="secondary" size="sm" className="text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 h-8 mt-4">
                  {t("seeMore")}
               </Button>
            </CardContent>
         </Card>

         <div className="space-y-6">
            <Card className="rounded-xl shadow-sm">
               <CardHeader>
                  <CardTitle className="text-base font-bold">{t("engagementTitle")}</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">{days === 3650 ? t("allTime") : t("daysCount", { days })}</p>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="space-y-2">
                     <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-indigo-400" style={{ width: `${data.contentBreakdown.shorts.stayPercent}%` }} />
                        <div className="h-full bg-neutral-200 dark:bg-neutral-700" style={{ width: `${data.contentBreakdown.shorts.swipePercent}%` }} />
                     </div>
                     <div className="flex justify-between items-start text-xs">
                        <div className="space-y-1">
                           <p className="font-bold">{data.contentBreakdown.shorts.stayPercent.toFixed(1)}%</p>
                           <p className="text-[10px] text-muted-foreground">{t("stayedWatching")}</p>
                        </div>
                        <div className="space-y-1 text-right">
                           <p className="font-bold">{data.contentBreakdown.shorts.swipePercent.toFixed(1)}%</p>
                           <p className="text-[10px] text-muted-foreground">{t("swipedAway")}</p>
                        </div>
                     </div>
                  </div>
                  <Button variant="secondary" size="sm" className="text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 h-8">
                     {t("seeMore")}
                  </Button>
               </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm">
               <CardHeader>
                  <CardTitle className="text-base font-bold">{t("topShorts")}</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">{t("trafficSourcesSub")}</p>
               </CardHeader>
               <CardContent className="space-y-4">
                  {data.contentBreakdown.shorts.topShorts.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between group">
                       <div className="flex items-center gap-x-3 min-w-0 flex-1">
                          <img src={v.thumbnailUrl || "/fallback.jpg"} alt="thumb" className="size-10 rounded shrink-0 object-cover" />
                          <span className="text-xs truncate max-w-[200px]">{v.title}</span>
                       </div>
                       <div className="flex items-center gap-x-3 flex-1">
                          <div className="h-1.5 flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-400" style={{ width: "60%" }} />
                          </div>
                          <span className="text-xs font-bold">{v.viewsCount}</span>
                       </div>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" className="text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 h-8 mt-2">
                     {t("seeMore")}
                  </Button>
               </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm">
               <CardHeader>
                  <CardTitle className="text-base font-bold">{t("mostRemixedTitle")}</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">{days === 3650 ? t("allTime") : t("daysCount", { days })}</p>
               </CardHeader>
               <CardContent className="py-8 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">{t("notEnoughRemixData")}</p>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
};

const PostsContentSection = ({ data, days, videoId }: { data: any, days: number, videoId?: string }) => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const [activePostType, setActivePostType] = useState<"image" | "poll" | "question" | "text" | "video">("image");

  const postTypes = [
    { id: "image", label: t("image"), icon: ImageIcon },
    { id: "poll", label: t("poll"), icon: BarChart2Icon },
    { id: "question", label: t("question"), icon: MessageCircleIcon },
    { id: "text", label: t("text"), icon: TypeIcon },
    { id: "video", label: t("video"), icon: PlayIcon },
  ];

  const filteredPosts = data.contentBreakdown.postsBreakdown.topPosts.filter((p: any) => p.type === activePostType);
  const activeTypeInfo = postTypes.find(t => t.id === activePostType);
  const ActiveIcon = activeTypeInfo?.icon || ImageIcon;

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm border-none bg-white dark:bg-neutral-900 overflow-hidden">
         <div className="grid grid-cols-1 md:grid-cols-3 border-b divide-x dark:divide-neutral-800">
            {[
              { label: t("postImpressions"), val: data.contentBreakdown.postsBreakdown.impressions, sub: "" },
              { label: t("likes"), val: data.contentBreakdown.postsBreakdown.likes, sub: "—" },
              { label: t("subscribers"), val: data.contentBreakdown.postsBreakdown.subscribers, sub: "—" },
            ].map((m, i) => (
              <div key={i} className="p-4 flex flex-col items-center justify-center text-center">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{m.label}</p>
                 <p className="text-xl font-bold">{m.val}</p>
                 {m.sub && <p className="text-[9px] text-muted-foreground mt-1">{m.sub}</p>}
              </div>
            ))}
         </div>
         <CardContent className="p-0 pt-6">
            <div className="h-[250px] w-full px-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.viewsByDay} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="0" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    dy={10}
                    interval="preserveStartEnd"
                    ticks={[data.viewsByDay[0]?.date, data.viewsByDay[Math.floor(data.viewsByDay.length / 2)]?.date, data.viewsByDay[data.viewsByDay.length - 1]?.date].filter(Boolean)}
                  />
                  <YAxis 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    dx={10}
                  />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fill="#8b5cf6" 
                    fillOpacity={0.1} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 flex justify-start px-6">
               <Button variant="secondary" size="sm" className="text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 h-8">
                  {t("seeMore")}
               </Button>
            </div>
         </CardContent>
      </Card>

      {/* TOP POSTS */}
      <Card className="rounded-xl shadow-sm">
         <CardHeader>
            <CardTitle className="text-base font-bold">{t("topPosts")}</CardTitle>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">{t("last28Days")}</p>
         </CardHeader>
         <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
               {postTypes.map((t) => (
                 <Button 
                   key={t.id} 
                   variant={activePostType === t.id ? "default" : "secondary"} 
                   size="sm" 
                   onClick={() => setActivePostType(t.id as any)}
                   className="text-[10px] h-7 px-3 rounded-lg font-bold flex items-center gap-x-1.5"
                 >
                    <t.icon className="size-3" />
                    {t.label}
                 </Button>
               ))}
            </div>

            {filteredPosts.length > 0 ? (
              <div className="space-y-4">
                 {filteredPosts.map((p: any) => (
                   <div key={p.id} className="flex items-center justify-between group p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                      <div className="flex items-center gap-x-3 min-w-0 flex-1">
                         <div className="size-10 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center shrink-0">
                            <ActiveIcon className="size-5 text-muted-foreground" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-xs truncate font-medium">{p.content || t("noPostContent")}</p>
                            <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(p.createdAt), { locale: dateFnsLocales[locale as keyof typeof dateFnsLocales] || enUS, addSuffix: true })}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-x-8">
                         <div className="text-center">
                            <p className="text-xs font-bold">{p.likeCount}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{t("likes")}</p>
                         </div>
                         <div className="text-center">
                            <p className="text-xs font-bold">{p.commentCount}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{t("comments")}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-50">
                 <ImageIcon className="size-10 text-muted-foreground" />
                 <p className="text-xs font-medium">{t("noPostsData")}</p>
              </div>
            )}

            <Button variant="secondary" size="sm" className="text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 h-8 mt-2">
               {t("seeMore")}
            </Button>
         </CardContent>
      </Card>
    </div>
  );
};

const ContentTab = ({ days, videoId }: { days: number, videoId?: string }) => {
  const t = useTranslations("Studio");
  const [data] = trpc.studio.getAnalytics.useSuspenseQuery({ days, videoId });
  const [activeSubTab, setActiveSubTab] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-x-2">
        {["all", "video", "shorts", "posts"].map((tab) => (
          <Button 
            key={tab}
            variant={activeSubTab === tab ? "default" : "secondary"} 
            size="sm" 
            className="rounded-lg h-8 px-4 font-bold"
            onClick={() => setActiveSubTab(tab)}
          >
            {tab === "all" ? t("all") : tab === "video" ? t("video") : tab === "shorts" ? "Shorts" : t("posts")}
          </Button>
        ))}
      </div>

      {activeSubTab === "all" && <AllContentSection data={data} days={days} videoId={videoId} />}
      {activeSubTab === "video" && <VideoContentSection data={data} days={days} videoId={videoId} />}
      {activeSubTab === "shorts" && <ShortsContentSection data={data} days={days} videoId={videoId} />}
      {activeSubTab === "posts" && <PostsContentSection data={data} days={days} videoId={videoId} />}
    </div>
  );
};

const AnalyticsContent = ({ days, videoId }: { days: number, videoId?: string }) => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const [data] = trpc.studio.getAnalytics.useSuspenseQuery({ days, videoId });
  const [activeStat, setActiveStat] = useState<"views" | "watchTime" | "subscribers">("views");

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* LEFT COLUMN - DETAILS */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold">
            {t("hasViewsInPeriod", { 
               target: videoId ? t("thisVideo") : t("yourChannel"), 
               count: data.totalViews, 
               period: days === 3650 ? t("allTime") : t("daysCount", { days }) 
            })}
          </h2>
        </div>

        {/* MAIN METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 bg-white dark:bg-neutral-900 border rounded-xl overflow-hidden shadow-sm">
          <div 
            className={cn(
              "p-6 cursor-pointer border-r transition-colors flex flex-col items-center",
              activeStat === "views" ? "bg-neutral-50 dark:bg-neutral-800 border-b-2 border-b-primary" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
            )}
            onClick={() => setActiveStat("views")}
          >
             <p className="text-[11px] text-muted-foreground uppercase font-bold mb-1">{t("videoViews")} ({days === 3650 ? t("allTime") : t("daysCount", { days })})</p>
             <div className="flex items-center gap-x-2">
                <span className="text-2xl font-bold">{data.totalViews}</span>
                {data.totalViews > 0 ? (
                  <div className="size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <TrendingUpIcon className="size-3 text-emerald-600" />
                  </div>
                ) : (
                  <div className="size-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <MinusIcon className="size-3 text-gray-500" />
                  </div>
                )}
             </div>
             <p className="text-[10px] text-muted-foreground mt-1">
               {data.totalViews > 0 ? t("goodProgress") : t("quietPeriod")}
             </p>
          </div>

          <div 
             className={cn(
               "p-6 cursor-pointer border-r transition-colors flex flex-col items-center",
               activeStat === "watchTime" ? "bg-neutral-50 dark:bg-neutral-800 border-b-2 border-b-primary" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
             )}
             onClick={() => setActiveStat("watchTime")}
          >
             <p className="text-[11px] text-muted-foreground uppercase font-bold mb-1">{t("watchTimeHours")}</p>
             <div className="flex items-center gap-x-2">
                <span className="text-2xl font-bold">{data.totalWatchTimeHours}</span>
                {Number(data.totalWatchTimeHours) > 0 ? (
                  <div className="size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <TrendingUpIcon className="size-3 text-emerald-600" />
                  </div>
                ) : (
                  <div className="size-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <MinusIcon className="size-3 text-gray-500" />
                  </div>
                )}
             </div>
             <p className="text-[10px] text-muted-foreground mt-1">
               {Number(data.totalWatchTimeHours) > 0 ? t("goodProgress") : t("basedOnWatching")}
             </p>
          </div>

          <div 
             className={cn(
               "p-6 cursor-pointer transition-colors flex flex-col items-center",
               activeStat === "subscribers" ? "bg-neutral-50 dark:bg-neutral-800 border-b-2 border-b-primary" : "hover:bg-neutral-50 dark:hover:hover:bg-neutral-800"
             )}
             onClick={() => setActiveStat("subscribers")}
          >
             <p className="text-[11px] text-muted-foreground uppercase font-bold mb-1">{t("subscribersGained")}</p>
             <div className="flex items-center gap-x-2">
                <span className="text-2xl font-bold">
                   {data.audience.subscribersGained > 0 ? `+${data.audience.subscribersGained}` : data.audience.subscribersGained}
                </span>
                {data.audience.subscribersGained !== 0 ? (
                  <div className={cn("size-4 rounded-full flex items-center justify-center", data.audience.subscribersGained > 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                    {data.audience.subscribersGained > 0 ? (
                      <TrendingUpIcon className="size-3 text-emerald-600" />
                    ) : (
                      <TrendingDownIcon className="size-3 text-red-600" />
                    )}
                  </div>
                ) : (
                  <div className="size-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <MinusIcon className="size-3 text-gray-500" />
                  </div>
                )}
             </div>
             <p className="text-[10px] text-muted-foreground mt-1">
               {data.audience.subscribersGained !== 0 ? t("changeInPeriod") : t("noChange")}
             </p>
          </div>
        </div>

        {/* BIỂU ĐỒ CHÍNH */}
        <Card className="rounded-xl shadow-sm overflow-hidden">
          <CardContent className="p-0 pt-6">
            <div className="h-[300px] w-full px-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.viewsByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#888888" }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#888888" }}
                    orientation="right"
                  />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#22d3ee" 
                    strokeWidth={2}
                    fill="#22d3ee" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 border-t flex justify-start">
               <Button variant="secondary" size="sm" className="text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4">
                  {t("seeMore")}
               </Button>
            </div>
          </CardContent>
        </Card>

        {/* TOP CONTENT TABLE */}
        <div className="space-y-4">
           <h3 className="text-base font-bold">{t("topContentInPeriod")}</h3>
           <div className="bg-white dark:bg-neutral-900 border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                 <thead className="text-[11px] text-muted-foreground uppercase bg-neutral-50/50 dark:bg-neutral-800/50">
                    <tr>
                       <th className="px-6 py-3 font-bold">{t("content")}</th>
                       <th className="px-6 py-3 font-bold text-center">{t("avgViewDuration")}</th>
                       <th className="px-6 py-3 font-bold text-right">{t("videoViews")}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y">
                    {data.topVideos.map((video, idx) => (
                       <tr key={video.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-x-4">
                             <span className="font-bold text-muted-foreground">{idx + 1}</span>
                             <div className="relative size-10 rounded overflow-hidden shrink-0">
                                <img src={video.thumbnailUrl || "/fallback.jpg"} alt={video.title} className="object-cover w-full h-full" />
                             </div>
                             <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate max-w-[300px]">{video.title}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(video.createdAt).toLocaleDateString()}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground">
                             {video.avgDurationLabel} ({video.averageViewPercent}%)
                          </td>
                          <td className="px-6 py-4 text-right font-bold">{video.viewsCount}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

       {/* RIGHT COLUMN - REALTIME */}
      <div className="w-full xl:w-[350px] space-y-6">
        <Card className="rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              {t("realtime")}
              <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">{t("updatingRealtime")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
               <div className="text-3xl font-bold">{data.totalSubscribers}</div>
               <p className="text-[11px] text-muted-foreground">{t("subscribers")}</p>
            </div>
            <Button variant="outline" className="w-full text-xs font-bold h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">
               {t("seeLiveSubscribers")}
            </Button>
            
            <div className="pt-4 border-t">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">{data.realtime.totalViews}</span>
                  <span className="text-[10px] text-muted-foreground">{t("viewsLast48Hours")}</span>
               </div>
               {/* BAR CHART REALTIME */}
               <div className="h-16 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.realtime.viewsByHour} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-neutral-800 text-white p-2 rounded-md shadow-lg text-[10px] border border-white/10">
                                <p className="font-bold">{payload[0].payload.fullLabel}</p>
                                <p className="text-lg mt-1">{payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="views" 
                        fill="#3ea6ff" 
                        radius={[2, 2, 0, 0]}
                        barSize={4}
                      />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>{t("last48Hours")}</span>
                  <span className="font-bold">{t("now")}</span>
               </div>
            </div>

            <div className="pt-4 space-y-2">
               <div className="flex justify-between text-[11px] text-muted-foreground font-bold uppercase">
                  <span>{t("topPosts")}</span>
                  <span>{t("views")}</span>
               </div>
               {data.realtime.topVideos.map((v: any) => (
                 <div key={v.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-x-2 min-w-0">
                       <div className="size-8 bg-neutral-100 dark:bg-neutral-800 rounded shrink-0 overflow-hidden">
                          <img src={v.thumbnailUrl || "/fallback.jpg"} alt={v.title} className="object-cover w-full h-full" />
                       </div>
                       <span className="text-xs truncate group-hover:text-blue-500 transition-colors">{v.title}</span>
                    </div>
<span className="text-xs font-bold ml-2">{v.viewsCount}</span>
                 </div>
               ))}
            </div>

            <Button variant="secondary" size="sm" className="w-full text-xs font-bold h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none mt-2">
                {t("seeMore")}
            </Button>
          </CardContent>
        </Card>

        {/* LATEST CONTENT */}
        {data.latestVideo && (
           <Card className="rounded-xl shadow-sm overflow-hidden border-none bg-neutral-900 text-white">
              <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-bold">{t("latestContent")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="aspect-video relative rounded-md overflow-hidden bg-neutral-800">
                    <img src={data.latestVideo.thumbnailUrl || "/fallback.jpg"} alt="Latest" className="w-full h-full object-cover" />
                 </div>
                 <p className="text-xs font-bold line-clamp-2">{data.latestVideo.title}</p>
                 <p className="text-[10px] text-neutral-400">{t("firstTimeLabel", { time: formatDistanceToNow(new Date(data.latestVideo.createdAt), { locale: dateFnsLocales[locale as keyof typeof dateFnsLocales] || enUS, addSuffix: true }) })}</p>
                 
                 <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="flex justify-between items-center text-[11px]">
                       <span className="text-neutral-400">{t("views")}</span>
                       <span className="font-bold">{data.latestVideo.viewsCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                       <span className="text-neutral-400">{t("avgViewRate")}</span>
                       <span className="font-bold">{data.latestVideo.averageViewPercent}%</span>
                    </div>
                 </div>
              </CardContent>
           </Card>
        )}
      </div>
    </div>
  );
};

// --- MAIN EXPORT ---

const AudienceTab = ({ days, videoId }: { days: number, videoId?: string }) => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const [data] = trpc.studio.getAnalytics.useSuspenseQuery({ days, videoId });
  const [activeStat, setActiveStat] = useState<"viewers" | "subscribers">("viewers");

  return (
    <div className="space-y-6">
      {/* KHÁN GIẢ HÀNG THÁNG & NGƯỜI ĐĂNG KÝ */}
      <Card className="rounded-xl shadow-sm overflow-hidden bg-transparent border-neutral-200 dark:border-neutral-800">
         <div className="grid grid-cols-1 md:grid-cols-2 border-b dark:border-neutral-800">
            <div 
              className={cn(
                "p-4 cursor-pointer transition-colors flex flex-col items-center justify-center text-center",
                activeStat === "viewers" ? "bg-neutral-50 dark:bg-neutral-800/50 border-b-2 border-b-black dark:border-b-white" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-b-2 border-b-transparent"
              )}
              onClick={() => setActiveStat("viewers")}
            >
               <p className="text-[11px] text-muted-foreground font-medium mb-1">{t("monthlyAudience")}</p>
               <p className="text-xl font-bold">{data.audience.uniqueViewers}</p>
            </div>
            <div 
              className={cn(
                "p-4 cursor-pointer transition-colors flex flex-col items-center justify-center text-center border-l dark:border-neutral-800",
                activeStat === "subscribers" ? "bg-neutral-50 dark:bg-neutral-800/50 border-b-2 border-b-black dark:border-b-white" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-b-2 border-b-transparent"
              )}
              onClick={() => setActiveStat("subscribers")}
            >
               <p className="text-[11px] text-muted-foreground font-medium mb-1">{t("subscribersGained")}</p>
               <p className="text-xl font-bold">{data.audience.subscribersGained}</p>
            </div>
         </div>
         <CardContent className="p-0 pt-6 bg-transparent">
            <div className="h-[250px] w-full px-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeStat === "viewers" ? data.viewsByDay : data.subscribersByDay} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="0" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={{ stroke: '#404040' }} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    dy={10}
                    interval="preserveStartEnd"
                    ticks={[data.viewsByDay[0]?.date, data.viewsByDay[Math.floor(data.viewsByDay.length / 2)]?.date, data.viewsByDay[data.viewsByDay.length - 1]?.date].filter(Boolean)}
                  />
                  <YAxis 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    dx={10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#262626', color: '#fff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={activeStat === "viewers" ? "views" : "count"} 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 flex justify-start px-6">
               <Button variant="secondary" size="sm" className="text-[10px] font-bold rounded-full bg-neutral-200/50 dark:bg-neutral-800 border-none px-4 h-7">
                  {t("seeMore")}
               </Button>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Audience behavior breakdown */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("audienceByBehavior")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("monthlyAudience")} • {format(new Date(), "d MMM, yyyy", { locale: dateFnsLocales[locale as keyof typeof dateFnsLocales] || enUS })}</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-xs text-muted-foreground mt-4 mb-8">{t("noAudienceData")}</p>
               <Button variant="secondary" size="sm" className="text-[10px] font-bold rounded-full bg-neutral-200/50 dark:bg-neutral-800 border-none px-4 h-7 mt-4">
                  {t("seeMore")}
               </Button>
            </CardContent>
         </Card>

         {/* Popular with various audiences */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("popularWithAudiences")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("views")} • {t("last28Days")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex gap-x-2">
                  {[t("new"), t("typical"), t("frequent")].map((txt, i) => (
                    <Button key={i} variant={i === 0 ? "secondary" : "ghost"} size="sm" className={cn("text-[10px] h-7 px-3 rounded-lg font-bold border", i === 0 ? "bg-black text-white dark:bg-white dark:text-black" : "border-neutral-300 dark:border-neutral-700")}>
                       {txt}
                    </Button>
                  ))}
               </div>
               <p className="text-xs text-muted-foreground mt-4">{t("noPostsData")}</p>
            </CardContent>
         </Card>

         {/* When viewers are on YouTube */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("whenViewersAreOnYoutube")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("localTime")} (GMT +0700) • {t("last28Days")}</p>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground mt-4 mb-4">{t("noAudienceData")}</p>
            </CardContent>
         </Card>

         {/* Channels your audience watches */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("channelsYourAudienceWatches")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("last28Days")}</p>
            </CardHeader>
            <CardContent>
               <p className="text-[11px] text-muted-foreground mt-4 mb-4">
                 {t("noAudienceData")} <span className="text-blue-500 cursor-pointer hover:underline">{t("learnMore")}</span>
               </p>
            </CardContent>
         </Card>

         {/* Watch time from subscribers */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("watchTimeFromSubscribers")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("watchTimeEngagement")} • {t("last28Days")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-[11px] font-bold items-center">
                     <span>{t("notSubscribed")}</span>
                     <div className="flex items-center gap-x-3 w-1/2 justify-end">
                       <div className="h-1.5 bg-[#c084fc] rounded-full" style={{ width: `${Math.max(data.audience.unsubscribedPercent, 1)}%` }} />
                       <span className="w-8 text-right">{data.audience.unsubscribedPercent.toFixed(1).replace(".", ",")}%</span>
                     </div>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold items-center">
                     <span>{t("subscribed")}</span>
                     <div className="flex items-center gap-x-3 w-1/2 justify-end">
                       <div className="h-1.5 bg-[#c084fc] rounded-full" style={{ width: `${Math.max(data.audience.subscribedPercent, 1)}%` }} />
                       <span className="w-8 text-right">{data.audience.subscribedPercent.toFixed(1).replace(".", ",")}%</span>
                     </div>
                  </div>
               </div>
               <Button variant="secondary" size="sm" className="text-[10px] font-bold rounded-full bg-neutral-200/50 dark:bg-neutral-800 border-none px-4 h-7 mt-6">
                  {t("seeMore")}
               </Button>
            </CardContent>
         </Card>

         {/* Content your audience watches */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("channelsYourAudienceWatches")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("daysCount", { days: 7 })}</p>
            </CardHeader>
            <CardContent>
               <p className="text-[11px] text-muted-foreground mt-4 mb-4">
                 {t("noAudienceData")} <span className="text-blue-500 cursor-pointer hover:underline">{t("learnMore")}</span>
               </p>
            </CardContent>
         </Card>

         {/* Formats */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("formatsYourAudienceWatches")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("last28Days")}</p>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground mt-4 mb-4">{t("noPostsData")}</p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

const ReachTab = ({ days, videoId }: { days: number, videoId?: string }) => {
  const t = useTranslations("Studio");
  const [data] = trpc.studio.getAnalytics.useSuspenseQuery({ days, videoId });

  return (
    <div className="space-y-6">
      {/* 4 THẺ CHỈ SỐ REACH */}
      <div className="grid grid-cols-1 md:grid-cols-4 bg-white dark:bg-neutral-900 border rounded-xl overflow-hidden shadow-sm">
         <div className="p-4 border-r flex flex-col items-center justify-center text-center">
            <p className="text-[11px] text-muted-foreground font-medium mb-1 uppercase">{t("impressions")}</p>
            <p className="text-xl font-bold">{data.contentBreakdown.discovery.impressions}</p>
         </div>
         <div className="p-4 border-r flex flex-col items-center justify-center text-center">
            <p className="text-[11px] text-muted-foreground font-medium mb-1 uppercase">{t("clickThroughRate")} (CTR)</p>
            <p className="text-xl font-bold">{data.contentBreakdown.discovery.ctr}%</p>
         </div>
         <div className="p-4 border-r flex flex-col items-center justify-center text-center">
            <p className="text-[11px] text-muted-foreground font-medium mb-1 uppercase">{t("videoViews")}</p>
            <p className="text-xl font-bold">{data.totalViews}</p>
         </div>
         <div className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] text-muted-foreground font-medium mb-1 uppercase">{t("uniqueViewers")}</p>
            <p className="text-xl font-bold">{data.audience.uniqueViewers}</p>
         </div>
      </div>

      {/* BIỂU ĐỒ REACH */}
      <Card className="rounded-xl shadow-sm overflow-hidden bg-transparent border-neutral-200 dark:border-neutral-800">
         <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t("impressions")}</CardTitle>
            <p className="text-[10px] text-muted-foreground">{t("impressionsOverTime")}</p>
         </CardHeader>
         <CardContent className="p-0 pt-6">
            <div className="h-[300px] w-full px-6">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.viewsByDay}>
                     <CartesianGrid vertical={false} strokeDasharray="0" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                     <XAxis 
                       dataKey="date" 
                       axisLine={{ stroke: '#404040' }} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fill: '#888' }} 
                       dy={10}
                     />
                     <YAxis 
                       orientation="right" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fill: '#888' }} 
                       dx={10}
                     />
                     <Tooltip 
                       contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#262626', color: '#fff' }}
                     />
                     <Line 
                       type="monotone" 
                       dataKey="impressions" 
                       name={t("impressions")}
                       stroke="#3ea6ff" 
                       strokeWidth={2}
                       dot={false}
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
            <div className="p-4 flex justify-start px-6">
               <Button variant="secondary" size="sm" className="text-[10px] font-bold rounded-full bg-neutral-200/50 dark:bg-neutral-800 border-none px-4 h-7">
                  {t("seeMore")}
               </Button>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* How viewers found this video */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("howViewersFoundThisVideo")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("viewsInSelectedPeriod")}</p>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex flex-col items-center py-4">
                  <div className="size-48 rounded-full border-[20px] border-blue-500/20 relative flex items-center justify-center">
                     <div className="absolute inset-0 border-[20px] border-blue-500 rounded-full clip-path-half" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 0)' }} />
                     <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">{t("trafficSourcesChartCenter")}</p>
                        <p className="text-xs font-bold">{t("seeDetailsBelow")}</p>
                     </div>
                  </div>
               </div>
               <div className="space-y-3">
                  {data.contentBreakdown.trafficSources.map((source: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                       <span className="text-muted-foreground">{source.label}</span>
                       <div className="flex items-center gap-x-4 w-1/2 justify-end">
                          <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${source.percentage}%` }} />
                          <span className="font-bold w-10 text-right">{source.percentage}%</span>
                       </div>
                    </div>
                  ))}
               </div>
               <Button variant="secondary" size="sm" className="text-[10px] font-bold rounded-full bg-neutral-200/50 dark:bg-neutral-800 border-none px-4 h-7 w-full mt-4">
                  {t("seeMore")}
               </Button>
            </CardContent>
         </Card>

         {/* DISCOVERY FUNNEL */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("discoveryFunnelTitle")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("discoveryFunnelSub")}</p>
            </CardHeader>
            <CardContent className="p-6 bg-neutral-50/50 dark:bg-neutral-900/30">
               <div className="relative flex flex-col items-center space-y-0.5">
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 p-4 text-center rounded-t-lg">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("impressions")}</p>
                     <p className="text-lg font-bold">{data.contentBreakdown.discovery.impressions}</p>
                     <p className="text-[10px] text-neutral-400">{t("discoveryCTRInfo", { ctr: data.contentBreakdown.discovery.ctr.toFixed(1) })}</p>
                  </div>
                  <div className="w-[85%] bg-neutral-200 dark:bg-neutral-700/50 p-4 text-center">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("clickThroughRate")}: {data.contentBreakdown.discovery.ctr}%</p>
                  </div>
                  <div className="w-[70%] bg-neutral-300 dark:bg-neutral-600/50 p-4 text-center">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("viewsFromImpressions")}</p>
                     <p className="text-lg font-bold">{data.contentBreakdown.discovery.viewsFromImpressions}</p>
                     <p className="text-[10px] text-neutral-400">{(data.contentBreakdown.discovery.avgViewDuration)} {t("avgViewDurationLabel")}</p>
                  </div>
                  <div className="w-[55%] bg-neutral-400 dark:bg-neutral-500/50 p-4 text-center rounded-b-lg">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">{t("watchTimeFromImpressionsLabel")}</p>
                     <p className="text-lg font-bold">{data.contentBreakdown.discovery.watchTimeFromImpressions}</p>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

const EngagementTab = ({ days, videoId }: { days: number, videoId?: string }) => {
  const t = useTranslations("Studio");
  const [data] = trpc.studio.getAnalytics.useSuspenseQuery({ days, videoId });

  return (
    <div className="space-y-6">
      {/* 2 THẺ CHỈ SỐ ENGAGEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-neutral-900 border rounded-xl overflow-hidden shadow-sm">
         <div className="p-6 border-r flex flex-col items-center justify-center text-center">
            <p className="text-[11px] text-muted-foreground font-medium mb-1 uppercase">{t("watchTimeEngagement")}</p>
            <p className="text-3xl font-bold">{data.totalWatchTimeHours}</p>
         </div>
         <div className="p-6 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] text-muted-foreground font-medium mb-1 uppercase">{t("avgViewDurationEngagement")}</p>
            <p className="text-3xl font-bold">{data.contentBreakdown.discovery.avgViewDuration}</p>
         </div>
      </div>

      {/* BIỂU ĐỒ ENGAGEMENT */}
      <Card className="rounded-xl shadow-sm overflow-hidden bg-transparent border-neutral-200 dark:border-neutral-800">
         <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t("watchTimeEngagement")}</CardTitle>
            <p className="text-[10px] text-muted-foreground">{t("impressionsOverTime")}</p>
         </CardHeader>
         <CardContent className="p-0 pt-6">
            <div className="h-[300px] w-full px-6">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.viewsByDay}>
                     <CartesianGrid vertical={false} strokeDasharray="0" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                     <XAxis 
                       dataKey="date" 
                       axisLine={{ stroke: '#404040' }} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fill: '#888' }} 
                       dy={10}
                     />
                     <YAxis 
                       orientation="right" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fill: '#888' }} 
                       dx={10}
                     />
                     <Tooltip 
                       contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#262626', color: '#fff' }}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="watchTime" 
                       name={t("watchTimeLabel")}
                       stroke="#a855f7" 
                       fill="#a855f7"
                       fillOpacity={0.1}
                       strokeWidth={2}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
            <div className="p-4 flex justify-start px-6">
               <Button variant="secondary" size="sm" className="text-[10px] font-bold rounded-full bg-neutral-200/50 dark:bg-neutral-800 border-none px-4 h-7">
                  {t("seeMore")}
               </Button>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* AUDIENCE RETENTION */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("audienceRetention")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("howYourVideoAttractsViewers")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={Array.from({ length: 10 }).map((_, i) => {
                        const target = data.engagement.avgViewPercent;
                        const val = 100 - (100 - target) * Math.pow(i / 9, 0.5);
                        return { time: i, val: Number(val.toFixed(1)) };
                      })} 
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="#eee" className="dark:stroke-neutral-800" strokeDasharray="3 3" />
                      <XAxis hide />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#888' }}
                        orientation="right"
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#262626', color: '#fff' }}
                        itemStyle={{ color: '#a855f7' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="val" 
                        stroke="#a855f7" 
                        strokeWidth={3} 
                        dot={false}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                     <span>{t("avgRetention")}</span>
                     <span className="font-bold">{data.engagement.avgViewPercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full">
                     <div className="bg-purple-500 h-full rounded-full" style={{ width: `${data.engagement.avgViewPercent}%` }} />
                  </div>
               </div>
            </CardContent>
         </Card>
 
         {/* LIKES AND RATINGS */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">{t("likesVsChannelAverage")}</CardTitle>
               <p className="text-[10px] text-muted-foreground">{t("likesPercentPeriod")}</p>
            </CardHeader>
            <CardContent className="space-y-8 py-8">
               <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-4xl font-bold">{data.engagement.likePercent.toString().replace(".", ",")}%</p>
                  <p className="text-xs text-muted-foreground">{t("vsChannelAverage", { percent: data.engagement.channelLikePercent.toString().replace(".", ",") })}</p>
               </div>
               {data.engagement.likePercent >= data.engagement.channelLikePercent ? (
                 <div className="flex items-center gap-x-2 text-xs text-emerald-500 font-bold justify-center bg-emerald-500/10 py-2 rounded-lg">
                    <TrendingUpIcon className="size-4" />
                    {t("higherThanUsual")}
                 </div>
               ) : (
                 <div className="flex items-center gap-x-2 text-xs text-amber-500 font-bold justify-center bg-amber-500/10 py-2 rounded-lg">
                    <TrendingDownIcon className="size-4" />
                    {t("lowerThanUsual")}
                 </div>
               )}
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

export const AnalyticsView = ({ videoId: videoIdParam }: { videoId?: string }) => {
  const t = useTranslations("Studio");
  const locale = useLocale();
  const params = useParams();
  const videoId = videoIdParam || (params.videoId as string);
  const [dateRange, setDateRange] = useState(t("last28Days"));
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const getDaysFromRange = (range: string) => {
    const now = new Date();

    if (range.startsWith(t("custom"))) {
      const match = range.match(/\d+/);
      return match ? parseInt(match[0]) : 28;
    }

    if (range === t("daysCount", { days: 7 })) return 7;
    if (range === t("last28Days")) return 28;
    if (range === t("daysCount", { days: 90 })) return 90;
    if (range === t("daysCount", { days: 365 })) return 365;
    if (range === t("allTime")) return 3650;
    
    // Year
    if (/^\d{4}$/.test(range)) {
      const year = parseInt(range);
      const startOfYear = new Date(year, 0, 1);
      const diffTime = Math.abs(now.getTime() - startOfYear.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Month
    if (range.startsWith(t("monthLabel", { month: "" }))) {
      const month = parseInt(range.split(" ")[1]) - 1;
      const startOfMonth = new Date(now.getFullYear(), month, 1);
      const diffTime = Math.abs(now.getTime() - startOfMonth.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return 28;
  };

  const days = getDaysFromRange(dateRange);
  const [data] = trpc.studio.getAnalytics.useSuspenseQuery({ days, videoId });

  const formatDateRange = (d: number) => {
    if (d === 3650) return t("allTime");
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - d);
    const formatStr = (date: Date) => `${date.getDate()} ${t("monthLabel", { month: date.getMonth() + 1 })}`;
    return t("dateRangeSummary", { start: formatStr(start), end: formatStr(end), year: end.getFullYear() });
  };

  const menuSections = [
    { items: [t("daysCount", { days: 7 }), t("last28Days"), t("daysCount", { days: 90 }), t("daysCount", { days: 365 }), t("allTime")] },
    { items: ["2026", "2025"] },
    { items: [t("monthLabel", { month: 5 }), t("monthLabel", { month: 4 }), t("monthLabel", { month: 3 })] },
    { items: [t("custom")] },
  ];

  return (
    <div className="flex flex-col gap-y-4 p-4 lg:p-8 bg-neutral-50 dark:bg-black min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{videoId ? t("videoAnalytics") : t("channelAnalytics")}</h1>
        <div className="flex items-center gap-x-2">
           <Button 
             variant="outline" 
             size="sm" 
             className="bg-white dark:bg-neutral-900"
             onClick={() => setIsAdvancedModalOpen(true)}
           >
              {t("advancedMode")}
           </Button>
        </div>
      </div>

      <AdvancedAnalyticsModal 
        isOpen={isAdvancedModalOpen} 
        onClose={() => setIsAdvancedModalOpen(false)} 
        dateRange={dateRange}
        days={days}
        videoId={videoId}
      />

      <Tabs defaultValue="overview" className="w-full">
        <div className="flex items-center justify-between border-b mb-4">
          <TabsList className="bg-transparent h-auto p-0 gap-x-8">
            {(videoId ? ["overview", "reach", "engagement", "audience"] : ["overview", "content", "audience"]).map((tab) => (
              <TabsTrigger 
                key={tab}
                value={tab} 
                className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent data-[state=active]:bg-transparent font-medium capitalize"
              >
                {tab === "overview" ? t("overview") : tab === "reach" ? t("reach") : tab === "engagement" ? t("engagement") : tab === "content" ? t("posts") : t("audience")}
              </TabsTrigger>
            ))}
          </TabsList>

          <Popover onOpenChange={(open) => !open && setShowCustomPicker(false)}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-x-2 text-sm text-muted-foreground cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2 rounded-md transition-colors">
                 {isPending ? (
                   <span className="opacity-50">{t("loading")}</span>
                 ) : (
                   <span>{formatDateRange(days)}</span>
                 )}
                 <span className="font-bold">{dateRange.startsWith(t("custom")) ? t("custom") : dateRange}</span>
                 <ChevronDownIcon className="size-4" />
              </div>
            </PopoverTrigger>
            <PopoverContent className={cn("p-0 bg-[#282828] border-white/10 text-white shadow-2xl", showCustomPicker ? "w-auto" : "w-56")} align="end">
               {!showCustomPicker ? (
                 <div className="py-1">
                    {menuSections.map((section, sIdx) => (
                      <div key={sIdx}>
                         {section.items.map((range) => (
                          <div 
                            key={range}
                            className={cn(
                              "px-4 py-2 hover:bg-white/10 cursor-pointer text-sm flex items-center justify-between transition-colors",
                              isPending && "opacity-50 pointer-events-none"
                            )}
                            onClick={() => {
                              if (range === t("custom")) {
                                setShowCustomPicker(true);
                                return;
                              }
                              startTransition(() => {
                                setDateRange(range);
                              });
                            }}
                          >
                            <span>{range}</span>
                            {dateRange === range && <CheckIcon className="size-4 text-[#3ea6ff]" />}
                          </div>
                         ))}
                         {sIdx < menuSections.length - 1 && <div className="h-px bg-white/10 my-1" />}
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                       <span className="font-bold text-sm">{t("custom")}</span>
                       <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/10 text-muted-foreground" onClick={() => setShowCustomPicker(false)}>X</Button>
                    </div>
                    <Calendar
                      mode="range"
                      selected={customRange}
                      onSelect={setCustomRange}
                      numberOfMonths={1}
                      className="bg-transparent text-white"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                       <Button variant="ghost" size="sm" onClick={() => setShowCustomPicker(false)} className="hover:bg-white/10">{t("cancel")}</Button>
                       <Button 
                         size="sm" 
                         disabled={!customRange?.from || !customRange?.to || isPending}
                         className="bg-[#3ea6ff] hover:bg-[#3ea6ff]/90 text-black"
                         onClick={() => {
                           if (customRange?.from && customRange?.to) {
                             const diff = Math.ceil(Math.abs(customRange.to.getTime() - customRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                             startTransition(() => {
                               setDateRange(`${t("custom")} (${diff} ${t("daysCount", { days: "" })})`);
                             });
                             // Note: Popover doesn't auto-close because we don't have a direct ref to close it, 
                             // but setting showCustomPicker(false) resets the state for next time
                             setShowCustomPicker(false);
                           }
                         }}
                       >
                         {t("apply")}
                       </Button>
                    </div>
                 </div>
               )}
            </PopoverContent>
          </Popover>
        </div>

        <TabsContent value="overview" className="mt-0 outline-none">
          <Suspense fallback={<AnalyticsLoading />}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <AnalyticsContent days={days} videoId={videoId} />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {!videoId && (
          <TabsContent value="content" className="mt-0 outline-none">
            <Suspense fallback={<AnalyticsLoading />}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <ContentTab days={days} videoId={videoId} />
              </ErrorBoundary>
            </Suspense>
          </TabsContent>
        )}

        {videoId && (
          <>
            <TabsContent value="reach" className="mt-0 outline-none">
              <Suspense fallback={<AnalyticsLoading />}>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <ReachTab days={days} videoId={videoId} />
                </ErrorBoundary>
              </Suspense>
            </TabsContent>

            <TabsContent value="engagement" className="mt-0 outline-none">
              <Suspense fallback={<AnalyticsLoading />}>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <EngagementTab days={days} videoId={videoId} />
                </ErrorBoundary>
              </Suspense>
            </TabsContent>
          </>
        )}

        <TabsContent value="audience" className="mt-0 outline-none">
          <Suspense fallback={<AnalyticsLoading />}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <AudienceTab days={days} videoId={videoId} />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};
