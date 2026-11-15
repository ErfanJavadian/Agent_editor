# Agent Editor — Implementation Plan

این برنامه اجرایی محصول جدید Agent Editor است: ویرایشگر حرفه‌ای ویدئو با سیستم ایجنتی یکپارچه و کلاینت‌های دسکتاپ، وب و اندروید.

## Milestone 0 — Product pivot
- [x] تعریف محصول به‌عنوان ویرایشگر حرفه‌ای ویدئو
- [x] تعیین دسکتاپ، وب و اندروید به‌عنوان پلتفرم‌های هدف
- [x] تعریف اصول پروژه مشترک، تدوین غیرمخرب و کنترل انسانی
- [x] ایجاد شاخه مستقل برای تغییر مسیر بدون دست‌کاری main
- [ ] اصلاح کامل اسناد و حذف تناقض‌های باقی‌مانده

## Milestone 1 — Shared Project Core
- [ ] تعریف مدل پروژه نسخه‌دار، رسانه، Sequence، Track و Clip
- [ ] اعتبارسنجی شناسه‌ها، frame rate، ابعاد و ارجاع رسانه‌ها
- [ ] پیاده‌سازی عملیات insert / move / trim / split
- [ ] تضمین عدم هم‌پوشانی ناخواسته کلیپ‌ها در یک Track
- [ ] تست واحد و property-based برای عملیات تایم‌لاین
- [ ] ذخیره‌سازی و بازخوانی پروژه و migration

**معیار پذیرش:** یک پروژه معتبر ساخته شود، کلیپ به تایم‌لاین افزوده شود، برش/جابجایی/Trim انجام شود و تمام invariantها با تست پوشش داده شوند.

## Milestone 2 — Media Ingest and Preview
- [ ] بررسی فنی FFmpeg و محدودیت‌های مجوز توزیع
- [ ] ساخت Media Probe Adapter
- [ ] واردکردن فایل و ثبت metadata
- [ ] ساخت thumbnail و waveform
- [ ] پیش‌نمایش یک کلیپ و seek دقیق
- [ ] بررسی مصرف RAM و عملکرد روی Android واقعی

## Milestone 3 — Timeline UI
- [ ] ساخت رابط تدوین دسکتاپ‌محور
- [ ] نمایش چند Track و کلیپ‌های زمان‌بندی‌شده
- [ ] انتخاب، جابه‌جایی، Trim و Split
- [ ] پخش/توقف و اتصال Preview به playhead
- [ ] Undo / Redo
- [ ] ذخیره خودکار و بازیابی پروژه

## Milestone 4 — Render and Export
- [ ] طراحی Render Graph از Project Model
- [ ] ساخت Job Queue با progress و cancellation
- [ ] خروجی MP4 در presetهای پایه
- [ ] اطمینان از تطابق preview و export
- [ ] تست رسانه‌های واقعی و فایل‌های خراب/غیرمعتبر

## Milestone 5 — Agent Editing
- [ ] تعریف EditPlan و typed editing tools
- [ ] ابزارهای خواندن وضعیت پروژه و metadata رسانه
- [ ] ابزارهای محدود برای عملیات تایم‌لاین
- [ ] مسیر Plan → Validate → Preview Diff → Approve → Apply
- [ ] ثبت provenance و امکان undo
- [ ] تست عدم امکان اعمال عملیات نامعتبر یا خارج از محدوده

## Milestone 6 — Professional Capabilities
- [ ] Audio mixing و پردازش صدا
- [ ] Captions، زیرنویس و Title
- [ ] Transitions و keyframes
- [ ] اصلاح رنگ و افکت‌ها
- [ ] Proxy workflow و render cache
- [ ] Motion graphics و compositing پیشرفته

## Milestone 7 — Cross-platform Clients
- [ ] Desktop shell برای Windows/Linux
- [ ] Web client با تشخیص قابلیت‌های مرورگر
- [ ] Android client با تعامل لمسی
- [ ] تست round-trip یک پروژه میان سه پلتفرم
- [ ] نمایش صریح قابلیت‌های پشتیبانی‌نشده

## Milestone 8 — Release Hardening
- [ ] تست امنیت فایل‌های واردشده و project manifest
- [ ] تست crash recovery و بازیابی پروژه
- [ ] تست performance و memory روی دستگاه‌های هدف
- [ ] بررسی مجوز codecها و کتابخانه‌های ثالث
- [ ] بسته‌بندی، نصب، به‌روزرسانی و مستندات کاربر

## وضعیت‌ها
- **Planned:** طراحی شده، هنوز پیاده‌سازی نشده.
- **Implemented:** کد وجود دارد، اما همه تست‌ها یا بررسی دستگاه هدف انجام نشده.
- **Verified:** تست‌های مربوط و smoke testهای لازم موفق بوده‌اند.

هیچ milestone صرفاً با ایجاد سند یا تولید کد کامل محسوب نمی‌شود.
