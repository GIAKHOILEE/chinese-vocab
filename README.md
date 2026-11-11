# Chinese Writing Practice ✍️🇨🇳

**Chinese Writing Practice** là ứng dụng web cá nhân giúp luyện viết chữ Hán ra giấy dựa trên các câu do AI (Google Gemini API) tự động tạo từ danh sách từ vựng người dùng đã học.

---

## 🌟 Tính năng chính

1. **Quản lý từ vựng (Vocabulary System)**:
   - Thêm từ vựng thủ công (Chinese word, Vietnamese meaning, Pinyin, Level).
   - Paste hàng loạt nhiều từ (mỗi dòng một từ hoặc định dạng `word | meaning | pinyin | level`).
   - Import dữ liệu từ tệp CSV (`word,meaning,pinyin,level`).
   - Tìm kiếm, lọc theo cấp độ (HSK1, HSK2, HSK3, Beginner), chỉnh sửa và xóa.

2. **AI Sentence Generation (Google Gemini Cloud API)**:
   - Gửi danh sách từ vựng đã chọn + tùy chọn số câu, độ khó, và Vocabulary Mode (`STRICT`, `BASIC`, `FLEXIBLE`).
   - Hạn mức cao vượt trội **1.000.000 Tokens/phút (TPM)**, sinh câu cực nhanh không lo bị giới hạn Rate Limit.
   - Cơ chế tự động thử lại (Retry lên tới 3 lần) và validate từ vựng bằng thuật toán **Chinese Tokenizer (MaxMatch)**.
   - **STRICT Mode**: Đảm bảo AI không tự do sử dụng từ ngoài danh sách đã học (ngoại trừ danh sách `BASIC_CHINESE_WORDS` cơ bản được cho phép).

3. **Chuyển đổi Pinyin tự động**:
   - Tự động sinh phiên âm Pinyin kèm thanh điệu chuẩn bằng thư viện Node.js (`pinyin-pro`), không phụ thuộc vào LLM.

4. **Giao diện Luyện tập Viết tay (Minimalist Practice UI)**:
   - **Mặc định CHỈ hiển thị câu tiếng Việt**.
   - Bấm **"Xem đáp án"** hoặc bấm phím tắt `Space` để mở câu tiếng Trung chuẩn & Pinyin.
   - Bấm **"Câu tiếp theo"** hoặc phím tắt `ArrowRight` để chuyển câu.
   - Tập trung 100% vào việc người dùng **tự cầm bút viết ra giấy**.

5. **Lịch sử bài tập & Thống kê**:
   - Lưu trữ và làm lại các bộ bài tập cũ.
   - Trang Dashboard tổng quan số lượng từ vựng, bài tập và câu đã luyện.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: NestJS, TypeScript, Prisma ORM, Class Validator, Pinyin-Pro, CSV-Parse.
- **Database**: PostgreSQL 16.
- **AI**: Google Gemini API (model `gemini-3.5-flash`).
- **Containerization**: Docker & Docker Compose.

---

## 🚀 Hướng dẫn chạy nhanh bằng Docker Compose

### 1. Tạo file cấu hình môi trường:

Khai báo `GEMINI_API_KEY` và tùy chọn `GEMINI_MODEL` (mặc định: `gemini-3.5-flash`) trong file `.env` (Lấy API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/)).

```env
GEMINI_API_KEY="AQ.Ab8RN6Jx..."
GEMINI_MODEL="gemini-3.5-flash"
```

### 2. Khởi chạy tất cả các dịch vụ (PostgreSQL, Backend, Frontend):

```bash
docker compose up -d
```

### 3. Truy cập ứng dụng:
- **Frontend**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:3002](http://localhost:3002)

---

## 💻 Hướng dẫn phát triển & Chạy Local không cần Docker

### Yêu cầu tiên quyết:
- Node.js >= 20.x
- PostgreSQL đang chạy tại `localhost:5432`
- Gemini API Key miễn phí từ [Google AI Studio](https://aistudio.google.com/)

### Bước 1: Khởi động Backend (NestJS)

```bash
cd backend

# Cài đặt thư viện
npm install

# Khởi tạo biến môi trường (.env)
cp .env.example .env (hoặc tạo file .env và điền GEMINI_API_KEY)

# Push schema vào PostgreSQL & Generate Prisma Client
npx prisma db push

# Nạp dữ liệu mẫu 20 từ HSK1 & 1 bài tập mẫu
npm run prisma:seed

# Chạy backend server ở chế độ dev
npm run start:dev
```

### Bước 2: Khởi động Frontend (Next.js)

```bash
cd frontend

# Cài đặt thư viện
npm install

# Chạy frontend dev server
npm run dev
```

Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000) (hoặc port hiển thị).

---

## 📚 Document REST APIs (NestJS Backend)

### 1. Từ Vựng (Vocabulary)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/vocabulary` | Lấy danh sách từ vựng (Query `search`, `level`) |
| `GET` | `/vocabulary/:id` | Xem chi tiết 1 từ vựng |
| `POST` | `/vocabulary` | Thêm 1 từ vựng thủ công |
| `POST` | `/vocabulary/bulk` | Nhập nhiều từ vựng qua paste text |
| `POST` | `/vocabulary/import` | Import file CSV hoặc chuỗi CSV content |
| `PATCH` | `/vocabulary/:id` | Cập nhật từ vựng |
| `DELETE` | `/vocabulary/:id` | Xóa từ vựng |

### 2. Bài Tập (Practice)
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/practice/generate` | Gửi yêu cầu AI sinh câu bài tập mới & sinh Pinyin |
| `GET` | `/practice` | Lấy danh sách lịch sử bài tập |
| `GET` | `/practice/stats/dashboard` | Lấy số liệu thống kê cho Dashboard |
| `GET` | `/practice/:id` | Lấy chi tiết bộ bài tập kèm danh sách câu hỏi |
| `DELETE` | `/practice/:id` | Xóa bài tập |

#### Request mẫu cho `POST /practice/generate`:
```json
{
  "vocabularyIds": ["uuid-1", "uuid-2", "uuid-3"],
  "questionCount": 10,
  "difficulty": "HSK1",
  "mode": "STRICT"
}
```

---

## 🧪 Testing & Verification

Chạy unit tests cho Backend (Kiểm tra Pinyin, AI Output Validation STRICT mode & Vocabulary):

```bash
cd backend
npm run test
```

---

## 📄 Giấy phép

Dự án phát triển mã nguồn mở phục vụ mục đích học tập cá nhân.
