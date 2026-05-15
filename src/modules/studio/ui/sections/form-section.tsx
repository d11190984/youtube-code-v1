"use client";

import { z } from "zod";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import {
  ChevronDownIcon,
  CopyCheckIcon,
  CopyIcon,
  Globe2Icon,
  ImagePlusIcon,
  Loader2Icon,
  LockIcon,
  MoreVerticalIcon,
  RotateCcwIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react";

import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { videoUpdateSchema } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_MAP, TRACK_STATUS_MAP } from "@/lib/status-map";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { APP_URL } from "@/constants";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { VideoPlayer } from "@/modules/videos/ui/components/video-player";

import { ThumbnailUploadModal } from "../components/thumbnail-upload-modal";
import { ThumbnailGenerateModal } from "../components/thumbnail-generate-modal";
import { PlaylistCreateModal } from "@/modules/playlists/ui/components/playlist-create-modal";
import { MixPlaylistCreateModal } from "@/modules/playlists/ui/components/mix-playlist-create-modal";
import { HashtagTextarea } from "../components/hashtag-textarea";

interface FormSectionProps {
  videoId: string;
}

export const FormSection = ({ videoId }: FormSectionProps) => {
  return (
    <Suspense fallback={<FormSectionSkeleton />}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <FormSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const FormSectionSkeleton = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="space-y-8 lg:col-span-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-[220px] w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-[84px] w-[153px]" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex flex-col gap-y-8 lg:col-span-2">
          <div className="flex flex-col gap-4 bg-muted/40 rounded-xl overflow-hidden">
            <Skeleton className="aspect-video" />
            <div className="px-4 py-4 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const t = useTranslations("Studio");
  const router = useRouter();
  const utils = trpc.useUtils();

  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [thumbnailGenerateModalOpen, setThumbnailGenerateModalOpen] =
    useState(false);
  const [playlistCreateModalOpen, setPlaylistCreateModalOpen] = useState(false);
  const [mixPlaylistCreateModalOpen, setMixPlaylistCreateModalOpen] =
    useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId });
  const tCategories = useTranslations("Categories");
  const [categories] = trpc.categories.getMany.useSuspenseQuery();
  const [playlists] = trpc.playlists.getManyForVideo.useSuspenseQuery({
    videoId,
    limit: 100,
  });

  const update = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success(t("success"));
    },
    onError: () => {
      toast.error(t("error"));
    },
  });

  const remove = trpc.videos.remove.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      toast.success(t("success"));
      router.push("/studio");
    },
    onError: () => {
      toast.error(t("error"));
    },
  });

  const revalidate = trpc.videos.revalidate.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success(t("success"));
    },
    onError: () => {
      toast.error(t("error"));
    },
  });

  const generateDescription = trpc.videos.generateDescription.useMutation({
    onSuccess: (data: { description: string | null }) => {
      form.setValue("description", data.description);
      toast.success(t("success"));
    },
    onError: () => {
      toast.error(t("error"));
    },
  });
  const generateTitle = trpc.videos.generateTitle.useMutation({
    onSuccess: (data: { title: string | null }) => {
      form.setValue("title", data.title ?? "");
      toast.success(t("success"));
    },
    onError: () => {
      toast.error(t("error"));
    },
  });

  const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success(t("success"));
    },
    onError: () => {
      toast.error(t("error"));
    },
  });

  const addVideoToPlaylist = trpc.playlists.addVideo.useMutation({
    onSuccess: () => {
      utils.playlists.getManyForVideo.invalidate({ videoId });
      toast.success(t("success"));
    },
    onError: (error) => {
      toast.error(error.message || t("error"));
    },
  });

  const removeVideoFromPlaylist = trpc.playlists.removeVideo.useMutation({
    onSuccess: () => {
      utils.playlists.getManyForVideo.invalidate({ videoId });
      toast.success(t("success"));
    },
    onError: (error) => {
      toast.error(error.message || t("error"));
    },
  });

  const form = useForm<z.infer<typeof videoUpdateSchema>>({
    resolver: zodResolver(videoUpdateSchema),
    defaultValues: video,
  });

  useEffect(() => {
    form.reset(video);
  }, [video, form]);

  const onSubmit = (data: z.infer<typeof videoUpdateSchema>) => {
    update.mutate(data);
  };

  const fullUrl = `${APP_URL}/videos/${videoId}`;
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <>
      <ThumbnailGenerateModal
        open={thumbnailGenerateModalOpen}
        onOpenChange={setThumbnailGenerateModalOpen}
        videoId={videoId}
      />
      <ThumbnailUploadModal
        open={thumbnailModalOpen}
        onOpenChange={setThumbnailModalOpen}
        videoId={videoId}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-xs text-muted-foreground">{t("desc")}</p>
            </div>
            <div className="flex items-center gap-x-2">
              <Button
                type="submit"
                disabled={update.isPending || !form.formState.isDirty}
              >
                {t("save")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => revalidate.mutate({ id: videoId })}
                  >
                    <RotateCcwIcon className="size-4 mr-2" />
                    {t("revalidate")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => remove.mutate({ id: videoId })}
                    className="text-red-500 focus:text-red-500"
                  >
                    <TrashIcon className="size-4 mr-2" />
                    {t("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="space-y-8 lg:col-span-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-x-2">
                        {t("videoName")}
                        <Button
                          size="icon"
                          variant="outline"
                          type="button"
                          className="rounded-full size-6 [&_svg]:size-3"
                          onClick={() => {
                            generateTitle.mutate({ id: videoId });
                          }}
                          disabled={
                            generateTitle.isPending || !video.muxTrackId
                          }
                        >
                          {generateTitle.isPending ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <SparklesIcon />
                          )}
                        </Button>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("videoPlaceholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-x-2">
                        {t("videoDesc")}
                        <Button
                          size="icon"
                          variant="outline"
                          type="button"
                          className="rounded-full size-6 [&_svg]:size-3"
                          onClick={() =>
                            generateDescription.mutate({ id: videoId })
                          }
                          disabled={
                            generateDescription.isPending || !video.muxTrackId
                          }
                        >
                          {generateDescription.isPending ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <SparklesIcon />
                          )}
                        </Button>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <HashtagTextarea
                        {...field}
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        rows={10}
                        className="resize-none pr-10"
                        placeholder={t("descPlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="thumbnailUrl"
                control={form.control}
                render={() => (
                  <FormItem>
                    <FormLabel>{t("thumbnail")}</FormLabel>
                    <FormControl>
                      <div className="p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                        <Image
                          src={video.thumbnailUrl || THUMBNAIL_FALLBACK}
                          className="object-cover"
                          fill
                          alt="Thumbnail"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              className="bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7"
                            >
                              <MoreVerticalIcon className="text-white" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side="right">
                            <DropdownMenuItem
                              onClick={() => setThumbnailModalOpen(true)}
                            >
                              <ImagePlusIcon className="size-4 mr-1" />
                              {t("change")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setThumbnailGenerateModalOpen(true)
                              }
                            >
                              <SparklesIcon className="size-4 mr-1" />
                              {t("generateThumbnail")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                restoreThumbnail.mutate({ id: videoId })
                              }
                            >
                              <RotateCcwIcon className="size-4 mr-1" />
                              {t("revalidate")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>{t("playlists")}</FormLabel>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      type="button"
                      className="w-full justify-between"
                    >
                      {playlists.items.filter((p) => p.containsVideo).length > 0
                        ? `${playlists.items.filter((p) => p.containsVideo).length} ${t("playlists")}`
                        : t("selectPlaylists")}
                      <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="flex flex-col h-full max-h-[400px]">
                      {playlists.items.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          {t("noPlaylistsFound")}
                        </div>
                      ) : (
                        <div className="p-4 flex-1 overflow-y-auto space-y-2">
                          {playlists.items.map((playlist) => (
                            <div
                              key={playlist.id}
                              className="flex items-center space-x-3 p-1 hover:bg-muted/50 rounded-md"
                            >
                              <Checkbox
                                id={playlist.id}
                                checked={playlist.containsVideo}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    addVideoToPlaylist.mutate({
                                      playlistId: playlist.id,
                                      videoId,
                                    });
                                  } else {
                                    removeVideoFromPlaylist.mutate({
                                      playlistId: playlist.id,
                                      videoId,
                                    });
                                  }
                                }}
                              />
                              <label
                                htmlFor={playlist.id}
                                className="text-sm font-medium leading-none cursor-pointer flex-1"
                              >
                                {playlist.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-2 border-t flex items-center justify-between bg-muted/20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                              {t("playlists")}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => setPlaylistCreateModalOpen(true)}
                            >
                              {t("newPlaylist")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setMixPlaylistCreateModalOpen(true)
                              }
                            >
                              {t("newMixPlaylist")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPopoverOpen(false)}
                        >
                          {t("done")}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-2">
                  {playlists.items
                    .filter((p) => p.containsVideo)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="bg-muted px-2 py-1 rounded-md text-xs font-medium flex items-center gap-x-1"
                      >
                        {p.name}
                      </div>
                    ))}
                </div>
              </div>
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCategory")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {tCategories(category.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-y-8 lg:col-span-2">
              <div className="flex flex-col gap-4 bg-muted/40 rounded-xl overflow-hidden h-fit">
                <div className="aspect-video overflow-hidden relative">
                  <VideoPlayer
                    videoId={video.id}
                    title={video.title}
                    playbackId={video.muxPlaybackId}
                    thumbnailUrl={video.thumbnailUrl}
                    component="studio"
                  />
                </div>
                <div className="p-4 flex flex-col gap-y-6">
                  <div className="flex justify-between items-center gap-x-2">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-muted-foreground text-xs">
                        {t("videoLink")}
                      </p>
                      <div className="flex items-center gap-x-2">
                        <Link prefetch href={`/videos/${video.id}`}>
                          <p className="line-clamp-1 text-sm text-blue-500">
                            {fullUrl}
                          </p>
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={onCopy}
                          disabled={isCopied}
                        >
                          {isCopied ? <CopyCheckIcon /> : <CopyIcon />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-muted-foreground text-xs">
                        {t("videoStatus")}
                      </p>
                      <p className="text-sm">
                        {t(video.muxStatus || "processing")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-muted-foreground text-xs">
                        {t("trackStatus")}
                      </p>
                      <p className="text-sm">
                        {t(video.muxTrackStatus || "no_subtitles")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("visibility")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("visibility")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center">
                            <Globe2Icon className="size-4 mr-2" />
                            {t("public")}
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center">
                            <LockIcon className="size-4 mr-2" />
                            {t("private")}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 🔥 BÌNH LUẬN VÀ MỨC PHÂN LOẠI */}
          <div className="mt-12 pt-8 border-t border-muted">
            <h2 className="text-xl font-bold mb-1">
              {t("commentsAndRatings")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("commentsDesc")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="canComment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("comments")}</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      value={field.value ? "true" : "false"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("comments")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">{t("on")}</SelectItem>
                        <SelectItem value="false">{t("off")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commentModeration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("moderation")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="[&_[data-description]]:hidden">
                          <SelectValue placeholder={t("moderation")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex flex-col">
                            <span>{t("none")}</span>
                            <span data-description className="text-xs text-muted-foreground">{t("noneDesc")}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="basic">
                          <div className="flex flex-col">
                            <span>{t("basic")}</span>
                            <span data-description className="text-xs text-muted-foreground">{t("basicDesc")}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="strict">
                          <div className="flex flex-col">
                            <span>{t("strict")}</span>
                            <span data-description className="text-xs text-muted-foreground">{t("strictDesc")}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="hold_all">
                          <div className="flex flex-col">
                            <span>{t("holdAll")}</span>
                            <span data-description className="text-xs text-muted-foreground">{t("holdAllDesc")}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commentPermission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("whoCanComment")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "anyone"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("whoCanComment")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="anyone">{t("anyone")}</SelectItem>
                        <SelectItem value="subscribers">
                          {t("subscribers")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commentSort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sortBy")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "top"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("sortBy")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="top">{t("top")}</SelectItem>
                        <SelectItem value="newest">{t("newest")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6">
              <FormField
                control={form.control}
                name="showLikeCount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("showLikeCount")}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>

        <PlaylistCreateModal
          open={playlistCreateModalOpen}
          onOpenChange={setPlaylistCreateModalOpen}
        />
        <MixPlaylistCreateModal
          open={mixPlaylistCreateModalOpen}
          onOpenChange={setMixPlaylistCreateModalOpen}
          initialVideoIds={[videoId]}
        />
      </Form>
    </>
  );
};
