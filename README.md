# 🏨 DenousceBooking — Website đặt phòng khách sạn

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen?logo=github)](https://benhochoi.github.io/DENOUSCEBOOKING.COM)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Benhochoi/DENOUSCEBOOKING.COM/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

---

## 📖 Mô tả dự án

**DenousceBooking** là một website đặt phòng khách sạn trực tuyến được xây dựng thuần bằng HTML, CSS và JavaScript — không sử dụng framework hay back-end. Dự án mô phỏng hệ thống tìm kiếm và đặt phòng khách sạn tại các địa điểm du lịch nổi bật ở Việt Nam: **Hà Nội**, **TP. Hồ Chí Minh**, **Đà Nẵng** và **Phú Quốc**.

Người dùng có thể duyệt danh sách khách sạn, xem thông tin chi tiết, thực hiện đặt phòng với tính năng tự động tính tiền, lưu khách sạn yêu thích và theo dõi lịch sử đặt phòng — tất cả hoạt động hoàn toàn phía client, dữ liệu được lưu trữ trong `localStorage`.

### ✨ Tính năng chính

- 🔍 **Tìm kiếm khách sạn** theo thành phố (Hà Nội, TP.HCM, Đà Nẵng, Phú Quốc)
- 🏩 **Trang chi tiết khách sạn** — hình ảnh, đánh giá, tiện nghi, bảng giá phòng
- 📅 **Đặt phòng & tự động tính tiền** — chọn ngày, số phòng, số người; hệ thống tự tính tổng chi phí
- ✅ **Xác nhận đặt phòng** bằng popup và lưu lịch sử vào `localStorage`
- ❤️ **Yêu thích khách sạn** — lưu và đồng bộ danh sách khách sạn yêu thích giữa các trang
- 👤 **Đăng ký / Đăng nhập** — có validation (định dạng email, số điện thoại 10 số, CCCD 12 số)
- 📋 **Trang cá nhân** — xem thông tin tài khoản, lịch sử đặt phòng và danh sách yêu thích
- 📱 **Responsive** — tương thích desktop, tablet và điện thoại di động
- 📬 **Trang liên hệ** và **Giới thiệu** đầy đủ

### 💡 Lý do lựa chọn công nghệ

Dự án sử dụng **HTML + CSS + JavaScript thuần** (Vanilla JS) vì:

- Phù hợp với học phần Thiết kế Web — tập trung vào nền tảng front-end
- Không cần môi trường cài đặt phức tạp, triển khai ngay bằng GitHub Pages
- Dễ dàng phân chia công việc theo từng trang (page-based structure) trong nhóm

### ⚠️ Thách thức đã gặp

- **Đồng bộ trạng thái** giữa các trang HTML riêng biệt (yêu thích, đăng nhập) khi không có framework state management — giải quyết bằng cách chuẩn hóa quy trình đọc/ghi `localStorage`
- **Tính tiền tự động** đòi hỏi logic xử lý ngày tháng chính xác (tính số đêm, nhân đơn giá theo loại phòng)
- **Responsive** cho nhiều loại thẻ khách sạn với layout phức tạp — sử dụng CSS Flexbox và media queries

### 🚀 Định hướng phát triển trong tương lai

- Tích hợp **back-end** (Node.js / PHP) và **cơ sở dữ liệu** thực sự để thay thế `localStorage`
- Xây dựng **hệ thống thanh toán trực tuyến** (VNPay, Momo)
- Thêm **bộ lọc tìm kiếm** nâng cao (giá, số sao, tiện nghi)
- Phát triển **trang quản trị** (admin panel) để quản lý khách sạn và đơn đặt phòng
- Tích hợp **đánh giá và nhận xét** từ người dùng sau khi lưu trú

---

## 📑 Mục lục

- [Mô tả dự án](#-mô-tả-dự-án)
- [Cài đặt & thiết lập](#-cài-đặt--thiết-lập)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Đóng góp](#-đóng-góp)
- [Thành viên & tài liệu tham khảo](#-thành-viên--tài-liệu-tham-khảo)
- [Giấy phép](#-giấy-phép)

---

## ⚙️ Cài đặt & thiết lập

Dự án không có dependencies — chỉ cần trình duyệt web và một trong các cách chạy dưới đây.

### 1. Clone repository

```bash
git clone https://github.com/Benhochoi/DENOUSCEBOOKING.COM.git
cd DENOUSCEBOOKING.COM
```

### 2. Cài đặt dependencies

> Không cần cài đặt thêm gì. Dự án chạy hoàn toàn bằng HTML/CSS/JS thuần.

*(Tuỳ chọn)* Nếu muốn dùng Live Server extension trong VS Code để tự động reload:

```bash
# Cài extension Live Server trong VS Code
# Chuột phải vào index.html → "Open with Live Server"
```

### 3. Cấu hình biến môi trường

Không có biến môi trường cần cấu hình. Dữ liệu người dùng (tài khoản, lịch sử đặt phòng, yêu thích) được lưu trong `localStorage` của trình duyệt.

### 4. Chạy dự án

**Cách 1 — Mở trực tiếp:**

```bash
# Mở file index.html bằng trình duyệt
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

**Cách 2 — Dùng VS Code Live Server:**

```
1. Mở thư mục dự án trong VS Code
2. Cài extension "Live Server" (Ritwick Dey)
3. Chuột phải vào index.html → Open with Live Server
4. Truy cập http://127.0.0.1:5500
```

**Cách 3 — Xem trực tiếp trên GitHub Pages:**

```
https://benhochoi.github.io/DENOUSCEBOOKING.COM
```

---

## 🖥️ Hướng dẫn sử dụng

### Luồng sử dụng cơ bản

```
Trang chủ (index.html)
  └─→ Chọn thành phố (Hà Nội / TP.HCM / Đà Nẵng / Phú Quốc)
       └─→ Xem danh sách khách sạn
            └─→ Xem chi tiết khách sạn
                 ├─→ Đặt phòng (chọn ngày, số phòng) → Xác nhận → Lưu lịch sử
                 └─→ Nhấn ❤️ để lưu yêu thích
```

### Các trang chính

| Đường dẫn | Chức năng |
|---|---|
| `index.html` | Trang chủ — tìm kiếm, khách sạn nổi bật, ưu đãi |
| `pages/hanoi.html` | Danh sách khách sạn tại Hà Nội |
| `pages/saigon.html` | Danh sách khách sạn tại TP. Hồ Chí Minh |
| `pages/danang.html` | Danh sách khách sạn tại Đà Nẵng |
| `hotels/` | Trang chi tiết từng khách sạn + đặt phòng |
| `user/login.html` | Đăng nhập |
| `user/register.html` | Đăng ký tài khoản |
| `user/profile.html` | Trang cá nhân — lịch sử & yêu thích |
| `pages/contact.html` | Liên hệ |

### Ví dụ — Quy trình đặt phòng

```
1. Chọn thành phố → chọn khách sạn → nhấn "Xem phòng"
2. Trên trang chi tiết, chọn:
   - Ngày nhận phòng / trả phòng
   - Số phòng & số người
3. Hệ thống tự động tính tổng tiền
4. Nhấn "Đặt phòng" → Popup xác nhận xuất hiện
5. Đơn đặt phòng được lưu vào localStorage
6. Xem lại lịch sử tại trang cá nhân (user/profile.html)
```

## 📁 Cấu trúc thư mục

```
DENOUSCEBOOKING.COM/
├── index.html              # Trang chủ
├── asset/                  # CSS, font và tài nguyên chung
├── images/                 # Hình ảnh khách sạn và giao diện
├── scripts/                # JavaScript dùng chung
├── data/                   # Dữ liệu khách sạn (JSON hoặc JS)
├── cities/                 # Trang danh sách khách sạn theo thành phố
├── hotels/                 # Trang chi tiết từng khách sạn
├── pages/                  # Các trang phụ (liên hệ, giới thiệu, v.v.)
├── user/                   # Đăng ký, đăng nhập, trang cá nhân
└── .vscode/                # Cấu hình VS Code
```

---

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng làm theo các bước sau:

```bash
# 1. Fork repository về tài khoản của bạn

# 2. Tạo branch mới cho tính năng / sửa lỗi
git checkout -b feature/ten-tinh-nang

# 3. Commit thay đổi với message rõ ràng
git commit -m "feat: mô tả ngắn về thay đổi"

# 4. Push lên branch của bạn
git push origin feature/ten-tinh-nang

# 5. Mở Pull Request vào branch main
```

### Quy ước commit message

| Prefix | Ý nghĩa |
|---|---|
| `feat:` | Thêm tính năng mới |
| `fix:` | Sửa lỗi |
| `style:` | Thay đổi CSS / giao diện |
| `refactor:` | Tái cấu trúc code |
| `docs:` | Cập nhật tài liệu |

### Chạy kiểm thử

> Dự án chưa có automated tests. Kiểm thử được thực hiện thủ công theo các bảng test case trong tài liệu báo cáo:
> - Kiểm thử đăng ký / đăng nhập
> - Kiểm thử điều hướng và hiển thị
> - Kiểm thử chức năng đặt phòng
> - Kiểm thử chức năng yêu thích
> - Kiểm thử responsive trên các thiết bị

---

## 👥 Thành viên & tài liệu tham khảo

### Nhóm phát triển — Nhóm 7 (Học viện Ngân hàng, lớp 252IS19A02)

| Họ và tên | GitHub | Nhiệm vụ |
|---|---|---|
| Phạm Gia Khánh | [@Benhochoi](https://github.com/Benhochoi) | Trang chủ, giao diện Hà Nội, viết báo cáo chương 4 |
| Nguyễn Tuấn Đạt | [@tuandat124-bm](https://github.com/tuandat124-bm) | Giao diện Đà Nẵng, trang cá nhân, báo cáo chương 3 & 5 |
| Hoàng Xuân Hiệp | [@hxhiepttn06-star](https://github.com/hxhiepttn06-star) | Giao diện Hà Nội, trang liên hệ, đăng ký/đăng nhập, báo cáo chương 1 |
| Đào Nguyên Chiến | [@khanhthuhai](https://github.com/khanhthuhai) | Giao diện Sài Gòn, trang "Về chúng tôi", báo cáo chương 2 |

> **Giảng viên hướng dẫn:** TS. Vũ Trọng Sinh — Khoa Công nghệ thông tin và Kinh tế số, Học viện Ngân hàng

### Tài liệu tham khảo & nguồn cảm hứng

- [MDN Web Docs](https://developer.mozilla.org/) — tài liệu tham khảo HTML, CSS, JavaScript
- [Booking.com](https://www.booking.com) — tham khảo UX/UI đặt phòng khách sạn
- [Agoda](https://www.agoda.com) — tham khảo giao diện trang "Về chúng tôi"
- [CSS Tricks](https://css-tricks.com/) — kỹ thuật Flexbox và responsive design
- Hoàng Quốc Hoa (2023) — số liệu du lịch trực tuyến Việt Nam
- VNAT (2020) — Tổng cục Du lịch Việt Nam, báo cáo chuyển đổi số ngành du lịch

---

## 📄 Giấy phép

Dự án được phân phối theo giấy phép **MIT License**.

```
MIT License

Copyright (c) 2026 Nhóm 7 — Học viện Ngân hàng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

Xem toàn bộ nội dung tại [LICENSE](./LICENSE).

---

<div align="center">
  <sub>Được thực hiện với ❤️ bởi Nhóm 7 — Học viện Ngân hàng, Hà Nội · Tháng 6/2026</sub>
</div>
