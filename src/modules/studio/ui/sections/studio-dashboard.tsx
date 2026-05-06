"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/trpc/client";
import { EyeIcon, ThumbsUpIcon, MessageCircleIcon } from "lucide-react";

export const StudioDashboard = () => {
  const { data, isLoading } = trpc.studio.getMany.useQuery({ limit: 10 });
  const { data: statsData } = trpc.studio.getStats.useQuery();

  if (isLoading) return <div>Đang tải số liệu...</div>;
  if (!data || !data.items || data.items.length === 0)
    return <div>Không có dữ liệu video</div>;

  // Video mới nhất
  const latestVideo = data.items[0];

  // Tổng lượt xem
  const totalViews = data.items.reduce(
    (acc, v) => acc + (v.viewsCount || 0),
    0,
  );

  // Tỷ lệ xem trung bình cho video mới nhất
  const averageViewPercent = latestVideo.averageViewPercent ?? 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-screen">
      {/* Card video mới nhất */}
      <Card className="w-full lg:w-[450px] lg:h-[500px] shadow-md rounded-lg flex-shrink-0">
        <CardHeader>
          <CardTitle>Hiệu suất video ngắn mới nhất trên YouTube</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-2">
          {/* Thumbnail + Title */}
          <div className="flex gap-4 items-start">
            <img
              src={latestVideo.thumbnailUrl || "/fallback-thumbnail.jpg"}
              alt={latestVideo.title || "Video"}
              className="w-40 h-24 rounded object-cover"
            />
            <div className="flex-1 flex flex-col justify-between">
              <div className="font-semibold line-clamp-2">
                {latestVideo.title || "Không có tiêu đề"}
              </div>
            </div>
          </div>

          {/* Stats chi tiết: mỗi chỉ số xuống dòng */}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
            <div className="flex flex-col">
              <span className="text-gray-400">Số lượt xem</span>
              <span className="flex items-center gap-1 font-medium">
                <EyeIcon className="w-4 h-4" /> {latestVideo.viewsCount || 0}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400">Tỷ lệ xem trung bình</span>
              <span className="font-medium">{averageViewPercent}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400">Số lượt thích</span>
              <span className="flex items-center gap-1 font-medium">
                <ThumbsUpIcon className="w-4 h-4" />{" "}
                {latestVideo.likeCount || 0}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400">Số bình luận</span>
              <span className="flex items-center gap-1 font-medium">
                <MessageCircleIcon className="w-4 h-4" />{" "}
                {latestVideo.commentCount || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column bên phải: Tổng quan + Bình luận + Người đăng ký */}
      <div className="flex flex-col gap-6 w-full lg:max-w-[400px]">
        {/* Card tổng quan kênh */}
        <Card className="shadow-md rounded-lg flex-1">
          <CardHeader>
            <CardTitle>Số liệu phân tích về kênh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {/* Số người đăng ký hiện tại */}
            <div className="text-lg font-bold">Số người đăng ký hiện tại:</div>
            <div className="text-3xl font-extrabold mb-2">
              {statsData?.totalSubscribers || 0}
            </div>

            <hr className="border-t border-gray-300 my-2" />

            {/* Tóm tắt 28 ngày qua */}
            <div className="font-semibold">Tóm tắt (28 ngày qua)</div>
            <div className="ml-2">
              <div>Số lượt xem: {totalViews}</div>
              <div>Thời gian xem (giờ): {(totalViews / 60).toFixed(1)}</div>
            </div>

            <hr className="border-t border-gray-300 my-2" />

            {/* Nội dung hàng đầu */}
            <div className="font-semibold">Nội dung hàng đầu (48 giờ qua)</div>
            {latestVideo && (
              <div className="ml-2 line-clamp-1">
                {latestVideo.title} · {latestVideo.viewsCount || 0} lượt xem
              </div>
            )}

            <button className="mt-4 w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-400">
              Chuyển đến số liệu phân tích
            </button>
          </CardContent>
        </Card>

        {/* Card Bình luận */}
        <Card className="shadow-md rounded-lg flex-1">
          <CardHeader>
            <CardTitle>Bình luận</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm max-h-72 overflow-auto">
            {statsData?.latestComments?.map((c: any) => (
              <div
                key={c.id}
                className="flex gap-3 items-start p-2 border-b last:border-b-0"
              >
                {/* Thumbnail video */}
                <img
                  src={c.videoThumbnail || "/fallback-thumbnail.jpg"}
                  alt={c.videoTitle || "Video"}
                  className="w-14 h-14 rounded object-cover flex-shrink-0"
                />

                <div className="flex-1 flex flex-col gap-1">
                  {/* Tên video */}
                  <span className="text-xs font-semibold text-gray-600 line-clamp-1">
                    {c.videoTitle || "Không có tiêu đề"}
                  </span>

                  {/* User info + comment */}
                  <div className="flex items-start gap-2">
                    <img
                      src={c.userAvatar}
                      alt={c.userName}
                      className="w-6 h-6 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{c.userName}</span>
                      <p className="text-gray-700 mt-0.5">{c.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card Người đăng ký gần đây */}
        <Card className="shadow-md rounded-lg flex-1">
          <CardHeader>
            <CardTitle>Người đăng ký gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm max-h-60 overflow-auto">
            {statsData?.recentSubscribers?.map((s: any) => (
              <div key={s.viewerId} className="flex items-center gap-2">
                <img
                  src={s.avatarUrl}
                  alt={s.name}
                  className="w-6 h-6 rounded-full"
                />
                <div>{s.name}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
