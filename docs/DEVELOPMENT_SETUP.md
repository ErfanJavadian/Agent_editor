# راه‌اندازی محیط توسعه Agent Editor

این راهنما برای شاخه بازطراحی ویرایشگر ویدئو نوشته شده است.

## پیش‌نیازها
- Git
- Node.js 20 یا جدیدتر
- npm همراه Node.js

Backend قدیمی برای اجرای پوسته فعلی تدوین لازم نیست. پردازش رسانه و API محلی در milestoneهای بعدی اضافه می‌شوند.

## دریافت شاخه محصول

اگر هنوز مخزن را دریافت نکرده‌ای:

```bash
git clone --branch product/video-editor-pivot https://github.com/ErfanJavadian/Agent_editor.git
cd Agent_editor
```

اگر مخزن را قبلاً دریافت کرده‌ای:

```bash
git fetch origin
git switch product/video-editor-pivot
git pull --ff-only origin product/video-editor-pivot
```

## نصب و اجرای رابط تدوین

```bash
cd frontend
npm install
npm run dev
```

آدرس محلی:

`http://127.0.0.1:5173`

در Android، مرورگر همان گوشی می‌تواند آدرس localhost را باز کند. سرور Vite به‌صورت پیش‌فرض فقط روی loopback گوش می‌دهد.

## اجرای تست‌ها و build

از پوشه `frontend`:

```bash
npm test
npm run typecheck
npm run build
```

تست‌های هسته مشترک در `packages/project-core/tests` قرار دارند و از طریق اسکریپت Vitest در ریشه مخزن کشف می‌شوند.

## وضعیت محدودیت‌های prototype فعلی

- واردکردن ویدئو/صدا از طریق مرورگر انجام می‌شود.
- فایل‌ها به سرور آپلود نمی‌شوند و URLهای موقت مرورگر فقط تا پایان نشست معتبرند.
- پروژه هنوز در IndexedDB یا فایل پروژه قابل‌انتقال ذخیره نمی‌شود.
- خروجی MP4، رندر واقعی، چندکلیپی audio mixing، افکت‌ها و undo پایدار هنوز پیاده‌سازی نشده‌اند.
- FPS اولیه sequence برابر 30 است؛ تشخیص دقیق frame rate منبع و تبدیل frame-rate هنوز در دست طراحی است.
- پیش‌نمایش فعلی از قابلیت HTMLVideoElement مرورگر استفاده می‌کند و جایگزین موتور رسانه دسکتاپ نیست.

این محدودیت‌ها باید قبل از اعلام آماده‌بودن نسخه اول برطرف یا مستند شوند.
