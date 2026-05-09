# 📋 Nhận Xét & Ý Tưởng Phát Triển — Dự Án NewTube

> **Dự án:** NewTube (YouTube Clone)  
> **Ngày đánh giá:** 06/05/2026  
> **Phiên bản:** 0.1.0

---

## 📊 Tổng Quan Dự Án

### Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | Neon (PostgreSQL Serverless) |
| **ORM** | Drizzle ORM |
| **Auth** | Clerk |
| **API** | tRPC v11 (React Query) |
| **Video** | Mux (streaming, HLS, subtitles) |
| **File Upload** | UploadThing |
| **Rate Limiting** | Upstash Redis + Ratelimit |
| **Background Jobs** | Upstash Workflow |
| **AI Features** | Workflow-based (title, description, thumbnail generation) |
| **Styling** | Tailwind CSS + Radix UI (shadcn/ui) |
| **Media** | Cloudinary (images), FFmpeg (video processing) |

### Cấu Trúc Module

```
src/modules/
├── auth/              # Xác thực
├── categories/        # Danh mục video
├── comments/          # Hệ thống bình luận (reply, pin, heart, reaction)
├── comment-reactions/  # Like/dislike bình luận
├── home/              # Trang chủ (layouts, sections, views)
├── playlists/         # Playlist thường + Mix playlist
├── search/            # Tìm kiếm
├── studio/            # Creator Studio (dashboard, video manager)
├── subscriptions/     # Đăng ký kênh
├── suggestions/       # Đề xuất video
├── users/             # Hồ sơ người dùng (banner, bio, avatar)
├── video-reactions/   # Like/dislike video
├── video-views/       # Tracking lượt xem + tiến độ
└── videos/            # Core video (player, upload, CRUD)
```

### Trang & Routes

| Route | Mô tả |
|-------|--------|
| `/` | Trang chủ — video grid + filter theo danh mục |
| `/feed/trending` | Video thịnh hành |
| `/feed/subscribed` | Video từ kênh đã đăng ký |
| `/feed/shorts` | Video ngắn (≤ 60s) |
| `/videos/[videoId]` | Xem video + bình luận + gợi ý |
| `/users/[userId]` | Trang kênh người dùng |
| `/users/current` | Trang cá nhân |
| `/playlists` | Danh sách playlist |
| `/playlists/history` | Lịch sử xem |
| `/playlists/liked` | Video đã thích |
| `/playlists/[playlistId]` | Chi tiết playlist |
| `/subscriptions` | Kênh đã đăng ký |
| `/search` | Tìm kiếm |
| `/studio` | Studio — Quản lý nội dung |
| `/studio/dashboard` | Dashboard tổng quan |
| `/studio/videos/[videoId]` | Chỉnh sửa video |

---

## ✅ Điểm Mạnh

### 1. Kiến trúc Module rõ ràng
- Mỗi module có `server/`, `ui/`, `types.ts` riêng biệt → dễ maintain
- Tách biệt `components`, `sections`, `views`, `layouts` trong UI
- Pattern `Suspense + ErrorBoundary` nhất quán ở mọi section

### 2. tRPC Type-Safe End-to-End
- Toàn bộ API đều type-safe từ server → client
- Cursor-based pagination đúng chuẩn cho infinite scroll
- Optimistic updates (incrementView, comment reactions)

### 3. Video Player tinh vi
- Progress tracking chính xác với nhiều case (restart, jitter, seek, completed)
- Auto-next với countdown overlay
- Loop mode + Auto-next toggle
- `sendBeacon` để save progress khi thoát trang
- Hỗ trợ video dọc (Shorts) với UI riêng
- Ambient glow effect từ thumbnail

### 4. Hệ thống Comments đầy đủ
- Reply nhiều cấp
- Pin comment (chỉ chủ kênh)
- Heart comment (creator)
- Like/dislike reactions
- Sắp xếp theo "Top" (engagement score) hoặc "Newest"

### 5. AI Features
- AI generate title từ video transcript
- AI generate description
- AI generate thumbnail từ prompt
- Tất cả chạy qua Upstash Workflow (async, không block UI)

### 6. Playlist System phức tạp
- Playlist thường + Mix playlist
- Public/Private visibility
- Lịch sử xem + Video đã thích (auto-playlist)
- Thêm/xóa video từ playlist

