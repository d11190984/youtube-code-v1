

## ⚠️ Điểm Cần Cải Thiện

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

---

### 🟢 Ưu tiên thấp — Ý tưởng dài hạn

#### 22. Video Clips
- Tạo clip ngắn từ video dài (giống YouTube Clips)
- Share clip với timestamp range
- Embed clip
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


