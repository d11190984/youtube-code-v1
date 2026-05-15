// ====================== DRIZZLE & ZOD IMPORTS ======================
import { relations } from "drizzle-orm";

// PostgreSQL core types
import {
  boolean,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from "drizzle-orm/pg-core";

// Zod schemas cho insert / select / update
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
// ====================== ENUMS ======================
export const reactionType = pgEnum("reaction_type", ["like", "dislike"]);
export const videoVisibility = pgEnum("video_visibility", [
  "private",
  "public",
]);
export const playlistVisibility = pgEnum("playlist_visibility", [
  "public",
  "private",
]);

export const postType = pgEnum("post_type", ["text", "image", "poll", "video"]);
export const moderationType = pgEnum("moderation_type", [
  "hidden",
  "approved",
  "manager_mod",
  "standard_mod"
]);

export const commentStatus = pgEnum("comment_status", [
  "published",
  "held_for_review",
  "hidden",
]);

export const notificationType = pgEnum("notification_type", [
  "video_like",
  "video_comment",
  "comment_reply",
  "comment_like",
  "subscription",
  "post_like",
  "post_comment",
]);

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content"),
  type: postType("type").default("text").notNull(),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at"),
  isEdited: boolean("is_edited").default(false).notNull(),
  canComment: boolean("can_comment").default(true).notNull(),
  commentModeration: text("comment_moderation", { enum: ["none", "basic", "strict", "hold_all"] }).default("none").notNull(),
  commentSort: text("comment_sort").default("top").notNull(),
  showLikeCount: boolean("show_like_count").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postImages = pgTable("post_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  imageUrl: text("image_url").notNull(),
  imageKey: text("image_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postPolls = pgTable("post_polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type", { enum: ["text", "image"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postPollOptions = pgTable("post_poll_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id")
    .references(() => postPolls.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text"),
  imageUrl: text("image_url"),
  imageKey: text("image_key"),
  isCorrect: boolean("is_correct").default(false).notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postPollVotes = pgTable(
  "post_poll_votes",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    optionId: uuid("option_id")
      .references(() => postPollOptions.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ name: "post_poll_votes_pk", columns: [t.userId, t.optionId] }),
  ],
);

export const postReactions = pgTable(
  "post_reactions",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    postId: uuid("post_id")
      .references(() => posts.id, { onDelete: "cascade" })
      .notNull(),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ name: "post_reactions_pk", columns: [t.userId, t.postId] }),
  ],
);

export const postRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  video: one(videos, { fields: [posts.videoId], references: [videos.id] }),
  images: many(postImages),
  poll: one(postPolls, { fields: [posts.id], references: [postPolls.postId] }),
  reactions: many(postReactions),
  comments: many(comments),
}));

export const postImageRelations = relations(postImages, ({ one }) => ({
  post: one(posts, { fields: [postImages.postId], references: [posts.id] }),
}));

export const postPollRelations = relations(postPolls, ({ one, many }) => ({
  post: one(posts, { fields: [postPolls.postId], references: [posts.id] }),
  options: many(postPollOptions),
}));

export const postPollOptionRelations = relations(
  postPollOptions,
  ({ one, many }) => ({
    poll: one(postPolls, {
      fields: [postPollOptions.pollId],
      references: [postPolls.id],
    }),
    votes: many(postPollVotes),
  }),
);

export const postPollVoteRelations = relations(postPollVotes, ({ one }) => ({
  user: one(users, { fields: [postPollVotes.userId], references: [users.id] }),
  option: one(postPollOptions, {
    fields: [postPollVotes.optionId],
    references: [postPollOptions.id],
  }),
}));

export const postReactionRelations = relations(postReactions, ({ one }) => ({
  user: one(users, { fields: [postReactions.userId], references: [users.id] }),
  post: one(posts, { fields: [postReactions.postId], references: [posts.id] }),
}));

export const postSelectSchema = createSelectSchema(posts);
export const postInsertSchema = createInsertSchema(posts);
export const postUpdateSchema = createUpdateSchema(posts);

export const postPollOptionSelectSchema = createSelectSchema(postPollOptions);
export const postPollOptionInsertSchema = createInsertSchema(postPollOptions);

export const postPollSelectSchema = createSelectSchema(postPolls);
export const postPollInsertSchema = createInsertSchema(postPolls);

