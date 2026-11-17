# راهنمای اجرای فاز ۱

این راهنما برای اجرای محلی پروژه، از جمله روی Android و Termux نوشته شده است.

## پیش‌نیازها
- Python 3.11 یا بالاتر
- Node.js 20 یا بالاتر و npm
- Git

در Termux:

```bash
pkg update
pkg install python nodejs-lts git
```

اگر مخزن را هنوز دریافت نکرده‌ای:

```bash
git clone https://github.com/ErfanJavadian/Agent_editor.git
cd Agent_editor
```

اگر مخزن از قبل روی دستگاه وجود دارد، وارد پوشه آن شو و آخرین تغییرات را بگیر:

```bash
git pull origin main
```

## ۱. اجرای Backend

از ریشه مخزن:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

نشانی‌ها:
- سلامت API: http://127.0.0.1:8000/api/v1/health
- مستندات API: http://127.0.0.1:8000/api/docs

## ۲. اجرای Frontend

Backend را روشن نگه دار. یک نشست Termux دیگر باز کن:

```bash
cd ~/Agent_editor/frontend
npm install
npm run dev
```

سپس در مرورگر همان دستگاه باز کن:

http://127.0.0.1:5173

Vite درخواست‌های `/api` را به Backend محلی روی پورت ۸۰۰۰ هدایت می‌کند.

## ۳. تست Backend

در پوشه `backend`:

```bash
source .venv/bin/activate
pytest
```

## ۴. بررسی Frontend

در پوشه `frontend`:

```bash
npm run typecheck
npm run build
```

## مشکلات رایج
- اگر پورت ۸۰۰۰ اشغال است، فرایند قبلی را متوقف کن یا پورت را تغییر بده و مقصد proxy در `frontend/vite.config.ts` را نیز هماهنگ کن.
- اگر `nodejs-lts` در مخزن بسته‌های Termux پیدا نشد، نام بسته Node.js موجود را با `pkg search nodejs` بررسی کن.
- اگر نصب وابستگی روی Android خطا داد، متن کامل خطا را ارسال کن تا بر اساس همان خطا اصلاح کنیم.
- برای دسترسی از دستگاه دیگر، سرور را بدون بررسی امنیتی روی `0.0.0.0` باز نکن.

این فاز اسکلت و تست‌های اولیه را اضافه می‌کند. تا زمان اجرای دستورها روی محیط هدف، نتیجه را تأییدشده تلقی نکن.


## ۵. پیکربندی Nango (GitHub)

**محدودیت حساب:** طبق شرایط Nango، دارنده حساب فردی باید حداقل ۱۸ سال داشته باشد. اگر توسعه‌دهنده زیر ۱۸ سال است، یک والد/سرپرست بزرگسال باید حساب را ایجاد و مدیریت کند و خودش شرایط را بپذیرد. از تاریخ تولد نادرست استفاده نکن.

1. مدیر بزرگسال در [Nango signup](https://app.nango.dev/signup) حساب بسازد و ایمیل را تأیید کند.
2. در داشبورد به **Environment settings → API Keys** برود و کلید پیش‌فرض Environment را کپی کند. این کلید باید مجوز `environment:agent_sessions:write` داشته باشد.
3. در ریشه مخزن، فایل محلی را بساز:

```bash
cd ~/Agent_editor
test -f .env || cp .env.example .env
nano .env
```

4. مقدار کلید را فقط در فایل محلی `.env` قرار بده:

```dotenv
NANGO_API_KEY=کلید_واقعی_را_اینجا_قرار_بده
NANGO_API_BASE_URL=https://api.nango.dev
NANGO_USER_ID=agent-editor-local-user
```

5. فایل `.env` در `.gitignore` قرار دارد. کلید را در GitHub، کد Frontend، اسکرین‌شات یا چت قرار نده. اگر کلید جایی افشا شد، آن را در داشبورد Nango باطل و جایگزین کن.
6. Backend را دوباره اجرا کن تا متغیرها بارگذاری شوند. سپس در رابط Agent Editor:
   - وضعیت Nango باید به حالت تنظیم‌شده تغییر کند.
   - روی **ساخت لینک اتصال GitHub** بزن.
   - لینک تأیید را باز کن و حساب GitHub موردنظر را مجاز کن.
   - پس از بازگشت، روی **کشف ابزارهای GitHub** بزن.
   - برای تأیید اجرای واقعی یک ابزار، روی **اجرای تست read-only واقعی** بزن. این تست فقط metadata مخزن عمومی `NangoHQ/nango` را می‌خواند و چیزی را تغییر نمی‌دهد.

Backend Integration با شناسه `github` را در صورت نیاز می‌سازد و یک نشست ۱۰ دقیقه‌ای می‌گیرد. ابزارها از طریق MCP کشف می‌شوند. کلید اصلی و session token به مرورگر ارسال نمی‌شوند.

### APIهای محلی Nango

- `GET /api/v1/integrations/nango/status`
- `POST /api/v1/integrations/nango/github/connect`
- `POST /api/v1/integrations/nango/tools/search`
- `POST /api/v1/integrations/nango/github/test` (تست ثابت و فقط‌خواندنی)

نمونه تست کشف ابزار با curl:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/integrations/nango/tools/search \
  -H 'Content-Type: application/json' \
  -d '{"queries":["read repository details"],"goal":"Find read-only GitHub repository tools"}'
```

**مرز نسخه فعلی:** Nango session و MCP tool discovery پیاده‌سازی شده‌اند؛ اتصال ابزارها به چرخه اجرای مدل در Agent Core تا زمان ساخت Model Gateway و Agent Runtime کامل محسوب نمی‌شود.