### 7. UX tốt
- Dark mode support
- Micro-animations và hover effects
- Scroll-to-top character
- Click effect toàn trang
- Responsive design cho mobile

---

## ⚠️ Điểm Cần Cải Thiện

### 1. Performance — N+1 Query Problem
```
// studio/procedures.ts — getMany
const itemsWithAvgView = await Promise.all(
  items.map(async (v) => {
    const views = await db.select()... // ❌ N+1 query!
  })
);
```

### 2. Thiếu Error Handling UI
- Nhiều chỗ chỉ hiện `<p>Error</p>` trong ErrorBoundary
- Không có retry mechanism cho user
- Loading states một số nơi chỉ là text đơn giản ("Đang tải số liệu...")

### 3. Security Gaps
- `cors_origin: "*"` trong Mux upload config (comment TODO nhưng chưa fix)
- `updateBio` dùng `baseProcedure` thay vì `protectedProcedure` (tuy có check `clerkUserId` manual)
- Thiếu input sanitization cho comment `value` (có DOMPurify trong deps nhưng chưa rõ dùng ở đâu)


### 5. CSS & Styling
- `globals.css` có `body { user-select: none }` → chặn user select text trên toàn trang
- `font-family: Arial` override font Inter đã import từ Google Fonts
- Duplicate `@layer base { * { @apply border-border; } }`

---

## 💡 Ý Tưởng Phát Triển

### 🔴 Ưu tiên cao — Nên làm ngay

#### 1. Hệ Thống Thông Báo (Notifications)
- Thông báo khi có người subscribe, bình luận, like video
- Real-time notifications bằng WebSocket hoặc Server-Sent Events
- Bell icon trên navbar với badge count
- Trang quản lý thông báo

#### 2. Trang Số Liệu Phân Tích (Analytics Page)
- Route `/studio/analytics` đã có trong sidebar nhưng chưa build
- Biểu đồ lượt xem theo thời gian (dùng Recharts — đã install)
- Top videos, thống kê subscriber growth
- Watch time analytics, audience retention

#### 3. Trang Cộng Đồng (Community Page)
- Route `/studio/community` đã có trong sidebar nhưng chưa build
- Community posts (text, images, polls)
- Tương tác giữa creator và subscriber

---

### 🟡 Ưu tiên trung bình — Nên làm trong 1-2 tháng

#### 6. Hệ Thống Live Streaming
- Tích hợp Mux Live
- Chat real-time trong live stream
- Lưu lại VOD sau khi stream kết thúc
- Scheduled live streams

#### 10. Hệ Thống Tags & Hashtags
- Thêm tags cho video
- Click tag để filter/search
- Trending tags section
- Autocomplete tags khi nhập

#### 13. Multi-Language Support (i18n)
- Hiện tại UI hoàn toàn bằng Tiếng Việt
- Thêm hỗ trợ English, Japanese,...
- Dùng `next-intl` hoặc `react-i18next`

#### 15. Hệ Thống Report / Báo Cáo Vi Phạm
- Report video, comment, user
- Admin review queue
- Auto-moderation rules

---

### 🟢 Ưu tiên thấp — Ý tưởng dài hạn

#### 18. End Screens & Cards
- Thêm cards (link video khác) vào cuối video
- End screen với subscribe button
- Interactive elements overlay

#### 22. Video Clips
- Tạo clip ngắn từ video dài (giống YouTube Clips)
- Share clip với timestamp range
- Embed clip

#### 25. Advanced Comment Features
- Comment với timestamp (click để nhảy đến thời điểm)
- Comment với hình ảnh/GIF
- @mention user trong comment
- Comment moderation tools

#### 29. Embed Player
- Embeddable video player cho website khác
- Custom embed options (autoplay, start time)
- Embed code generator trong Studio

#### 30. Admin Dashboard
- Quản lý toàn bộ users, videos, comments
- Content moderation queue
- Platform analytics (MAU, DAU, total watch time)
- Ban/suspend accounts

---

### Fix CSS Issues
```diff
// globals.css
- body {
-   font-family: Arial, Helvetica, sans-serif;
- }
+ /* Để Inter font từ layout.tsx hoạt động đúng */

- body {
-   user-select: none;
-   -webkit-user-select: none;
- }
+ /* Chỉ chặn select ở những element cần thiết, không phải toàn bộ body */
```


