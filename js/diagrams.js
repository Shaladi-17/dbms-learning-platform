/**
 * DBMS Learning Platform - Interactive SVG Diagrams & Visualizers
 */

export class DiagramRenderer {
  // 1. Traditional File-Based System vs Database Approach
  static renderFileVsDb() {
    return `
      <div class="svg-diagram-card">
        <h4 style="margin-bottom: 1rem; color: var(--primary);">مخطط المقارنة المعمارية: نظام الملفات التقليدي مقابل مدخل قاعدة البيانات الموحدة</h4>
        <svg viewBox="0 0 850 360" width="100%" height="auto" style="font-family: inherit;">
          <defs>
            <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fee2e2" />
              <stop offset="100%" stop-color="#fecaca" />
            </linearGradient>
            <linearGradient id="gradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ecfdf5" />
              <stop offset="100%" stop-color="#d1fae5" />
            </linearGradient>
            <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#1d4ed8" />
            </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker id="arrowBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
            </marker>
          </defs>

          <!-- Left Side: File-Based System -->
          <g transform="translate(10, 20)">
            <rect x="0" y="0" width="380" height="320" rx="12" fill="url(#gradRed)" stroke="#f87171" stroke-width="2" />
            <text x="190" y="32" text-anchor="middle" font-weight="700" font-size="15" fill="#991b1b">النظام التقليدي (File-Based System)</text>
            <text x="190" y="52" text-anchor="middle" font-size="12" fill="#b91c1c">معالجة وتخزين لا مركزي - عزل وتكرار</text>

            <!-- App 1 -->
            <rect x="20" y="75" width="130" height="45" rx="6" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" />
            <text x="85" y="102" text-anchor="middle" font-size="12" font-weight="600" fill="#1e293b">تطبيق شؤون الطلاب</text>
            <line x1="150" y1="97" x2="210" y2="97" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />
            <rect x="220" y="75" width="140" height="45" rx="6" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,2" />
            <text x="290" y="95" text-anchor="middle" font-size="11" font-weight="600" fill="#991b1b">ملفات الطلاب</text>
            <text x="290" y="110" text-anchor="middle" font-size="10" fill="#dc2626">بيانات مكررة (Student Records)</text>

            <!-- App 2 -->
            <rect x="20" y="145" width="130" height="45" rx="6" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" />
            <text x="85" y="172" text-anchor="middle" font-size="12" font-weight="600" fill="#1e293b">تطبيق التسجيل والمالية</text>
            <line x1="150" y1="167" x2="210" y2="167" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />
            <rect x="220" y="145" width="140" height="45" rx="6" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,2" />
            <text x="290" y="165" text-anchor="middle" font-size="11" font-weight="600" fill="#991b1b">ملفات الحسابات</text>
            <text x="290" y="180" text-anchor="middle" font-size="10" fill="#dc2626">بيانات مكررة (Finance Records)</text>

            <!-- App 3 -->
            <rect x="20" y="215" width="130" height="45" rx="6" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" />
            <text x="85" y="242" text-anchor="middle" font-size="12" font-weight="600" fill="#1e293b">تطبيق السكن الجامعي</text>
            <line x1="150" y1="237" x2="210" y2="237" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />
            <rect x="220" y="215" width="140" height="45" rx="6" fill="#ffffff" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,2" />
            <text x="290" y="235" text-anchor="middle" font-size="11" font-weight="600" fill="#991b1b">ملفات السكن</text>
            <text x="290" y="250" text-anchor="middle" font-size="10" fill="#dc2626">بيانات مكررة (Housing Records)</text>

            <rect x="20" y="278" width="340" height="26" rx="4" fill="#fee2e2" />
            <text x="190" y="295" text-anchor="middle" font-size="11" font-weight="700" fill="#b91c1c">⚠️ تكرار هائل، عدم اتساق، تبعية كاملة بين البرنامج والبيانات</text>
          </g>

          <!-- Right Side: DBMS Approach -->
          <g transform="translate(450, 20)">
            <rect x="0" y="0" width="380" height="320" rx="12" fill="url(#gradGreen)" stroke="#34d399" stroke-width="2" />
            <text x="190" y="32" text-anchor="middle" font-weight="700" font-size="15" fill="#065f46">مدخل قاعدة البيانات (DBMS Approach)</text>
            <text x="190" y="52" text-anchor="middle" font-size="12" fill="#047857">مستودع مشترك موحد - استقلالية وأمان</text>

            <!-- Apps -->
            <rect x="15" y="75" width="105" height="40" rx="6" fill="#ffffff" stroke="#10b981" stroke-width="1.5" />
            <text x="67" y="100" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">تطبيق الطلاب</text>

            <rect x="15" y="135" width="105" height="40" rx="6" fill="#ffffff" stroke="#10b981" stroke-width="1.5" />
            <text x="67" y="160" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">تطبيق المالية</text>

            <rect x="15" y="195" width="105" height="40" rx="6" fill="#ffffff" stroke="#10b981" stroke-width="1.5" />
            <text x="67" y="220" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">تطبيق السكن</text>

            <!-- Lines to DBMS -->
            <path d="M 120 95 L 165 145" stroke="#2563eb" stroke-width="2" marker-end="url(#arrowBlue)" />
            <path d="M 120 155 L 165 155" stroke="#2563eb" stroke-width="2" marker-end="url(#arrowBlue)" />
            <path d="M 120 215 L 165 165" stroke="#2563eb" stroke-width="2" marker-end="url(#arrowBlue)" />

            <!-- DBMS Box -->
            <rect x="175" y="120" width="80" height="70" rx="8" fill="url(#gradBlue)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))" />
            <text x="215" y="152" text-anchor="middle" font-size="15" font-weight="800" fill="#ffffff">DBMS</text>
            <text x="215" y="172" text-anchor="middle" font-size="10" fill="#bfdbfe">نظام الإدارة</text>

            <line x1="255" y1="155" x2="285" y2="155" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrowBlue)" />

            <!-- Central DB Cylinder -->
            <g transform="translate(295, 115)">
              <ellipse cx="38" cy="12" rx="38" ry="12" fill="#047857" />
              <rect x="0" y="12" width="76" height="55" fill="#059669" />
              <ellipse cx="38" cy="67" rx="38" ry="12" fill="#047857" />
              <ellipse cx="38" cy="12" rx="38" ry="12" fill="#10b981" />
              <text x="38" y="44" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">قاعدة بيانات</text>
              <text x="38" y="58" text-anchor="middle" font-size="9" fill="#ecfdf5">مركزية موحدة</text>
            </g>

            <rect x="20" y="278" width="340" height="26" rx="4" fill="#d1fae5" />
            <text x="190" y="295" text-anchor="middle" font-size="11" font-weight="700" fill="#065f46">✓ تقليص التكرار، اتساق دائم، أمان مركزي، استقلالية البيانات</text>
          </g>
        </svg>
      </div>
    `;
  }