// ====================== USERS ======================
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").unique().notNull(),
    name: text("name").notNull(),
    bannerUrl: text("banner_url"),
    bannerKey: text("banner_key"),
    imageUrl: text("image_url").notNull(),
    trackHistory: boolean("track_history").default(true).notNull(),

    bio: text("bio"),
    handle: text("handle").unique(),
    handleUpdatedAt: timestamp("handle_updated_at"),
    handlePreviousUpdatedAt: timestamp("handle_previous_updated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    banned: boolean("banned").default(false).notNull(),
    blacklistKeywords: text("blacklist_keywords"),
  },
  (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)],
);

export const userRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  videoViews: many(videoViews),
  videoReactions: many(videoReactions),
  subscriptions: many(subscriptions, {
    relationName: "subscriptions_viewer_id_fkey",
  }),
  subscribers: many(subscriptions, {
    relationName: "subscriptions_creator_id_fkey",
  }),
  comments: many(comments),
  commentReactions: many(commentReactions),
  playlists: many(playlists),
  notifications: many(notifications, {
    relationName: "notifications_user_id_fkey",
  }),
  triggeredNotifications: many(notifications, {
    relationName: "notifications_actor_id_fkey",
  }),
  searchHistory: many(searchHistory),
}));

// ====================== SEARCH HISTORY ======================
export const searchHistory = pgTable("search_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  query: text("query").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, { fields: [searchHistory.userId], references: [users.id] }),
}));

export const searchHistorySelectSchema = createSelectSchema(searchHistory);
export const searchHistoryInsertSchema = createInsertSchema(searchHistory);

// ====================== CATEGORIES ======================
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("name_idx").on(t.name)],
);

export const categoryRelations = relations(categories, ({ many }) => ({
  videos: many(videos),
}));

// ====================== VIDEOS ======================
export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  muxStatus: text("mux_status"),
  muxAssetId: text("mux_asset_id").unique(),
  muxUploadId: text("mux_upload_id").unique(),
  muxPlaybackId: text("mux_playback_id").unique(),
  muxTrackId: text("mux_track_id").unique(),
  muxTrackStatus: text("mux_track_status"),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailKey: text("thumbnail_key"),
  previewUrl: text("preview_url"),
  previewKey: text("preview_key"),
  videoWidth: integer("video_width"),
  videoHeight: integer("video_height"),
  duration: integer("duration").default(0).notNull(),
  visibility: videoVisibility("visibility").default("private").notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  viewsCount: integer("views_count").default(0).notNull(),
  canComment: boolean("can_comment").default(true).notNull(),
  commentModeration: text("comment_moderation", { enum: ["none", "basic", "strict", "hold_all"] }).default("none").notNull(),
  commentPermission: text("comment_permission").default("anyone").notNull(),
  commentSort: text("comment_sort").default("top").notNull(),
  showLikeCount: boolean("show_like_count").default(true).notNull(),
  tags: text("tags").array(),
}, (t) => [
  index("tags_gin_idx").using("gin", t.tags),
]);

export const videoSelectSchema = createSelectSchema(videos);
export const videoInsertSchema = createInsertSchema(videos);
export const videoUpdateSchema = createUpdateSchema(videos);

export const videoRelations = relations(videos, ({ one, many }) => ({
  user: one(users, { fields: [videos.userId], references: [users.id] }),
  category: one(categories, {
    fields: [videos.categoryId],
    references: [categories.id],
  }),
  views: many(videoViews),
  reactions: many(videoReactions),
  comments: many(comments),
  playlistVideos: many(playlistVideos),
}));

// ====================== PLAYLISTS ======================
export const playlists = pgTable("playlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isMixPlaylist: boolean("is_mix_playlist").default(false).notNull(),
  visibility: playlistVisibility("visibility").default("public").notNull(), // dùng enum thay vì varchar
});

export const playlistRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, { fields: [playlists.userId], references: [users.id] }),
  playlistVideos: many(playlistVideos),
}));

export const playlistVideos = pgTable(
  "playlist_videos",
  {
    playlistId: uuid("playlist_id")
      .references(() => playlists.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "playlist_videos_pk",
      columns: [t.playlistId, t.videoId],
    }),
  ],
);

export const playlistVideoRelations = relations(playlistVideos, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistVideos.playlistId],
    references: [playlists.id],
  }),
  video: one(videos, {
    fields: [playlistVideos.videoId],
    references: [videos.id],
  }),
}));

// ====================== SUBSCRIPTIONS ======================
export const subscriptions = pgTable(
  "subscriptions",
  {
    viewerId: uuid("viewer_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "subscriptions_pk",
      columns: [t.viewerId, t.creatorId],
    }),
  ],
);

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  viewer: one(users, {
    fields: [subscriptions.viewerId],
    references: [users.id],
    relationName: "subscriptions_viewer_id_fkey",
  }),
  creator: one(users, {
    fields: [subscriptions.creatorId],
    references: [users.id],
    relationName: "subscriptions_creator_id_fkey",
  }),
}));

