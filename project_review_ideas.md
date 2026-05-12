

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

### 5. CSS & Styling
- `globals.css` có `body { user-select: none }` → chặn user select text trên toàn trang
- `font-family: Arial` override font Inter đã import từ Google Fonts
- Duplicate `@layer base { * { @apply border-border; } }`

---

## 💡 Ý Tưởng Phát Triển

### 🟡 Ưu tiên trung bình — Nên làm trong 1-2 tháng

#### 6. Hệ Thống Live Streaming
- Tích hợp Mux Live
- Chat real-time trong live stream
- Lưu lại VOD sau khi stream kết thúc
- Scheduled live streams

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


