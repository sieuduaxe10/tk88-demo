# TK88 Deploy — Vercel + Railway (Demo)

> **Cảnh báo pháp lý**: Đây là demo kỹ thuật. **Không nhận tiền thật**, không quảng cáo công khai ở VN. Giữ tên miền/subdomain ở mức portfolio.

## Kiến trúc

```
┌────────────────┐    HTTPS     ┌──────────────────┐
│  Vercel (SPA)  │ ───────────> │ Railway (Node)   │
│  frontend/dist │              │ tk88-lite.ts     │
└────────────────┘              │ + SQLite @ /data │
                                └──────────────────┘
```

Frontend = Vercel (free). Backend + SQLite = Railway ($5/tháng, đã gồm 1 GB volume).

---

## A. Chuẩn bị (1 lần)

1. **Push code lên GitHub.** Railway & Vercel đều deploy từ GitHub repo.
2. **Tạo tài khoản**:
   - [vercel.com](https://vercel.com) — đăng nhập bằng GitHub.
   - [railway.app](https://railway.app) — đăng nhập bằng GitHub.
3. **Sinh secret mới** cho JWT + admin token (chạy local):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Chạy **3 lần** để có 3 giá trị cho `TK88_JWT_SECRET`, `TK88_REFRESH_SECRET`, `TK88_ADMIN_TOKEN`.

---

## B. Deploy Backend → Railway (trước, vì FE cần URL)

1. Railway Dashboard → **New Project → Deploy from GitHub repo** → chọn repo.
2. **Root Directory**: `tk88-gaming/backend` (nếu monorepo).
3. Railway sẽ tự phát hiện `Dockerfile`.
4. **Variables** (tab Settings → Variables) — dán vào:
   ```
   TK88_DB=/data/tk88-lite.db
   TK88_JWT_SECRET=<hex 64 ký tự #1>
   TK88_REFRESH_SECRET=<hex 64 ký tự #2>
   TK88_ADMIN_TOKEN=<hex 64 ký tự #3>
   CORS_ORIGIN=https://<sẽ-điền-sau>.vercel.app
   NODE_ENV=production
   ```
   > `CORS_ORIGIN` để trống tạm lúc đầu cũng được (sẽ cho phép tất cả). Điền sau khi có URL Vercel.
5. **Volume** (rất quan trọng, để SQLite không mất khi redeploy):
   Settings → Volumes → **Mount path: `/data`** → Size 1 GB.
6. **Networking** → Generate Domain. Ghi lại URL, ví dụ `https://tk88-backend-production.up.railway.app`.
7. **Kiểm tra**:
   ```bash
   curl https://<railway-url>/tk88/health
   # → {"ok":true,"service":"tk88-lite"}
   ```
8. Mở `https://<railway-url>/tk88/admin` → đăng nhập bằng `TK88_ADMIN_TOKEN` mới.

---

## C. Deploy Frontend → Vercel

1. Vercel Dashboard → **Add New Project** → Import GitHub repo.
2. **Root Directory**: `tk88-gaming/frontend`.
3. Framework preset: Vite (tự nhận).
4. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://<railway-url-từ-bước-B>
   ```
5. **Deploy**. Vercel sẽ cấp URL `https://<project>.vercel.app`.
6. **Quay lại Railway** → update biến `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://<project>.vercel.app
   ```
   Nếu có custom domain: thêm vào, ngăn cách dấu phẩy.
7. Railway tự redeploy → chờ ~30s.

---

## D. Smoke test

1. Mở `https://<project>.vercel.app`.
2. Đăng ký 1 tài khoản mới → nạp thử 50,000 ₫ qua bank.
3. Mở admin `https://<railway-url>/tk88/admin` → thấy giao dịch pending → Duyệt.
4. Về FE → số dư đã cộng.
5. Đặt cược 1 ván Bầu Cua với 2 cửa → kiểm tra multi-bet.

---

## E. Bảo trì

- **Backup DB**: Railway → Volumes → Download snapshot, hoặc CLI:
  ```bash
  railway run "cp /data/tk88-lite.db /data/backup-$(date +%F).db"
  ```
- **Đổi admin token**: cập nhật `TK88_ADMIN_TOKEN` trong Variables → redeploy.
- **Xem log**: Railway → service → tab Logs.

---

## F. Gỡ deploy

- Railway: Settings → Danger → Delete Project.
- Vercel: Settings → Delete Project.

---

## Troubleshooting

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| `CORS blocked` trên FE | `CORS_ORIGIN` không khớp Vercel URL | Copy chính xác (kể cả `https://`), redeploy Railway |
| `Không kết nối được máy chủ` | Railway ngủ / sập | Check `/tk88/health`, xem Railway logs |
| `bad_admin_token` | Token sai | Dùng giá trị trong Railway Variables, không phải `admin123` |
| Balance reset sau redeploy | Volume chưa mount `/data` | Settings → Volumes → mount vào `/data` |
| Build fail `better-sqlite3` | Thiếu python/g++ | Đã có trong Dockerfile; nếu vẫn lỗi, kiểm tra node version = 20 |

---

## Chi phí dự kiến

| Service | Free tier | Sau đó |
|---|---|---|
| Vercel Hobby | Đủ dùng cho demo | $0 |
| Railway | $5 credit/tháng miễn phí 1 lần | ~$5/tháng khi vượt |
| **Tổng** | **$0 tháng đầu** | **~$5/tháng** |