// ====================== CHANNEL MODERATIONS ======================
export const channelModerations = pgTable(
  "channel_moderations",
  {
    creatorId: uuid("creator_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    viewerId: uuid("viewer_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: moderationType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "channel_moderations_pk",
      columns: [t.creatorId, t.viewerId],
    }),
  ],
);

export const channelModerationRelations = relations(channelModerations, ({ one }) => ({
  creator: one(users, {
    fields: [channelModerations.creatorId],
    references: [users.id],
    relationName: "channel_moderations_creator_id_fkey",
  }),
  viewer: one(users, {
    fields: [channelModerations.viewerId],
    references: [users.id],
    relationName: "channel_moderations_viewer_id_fkey",
  }),
}));

// ====================== COMMENTS ======================
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id"),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .references(() => posts.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    imageUrl: text("image_url"),
    timestamp: integer("timestamp"),
    isPinned: boolean("is_pinned").default(false).notNull(),
    creatorHearted: boolean("creator_hearted").default(false).notNull(),
    moderationStatus: commentStatus("moderation_status").default("published").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
      name: "comments_parent_id_fkey",
    }),
  ],
);

export const commentReactions = pgTable(
  "comment_reactions",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    commentId: uuid("comment_id")
      .references(() => comments.id, { onDelete: "cascade" })
      .notNull(),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "comment_reactions_pk",
      columns: [t.userId, t.commentId],
    }),
  ],
);

export const commentReactionRelations = relations(
  commentReactions,
  ({ one }) => ({
    user: one(users, {
      fields: [commentReactions.userId],
      references: [users.id],
    }),
    comment: one(comments, {
      fields: [commentReactions.commentId],
      references: [comments.id],
    }),
  }),
);

// Bây giờ mới định nghĩa commentRelations
export const commentRelations = relations(comments, ({ one, many }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  video: one(videos, { fields: [comments.videoId], references: [videos.id] }),
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "comments_parent_id_fkey",
  }),
  reactions: many(commentReactions), // ok, đã biết commentReactions
  replies: many(comments, { relationName: "comments_parent_id_fkey" }),
}));


export const commentSelectSchema = createSelectSchema(comments);
export const commentInsertSchema = createInsertSchema(comments);
export const commentUpdateSchema = createUpdateSchema(comments);

// ====================== VIDEO REACTIONS & VIEWS ======================
export const videoReactions = pgTable(
  "video_reactions",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ name: "video_reactions_pk", columns: [t.userId, t.videoId] }),
  ],
);

export const videoReactionRelations = relations(videoReactions, ({ one }) => ({
  user: one(users, { fields: [videoReactions.userId], references: [users.id] }),
  video: one(videos, {
    fields: [videoReactions.videoId],
    references: [videos.id],
  }),
}));

export const videoViews = pgTable(
  "video_views",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    progress: integer("progress").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ name: "video_views_pk", columns: [t.userId, t.videoId] }),
  ],
);

export const viewEvents = pgTable(
  "view_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export const videoViewRelations = relations(videoViews, ({ one }) => ({
  user: one(users, { fields: [videoViews.userId], references: [users.id] }),
  video: one(videos, { fields: [videoViews.videoId], references: [videos.id] }),
}));

// ====================== NOTIFICATIONS ======================
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  actorId: uuid("actor_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: notificationType("type").notNull(),
  videoId: uuid("video_id").references(() => videos.id, {
    onDelete: "cascade",
  }),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, {
    onDelete: "cascade",
  }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: "notifications_user_id_fkey",
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: "notifications_actor_id_fkey",
  }),
  video: one(videos, {
    fields: [notifications.videoId],
    references: [videos.id],
  }),
  post: one(posts, { fields: [notifications.postId], references: [posts.id] }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id],
  }),
}));

export const notificationSelectSchema = createSelectSchema(notifications);
export const notificationInsertSchema = createInsertSchema(notifications);
export const notificationUpdateSchema = createUpdateSchema(notifications);
// ====================== REPORTS & MODERATION ======================
export const reportType = pgEnum("report_type", ["video", "comment", "user", "post"]);
export const reportStatus = pgEnum("report_status", [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  targetId: uuid("target_id").notNull(),
  targetType: reportType("target_type").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: reportStatus("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reportRelations = relations(reports, ({ one }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
}));