  // 2. ANSI-SPARC 3-Level Architecture
  static renderAnsiSparc() {
    return `
      <div class="svg-diagram-card">
        <h4 style="margin-bottom: 0.5rem; color: var(--primary);">معمارية ANSI-SPARC القياسية ذات المستويات الثلاثة</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">اضغط على أي مستوى للاطلاع على خصائصه وموقعه في النظام</p>
        <svg viewBox="0 0 760 480" width="100%" height="auto" style="font-family: inherit;">
          <defs>
            <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.1" />
            </filter>
            <marker id="mapArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
            </marker>
          </defs>

          <!-- Level 1: External Level -->
          <g id="node-external" class="clickable-node" style="cursor: pointer;">
            <rect x="60" y="20" width="640" height="100" rx="12" fill="#eff6ff" stroke="#3b82f6" stroke-width="2" filter="url(#cardShadow)" />
            <text x="380" y="46" text-anchor="middle" font-weight="800" font-size="16" fill="#1e3a8a">1. المستوى الخارجي (External Level / User Views)</text>
            <text x="380" y="66" text-anchor="middle" font-size="12" fill="#3b82f6">نظرة المستخدم الفردي - حجب البيانات غير المصرح بها - رؤى متعددة ومخصصة</text>

            <rect x="85" y="78" width="160" height="30" rx="6" fill="#ffffff" stroke="#93c5fd" />
            <text x="165" y="98" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">رؤية شؤون الطلاب (View 1)</text>

            <rect x="300" y="78" width="160" height="30" rx="6" fill="#ffffff" stroke="#93c5fd" />
            <text x="380" y="98" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">رؤية الشؤون المالية (View 2)</text>

            <rect x="515" y="78" width="160" height="30" rx="6" fill="#ffffff" stroke="#93c5fd" />
            <text x="595" y="98" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">رؤية السكن والمكتبة (View n)</text>
          </g>

          <!-- Mapping 1 -->
          <g transform="translate(380, 120)">
            <line x1="0" y1="5" x2="0" y2="45" stroke="#2563eb" stroke-width="3" stroke-dasharray="6,4" marker-end="url(#mapArrow)" marker-start="url(#mapArrow)" />
            <rect x="-170" y="12" width="340" height="26" rx="13" fill="#ffffff" stroke="#2563eb" stroke-width="1.5" />
            <text x="0" y="29" text-anchor="middle" font-size="11" font-weight="700" fill="#2563eb">الربط الخارجي/المفاهيمي (External/Conceptual Mapping)</text>
          </g>

          <!-- Level 2: Conceptual Level -->
          <g id="node-conceptual" class="clickable-node" style="cursor: pointer;" transform="translate(0, 175)">
            <rect x="60" y="0" width="640" height="100" rx="12" fill="#f0fdf4" stroke="#10b981" stroke-width="2" filter="url(#cardShadow)" />
            <text x="380" y="28" text-anchor="middle" font-weight="800" font-size="16" fill="#065f46">2. المستوى المفاهيمي / المنطقي (Conceptual Level)</text>
            <text x="380" y="48" text-anchor="middle" font-size="12" fill="#059669">الهيكل المنطقي الشامل للمؤسسة ككل (Community View)</text>
            <text x="380" y="70" text-anchor="middle" font-size="11" fill="#334155">الكيانات (Entities) • العلاقات (Relationships) • قيود التكامل والأمان (Constraints)</text>
            <rect x="180" y="78" width="400" height="18" rx="4" fill="#dcfce7" />
            <text x="380" y="91" text-anchor="middle" font-size="10" font-weight="700" fill="#166534">⚠️ يخلو تماماً من أي تفاصيل فيزيائية للتخزين (لا فهارس ولا مسارات أقراص)</text>
          </g>

          <!-- Mapping 2 -->
          <g transform="translate(380, 275)">
            <line x1="0" y1="5" x2="0" y2="45" stroke="#10b981" stroke-width="3" stroke-dasharray="6,4" marker-end="url(#mapArrow)" marker-start="url(#mapArrow)" />
            <rect x="-170" y="12" width="340" height="26" rx="13" fill="#ffffff" stroke="#10b981" stroke-width="1.5" />
            <text x="0" y="29" text-anchor="middle" font-size="11" font-weight="700" fill="#059669">الربط المفاهيمي/الداخلي (Conceptual/Internal Mapping)</text>
          </g>

          <!-- Level 3: Internal Level -->
          <g id="node-internal" class="clickable-node" style="cursor: pointer;" transform="translate(0, 330)">
            <rect x="60" y="0" width="640" height="95" rx="12" fill="#fffbeb" stroke="#f59e0b" stroke-width="2" filter="url(#cardShadow)" />
            <text x="380" y="28" text-anchor="middle" font-weight="800" font-size="16" fill="#92400e">3. المستوى الداخلي / الفيزيائي (Internal Level)</text>
            <text x="380" y="48" text-anchor="middle" font-size="12" fill="#d97706">التخزين الفيزيائي الفعلي على وسائط التخزين (Physical Storage)</text>
            <text x="380" y="70" text-anchor="middle" font-size="11" fill="#475569">تراكيب السجلات • الفهارس (Indexes) • خوارزميات التجزئة والتشفير • مسارات الوصول</text>
          </g>

          <!-- Physical Database -->
          <g transform="translate(380, 445)">
            <text x="0" y="15" text-anchor="middle" font-size="12" font-weight="700" fill="#64748b">💾 القرص الصلب الفيزيائي الحقيقي (Physical Database on Disk)</text>
          </g>
        </svg>
      </div>
    `;
  }

