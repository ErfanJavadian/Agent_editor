# Shared Project Core

این بسته مستقل از رابط کاربری و موتور رسانه است و قرارداد مشترک پروژه را برای کلاینت‌های دسکتاپ، وب و اندروید تعریف می‌کند.

## مدل نسخه ۱

- Project: شناسه، نام، نسخه schema و زمان ایجاد/به‌روزرسانی
- MediaAsset: شناسه رسانه، نوع، نام، منبع و metadata اختیاری
- Sequence: ابعاد و frame rate به‌صورت کسر numerator/denominator
- Track: ترک ویدئو یا صدا
- TimelineClip: بازه منبع با start شامل و end غیرشامل، به‌علاوه محل شروع در تایم‌لاین

تمام زمان‌های ذخیره‌شده در هسته برحسب فریم صحیح هستند. زمان اعشاری ثانیه نباید به‌عنوان موقعیت تایم‌لاین ذخیره شود.

## عملیات موجود

- `createEmptyProject`
- `validateProject` و `assertValidProject`
- `parseProjectDocument` و `serializeProjectDocument`
- `insertClip`
- `moveClip`
- `trimClip`
- `splitClip`

عملیات تایم‌لاین immutable هستند: یک ProjectDocument جدید برمی‌گردانند و ورودی را تغییر نمی‌دهند. پس از هر عملیات، invariantهای پروژه دوباره اعتبارسنجی می‌شوند.

## محدودیت‌های نسخه ۱

- سرعت متغیر، transition overlap، compound clip، nested sequence و keyframe هنوز مدل نشده‌اند.
- هم‌پوشانی کلیپ‌ها در یک Track فعلاً رد می‌شود.
- frame rate منبع رسانه و تبدیل بین timebaseها هنوز پیاده‌سازی نشده است.
- مدیریت path و relink رسانه مسئول Media Asset Manager خواهد بود؛ `sourceUri` نباید مستقیماً بدون کنترل به فایل‌سیستم سپرده شود.
- این بسته decode، preview یا render انجام نمی‌دهد.

## تست

از `frontend/` اجرا کن:

```bash
npm test
npm run build
```
