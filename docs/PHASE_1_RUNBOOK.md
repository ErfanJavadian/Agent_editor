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
