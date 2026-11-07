<!-- ASH - DBMS Learning Platform Deployment Guide -->
# دليل النشر والتشغيل الشامل | DBMS Learning Platform Deployment Guide

يقدم هذا الدليل إرشادات تفصيلية ومتكاملة لتشغيل ونشر **منصة الداتا بيز (DBMS Learning Platform)** في بيئات متعددة، تشمل بيئة التطوير المحلية عبر **XAMPP (Windows)**، وحاويات **Docker**، والنشر السحابي المباشر عبر منصة **Render**.

---

## 📋 المتطلبات الأساسية للنظام (System Requirements)

- **الواجهة الأمامية (Frontend):** أي متصفح ويب حديث يدعم معايير ES6+ (Google Chrome, Microsoft Edge, Firefox, Safari).
- **الواجهة الخلفية (Backend API):**
  - **PHP 8.1 أو أحدث** (تم اختباره بنجاح على PHP 8.2).
  - امتدادات PHP الإلزامية: `ext-curl` (للتواصل مع Gemini API) و `ext-mbstring` (لمعالجة نصوص RAG العربية والإنجليزية).
- **حاوية التشغيل (للنشر السحابي):** Docker Engine 20.10+ (أو منصة Render المدعومة بـ Docker).
- **مفتاح Google Gemini API:** لتفعيل المساعد الذكي التفاعلي (احصل عليه مجاناً عبر [Google AI Studio](https://aistudio.google.com/)).

---

## 🛠️ الخيار الأول: التشغيل المحلي عبر XAMPP (Windows)

### 1. إعداد مسار المشروع
تأكد من تواجد مجلد المشروع كاملاً داخل مسار خادم Apache:
```text
C:\xampp\htdocs\hall
```

### 2. ضبط متغيرات البيئة ومفتاح الذكاء الاصطناعي
1. انسخ ملف الإعدادات النموذجي `.env.example` وأعد تسميته إلى `.env`:
   - في PowerShell:
     ```powershell
     Copy-Item .env.example .env
     ```
2. افتح ملف `.env` بواسطة أي محرر نصوص وضع مفتاح API الخاص بك:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualGeminiApiKeyHere
   GEMINI_MODEL=gemini-1.5-flash
   APP_ENV=local
   ```
   > ⚠️ **ملاحظة أمنية:** ملف `.env` مدرج تلقائياً في `.gitignore` ولا يتم رفعه إلى مستودعات Git نهائياً.

### 3. تشغيل خادم Apache
1. افتح **XAMPP Control Panel**.
2. اضغط على زر **Start** أمام خدمة **Apache**.
3. تأكد من ظهور المنفذ الافتراضي `Port 80, 443` باللون الأخضر.

### 4. الوصول إلى المنصة واختبار الميزات
- افتح المتصفح وتوجه إلى الرابط:
  ```text
  http://localhost/hall/
  ```
- لاختبار نقطة نهاية مساعد الذكاء الاصطناعي و RAG:
  ```text
  http://localhost/hall/api/chat.php
  ```
- انقر على أيقونة المساعد الذكي العائمة (🤖) أسفل الشاشة، وجرب سؤالاً مثل:
  > "ما هو الفرق بين Candidate Key و Primary Key؟"
  > "اشرح لي قاعدة تحويل 1:N في مخططات ER مع مثال"

---

## 🐳 الخيار الثاني: التشغيل عبر حاويات Docker (محلياً أو على أي سيرفر VPS)

المشروع مزود بملف `Dockerfile` معتمد مبني على صورة `php:8.2-apache` الرسمية، ومجهّز بسكريبت دخول ذكي `docker-entrypoint.sh`.

### 1. بناء صورة Docker (Docker Build)
من داخل المجلد الرئيسي للمشروع، نفّذ الأمر التالي:
```bash
docker build -t dbms-learning-platform:latest .
```

### 2. تشغيل الحاوية (Docker Run)
قم بتشغيل الحاوية مع تمرير مفتاح Gemini كمتغير بيئة:
```bash
docker run -d \
  --name dbms-app \
  -p 8080:80 \
  -e GEMINI_API_KEY="AIzaSyYourActualGeminiApiKeyHere" \
  -e GEMINI_MODEL="gemini-1.5-flash" \
  -e APP_ENV="production" \
  dbms-learning-platform:latest
```

### 3. الوصول إلى المنصة
افتح المتصفح وانتقل إلى:
```text
http://localhost:8080
```

---

## 🚀 الخيار الثالث: النشر السحابي المباشر على Render (Render.com)

منصة **Render** تتيح تشغيل خدمات الويب (Web Services) بحاويات Docker مجاناً وبسهولة فائقة.

### 1. رفع المشروع إلى GitHub أو GitLab
1. تأكد من تهيئة مستودع Git في مجلد المشروع:
   ```bash
   git init
   git add .
   git commit -m "feat: complete independent DBMS Learning Platform with RAG and Gemini AI (ASH)"
   ```
2. اربط المستودع بحسابك على GitHub:
   ```bash
   git remote add origin https://github.com/your-username/dbms-learning-platform.git
   git branch -M main
   git push -u origin main
   ```

### 2. إنشاء Web Service على Render
1. سجّل الدخول إلى لوحة تحكم [Render Dashboard](https://dashboard.render.com/).
2. اضغط على زر **New +** ثم اختر **Web Service**.
3. اربط حساب GitHub الخاص بك واختر مستودع `dbms-learning-platform`.
4. سيتعرف Render تلقائياً على وجود ملف `Dockerfile`.
5. اضبط الإعدادات التالية:
   - **Name:** `dbms-learning-platform` (أو أي اسم تفضله).
   - **Region:** اختر أقرب منطقة جغرافية (مثل Frankfurt / Oregon).
   - **Branch:** `main`.
   - **Runtime:** `Docker`.
   - **Instance Type:** `Free`.

### 3. ضبط متغيرات البيئة على Render (Environment Variables)
انتقل إلى قسم **Environment Variables** وأضف المتغيرات التالية:
| اسم المتغير (Key) | القيمة (Value) | الوصف |
|-------------------|----------------|-------|
| `GEMINI_API_KEY` | `AIzaSy...` | مفتاح Google Gemini API الخاص بك |
| `GEMINI_MODEL` | `gemini-1.5-flash` | نموذج الذكاء الاصطناعي المعتمد |
| `APP_ENV` | `production` | بيئة التشغيل الإنتاجية |

> 💡 **كيف يتعامل المشروع مع منفذ Render الديناميكي؟**  
> يقوم Render بحقن متغير بيئة باسم `$PORT` (غالباً `10000`). يقوم سكريبت الدخول المضمن `docker-entrypoint.sh` تلقائياً بتعديل إعدادات خادم Apache ليرتبط بالمنفذ المخصص عبر الأمر:
> ```bash
> sed -i "s/80/$PORT/g" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf
> ```
> ثم يبدأ تشغيل Apache، مما يضمن عمل المنصة دون أي تعارض في المنافذ.

### 4. إتمام النشر والتحقق
1. اضغط على **Create Web Service**.
2. سيبدأ Render في بناء صورة Docker وتشغيلها.
3. بمجرد اكتمال البناء وظهور علامة **Live** الخضراء، ستحصل على رابط عام للمنصة، مثل:
   ```text
   https://dbms-learning-platform.onrender.com
   ```
4. افتح الرابط وتأكد من عمل كافة الوظائف التعليمية والمساعد الذكي فوراً.

---

## 🔒 حماية مفتاح API والتعامل مع الأخطاء

1. **إخفاء المفاتيح في ردود الأخطاء:** تم تصميم محرك `api/gemini.php` ليقوم تلقائياً بتشفير وإخفاء أي مفاتيح في رسائل الخطأ `API key masked: AIzaSy...xxxx`.
2. **الاستجابة الأنيقة عند غياب المفتاح:** إذا لم يتم تزويد مفتاح API في البيئة المحلية، لن يتعطل الموقع، بل سيظهر للمستخدم رسالة إرشادية واضحة تشرح كيفية إدخال المفتاح مع إمكانية استخدام كافة الميزات الأكاديمية الأخرى (الموسوعة، المختبرات، الامتحانات التجريبية، بنك الأسئلة) بكفاءة كاملة بنسبة 100%.
3. **معدل الطلبات (Rate Limiting):** يستخدم Gemini Flash حدوداً مجانية كريمة (15 طلب بالدقيقة)، مع تفعيل RAG الذكي لتلخيص السياق قبل إرساله لتقليل استهلاك التوكنز وتجنب أخطاء HTTP 429.

---

## 🧪 إجراء الفحص والتحقق بعد النشر (Post-Deployment Verification)

للتأكد من سلامة النظام بعد النشر، يمكنك إجراء الفحوصات التالية:

1. **فحص الواجهة الأمامية والأدوات:**
   - فتح الموسوعة والانتقال بين المحاضرات 1 إلى 9.
   - تشغيل حاسبة إغلاق الصفات والمفاتيح المرشحة ($X^+$).
   - تجربة محاكي مراحل التطبيع (UNF $\to$ BCNF).
   - تجربة مختبر الجبر العلائقي والتأكد من تطبيق عمليات الاختيار والإسقاط والربط.
   - خوض الامتحان النصفي التجريبي (50 درجة) والتحقق من حساب النتيجة وتشخيص نقاط الضعف.
2. **فحص الاستجابة للهواتف (Responsive Check):**
   - تصغير الشاشة إلى أقل من 960 بكسل للتأكد من ظهور زر القائمة (☰) وإغلاق القائمة عبر الخلفية الشفافة (Overlay) وزر الإغلاق (✕) ومفتاح Escape.
3. **فحص مساعد الذكاء الاصطناعي:**
   - النقر على زر المساعد وتجربة اقتراح من الاقتراحات السريعة، والتأكد من استرجاع المراجع الدقيقة من ملف `DBMS_Midterm_Summary_Lectures_1-9.md`.

---
*علامة التوثيق البرمجية: ASH | منصة الداتا بيز - DBMS Learning Platform*

