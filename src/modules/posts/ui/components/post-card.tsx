"use client";

import { useState } from "react";
import { formatDistanceToNow, format, isAfter } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import { UserAvatar } from "@/components/user-avatar";
import { enUS, vi as viLocale, de, es, fr, ja, ko, zhCN } from "date-fns/locale";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { ThumbsUp, ThumbsDown, MessageSquare, MoreVertical, Trash2, CheckCircle2, Pencil, Share2, Flag } from "lucide-react";
import Image from "next/image";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostCommentsSection } from "../sections/post-comments-section";
import { ReportModal } from "@/modules/reports/ui/components/report-modal";

interface PostCardProps {
  post: any; 
  isCompact?: boolean;
}

export const PostCard = ({ post, isCompact }: PostCardProps) => {
  const t = useTranslations("Posts");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useUser();
  const utils = trpc.useUtils();

  const getDateLocale = () => {
    switch (locale) {
      case "vi": return viLocale;
      case "de": return de;
      case "es": return es;
      case "fr": return fr;
      case "ja": return ja;
      case "ko": return ko;
      case "zh": return zhCN;
      default: return enUS;
    }
  };

  const dateLocale = getDateLocale();
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  
  const react = trpc.posts.react.useMutation({
     onSuccess: () => utils.posts.getMany.invalidate(),
  });
  
  const vote = trpc.posts.vote.useMutation({
     onSuccess: () => utils.posts.getMany.invalidate(),
  });

  const remove = trpc.posts.remove.useMutation({
    onSuccess: () => {
      toast.success(t("postDeletedSuccess"));
      utils.posts.getMany.invalidate();
    }
  });

  const update = trpc.posts.update.useMutation({
    onSuccess: () => {
      toast.success(t("postUpdatedSuccess"));
      setIsEditing(false);
      utils.posts.getMany.invalidate();
    },
    onError: () => {
      toast.error(t("postUpdateError"));
    }
  });

  const isOwner = user?.id === post.user.clerkId;
  const hasVoted = post.poll?.options.some((opt: any) => opt.viewerVoted);
  const isQuiz = post.poll?.options.some((opt: any) => opt.isCorrect);
  const totalVotes = post.poll?.options.reduce((acc: number, o: any) => acc + (o.voteCount || 0), 0) || 0;

  const handleVote = (optionId: string) => {
    if (isOwner) {
      toast.error(t("ownerCannotVote"));
      return;
    }
    vote.mutate({ postId: post.id, optionId });
  };

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    update.mutate({ id: post.id, content: editContent });
  };

  return (
    <div className={cn(
      "border border-gray-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm hover:border-gray-300 transition-colors flex flex-col h-full",
      isCompact ? "p-3" : "p-4"
    )}>
      {/* Header & Content wrapper */}
      <div className="flex-1 min-h-0">
        <div className="flex gap-3">
          <Link href={`/users/${post.user.id}`}>
            <UserAvatar name={post.user.name} imageUrl={post.user.imageUrl} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            {/* Header info */}
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/users/${post.user.id}`} className="hover:opacity-70 transition-opacity">
                <span className="text-sm font-semibold">
                  {post.user.handle ? `@${post.user.handle}` : post.user.name}
                </span>
              </Link>
              <span className="text-[11px] text-muted-foreground">
                {post.scheduledAt && isAfter(new Date(post.scheduledAt), new Date()) ? (
                  t("scheduledFor", { time: format(new Date(post.scheduledAt), "HH:mm d 'thg' M, yyyy", { locale: dateLocale }) })
                ) : (
                  <>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: dateLocale })}
                    {post.isEdited && t("edited")}
                  </>
                )}
              </span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-auto size-8 text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner ? (
                    <>
                      {post.type === "image" && (
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Pencil className="size-4 mr-2" />
                          {t("edit")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-500" onClick={() => remove.mutate({ id: post.id })}>
                        <Trash2 className="size-4 mr-2" />
                        {t("deletePost")}
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => setIsReportModalOpen(true)}>
                      <Flag className="size-4 mr-2" />
                      {t("reportViolation")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Main Content Area */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] bg-transparent border-gray-300 dark:border-neutral-700 focus-visible:ring-blue-500"
                  placeholder={t("editPostPlaceholder")}
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(post.content || "");
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
                    onClick={handleUpdate}
                    disabled={update.isPending || !editContent.trim()}
                  >
                    {t("save")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn(isCompact && "flex justify-between gap-4 items-start")}>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm whitespace-pre-wrap mb-2 leading-relaxed",
                    isCompact ? "line-clamp-4 text-xs mb-1" : ""
                  )}>
                    {post.content}
                  </div>

                  {isCompact && post.poll && (
                    <div className="mt-2">
                      <div className="text-[11px] text-muted-foreground mb-1.5 font-medium">
                        {t("peopleResponded", { totalVotes })}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-full text-blue-500 border-neutral-200 dark:border-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-[11px] font-bold"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/posts/${post.id}`);
                        }}
                      >
                        {t("respondNow")}
                      </Button>
                    </div>
                  )}
                </div>

                {isCompact && post.images && post.images.length > 0 && (
                  <div className="relative size-20 rounded-xl overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <Image src={post.images[0].imageUrl} alt="" fill className="object-cover" />
                  </div>
                )}
              </div>
            )}

            {/* Non-compact details */}
            {isQuiz && !isCompact && (
              <div className="text-xs text-muted-foreground mb-3">
                {t("peopleResponded", { totalVotes })}
              </div>
            )}

            {!isCompact && post.images && post.images.length > 0 && (
              <div className={cn(
                "mb-4 rounded-xl overflow-hidden border border-gray-100 dark:border-neutral-800 mx-auto",
                post.images.length > 1 ? "grid grid-cols-2 gap-2 aspect-video" : "max-w-[450px] aspect-square"
              )}>
                {post.images.map((img: any) => (
                  <div key={img.id} className="relative w-full h-full">
                    <Image src={img.imageUrl} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {post.poll && !isCompact && (
              <div className="mb-4 space-y-2">
                {post.poll.options.map((opt: any) => {
                  const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                  const showResult = hasVoted || isOwner;
                  
                  return (
                    <div key={opt.id} className="space-y-1">
                      <div 
                        className={cn(
                          "relative group border rounded-lg overflow-hidden transition-all",
                          isOwner ? "cursor-default" : "cursor-pointer",
                          opt.viewerVoted ? "border-blue-500 bg-blue-50/5" : "border-gray-200 dark:border-neutral-800 hover:bg-gray-50/50",
                          showResult && isQuiz && opt.isCorrect && "border-green-500 bg-green-50/5",
                          showResult && isQuiz && opt.viewerVoted && !opt.isCorrect && "border-red-500 bg-red-50/5"
                        )}
                        onClick={() => !showResult && handleVote(opt.id)}
                      >
                        {showResult && (
                          <div 
                            className={cn(
                              "absolute left-0 top-0 bottom-0 transition-all duration-500",
                              opt.viewerVoted ? "bg-blue-100 dark:bg-blue-900/20" : "bg-gray-100 dark:bg-neutral-800",
                              isQuiz && opt.isCorrect && "bg-green-100 dark:bg-green-900/20",
                              isQuiz && opt.viewerVoted && !opt.isCorrect && "bg-red-100 dark:bg-red-900/20"
                            )} 
                            style={{ width: `${percentage}%` }}
                          />
                        )}
                        
                        <div className={cn(
                          "relative flex items-center gap-4",
                          post.poll.type === "image" ? "h-24" : "p-3"
                        )}>
                          {post.poll.type === "image" && opt.imageUrl && (
                            <div className="relative h-full aspect-square overflow-hidden flex-shrink-0 border-r border-gray-100 dark:border-neutral-800">
                              <Image src={opt.imageUrl} alt="" fill className="object-cover" />
                            </div>
                          )}
                          
                          <div className="flex-1 flex items-center justify-between pr-4">
                            <span className={cn(
                              "text-sm font-medium",
                              opt.viewerVoted && "text-blue-600 dark:text-blue-400",
                              showResult && isQuiz && opt.isCorrect && "text-green-600 dark:text-green-400",
                              showResult && isQuiz && opt.viewerVoted && !opt.isCorrect && "text-red-600 dark:text-red-400"
                            )}>{opt.text}</span>
                            
                            {showResult && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">{percentage}%</span>
                                {isQuiz && opt.isCorrect && (
                                  <CheckCircle2 className="size-5 text-green-600" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {showResult && isQuiz && opt.isCorrect && opt.explanation && (
                        <div className="text-[11px] text-muted-foreground bg-gray-50 dark:bg-neutral-800/50 p-2 rounded-lg ml-2">
                          {opt.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!isQuiz && (
                  <div className="text-[10px] text-muted-foreground pl-1">
                    {t("votes", { totalVotes })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className={cn("flex items-center justify-between mt-auto", isCompact ? "pt-2" : "mt-4")}>
        <div className="flex items-center gap-1 sm:gap-4">
          <div className="flex items-center gap-1 group">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "size-8 group-hover:bg-gray-100 dark:group-hover:bg-neutral-800 rounded-full", 
                post.viewerReaction === "like" && "text-blue-500",
                isCompact && "size-7"
              )}
              onClick={() => react.mutate({ postId: post.id, type: post.viewerReaction === "like" ? "none" : "like" })}
            >
              <ThumbsUp className={cn("size-4", isCompact && "size-3.5")} />
            </Button>
            {post.likeCount > 0 && (
              <span className={cn("text-xs text-muted-foreground", isCompact && "text-[10px]")}>{post.likeCount}</span>
            )}
          </div>

          <div className="flex items-center gap-1 group">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "size-8 group-hover:bg-gray-100 dark:group-hover:bg-neutral-800 rounded-full", 
                post.viewerReaction === "dislike" && "text-red-500",
                isCompact && "size-7"
              )}
              onClick={() => react.mutate({ postId: post.id, type: post.viewerReaction === "dislike" ? "none" : "dislike" })}
            >
              <ThumbsDown className={cn("size-4", isCompact && "size-3.5")} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800",
              isCompact ? "size-7" : "size-8"
            )}
            onClick={(e) => {
              e.stopPropagation();
              const url = `${window.location.origin}/posts/${post.id}`;
              navigator.clipboard.writeText(url);
              toast.success(t("postLinkCopied"));
            }}
          >
            <Share2 className={cn("size-4", isCompact && "size-3.5")} />
          </Button>
          <div className="flex items-center group">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "size-8 group-hover:bg-gray-100 dark:group-hover:bg-neutral-800 rounded-full",
                showComments && "text-blue-500 bg-gray-100 dark:bg-neutral-800",
                isCompact && "size-7"
              )}
              onClick={() => setShowComments(!showComments)}
            >
              <MessageSquare className={cn("size-4", isCompact && "size-3.5")} />
            </Button>
            {!isCompact && post.commentCount > 0 && (
              <span className="text-xs text-muted-foreground">{post.commentCount}</span>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
          <PostCommentsSection postId={post.id} canComment={post.canComment} />
        </div>
      )}
      <ReportModal 
        targetId={post.id}
        targetType="post"
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
