"use client";

import { XIcon, Maximize2Icon, MinusIcon, ChevronRightIcon, ListVideoIcon, Minimize2Icon, ExternalLinkIcon } from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";
import { usePlayerStore } from "@/modules/videos/store/use-player-store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const GlobalPlayer = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    activeVideo, 
    isOpen, 
    isMinimized, 
    close, 
    minimize, 
    maximize,
    queue,
    playNext,
    removeFromQueue,
    currentTime,
    setCurrentTime
  } = usePlayerStore();

  const playerRef = useRef<any>(null);

  const [showQueue, setShowQueue] = useState(false);

  // Auto-minimize when navigating away from video page
  useEffect(() => {
    const isVideoPage = pathname.includes("/videos/");
    if (!isVideoPage && isOpen && !isMinimized) {
      minimize();
    }
  }, [pathname, isOpen, isMinimized, minimize]);

  if (!isOpen || !activeVideo) return null;

  // Don't show global player if we are on the video page and NOT minimized
  const isVideoPage = pathname.includes(`/videos/${activeVideo.id}`);
  if (isVideoPage && !isMinimized) return null;

  return (
    <div 
      className={cn(
        "group fixed z-[9999] transition-all duration-300 ease-in-out shadow-2xl rounded-xl overflow-hidden bg-background border border-border",
        "bottom-4 right-4", // Desktop
        "max-sm:bottom-[80px] max-sm:right-2 max-sm:left-2", // Mobile (above bottom bar)
        isMinimized ? "w-[280px] sm:w-[400px] ml-auto" : "w-[calc(100%-1rem)] sm:max-w-[800px] aspect-video"
      )}
    >
      {/* Header / Controls */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-end px-2 gap-1 z-10 transition-opacity",
        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      )}>
         <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 text-white hover:bg-white/20"
          onClick={() => setShowQueue(!showQueue)}
        >
          <ListVideoIcon className="size-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 text-white hover:bg-white/20"
          onClick={() => isMinimized ? maximize() : minimize()}
          title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
        >
          {isMinimized ? <Maximize2Icon className="size-4" /> : <Minimize2Icon className="size-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 text-white hover:bg-white/20"
          onClick={() => {
            router.push(`/videos/${activeVideo.id}`);
            maximize();
          }}
          title="Xem trang video"
        >
          <ExternalLinkIcon className="size-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 text-white hover:bg-white/20"
          onClick={close}
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      <div className="relative w-full aspect-video flex">
        {/* Video Player */}
        <div className="flex-1 bg-black">
          <MuxPlayer
            ref={playerRef}
            playbackId={activeVideo.playbackId || ""}
            streamType="on-demand"
            autoPlay
            startTime={currentTime}
            className="w-full h-full"
            accentColor="#FF2056"
            onTimeUpdate={(e) => {
              const player = playerRef.current;
              if (player) {
                setCurrentTime(Math.floor(player.currentTime));
              }
            }}
            onEnded={() => {
              if (queue.length > 0) {
                playNext();
              } else {
                close();
              }
            }}
          />
        </div>

        {/* Queue Panel (Only if expanded and requested) */}
        {!isMinimized && showQueue && (
          <div className="w-[300px] bg-background border-l border-border flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-sm">Danh sách chờ ({queue.length})</span>
              <Button variant="ghost" size="icon" className="size-6" onClick={() => setShowQueue(false)}>
                <XIcon className="size-3" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 grid gap-2">
                {queue.map((video, index) => (
                  <div key={video.id} className="flex gap-2 p-1 hover:bg-muted rounded-lg group/item relative">
                    <img src={video.thumbnailUrl} className="w-20 aspect-video rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{video.title}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-6 opacity-0 group-hover/item:opacity-100"
                      onClick={() => removeFromQueue(video.id)}
                    >
                      <XIcon className="size-3" />
                    </Button>
                  </div>
                ))}
                {queue.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-10">Hàng chờ trống</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Info Bar (Only when minimized) */}
      {isMinimized && (
        <div className="p-3 bg-background flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{activeVideo.title}</p>
            <p className="text-xs text-muted-foreground truncate">Đang phát</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 rounded-full"
            onClick={() => router.push(`/videos/${activeVideo.id}`)}
          >
            <ChevronRightIcon className="size-5" />
          </Button>
        </div>
      )}
    </div>
  );
};
