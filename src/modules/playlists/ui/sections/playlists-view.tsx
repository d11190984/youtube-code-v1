"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";

export const PlaylistsView = () => {
  const router = useRouter();

  const { data, isLoading } = trpc.playlists.getMixPlaylists.useQuery();

  if (isLoading) {
    return <p className="p-4">Đang tải...</p>;
  }

  if (!data || data.length === 0) {
    return <p className="p-4">Không có danh sách</p>;
  }

  return (
    <div className="px-4 mt-4">
      {/* Title */}
      <h2 className="text-lg font-semibold mb-4">Danh sách kết hợp</h2>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {data.map((playlist) => {
          const firstVideo = playlist.videos?.[0];

          // 🔥 FIX: đảm bảo luôn có số đúng
          const videoCount =
            playlist.videoCount ?? playlist.videos?.length ?? 0;

          return (
            <div
              key={playlist.id}
              onClick={() => {
                if (firstVideo?.id) {
                  router.push(
                    `/videos/${firstVideo.id}?list=${playlist.id}&index=0`,
                  );
                }
              }}
              className="cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <img
                  src={playlist.thumbnail || "/placeholder.jpg"}
                  alt={playlist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 transition">
                  ▶ {videoCount} video
                </div>
              </div>

              {/* Title */}
              <p className="mt-2 text-sm font-semibold line-clamp-2">
                {playlist.name}
              </p>

              {/* Sub text */}
              <p className="text-xs text-muted-foreground">Danh sách kết hợp</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
