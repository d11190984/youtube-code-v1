import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Trash2Icon,
  PinIcon,
  HeartIcon,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CommentForm } from "./comment-form";
import { CommentReplies } from "./comment-replies";
import { CommentsGetManyOutput } from "../../types";

interface CommentItemProps {
  comment: CommentsGetManyOutput["items"][number];
  variant?: "reply" | "comment";
}

export const CommentItem = ({
  comment,
  variant = "comment",
}: CommentItemProps) => {
  const clerk = useClerk();
  const { userId } = useAuth();

  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);

  const utils = trpc.useUtils();

  const remove = trpc.comments.remove.useMutation({
    onSuccess: () => {
      toast.success("Bình luận đã bị xóa");
      utils.comments.getMany.invalidate({ videoId: comment.videoId, postId: comment.postId });
    },
    onError: (error) => {
      toast.error("Đã xảy ra lỗi");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const pin = trpc.comments.pin.useMutation({
    onSuccess: () => {
      toast.success(comment.isPinned ? "Đã bỏ ghim bình luận" : "Đã ghim bình luận");
      utils.comments.getMany.invalidate({ videoId: comment.videoId, postId: comment.postId });
    },
    onError: (error) => {
      toast.error("Đã xảy ra lỗi");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const heart = trpc.comments.heart.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId, postId: comment.postId });
    },
    onError: (error) => {
      toast.error("Đã xảy ra lỗi");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const isContentOwner = comment.contentOwnerClerkId === userId;
  const isCommentOwner = comment.user.clerkId === userId;

  const like = trpc.commentReactions.like.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId, postId: comment.postId });
    },
    onError: (error) => {
      toast.error("Đã xảy ra lỗi");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });
  const dislike = trpc.commentReactions.dislike.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId: comment.videoId, postId: comment.postId });
    },
    onError: (error) => {
      toast.error("Đã xảy ra lỗi");

      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
      {comment.isPinned && variant === "comment" && (
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground pl-14">
          <PinIcon className="size-3" />
          <span>Đã ghim bởi chủ kênh</span>
        </div>
      )}
      <div className="flex gap-4">
        <Link prefetch href={`/users/${comment.userId}`}>
          <UserAvatar
            size={variant === "comment" ? "lg" : "sm"}
            imageUrl={comment.user.imageUrl}
            name={comment.user.name}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link prefetch href={`/users/${comment.userId}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm pb-0.5">
                {comment.user.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNowStrict(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })
                  .replace("vài giây trước", "vừa xong")
                  .replace(" giây trước", " giây trước")
                  .replace(" phút trước", " phút trước")
                  .replace(" giờ trước", " giờ trước")
                  .replace(" ngày trước", " ngày trước")
                  .replace(" tháng trước", " tháng trước")
                  .replace(" năm trước", "năm trước")}
              </span>
            </div>
          </Link>
          <p className="text-sm">{comment.value}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              <Button
                disabled={like.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => like.mutate({ commentId: comment.id })}
              >
                <ThumbsUpIcon
                  className={cn(
                    "transition-transform",
                    comment.viewerReaction === "like" && "fill-black animate-likeBounce",
                  )}
                />
              </Button>
              <span className="text-xs text-muted-foreground">
                {comment.likeCount}
              </span>
              <Button
                disabled={dislike.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => dislike.mutate({ commentId: comment.id })}
              >
                <ThumbsDownIcon
                  className={cn(
                    "transition-transform",
                    comment.viewerReaction === "dislike" && "fill-black animate-likeBounce",
                  )}
                />
              </Button>
              <span className="text-xs text-muted-foreground">
                {comment.dislikeCount}
              </span>
              {comment.creatorHearted && (
                <div className="flex items-center justify-center ml-2 relative">
                  <UserAvatar size="xs" imageUrl={comment.contentOwnerImageUrl || ""} name={comment.contentOwnerName || ""} />
                  <HeartIcon className="size-3 fill-red-500 text-red-500 absolute -bottom-1 -right-1 bg-white dark:bg-black rounded-full p-[1px]" />
                </div>
              )}
            </div>
            {variant === "comment" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setIsReplyOpen(true)}
              >
                Trả lời
              </Button>
            )}
          </div>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsReplyOpen(true)}>
              <MessageSquareIcon className="size-4 mr-2" />
              Trả lời
            </DropdownMenuItem>
            {isContentOwner && (
              <>
                <DropdownMenuItem onClick={() => pin.mutate({ id: comment.id })}>
                  <PinIcon className="size-4 mr-2" />
                  {comment.isPinned ? "Bỏ ghim" : "Ghim"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => heart.mutate({ id: comment.id })}>
                  <HeartIcon className={cn("size-4 mr-2", comment.creatorHearted && "fill-red-500 text-red-500")} />
                  {comment.creatorHearted ? "Bỏ thả tim" : "Thả tim"}
                </DropdownMenuItem>
              </>
            )}
            {(isCommentOwner || isContentOwner) && (
              <DropdownMenuItem
                onClick={() => remove.mutate({ id: comment.id })}
              >
                <Trash2Icon className="size-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isReplyOpen && variant === "comment" && (
        <div className="mt-4 pl-14">
          <CommentForm
            variant="reply"
            parentId={comment.id}
            videoId={comment.videoId || undefined}
            postId={comment.postId || undefined}
            onCancel={() => setIsReplyOpen(false)}
            onSuccess={() => {
              setIsReplyOpen(false);
              setIsRepliesOpen(true);
            }}
          />
        </div>
      )}
      {comment.replyCount > 0 && variant === "comment" && (
        <div className="pl-14">
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setIsRepliesOpen((current) => !current)}
          >
            {isRepliesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {comment.replyCount} lượt phản hồi
          </Button>
        </div>
      )}
      {comment.replyCount > 0 && variant === "comment" && isRepliesOpen && (
        <CommentReplies parentId={comment.id} videoId={comment.videoId || undefined} postId={comment.postId || undefined} />
      )}
    </div>
  );
};

