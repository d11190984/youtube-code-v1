"use client";

import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

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
  PlayIcon
} from "lucide-react";

import { trpc } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorFallback } from "@/components/error-fallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- SUB-COMPONENTS (SECTIONS) ---

const AnalyticsLoading = () => {
  return <div className="p-8">Đang tải dữ liệu...</div>;
};

const AllContentSection = ({ data }: { data: any }) => {
  const viewsBreakdown = data.contentBreakdown.views;
  const totalViews = viewsBreakdown.shorts + viewsBreakdown.video + viewsBreakdown.posts;
  const getPercentage = (val: number) => totalViews > 0 ? ((val / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* NGƯỜI XEM MỚI */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Người xem mới</CardTitle>
               <p className="text-[10px] text-muted-foreground uppercase font-bold">28 ngày qua</p>
            </CardHeader>
            <CardContent className="space-y-4">
               {["Shorts", "Video", "Bài đăng"].map((type) => (
                 <div key={type} className="flex justify-between items-center text-xs">
                    <span>{type}</span>
                    <span className="font-bold">0</span>
                 </div>
               ))}
               <Button variant="secondary" className="w-full text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">
                  Xem thêm
               </Button>
            </CardContent>
         </Card>

         {/* NGƯỜI XEM THƯỜNG XUYÊN */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Người xem thường xuyên</CardTitle>
               <p className="text-[10px] text-muted-foreground uppercase font-bold">28 ngày qua</p>
            </CardHeader>
            <CardContent className="space-y-4">
               {["Shorts", "Video", "Bài đăng"].map((type) => (
                 <div key={type} className="flex justify-between items-center text-xs">
                    <span>{type}</span>
                    <span className="font-bold">0</span>
                 </div>
               ))}
               <Button variant="secondary" className="w-full text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">
                  Xem thêm
               </Button>
            </CardContent>
         </Card>

         {/* NGƯỜI ĐĂNG KÝ */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Người đăng ký</CardTitle>
               <p className="text-[10px] text-muted-foreground uppercase font-bold">28 ngày qua</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between items-center text-xs">
                  <span>Shorts</span>
                  <span className="font-bold">{data.contentBreakdown.subscribers.shorts}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span>Video</span>
                  <span className="font-bold">{data.contentBreakdown.subscribers.video}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span>Bài đăng</span>
                  <span className="font-bold">{data.contentBreakdown.subscribers.posts}</span>
               </div>
               <Button variant="secondary" className="w-full text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">
                  Xem thêm
               </Button>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         {/* LƯỢT XEM BREAKDOWN */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">Lượt xem</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">28 ngày qua</p>
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
                        <span>Video</span>
                        <span className="font-bold">{viewsBreakdown.video} ({getPercentage(viewsBreakdown.video)}%)</span>
                     </div>
                     <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${getPercentage(viewsBreakdown.video)}%` }} />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs mb-1">
                        <span>Bài đăng</span>
                        <span className="font-bold">{viewsBreakdown.posts} ({getPercentage(viewsBreakdown.posts)}%)</span>
                     </div>
                     <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${getPercentage(viewsBreakdown.posts)}%` }} />
                     </div>
                  </div>
               </div>
               <Button variant="link" className="text-blue-500 font-bold p-0 uppercase text-xs">Xem thêm</Button>
            </CardContent>
         </Card>

         {/* NỘI DUNG ĐÃ XUẤT BẢN */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold flex items-center gap-x-2">
                  Nội dung đã xuất bản <InfoIcon className="size-3 text-muted-foreground" />
               </CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">28 ngày qua</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
               {data.contentBreakdown.publishedCount.videos > 0 || data.contentBreakdown.publishedCount.posts > 0 ? (
                 <div className="w-full space-y-4">
                    <div className="flex items-center justify-around w-full">
                       <div className="text-center">
                          <p className="text-2xl font-bold">{data.contentBreakdown.publishedCount.videos}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Video</p>
                       </div>
                       <div className="text-center">
                          <p className="text-2xl font-bold">{data.contentBreakdown.publishedCount.posts}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Bài đăng</p>
                       </div>
                    </div>
                 </div>
               ) : (
                 <p className="text-xs text-muted-foreground">Không có dữ liệu</p>
               )}
               <Button variant="secondary" className="text-xs font-bold h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">Xem thêm</Button>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         {/* PHỄU HIỂN THỊ */}
         <Card className="rounded-xl shadow-sm overflow-hidden bg-white dark:bg-neutral-900">
            <CardHeader>
               <CardTitle className="text-base font-bold">Số lượt hiển thị và cách chỉ số này đã tạo ra thời gian xem</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">Dữ liệu hiện có 12 thg 4 – 9 thg 5, 2026 (28 ngày)</p>
            </CardHeader>
            <CardContent className="p-0">
               <div className="flex flex-col items-center bg-neutral-50 dark:bg-neutral-900/50 p-6">
                  <div className="w-full max-w-[400px] flex flex-col gap-y-0.5">
                     <div className="bg-neutral-800 text-white p-4 text-center">
                        <p className="text-[10px] text-neutral-400 uppercase font-bold">Lượt hiển thị hình thu nhỏ</p>
                        <p className="text-2xl font-bold">{data.contentBreakdown.discovery.impressions}</p>
                        <p className="text-[9px] text-neutral-400 mt-1 flex items-center justify-center gap-x-1">
                           {(data.contentBreakdown.discovery.ctr).toFixed(1)}% từ YouTube đề xuất nội dung của bạn <InfoIcon className="size-2" />
                        </p>
                     </div>
                     <div className="flex justify-center -my-1 relative z-10">
                        <div className="w-0 h-0 border-l-[200px] border-l-transparent border-r-[200px] border-r-transparent border-t-[20px] border-t-neutral-800" />
                     </div>
                     <div className="bg-neutral-800/90 text-white p-3 text-center">
                        <p className="text-[10px] text-neutral-400 font-bold">Tỷ lệ nhấp: {(data.contentBreakdown.discovery.ctr).toFixed(1)}%</p>
                     </div>
                     <div className="flex justify-center -my-1 relative z-10">
                        <div className="w-0 h-0 border-l-[200px] border-l-transparent border-r-[200px] border-r-transparent border-t-[20px] border-t-neutral-800/90" />
                     </div>
                     <div className="bg-neutral-800/80 text-white p-4 text-center">
                        <p className="text-[10px] text-neutral-400 uppercase font-bold">Lượt xem từ số lượt hiển thị hình thu nhỏ</p>
                        <p className="text-2xl font-bold">{data.contentBreakdown.discovery.viewsFromImpressions}</p>
                     </div>
                     <div className="flex justify-center -my-1 relative z-10">
                        <div className="w-0 h-0 border-l-[200px] border-l-transparent border-r-[200px] border-r-transparent border-t-[20px] border-t-neutral-800/80" />
                     </div>
                     <div className="bg-neutral-800/70 text-white p-3 text-center">
                        <p className="text-[10px] text-neutral-400 font-bold">{data.contentBreakdown.discovery.avgViewDuration} thời lượng xem trung bình</p>
                     </div>
                     <div className="flex justify-center -my-1 relative z-10">
                        <div className="w-0 h-0 border-l-[200px] border-l-transparent border-r-[200px] border-r-transparent border-t-[20px] border-t-neutral-800/70" />
                     </div>
                     <div className="bg-neutral-800/60 text-white p-4 text-center">
                        <p className="text-[10px] text-neutral-400 uppercase font-bold">Thời gian xem từ số lượt hiển thị (giờ)</p>
                        <p className="text-2xl font-bold">{data.contentBreakdown.discovery.watchTimeFromImpressions}</p>
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* CÁCH NGƯỜI XEM TÌM THẤY BẠN */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">Cách người xem tìm thấy bạn</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">Số lượt xem • 28 ngày qua</p>
            </CardHeader>
            <CardContent className="space-y-8">
               <div className="flex items-center justify-center py-4">
                  <div className="size-32 rounded-full border-[16px] border-blue-500/20 relative flex items-center justify-center">
                     <div className="absolute inset-[-16px] rounded-full border-[16px] border-blue-500 border-t-transparent border-r-transparent rotate-[-45deg]" />
                     <p className="text-[10px] text-center font-bold max-w-[60px] leading-tight">Nguồn lưu lượng truy cập</p>
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
               <Button variant="link" className="text-blue-500 font-bold p-0 uppercase text-xs">Xem thêm</Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

const VideoContentSection = ({ data }: { data: any }) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(data.topVideos[0]?.id || null);
  const selectedVideo = data.topVideos.find((v: any) => v.id === selectedVideoId) || data.topVideos[0];

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm border-none bg-white dark:bg-neutral-900 overflow-hidden">
         <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-x dark:divide-neutral-800">
            {[
              { label: "Số lượt xem", val: data.contentBreakdown.views.video, sub: "" },
              { label: "Lượt hiển thị hình thu nhỏ", val: data.contentBreakdown.discovery.impressions, sub: "Giảm 8% so với 28 ngày trước" },
              { label: "Tỷ lệ nhấp", val: `${data.contentBreakdown.discovery.ctr}%`, sub: "—" },
              { label: "Thời lượng xem trung bình", val: data.contentBreakdown.discovery.avgViewDuration, sub: "" },
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
                  Xem thêm
               </Button>
            </div>
         </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
         <CardHeader className="flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-base font-bold">Những khoảnh khắc giữ chân người xem hiệu quả nhất</CardTitle>
               <p className="text-xs text-muted-foreground">Những video mới nhất (trong vòng 365 ngày qua)</p>
            </div>
            <div className="flex gap-x-1">
               {["Đoạn mở đầu", "Khoảnh khắc nổi bật", "Mốc tăng đột biến", "Mốc sụt giảm"].map((t, i) => (
                 <Button key={i} variant={i === 0 ? "default" : "secondary"} size="sm" className="text-[10px] h-7 px-3 rounded-lg font-bold">
                    {t}
                 </Button>
               ))}
            </div>
         </CardHeader>
         <CardContent className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
               <div className="flex justify-between text-[11px] text-muted-foreground uppercase font-bold border-b pb-2">
                  <span>Nội dung</span>
                  <span>Xem tiếp vào giây thứ 30</span>
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
                        <span className="text-[10px] font-medium">Video này</span>
                     </div>
                     <div className="flex items-center gap-x-1.5 opacity-50">
                        <div className="size-2 rounded-full bg-neutral-400" />
                        <span className="text-[10px]">Tỷ lệ giữ chân thông thường</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-x-1 text-muted-foreground cursor-help">
                     <span className="text-[10px]">Hướng dẫn về biểu đồ</span>
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
               <p className="text-[10px] text-muted-foreground text-center mt-2 italic">Biểu đồ tỷ lệ giữ chân người xem</p>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">Cách người xem tìm thấy video của bạn</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">Lượt xem • 28 ngày qua</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex gap-x-2">
                  {["Tổng quan", "Bên ngoài", "YouTube Tìm kiếm", "Video đề xuất"].map((t, i) => (
                    <Button key={i} variant={i === 0 ? "default" : "secondary"} size="sm" className="text-[10px] h-7 px-3 rounded-lg font-bold">
                       {t}
                    </Button>
                  ))}
               </div>
               <div className="space-y-4 pt-4">
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs">
                        <span>Các tính năng khác của YouTube</span>
                        <span className="font-bold">100,0%</span>
                     </div>
                     <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: "100%" }} />
                     </div>
                  </div>
               </div>
               <Button variant="link" size="sm" className="text-blue-500 font-bold p-0 uppercase text-xs mt-2">Xem thêm</Button>
            </CardContent>
         </Card>

         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">Video hàng đầu</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">Số lượt xem • 28 ngày qua</p>
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
               <Button variant="link" size="sm" className="text-blue-500 font-bold p-0 uppercase text-xs mt-2">Xem thêm</Button>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

const ShortsContentSection = ({ data }: { data: any }) => {
  const hasShorts = data.contentBreakdown.views.shorts > 0 || data.contentBreakdown.shorts.topShorts.length > 0;

  if (!hasShorts) {
    return (
      <div className="py-20 text-center border rounded-xl bg-white dark:bg-neutral-900 flex flex-col items-center justify-center space-y-4">
        <div className="size-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
           <PlayCircleIcon className="size-10 text-muted-foreground opacity-20" />
        </div>
        <div className="space-y-1">
           <p className="font-bold text-lg">Chưa có dữ liệu cho Shorts</p>
           <p className="text-sm text-muted-foreground">Hãy đăng video ngắn để bắt đầu theo dõi hiệu suất</p>
        </div>
        <Button variant="secondary" className="rounded-full font-bold h-9 px-6 bg-neutral-100 dark:bg-neutral-800 border-none">
           Tạo Shorts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TỔNG QUAN SHORTS METRICS */}
      <Card className="rounded-xl shadow-sm border-none bg-white dark:bg-neutral-900 overflow-hidden">
         <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-x dark:divide-neutral-800">
            {[
              { label: "Số lượt xem", val: data.contentBreakdown.views.shorts, sub: "Giảm 74% so với 28 ngày trước" },
              { label: "Lượt xem có chủ đích", val: data.contentBreakdown.shorts.intentionalViews, sub: "Giảm 69% so với 28 ngày trước" },
              { label: "Số lượt thích", val: data.contentBreakdown.shorts.likes, sub: "Tăng 100% so với 28 ngày trước" },
              { label: "Số người đăng ký", val: data.contentBreakdown.subscribers.shorts, sub: "—" },
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
                  Xem thêm
               </Button>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* CÁCH TÌM THẤY VIDEO NGẮN */}
         <Card className="rounded-xl shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-bold">Cách người xem tìm thấy video ngắn của bạn</CardTitle>
               <p className="text-[10px] text-muted-foreground font-bold uppercase">Lượt xem • 28 ngày qua</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex flex-wrap gap-2">
                  {["Tổng quan", "Bên ngoài", "YouTube Tìm kiếm", "Video đề xuất"].map((t, i) => (
                    <Button key={i} variant={i === 0 ? "default" : "secondary"} size="sm" className="text-[10px] h-7 px-3 rounded-lg font-bold">
                       {t}
                    </Button>
                  ))}
               </div>
               <div className="space-y-4 pt-4">
                  {[
                    { label: "YouTube Tìm kiếm", percentage: 86.7 },
                    { label: "Các tính năng khác của YouTube", percentage: 13.3 },
                    { label: "Trực tiếp hoặc không xác định", percentage: 0.0 },
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
                  Xem thêm
               </Button>
            </CardContent>
         </Card>

         <div className="space-y-6">
            {/* MỨC ĐỘ TƯƠNG TÁC */}
            <Card className="rounded-xl shadow-sm">
               <CardHeader>
                  <CardTitle className="text-base font-bold">Mức độ tương tác của người xem</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">28 ngày qua</p>
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
                           <p className="text-[10px] text-muted-foreground">Ở lại xem</p>
                        </div>
                        <div className="space-y-1 text-right">
                           <p className="font-bold">{data.contentBreakdown.shorts.swipePercent.toFixed(1)}%</p>
                           <p className="text-[10px] text-muted-foreground">Bỏ qua</p>
                        </div>
                     </div>
                  </div>
                  <Button variant="secondary" size="sm" className="text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 h-8">
                     Xem thêm
                  </Button>
               </CardContent>
            </Card>

            {/* VIDEO SHORTS HÀNG ĐẦU */}
            <Card className="rounded-xl shadow-sm">
               <CardHeader>
                  <CardTitle className="text-base font-bold">Video Shorts hàng đầu</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Số lượt xem • 28 ngày qua</p>
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
                     Xem thêm
                  </Button>
               </CardContent>
            </Card>

            {/* PHỐI LẠI */}
            <Card className="rounded-xl shadow-sm">
               <CardHeader>
                  <CardTitle className="text-base font-bold">Nội dung được phối lại nhiều nhất</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">28 ngày qua</p>
               </CardHeader>
               <CardContent className="py-8 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">Chưa có đủ dữ liệu phối lại</p>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
};

const PostsContentSection = ({ data }: { data: any }) => {
  const [activePostType, setActivePostType] = useState<"image" | "poll" | "question" | "text" | "video">("image");

  const postTypes = [
    { id: "image", label: "Hình ảnh", icon: ImageIcon },
    { id: "poll", label: "Cuộc thăm dò ý kiến", icon: BarChart2Icon },
    { id: "question", label: "Câu hỏi", icon: MessageCircleIcon },
    { id: "text", label: "Văn bản", icon: TypeIcon },
    { id: "video", label: "Video", icon: PlayIcon },
  ];

  const filteredPosts = data.contentBreakdown.postsBreakdown.topPosts.filter((p: any) => p.type === activePostType);
  const activeTypeInfo = postTypes.find(t => t.id === activePostType);
  const ActiveIcon = activeTypeInfo?.icon || ImageIcon;

  return (
    <div className="space-y-6">
      {/* TỔNG QUAN BÀI ĐĂNG METRICS */}
      <Card className="rounded-xl shadow-sm border-none bg-white dark:bg-neutral-900 overflow-hidden">
         <div className="grid grid-cols-1 md:grid-cols-3 border-b divide-x dark:divide-neutral-800">
            {[
              { label: "Số lượt hiển thị hình thu nhỏ", val: data.contentBreakdown.postsBreakdown.impressions, sub: "" },
              { label: "Số lượt thích", val: data.contentBreakdown.postsBreakdown.likes, sub: "—" },
              { label: "Số người đăng ký", val: data.contentBreakdown.postsBreakdown.subscribers, sub: "—" },
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
                  Xem thêm
               </Button>
            </div>
         </CardContent>
      </Card>

      {/* BÀI ĐĂNG HÀNG ĐẦU */}
      <Card className="rounded-xl shadow-sm">
         <CardHeader>
            <CardTitle className="text-base font-bold">Bài đăng hàng đầu</CardTitle>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">28 ngày qua</p>
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
                            <p className="text-xs truncate font-medium">{p.content || "Không có nội dung văn bản"}</p>
                            <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(p.createdAt), { locale: vi, addSuffix: true })}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-x-8">
                         <div className="text-center">
                            <p className="text-xs font-bold">{p.likeCount}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Lượt thích</p>
                         </div>
                         <div className="text-center">
                            <p className="text-xs font-bold">{p.commentCount}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Bình luận</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-50">
                 <ImageIcon className="size-10 text-muted-foreground" />
                 <p className="text-xs font-medium">Không có dữ liệu để hiển thị cho những ngày này</p>
              </div>
            )}

            <Button variant="secondary" size="sm" className="text-xs font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 border-none px-4 h-8 mt-2">
               Xem thêm
            </Button>
         </CardContent>
      </Card>
    </div>
  );
};

const ContentTab = () => {
  const [data] = trpc.studio.getAnalytics.useSuspenseQuery();
  const [activeSubTab, setActiveSubTab] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-x-2">
        {["all", "video", "shorts", "posts"].map((t) => (
          <Button 
            key={t}
            variant={activeSubTab === t ? "default" : "secondary"} 
            size="sm" 
            className="rounded-lg h-8 px-4 font-bold"
            onClick={() => setActiveSubTab(t)}
          >
            {t === "all" ? "Tất cả" : t === "video" ? "Video" : t === "shorts" ? "Shorts" : "Bài đăng"}
          </Button>
        ))}
      </div>

      {activeSubTab === "all" && <AllContentSection data={data} />}
      {activeSubTab === "video" && <VideoContentSection data={data} />}
      {activeSubTab === "shorts" && <ShortsContentSection data={data} />}
      {activeSubTab === "posts" && <PostsContentSection data={data} />}
    </div>
  );
};

const AnalyticsContent = () => {
  const [data] = trpc.studio.getAnalytics.useSuspenseQuery();
  const [activeStat, setActiveStat] = useState<"views" | "watchTime" | "subscribers">("views");

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* CỘT TRÁI - CHI TIẾT */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold">Kênh của bạn có {data.totalViews} lượt xem trong 28 ngày qua</h2>
        </div>

        {/* THẺ CHỈ SỐ LỚN */}
        <div className="grid grid-cols-1 md:grid-cols-3 bg-white dark:bg-neutral-900 border rounded-xl overflow-hidden shadow-sm">
          <div 
            className={cn(
              "p-6 cursor-pointer border-r transition-colors flex flex-col items-center",
              activeStat === "views" ? "bg-neutral-50 dark:bg-neutral-800 border-b-2 border-b-primary" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
            )}
            onClick={() => setActiveStat("views")}
          >
             <p className="text-[11px] text-muted-foreground uppercase font-bold mb-1">Số lượt xem</p>
             <div className="flex items-center gap-x-2">
                <span className="text-2xl font-bold">{data.totalViews}</span>
                <div className="size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUpIcon className="size-3 text-emerald-600" />
                </div>
             </div>
             <p className="text-[10px] text-muted-foreground mt-1">Như bình thường</p>
          </div>

          <div 
             className={cn(
               "p-6 cursor-pointer border-r transition-colors flex flex-col items-center",
               activeStat === "watchTime" ? "bg-neutral-50 dark:bg-neutral-800 border-b-2 border-b-primary" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
             )}
             onClick={() => setActiveStat("watchTime")}
          >
             <p className="text-[11px] text-muted-foreground uppercase font-bold mb-1">Thời gian xem (giờ)</p>
             <div className="flex items-center gap-x-2">
                <span className="text-2xl font-bold">{data.totalWatchTimeHours}</span>
                <InfoIcon className="size-3 text-muted-foreground" />
             </div>
             <p className="text-[10px] text-muted-foreground mt-1">Dựa trên tiến trình xem</p>
          </div>

          <div 
             className={cn(
               "p-6 cursor-pointer transition-colors flex flex-col items-center",
               activeStat === "subscribers" ? "bg-neutral-50 dark:bg-neutral-800 border-b-2 border-b-primary" : "hover:bg-neutral-50 dark:hover:hover:bg-neutral-800"
             )}
             onClick={() => setActiveStat("subscribers")}
          >
             <p className="text-[11px] text-muted-foreground uppercase font-bold mb-1">Số người đăng ký</p>
             <div className="flex items-center gap-x-2">
                <span className="text-2xl font-bold">—</span>
             </div>
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
               <Button variant="link" size="sm" className="text-blue-500 font-bold p-0 uppercase text-xs">
                  Xem thêm
               </Button>
            </div>
          </CardContent>
        </Card>

        {/* NỘI DUNG HÀNG ĐẦU TABLE */}
        <div className="space-y-4">
           <h3 className="text-base font-bold">Nội dung hàng đầu trong khoảng thời gian này</h3>
           <div className="bg-white dark:bg-neutral-900 border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                 <thead className="text-[11px] text-muted-foreground uppercase bg-neutral-50/50 dark:bg-neutral-800/50">
                    <tr>
                       <th className="px-6 py-3 font-bold">Nội dung</th>
                       <th className="px-6 py-3 font-bold text-center">Thời lượng xem trung bình</th>
                       <th className="px-6 py-3 font-bold text-right">Số lượt xem</th>
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

      {/* CỘT PHẢI - THỜI GIAN THỰC */}
      <div className="w-full xl:w-[350px] space-y-6">
        <Card className="rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              Thời gian thực
              <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Đang cập nhật theo thời gian thực</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
               <div className="text-3xl font-bold">{data.totalSubscribers}</div>
               <p className="text-[11px] text-muted-foreground">Số người đăng ký</p>
            </div>
            <Button variant="outline" className="w-full text-xs font-bold h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none">
               Xem số người đăng ký trực tiếp
            </Button>
            
            <div className="pt-4 border-t">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">3</span>
                  <span className="text-[10px] text-muted-foreground">Số lượt xem • 48 giờ qua</span>
               </div>
               {/* BAR CHART REALTIME */}
               <div className="h-16 w-full flex items-end gap-x-0.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500 transition-colors rounded-t-sm" 
                      style={{ height: `${Math.random() * 80 + 10}%` }}
                    />
                  ))}
               </div>
               <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>48 giờ trước</span>
                  <span className="font-bold">Ngay bây giờ</span>
               </div>
            </div>

            <div className="pt-4 space-y-2">
               <div className="flex justify-between text-[11px] text-muted-foreground font-bold uppercase">
                  <span>Nội dung hàng đầu</span>
                  <span>Số lượt xem</span>
               </div>
               {data.topVideos.slice(0, 3).map((v) => (
                 <div key={v.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-x-2 min-w-0">
                       <div className="size-8 bg-neutral-100 dark:bg-neutral-800 rounded shrink-0 overflow-hidden">
                          <img src={v.thumbnailUrl || "/fallback.jpg"} alt={v.title} className="object-cover w-full h-full" />
                       </div>
                       <span className="text-xs truncate group-hover:text-blue-500 transition-colors">{v.title}</span>
                    </div>
                    <span className="text-xs font-bold ml-2">{Math.floor(v.viewsCount / 10) || 1}</span>
                 </div>
               ))}
            </div>

            <Button variant="link" size="sm" className="w-full text-blue-500 font-bold p-0 uppercase text-xs mt-2">
                Xem thêm
            </Button>
          </CardContent>
        </Card>

        {/* NỘI DUNG MỚI NHẤT */}
        {data.latestVideo && (
           <Card className="rounded-xl shadow-sm overflow-hidden border-none bg-neutral-900 text-white">
              <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-bold">Nội dung mới nhất</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="aspect-video relative rounded-md overflow-hidden bg-neutral-800">
                    <img src={data.latestVideo.thumbnailUrl || "/fallback.jpg"} alt="Latest" className="w-full h-full object-cover" />
                 </div>
                 <p className="text-xs font-bold line-clamp-2">{data.latestVideo.title}</p>
                 <p className="text-[10px] text-neutral-400">{data.latestVideo.timeSincePosted} đầu tiên</p>
                 
                 <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="flex justify-between items-center text-[11px]">
                       <span className="text-neutral-400">Số lượt xem</span>
                       <span className="font-bold">{data.latestVideo.viewsCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                       <span className="text-neutral-400">Tỷ lệ xem trung bình</span>
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

const AudienceTab = () => {
  const [data] = trpc.studio.getAnalytics.useSuspenseQuery();
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
               <p className="text-[11px] text-muted-foreground font-medium mb-1">Khán giả hàng tháng</p>
               <p className="text-xl font-bold">{data.audience.uniqueViewers}</p>
            </div>
            <div 
              className={cn(
                "p-4 cursor-pointer transition-colors flex flex-col items-center justify-center text-center border-l dark:border-neutral-800",
                activeStat === "subscribers" ? "bg-neutral-50 dark:bg-neutral-800/50 border-b-2 border-b-black dark:border-b-white" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-b-2 border-b-transparent"
              )}
              onClick={() => setActiveStat("subscribers")}
            >
               <p className="text-[11px] text-muted-foreground font-medium mb-1">Số người đăng ký</p>
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
                  Xem thêm
               </Button>
            </div>
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Khán giả phân theo hành vi xem */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Khán giả phân theo hành vi xem</CardTitle>
               <p className="text-[10px] text-muted-foreground">Khán giả hàng tháng • 9 thg 5, 2026</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-xs text-muted-foreground mt-4 mb-8">Không đủ dữ liệu về người xem để hiện báo cáo này</p>
               <Button variant="secondary" size="sm" className="text-[10px] font-bold rounded-full bg-neutral-200/50 dark:bg-neutral-800 border-none px-4 h-7 mt-4">
                  Xem thêm
               </Button>
            </CardContent>
         </Card>

         {/* Phổ biến với nhiều đối tượng người xem */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Phổ biến với nhiều đối tượng người xem</CardTitle>
               <p className="text-[10px] text-muted-foreground">Số lượt xem • 28 ngày qua</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex gap-x-2">
                  {["Mới", "Thông thường", "Thường xuyên"].map((t, i) => (
                    <Button key={i} variant={i === 0 ? "secondary" : "ghost"} size="sm" className={cn("text-[10px] h-7 px-3 rounded-lg font-bold border", i === 0 ? "bg-black text-white dark:bg-white dark:text-black" : "border-neutral-300 dark:border-neutral-700")}>
                       {t}
                    </Button>
                  ))}
               </div>
               <p className="text-xs text-muted-foreground mt-4">Không có dữ liệu để hiển thị cho những ngày này</p>
            </CardContent>
         </Card>

         {/* Thời điểm khán giả xem YouTube */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Thời điểm khán giả xem YouTube</CardTitle>
               <p className="text-[10px] text-muted-foreground">Giờ địa phương (GMT +0700) • 28 ngày qua</p>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground mt-4 mb-4">Không đủ dữ liệu về người xem để hiện báo cáo này</p>
            </CardContent>
         </Card>

         {/* Kênh mà khán giả xem */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Kênh mà khán giả xem</CardTitle>
               <p className="text-[10px] text-muted-foreground">28 ngày qua</p>
            </CardHeader>
            <CardContent>
               <p className="text-[11px] text-muted-foreground mt-4 mb-4">
                 Không có đủ dữ liệu hợp lệ về khán giả để hiển thị báo cáo này. <span className="text-blue-500 cursor-pointer hover:underline">Tìm hiểu thêm</span>
               </p>
            </CardContent>
         </Card>

         {/* Thời gian xem từ người đăng ký */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Thời gian xem từ người đăng ký</CardTitle>
               <p className="text-[10px] text-muted-foreground">Thời gian xem • 28 ngày qua</p>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-[11px] font-bold items-center">
                     <span>Chưa đăng ký</span>
                     <div className="flex items-center gap-x-3 w-1/2 justify-end">
                       <div className="h-1.5 bg-[#c084fc] rounded-full" style={{ width: `${Math.max(data.audience.unsubscribedPercent, 1)}%` }} />
                       <span className="w-8 text-right">{data.audience.unsubscribedPercent.toFixed(1).replace(".", ",")}%</span>
                     </div>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold items-center">
                     <span>Đã đăng ký</span>
                     <div className="flex items-center gap-x-3 w-1/2 justify-end">
                       <div className="h-1.5 bg-[#c084fc] rounded-full" style={{ width: `${Math.max(data.audience.subscribedPercent, 1)}%` }} />
                       <span className="w-8 text-right">{data.audience.subscribedPercent.toFixed(1).replace(".", ",")}%</span>
                     </div>
                  </div>
               </div>
               <Button variant="secondary" size="sm" className="text-[10px] font-bold rounded-full bg-neutral-200/50 dark:bg-neutral-800 border-none px-4 h-7 mt-6">
                  Xem thêm
               </Button>
            </CardContent>
         </Card>

         {/* Nội dung khán giả của bạn xem */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Nội dung khán giả của bạn xem</CardTitle>
               <p className="text-[10px] text-muted-foreground">7 ngày qua</p>
            </CardHeader>
            <CardContent>
               <p className="text-[11px] text-muted-foreground mt-4 mb-4">
                 Không có đủ dữ liệu hợp lệ về khán giả để hiển thị báo cáo này. <span className="text-blue-500 cursor-pointer hover:underline">Tìm hiểu thêm</span>
               </p>
            </CardContent>
         </Card>

         {/* Định dạng */}
         <Card className="rounded-xl shadow-sm bg-transparent border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold">Các định dạng mà khán giả của bạn xem trên YouTube</CardTitle>
               <p className="text-[10px] text-muted-foreground">28 ngày qua</p>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground mt-4 mb-4">Không đủ dữ liệu để hiện báo cáo này.</p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

export const AnalyticsView = () => {
  return (
    <div className="flex flex-col gap-y-4 p-4 lg:p-8 bg-neutral-50 dark:bg-black min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Số liệu phân tích về kênh</h1>
        <div className="flex items-center gap-x-2">
           <Button variant="outline" size="sm" className="bg-white dark:bg-neutral-900">
              Chế độ nâng cao
           </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="flex items-center justify-between border-b mb-4">
          <TabsList className="bg-transparent h-auto p-0 gap-x-8">
            {["overview", "content", "audience", "trending"].map((t) => (
              <TabsTrigger 
                key={t}
                value={t} 
                className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent data-[state=active]:bg-transparent font-medium capitalize"
              >
                {t === "overview" ? "Tổng quan" : t === "content" ? "Nội dung" : t === "audience" ? "Đối tượng người xem" : "Xu hướng"}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
             <span>12 thg 4 – 9 thg 5, 2026</span>
             <span className="font-bold">28 ngày qua</span>
             <ChevronDownIcon className="size-4" />
          </div>
        </div>

        <TabsContent value="overview" className="mt-0 outline-none">
          <Suspense fallback={<AnalyticsLoading />}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <AnalyticsContent />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        <TabsContent value="content" className="mt-0 outline-none">
          <Suspense fallback={<AnalyticsLoading />}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <ContentTab />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        <TabsContent value="audience" className="mt-0 outline-none">
          <Suspense fallback={<AnalyticsLoading />}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <AudienceTab />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};