  // 3. Keys Taxonomy Tree
  static renderKeysTree() {
    return `
      <div class="svg-diagram-card">
        <h4 style="margin-bottom: 1rem; color: var(--primary);">شجرة التصنيف الهرمي للمفاتيح في قواعد البيانات العلائقية</h4>
        <svg viewBox="0 0 760 360" width="100%" height="auto" style="font-family: inherit;">
          <!-- Superkey -->
          <g transform="translate(255, 10)">
            <rect x="0" y="0" width="250" height="55" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2" />
            <text x="125" y="25" text-anchor="middle" font-weight="800" font-size="14" fill="#1e3a8a">المفتاح الفائق (Superkey)</text>
            <text x="125" y="43" text-anchor="middle" font-size="11" fill="#1d4ed8">أي مجموعة سمات تميز الصف فريداً</text>
          </g>

          <!-- Down arrow with condition -->
          <path d="M 380 65 L 380 115" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow)" />
          <rect x="290" y="80" width="180" height="20" rx="4" fill="#ffffff" stroke="#93c5fd" />
          <text x="380" y="94" text-anchor="middle" font-size="10" font-weight="700" fill="#2563eb">شرط الأصغرية (Minimality)</text>

          <!-- Candidate Key -->
          <g transform="translate(255, 120)">
            <rect x="0" y="0" width="250" height="55" rx="8" fill="#dcfce7" stroke="#10b981" stroke-width="2" />
            <text x="125" y="25" text-anchor="middle" font-weight="800" font-size="14" fill="#065f46">المفتاح المرشح (Candidate Key)</text>
            <text x="125" y="43" text-anchor="middle" font-size="11" fill="#047857">أصغر مفتاح فائق ممكن (Minimal Superkey)</text>
          </g>

          <!-- Branching -->
          <path d="M 320 175 L 180 230" stroke="#64748b" stroke-width="2" />
          <path d="M 440 175 L 580 230" stroke="#64748b" stroke-width="2" />

          <!-- Selection labels -->
          <rect x="180" y="190" width="120" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" />
          <text x="240" y="203" text-anchor="middle" font-size="9" font-weight="600" fill="#1e293b">يتم اختياره رسمياً</text>

          <rect x="460" y="190" width="120" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" />
          <text x="520" y="203" text-anchor="middle" font-size="9" font-weight="600" fill="#1e293b">المتبقي دون اختيار</text>

          <!-- Primary Key -->
          <g transform="translate(60, 235)">
            <rect x="0" y="0" width="240" height="65" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" />
            <text x="120" y="26" text-anchor="middle" font-weight="800" font-size="14" fill="#92400e">المفتاح الأساسي (Primary Key)</text>
            <text x="120" y="44" text-anchor="middle" font-size="11" fill="#b45309">واحد فقط لكل جدول</text>
            <text x="120" y="58" text-anchor="middle" font-size="10" font-weight="700" fill="#d97706">⛔ لا يقبل NULL إطلاقاً</text>
          </g>

          <!-- Alternate Key -->
          <g transform="translate(460, 235)">
            <rect x="0" y="0" width="240" height="65" rx="8" fill="#f1f5f9" stroke="#64748b" stroke-width="2" />
            <text x="120" y="26" text-anchor="middle" font-weight="800" font-size="14" fill="#334155">المفتاح البديل (Alternate Key)</text>
            <text x="120" y="44" text-anchor="middle" font-size="11" fill="#475569">مرشح لم يُختر أساسياً</text>
            <text x="120" y="58" text-anchor="middle" font-size="10" fill="#64748b">يحقق شروط المفتاح المرشح</text>
          </g>

          <!-- Additional Keys footer -->
          <g transform="translate(60, 315)">
            <rect x="0" y="0" width="640" height="35" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
            <text x="120" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="#1e293b">🔗 المفتاح الأجنبي (Foreign Key): للربط بين الجداول</text>
            <text x="360" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="#1e293b">🧩 المركب (Composite): من سمتين أو أكثر</text>
            <text x="560" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="#1e293b">🔍 الثانوي (Secondary): للفهرسة</text>
          </g>
        </svg>
      </div>
    `;
  }

