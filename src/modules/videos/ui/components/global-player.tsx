"use client";

import { XIcon, Maximize2Icon, MinusIcon, ChevronRightIcon, ListVideoIcon } from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";
import { usePlayerStore } from "@/modules/videos/store/use-player-store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    removeFromQueue
  } = usePlayerStore();

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
        "fixed bottom-4 right-4 z-[100] transition-all duration-300 ease-in-out shadow-2xl rounded-xl overflow-hidden bg-background border border-border",
        isMinimized ? "w-[300px] sm:w-[400px]" : "w-full max-w-[800px] aspect-video"
      )}
    >
      {/* Header / Controls */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-end px-2 gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
        >
          {isMinimized ? <Maximize2Icon className="size-4" /> : <MinusIcon className="size-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 text-white hover:bg-white/20 underline decoration-white"
          onClick={() => {
            router.push(`/videos/${activeVideo.id}`);
            maximize();
          }}
        >
          <Maximize2Icon className="size-4" />
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

      <div className="group relative w-full aspect-video flex">
        {/* Video Player */}
        <div className="flex-1 bg-black">
          <MuxPlayer
            playbackId={activeVideo.playbackId || ""}
            streamType="on-demand"
            autoPlay
            className="w-full h-full"
            accentColor="#FF2056"
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
