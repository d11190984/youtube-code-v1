"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ImageIcon, 
  BarChart2, 
  ListTodo, 
  VideoIcon, 
  HelpCircle,
  X,
  Plus,
  Trash2,
  ImagePlusIcon,
  ChevronDown,
  Clock,
  Calendar,
  Globe
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PostEditorProps {
  userId: string;
}

type PollOption = {
  id: string;
  text: string;
  imageUrl?: string;
  imageKey?: string;
};

export const PostEditor = ({ userId }: PostEditorProps) => {
  const { user } = useUser();
  const utils = trpc.useUtils();
  
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState<"text" | "image" | "poll" | "video" | "question">("text");
  const [pollType, setPollType] = useState<"text" | "image">("text");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ]);
  const [selectedImages, setSelectedImages] = useState<{ url: string; key?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState("12:00 AM");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: channelUser } = trpc.users.getOne.useQuery({ id: userId });
  
  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      toast.success(isScheduling ? "Đã lên lịch bài viết!" : "Đã đăng bài viết!");
      setContent("");
      setSelectedImages([]);
      setActiveImageIndex(0);
      setPollOptions([{ id: "1", text: "" }, { id: "2", text: "" }]);
      setPostType("text");
      setIsExpanded(false);
      setIsScheduling(false);
      utils.posts.getMany.invalidate({ userId });
    },
    onError: () => {
      toast.error("Có lỗi xảy ra!");
    }
  });

  const isOwner = user?.id && channelUser?.clerkId === user.id;

  if (!isOwner || !channelUser) return null;

  const handlePost = async () => {
    if (!content.trim() && selectedImages.length === 0 && postType === "text") return;

    let scheduledAt: string | undefined;
    if (isScheduling) {
       const [hoursStr, minutesStrWithPeriod] = scheduledTime.split(":");
       const [minutesStr, period] = minutesStrWithPeriod.split(" ");
       let hours = parseInt(hoursStr);
       const minutes = parseInt(minutesStr);
       if (period === "PM" && hours < 12) hours += 12;
       if (period === "AM" && hours === 12) hours = 0;
       
       const date = new Date(scheduledDate);
       date.setHours(hours, minutes, 0, 0);
       scheduledAt = date.toISOString();
    }

    createPost.mutate({
      content,
      type: postType === "question" ? "poll" : postType,
      images: postType === "image" ? selectedImages : undefined,
      poll: (postType === "poll" || postType === "question") ? {
        type: postType === "question" ? "text" : pollType,
        options: pollOptions.map(opt => ({ text: opt.text, url: opt.imageUrl, key: opt.imageKey })),
      } : undefined,
      scheduledAt,
    });
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, optionId?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      toast.error("Chưa cấu hình Cloudinary Cloud Name trong .env");
      return;
    }

    setIsUploading(true);
    
    try {
       for (let i = 0; i < files.length; i++) {
         const formData = new FormData();
         formData.append("file", files[i]);
         formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default");
         
         const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
           method: "POST",
           body: formData,
         });
         
         const data = await response.json();

         if (!response.ok || !data.secure_url) {
            throw new Error(data.error?.message || "Lỗi khi tải ảnh lên");
         }
         
         if (optionId) {
            setPollOptions(prev => prev.map(opt => opt.id === optionId ? { ...opt, imageUrl: data.secure_url, imageKey: data.public_id } : opt));
         } else {
            setSelectedImages(prev => {
               const newImages = [...prev, { url: data.secure_url, key: data.public_id }];
               setActiveImageIndex(newImages.length - 1);
               return newImages;
            });
         }
       }
    } catch (error: any) {
       toast.error(error.message || "Lỗi khi tải ảnh lên!");
    } finally {
       setIsUploading(false);
       if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, { id: Math.random().toString(), text: "" }]);
    }
  };

  const removePollOption = (id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter(opt => opt.id !== id));
    }
  };

  const removeSelectedImage = (index: number) => {
     setSelectedImages(prev => {
        const newImages = prev.filter((_, i) => i !== index);
        if (activeImageIndex >= newImages.length) {
           setActiveImageIndex(Math.max(0, newImages.length - 1));
        }
        return newImages;
     });
  };

  return (
    <div className="border border-gray-300 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-900 shadow-sm mb-6 transition-all duration-300 overflow-hidden">
      <div className="flex gap-3">
        <UserAvatar
          name={channelUser.name}
          imageUrl={channelUser.imageUrl}
          size="sm"
        />
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
             <span className="font-medium text-black dark:text-white">{channelUser.name}</span>
             <span>Trạng thái hiển thị: <span className="font-semibold text-black dark:text-white">Công khai</span></span>
          </div>
          
          <Textarea
            placeholder="Bạn đang nghĩ gì?"
            className="border-none focus-visible:ring-0 resize-none min-h-[40px] p-0 text-base placeholder:text-gray-500 bg-transparent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
          />

          {(postType === "poll" || postType === "question") && (
            <div className="mt-2 space-y-3 p-4 border rounded-xl border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
               {pollOptions.map((option, index) => (
                 <div key={option.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                       {postType === "poll" && pollType === "image" ? (
                         <div 
                           className="relative w-20 h-20 bg-gray-200 dark:bg-neutral-800 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden group"
                           onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = (e) => handleImageUpload(e as any, option.id);
                              input.click();
                           }}
                         >
                           {option.imageUrl ? (
                             <Image src={option.imageUrl} alt="" fill className="object-cover" />
                           ) : (
                             <ImageIcon className="size-6 text-gray-400" />
                           )}
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ImagePlusIcon className="size-5 text-white" />
                           </div>
                         </div>
                       ) : (
                         <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                            {postType === "poll" ? (
                               <X className="size-4 text-gray-500" />
                            ) : (
                               <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                            )}
                         </div>
                       )}
                       
                       <div className="flex-1 relative">
                          <Input
                            placeholder={postType === "question" ? `Câu trả lời ${index + 1}` : "Thêm lựa chọn"}
                            value={option.text}
                            onChange={(e) => {
                              const limit = (postType === "poll" && pollType === "image") ? 36 : 65;
                              if (e.target.value.length <= limit) {
                                setPollOptions(prev => prev.map(opt => opt.id === option.id ? { ...opt, text: e.target.value } : opt));
                              }
                            }}
                            className={cn(
                              "bg-transparent border-gray-300 dark:border-neutral-700 h-10 px-0 rounded-none border-t-0 border-x-0 border-b focus-visible:ring-0",
                              pollType === "image" && postType === "poll" ? "px-3 rounded-md border-t border-x" : ""
                            )}
                          />
                          <span className="absolute right-0 bottom-1 text-[10px] text-gray-500">
                             {option.text.length}/{(postType === "poll" && pollType === "image") ? "36" : "65"}
                          </span>
                       </div>
                       
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="size-8 text-gray-500 hover:text-red-500"
                         onClick={() => removePollOption(option.id)}
                         disabled={pollOptions.length <= 2}
                       >
                         <Trash2 className="size-4" />
                       </Button>
                    </div>
                 </div>
               ))}
               
               <div className="flex gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-500 hover:bg-blue-50 px-0"
                    onClick={addPollOption}
                    disabled={pollOptions.length >= 5}
                  >
                    {postType === "question" ? "Thêm câu trả lời" : "Thêm lựa chọn khác"}
                  </Button>
                  {pollType === "image" && postType === "poll" && (
                    <Button variant="outline" size="sm" className="flex-1 rounded-full">
                       Đổi vị trí hình ảnh
                    </Button>
                  )}
               </div>
            </div>
          )}

          {postType === "image" && selectedImages.length > 0 && (
            <div className="relative mt-2 border border-gray-300 dark:border-neutral-700 rounded-xl overflow-hidden bg-black flex h-[400px]">
               {/* Close button for the entire gallery editor */}
               <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 size-8 rounded-full bg-black/50 hover:bg-black/70 text-white z-20"
                  onClick={() => {
                    setSelectedImages([]);
                    setPostType("text");
                  }}
               >
                  <X className="size-5" />
               </Button>

               {/* Left sidebar: Thumbnails */}
               <div className="w-24 border-r border-gray-300 dark:border-neutral-700 bg-neutral-900 flex flex-col p-2 gap-2 overflow-y-auto custom-scrollbar z-10">
                  {selectedImages.filter(img => img && img.url).map((img, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0",
                        activeImageIndex === i ? "border-blue-500 scale-95" : "border-transparent hover:border-white/50"
                      )}
                      onClick={() => setActiveImageIndex(i)}
                    >
                       <Image src={img.url} alt="" fill className="object-cover" />
                    </div>
                  ))}
                  
                  {selectedImages.length < 5 && (
                    <div 
                      className="aspect-square rounded-md border-2 border-dashed border-neutral-700 flex items-center justify-center cursor-pointer hover:bg-neutral-800 transition-colors flex-shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                       <ImagePlusIcon className="size-6 text-neutral-400" />
                    </div>
                  )}
               </div>

               {/* Center area: Active image preview */}
               <div className="flex-1 relative flex flex-col items-center justify-center p-4 bg-black/95">
                  <div className="relative w-full h-full max-h-[300px] flex items-center justify-center">
                    {selectedImages[activeImageIndex]?.url && (
                      <div className="relative w-full h-full">
                        <Image 
                           src={selectedImages[activeImageIndex].url} 
                           alt="" 
                           fill 
                           className="object-contain" 
                           priority
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions below image */}
                  <div className="mt-4 flex items-center gap-6 z-10">
                     <button 
                       className="text-white text-sm font-semibold hover:text-red-400 transition-colors"
                       onClick={() => removeSelectedImage(activeImageIndex)}
                     >
                        Xóa
                     </button>
                     <Button 
                       variant="secondary" 
                       size="sm" 
                       className="rounded-full bg-neutral-800 hover:bg-neutral-700 text-white border-none h-8 px-4 text-xs font-semibold"
                     >
                        Chỉnh sửa bản...
                     </Button>
                  </div>
               </div>
            </div>
          )}

          {isExpanded && (
            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 multiple 
                 accept="image/*"
                 onChange={handleImageUpload}
               />
               
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={cn("gap-2 text-xs h-8 rounded-md transition-colors", postType === "image" && "bg-gray-100 dark:bg-neutral-800")}
                 onClick={() => {
                   setPostType("image");
                   if (selectedImages.length === 0) {
                     fileInputRef.current?.click();
                   }
                 }}
               >
                  <ImageIcon className="size-4 text-blue-500" />
                  Hình ảnh
               </Button>
               
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={cn("gap-2 text-xs h-8 rounded-md transition-colors", postType === "poll" && pollType === "image" && "bg-gray-100 dark:bg-neutral-800")}
                 onClick={() => {
                   setPostType("poll");
                   setPollType("image");
                 }}
               >
                  <BarChart2 className="size-4 text-blue-500" />
                  Cuộc thăm dò ý kiến dạng hình ảnh
               </Button>
               
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={cn("gap-2 text-xs h-8 rounded-md transition-colors", postType === "poll" && pollType === "text" && "bg-gray-100 dark:bg-neutral-800")}
                 onClick={() => {
                   setPostType("poll");
                   setPollType("text");
                 }}
               >
                  <ListTodo className="size-4 text-blue-500" />
                  Cuộc thăm dò ý kiến dạng văn bản
               </Button>
               
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={cn("gap-2 text-xs h-8 rounded-md transition-colors", postType === "video" && "bg-gray-100 dark:bg-neutral-800")}
                 onClick={() => setPostType("video")}
               >
                  <VideoIcon className="size-4 text-blue-500" />
                  Video
               </Button>
               
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={cn("gap-2 text-xs h-8 rounded-md transition-colors", postType === "question" && "bg-gray-100 dark:bg-neutral-800")}
                 onClick={() => setPostType("question")}
               >
                  <HelpCircle className="size-4 text-blue-500" />
                  Câu hỏi
               </Button>
               
               <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => {
                    setIsExpanded(false);
                    setPostType("text");
                    setSelectedImages([]);
                    setIsScheduling(false);
                    setPollOptions([{ id: "1", text: "" }, { id: "2", text: "" }]);
                    setContent("");
                  }}>Hủy</Button>
                  <div className="flex items-center">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-l-full px-6 h-9 font-semibold transition-colors disabled:bg-gray-300 dark:disabled:bg-neutral-800"
                      disabled={(!content.trim() && selectedImages.length === 0 && postType !== "poll" && postType !== "question") || isUploading || createPost.isPending}
                      onClick={handlePost}
                    >
                      {createPost.isPending ? "Đang đăng..." : isScheduling ? "Lên lịch" : "Đăng"}
                    </Button>
                    
                    <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-r-full px-2 h-9 border-l border-blue-500/30 transition-colors disabled:bg-gray-300 dark:disabled:bg-neutral-800"
                            disabled={isUploading || createPost.isPending}
                          >
                             <ChevronDown className="size-4" />
                          </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-56 rounded-xl">
                          <DropdownMenuItem 
                            className="gap-3 py-3 cursor-pointer"
                            onClick={() => setIsScheduling(true)}
                          >
                             <Clock className="size-4" />
                             <span>Lên lịch đăng bài</span>
                          </DropdownMenuItem>
                       </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
               </div>
            </div>
          )}

          {isScheduling && (
             <div className="mt-4 p-4 border rounded-xl border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-sm font-semibold">Chọn ngày và giờ để xuất bản bài đăng này</span>
                   <Button variant="ghost" size="icon" className="size-8" onClick={() => setIsScheduling(false)}>
                      <X className="size-4" />
                   </Button>
                </div>
                
                <div className="flex flex-wrap gap-3">
                   <div className="flex-1 min-w-[150px] relative">
                      <Input 
                        type="date" 
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 h-10 pr-10"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                   </div>
                   
                   <div className="flex-1 min-w-[150px] relative">
                      <select 
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                         {["12:00 AM", "01:00 AM", "02:00 AM", "08:00 AM", "12:00 PM", "06:00 PM", "11:00 PM"].map(t => (
                           <option key={t} value={t}>{t}</option>
                         ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                   </div>
                   
                   <div className="flex-[2] min-w-[200px] relative">
                      <div className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md h-10 px-3 flex items-center gap-2 text-sm text-gray-500">
                         <Globe className="size-4" />
                         <span>(GMT+07:00) Giờ địa phương</span>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
