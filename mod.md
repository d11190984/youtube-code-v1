# 🛡️ Hệ Thống Kiểm Duyệt Cộng Đồng (Moderation System)

Tài liệu này quy định về các cấp bậc và quyền hạn của đội ngũ kiểm duyệt trên kênh.

---

## 📊 Bảng So Sánh Quyền Hạn

| Tính năng | Người dùng thường | 🛡️ Kiểm duyệt Tiêu chuẩn | 🛡️ Kiểm duyệt Quản lý |
| :--- | :---: | :---: | :---: |
| Viết bình luận | ✅ | ✅ | ✅ |
| Xóa bình luận của mình | ✅ | ✅ | ✅ |
| **Huy hiệu nhận diện** | ❌ | **Khiên Xanh** | **Khiên Tím (VIP)** |
| **Xóa bình luận người khác** | ❌ | ✅ | ✅ |
| **Ẩn người dùng khỏi kênh** | ❌ | ❌ | ✅ |
| **Quản lý từ khóa cấm** | ❌ | ❌ | ✅ |

---

## 🏗️ Chi Tiết Các Cấp Bậc

### 1. Kiểm duyệt viên Tiêu chuẩn (Standard Moderator)
*Đối tượng: Fan cứng, tình nguyện viên tin cậy.*
*   **Nhận diện:** Huy hiệu **Khiên Xanh Dương** cạnh tên.
*   **Quyền hạn:**
    *   Loại bỏ các bình luận spam, độc hại của khán giả khác.
    *   Giữ môi trường thảo luận lành mạnh.
*   **Hạn chế:** Không có quyền ẩn người dùng vĩnh viễn hoặc can thiệp vào cài đặt kênh.

### 2. Kiểm duyệt viên cấp Quản lý (Manager Moderator)
*Đối tượng: Bạn thân, cộng sự, nhân viên quản lý kênh.*
*   **Nhận diện:** Huy hiệu **Khiên Tím Đậm** (To hơn, nổi bật hơn).
*   **Quyền hạn:**
    *   Bao gồm toàn bộ quyền của cấp Tiêu chuẩn.
    *   **Quyền "Shadowban":** Ẩn hoàn toàn một người dùng khỏi kênh (người đó vẫn bình luận được nhưng không ai thấy).
    *   **Quản trị:** Sau này sẽ có thêm quyền quản lý danh sách từ khóa bị chặn và cài đặt livestream.

---

## ⚙️ Trạng thái triển khai hiện tại
- [x] **Cơ sở dữ liệu:** Đã phân loại `standard_mod` và `manager_mod`.
- [x] **Hệ thống Badge:** Đã hiển thị Khiên Xanh/Khiên Tím tại Studio và Trang xem video.
- [x] **Thực thi:** API đã cho phép các Mod thực hiện quyền Xóa bình luận.
- [x] **Bộ lọc:** Tự động ẩn bình luận của những người bị "Ẩn khỏi kênh".