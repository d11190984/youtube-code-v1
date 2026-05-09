import { useState } from "react";
import Link from "next/link";
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
  XIcon
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { useUpdateBio } from "@/hooks/useUpdateBio";

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
  const { userId, isLoaded } = useAuth();
  const clerk = useClerk();

  const { isPending, onClick } = useSubscription({
    userId: user.id,
    isSubscribed: user.viewerSubscribed,
  });

  const isOwner = userId === user.clerkId;
  const [bio, setBio] = useState(user.bio || "");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateBioMutation = useUpdateBio();

  const handleSave = async () => {
    if (!bio) return;
    setLoading(true);
    try {
      await updateBioMutation.mutateAsync({ bio });
      setEditing(false);
      toast.success("Đã cập nhật mô tả kênh!");
    } catch (error) {
      console.error("Lỗi khi update bio:", error);
      toast.error("Không thể cập nhật mô tả kênh.");
    }
    setLoading(false);
  };

  const handleCopyChannelLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép liên kết kênh!");
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
            <span>{user.subscriberCount} người đăng ký</span>
            <span>&bull;</span>
            <span>{user.videoCount} video</span>
          </div>

          {/* Bio / About Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <div className="group cursor-pointer mt-3 max-w-[600px]">
                 <p className="text-sm text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors flex items-center gap-1">
                    {user.bio || "Tìm hiểu thêm về kênh này"}
                    <ChevronRightIcon className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </p>
                 <span className="text-sm font-bold text-foreground">...xem thêm</span>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl border-none bg-neutral-100 dark:bg-neutral-900 p-0 overflow-hidden">
               <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                     <h2 className="text-xl font-bold">Thông tin</h2>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-1">
                        <h3 className="text-base font-bold">Mô tả</h3>
                        {isOwner && editing ? (
                           <div className="space-y-2">
                              <Textarea 
                                 value={bio} 
                                 onChange={(e) => setBio(e.target.value)}
                                 className="min-h-[100px] bg-neutral-200 dark:bg-neutral-800 border-none focus-visible:ring-1"
                                 placeholder="Nhập mô tả kênh..."
                              />
                              <div className="flex gap-2 justify-end">
                                 <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Hủy</Button>
                                 <Button size="sm" onClick={handleSave} disabled={loading}>Lưu</Button>
                              </div>
                           </div>
                        ) : (
                           <div className="relative group">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                 {user.bio || "Chưa có mô tả cho kênh này."}
                              </p>
                              {isOwner && (
                                 <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="p-0 h-auto text-blue-500 font-bold"
                                    onClick={() => setEditing(true)}
                                 >
                                    Chỉnh sửa
                                 </Button>
                              )}
                           </div>
                        )}
                     </div>

                     <div className="space-y-3">
                        <h3 className="text-base font-bold">Chi tiết về kênh</h3>
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
                              <span>{user.subscriberCount} người đăng ký</span>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <VideoIcon className="size-5 text-muted-foreground shrink-0" />
                              <span>{user.videoCount} video</span>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <TrendingUpIcon className="size-5 text-muted-foreground shrink-0" />
                              <span>{user.viewCount || 0} lượt xem</span>
                           </div>
                           <div className="flex items-center gap-3 text-sm">
                              <CalendarIcon className="size-5 text-muted-foreground shrink-0" />
                              <span>Đã tham gia {format(new Date(user.createdAt), "d 'thg' M, yyyy", { locale: vi })}</span>
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
                       Chia sẻ kênh
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
                    Tùy chỉnh kênh
                  </Link>
                </Button>
                <Button variant="secondary" asChild className="rounded-full font-bold px-6">
                  <Link prefetch href="/studio" target="_blank">
                    Quản lý video
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
          </div>
        </div>
      </div>
    </div>
  );
};