  // 4. EER Visualizer (Dynamic Disjointness & Completeness)
  static renderEerVisualizer(disjointType = "d", completenessType = "total") {
    const isDisjoint = disjointType === "d";
    const isTotal = completenessType === "total";

    const letter = isDisjoint ? "d" : "o";
    const letterDesc = isDisjoint ? "انفصال (Disjoint)" : "تداخل (Overlapping)";
    const compDesc = isTotal ? "كلي وإلزامي (Total)" : "جزئي واختياري (Partial)";

    return `
      <div class="card" id="eer-sim-container">
        <div class="card-header">
          <div>
            <h3 class="card-title">مختبر المحاكاة البصرية لنموذج الكيان-العلاقة المحسن (EER Visualizer)</h3>
            <p class="card-subtitle">التبديل التفاعلي بين قيود الانفصال والإكمال ومشاهدة تغير الرموز والمخطط فورياً</p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <select id="eer-disjoint-select" class="form-control" style="width: auto;">
              <option value="d" ${isDisjoint ? "selected" : ""}>انفصال (Disjoint - d)</option>
              <option value="o" ${!isDisjoint ? "selected" : ""}>تداخل (Overlapping - o)</option>
            </select>
            <select id="eer-completeness-select" class="form-control" style="width: auto;">
              <option value="total" ${isTotal ? "selected" : ""}>كلي (Total - خط مزدوج)</option>
              <option value="partial" ${!isTotal ? "selected" : ""}>جزئي (Partial - خط مفرد)</option>
            </select>
          </div>
        </div>

        <div style="text-align: center; margin: 1rem 0;">
          <span class="badge ${isTotal ? "badge-pk" : "badge-fk"}" style="font-size: 0.95rem; padding: 0.4rem 1rem;">
            الحالة الحالية: ${compDesc} + ${letterDesc}
          </span>
        </div>

        <div class="svg-diagram-card">
          <svg viewBox="0 0 700 340" width="100%" height="auto" style="font-family: inherit;">
            <!-- Superclass -->
            <g transform="translate(250, 20)">
              <rect x="0" y="0" width="200" height="50" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2" />
              <text x="100" y="27" text-anchor="middle" font-weight="800" font-size="15" fill="#1e3a8a">EMPLOYEE</text>
              <text x="100" y="42" text-anchor="middle" font-size="11" fill="#1d4ed8">الفئة العامة (Superclass)</text>
            </g>

            <!-- Line from Superclass to Circle -->
            ${isTotal ? `
              <!-- Double Line for Total Completeness -->
              <line x1="346" y1="70" x2="346" y2="130" stroke="#2563eb" stroke-width="2.5" />
              <line x1="354" y1="70" x2="354" y2="130" stroke="#2563eb" stroke-width="2.5" />
            ` : `
              <!-- Single Line for Partial Completeness -->
              <line x1="350" y1="70" x2="350" y2="130" stroke="#2563eb" stroke-width="2.5" />
            `}

            <!-- Specialization Circle with letter -->
            <g transform="translate(350, 150)">
              <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#2563eb" stroke-width="2.5" />
              <text x="0" y="7" text-anchor="middle" font-weight="800" font-size="18" fill="#2563eb">${letter}</text>
            </g>

            <!-- Subset U-symbols and branches -->
            <!-- Subclass 1: SECRETARY -->
            <path d="M 330 160 L 140 230" stroke="#64748b" stroke-width="2" />
            <g transform="translate(60, 230)">
              <rect x="0" y="0" width="150" height="50" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" />
              <text x="75" y="27" text-anchor="middle" font-weight="700" font-size="13" fill="#0f172a">SECRETARY</text>
              <text x="75" y="42" text-anchor="middle" font-size="10" fill="#64748b">فئة فرعية (Subclass)</text>
            </g>

            <!-- Subclass 2: ENGINEER -->
            <path d="M 350 172 L 350 230" stroke="#64748b" stroke-width="2" />
            <g transform="translate(275, 230)">
              <rect x="0" y="0" width="150" height="50" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" />
              <text x="75" y="27" text-anchor="middle" font-weight="700" font-size="13" fill="#0f172a">ENGINEER</text>
              <text x="75" y="42" text-anchor="middle" font-size="10" fill="#64748b">فئة فرعية (Subclass)</text>
            </g>

            <!-- Subclass 3: TECHNICIAN -->
            <path d="M 370 160 L 560 230" stroke="#64748b" stroke-width="2" />
            <g transform="translate(490, 230)">
              <rect x="0" y="0" width="150" height="50" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" />
              <text x="75" y="27" text-anchor="middle" font-weight="700" font-size="13" fill="#0f172a">TECHNICIAN</text>
              <text x="75" y="42" text-anchor="middle" font-size="10" fill="#64748b">فئة فرعية (Subclass)</text>
            </g>

            <!-- Explanatory footer text inside SVG -->
            <rect x="40" y="295" width="620" height="32" rx="6" fill="#eff6ff" />
            <text x="350" y="315" text-anchor="middle" font-size="11" font-weight="600" fill="#1e3a8a">
              ${isDisjoint
                ? "قيد الانفصال (d): الموظف ينتمي لفئة فرعية واحدة على الأكثر (لا يمكن أن يكون مهندساً وسكرتيراً معاً)."
                : "قيد التداخل (o): الموظف يمكن أن يجمع بين فئتين فرعيتين أو أكثر في نفس الوقت."
              } | ${isTotal
                ? "قيد الإكمال الكلي (خط مزدوج): كل موظف إجباري أن ينتمي لفئة فرعية."
                : "قيد الإكمال الجزئي (خط مفرد): يسمح بوجود موظفين لا ينتمون لأي فئة فرعية."
              }
            </text>
          </svg>
        </div>
      </div>
    `;
  }
}

