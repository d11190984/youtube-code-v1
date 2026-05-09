"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Wand2Icon, ImageIcon, UserCircleIcon, LinkIcon, PlusIcon, Trash2Icon, CopyIcon } from "lucide-react";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { BannerUploadModal } from "@/modules/users/ui/components/banner-upload-modal";

export const CustomizationView = () => {
  const [user] = trpc.users.getCurrent.useSuspenseQuery();
  const utils = trpc.useUtils();

  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle || "");
  const [bio, setBio] = useState(user.bio || "");
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const updateChannel = trpc.users.updateChannel.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật kênh!");
      utils.users.getCurrent.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    updateChannel.mutate({
      name,
      handle,
      bio,
    });
  };

  const hasChanges = name !== user.name || handle !== (user.handle || "") || bio !== (user.bio || "");

  return (
    <div className="flex flex-col gap-y-6 w-full max-w-5xl mx-auto px-4 py-8">
      <BannerUploadModal
        userId={user.id}
        open={isBannerModalOpen}
        onOpenChange={setIsBannerModalOpen}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tùy chỉnh kênh</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="font-bold text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
            <Link href={`/users/${user.id}`} target="_blank">
              Xem kênh
            </Link>
          </Button>
          <Button variant="ghost" disabled={!hasChanges} onClick={() => {
            setName(user.name);
            setHandle(user.handle || "");
            setBio(user.bio || "");
          }}>Hủy</Button>
          <Button 
            disabled={!hasChanges || updateChannel.isPending} 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md px-6"
          >
            Xuất bản
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-8">
          <TabsTrigger 
            value="profile" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-bold text-sm"
          >
            Hồ sơ
          </TabsTrigger>
          <TabsTrigger 
            value="branding" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-bold text-sm"
          >
            Xây dựng thương hiệu
          </TabsTrigger>
          <TabsTrigger 
            value="home" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-bold text-sm"
          >
            Thẻ Trang chủ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-6 space-y-8">
          {/* Section: Name */}
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-base font-bold">Tên</h3>
            <p className="text-sm text-muted-foreground">Chọn tên kênh thể hiện cá tính và nội dung của bạn. Những thay đổi về tên và hình đại diện của bạn chỉ xuất hiện trên YouTube.</p>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
            />
          </div>

          {/* Section: Handle */}
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-base font-bold">Tên người dùng</h3>
            <p className="text-sm text-muted-foreground">Tên người dùng là một tên độc nhất bắt đầu bằng ký tự @. Bạn có thể đổi tên người dùng hai lần trong vòng 14 ngày.</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input 
                value={handle} 
                onChange={(e) => setHandle(e.target.value)}
                className="pl-8 bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                placeholder="ten-nguoi-dung"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">https://youtube-code-v1.vercel.app/@{handle || "ten-nguoi-dung"}</p>
          </div>

          {/* Section: Bio */}
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-base font-bold">Thông tin mô tả</h3>
            <p className="text-sm text-muted-foreground">Giới thiệu với người xem về kênh của bạn. Nội dung mô tả sẽ xuất hiện trong phần Giới thiệu kênh.</p>
            <Textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[150px] bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
              placeholder="Kể cho người xem về kênh của bạn..."
            />
          </div>

          {/* Section: Links (Static placeholder for now) */}
          <div className="space-y-4 max-w-3xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold">Đường liên kết</h3>
              <p className="text-sm text-muted-foreground">Chia sẻ đường liên kết bên ngoài với người xem.</p>
            </div>
            
            <Button variant="outline" className="rounded-full gap-2 text-blue-500 font-bold border-none hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <PlusIcon className="size-5" />
              Thêm đường liên kết
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="pt-6 space-y-10">
          {/* Avatar Upload */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-48 h-48 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border">
              <UserAvatar 
                imageUrl={user.imageUrl} 
                name={user.name} 
                className="w-full h-full"
              />
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="text-base font-bold">Ảnh</h3>
              <p className="text-sm text-muted-foreground">Ảnh hồ sơ sẽ xuất hiện cùng với kênh của bạn trên YouTube tại những vị trí như bên cạnh bình luận và video của bạn.</p>
              <div className="flex gap-4 pt-2">
                <Button variant="ghost" className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30">Thay đổi</Button>
                <Button variant="ghost" className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30">Xóa</Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Banner Upload */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-[320px] aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex flex-col items-center justify-center overflow-hidden flex-shrink-0 border relative">
              {user.bannerUrl ? (
                <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="size-12 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="text-base font-bold">Hình ảnh biểu ngữ</h3>
              <p className="text-sm text-muted-foreground">Hình ảnh này sẽ xuất hiện ở phần đầu kênh của bạn. Để hình ảnh đạt chất lượng cao nhất trên mọi thiết bị, hãy dùng ảnh có độ phân giải ít nhất 2048 x 1152 pixel.</p>
              <div className="flex gap-4 pt-2">
                <Button 
                  variant="ghost" 
                  className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  onClick={() => setIsBannerModalOpen(true)}
                >
                  Thay đổi
                </Button>
                {user.bannerUrl && (
                  <Button variant="ghost" className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30">Xóa</Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="home" className="pt-6">
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed rounded-xl border-neutral-200 dark:border-neutral-800">
             <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full">
                <Wand2Icon className="size-8 text-muted-foreground" />
             </div>
             <div className="space-y-1">
                <p className="font-bold">Sắp xếp bố cục Trang chủ của bạn</p>
                <p className="text-sm text-muted-foreground max-w-md">Thêm video nổi bật, danh sách phát hoặc các mục khác để giới thiệu nội dung tốt nhất của bạn.</p>
             </div>
             <Button className="rounded-full font-bold">Thêm mục</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
