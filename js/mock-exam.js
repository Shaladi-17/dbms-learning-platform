/**
 * DBMS Learning Platform - Timed Mock Exam Simulator (50 Marks)
 * Strictly structured according to Lectures 1–9 academic scope
 */

import { progressManager } from "./progress.js";
import { showToast, formatTime } from "./utils.js";

export const EXAM_DATA = {
  title: "الامتحان النصفي التجريبي الشامل (50 درجة)",
  titleEn: "Comprehensive DBMS Midterm Mock Examination",
  durationMinutes: 60,
  totalMarks: 50,
  sections: [
    {
      id: "sec-tf",
      title: "السؤال الأول: الصواب والخطأ الأكاديمي مع التصحيح (10 درجات)",
      description: "حدد ما إذا كانت العبارة صحيحة أم خاطئة. إذا كانت خاطئة، اختر التصحيح الأكاديمي الدقيق.",
      marks: 10,
      questions: [
        {
          id: "tf1",
          text: "المستوى الداخلي (Internal Level) في معمارية ANSI-SPARC يهتم بالتخزين الفيزيائي الفعلي للبيانات.",
          correctAnswer: "true",
          marks: 1,
          topic: "ANSI-SPARC Architecture",
          correctionOptions: [],
          explanation: "صحيح؛ المستوى الداخلي يصف كيفية التخزين الفيزيائي الفعلي: تراكيب الملفات والفهارس ومسارات الوصول."
        },
        {
          id: "tf2",
          text: "استقلالية البيانات (Data Independence) تعني أن البيانات لا تحتاج إلى تخزين على وسائط التخزين.",
          correctAnswer: "false",
          marks: 1,
          topic: "Data Independence",
          correctionOptions: [
            "تعني إمكانية تغيير هيكل البيانات أو طريقة تخزينها في مستوى أدنى دون التأثير على التطبيقات أو المستويات الأعلى.",
            "تعني أن كل مستخدم يملك قاعدة بيانات منفصلة تماماً على جهازه.",
            "تعني أن لغة SQL لا تحتاج إلى ترجمة أو تنفيذ."
          ],
          correctCorrectionIndex: 0,
          explanation: "خطأ؛ استقلالية البيانات تعني فصل منطق البرامج عن التخزين وإمكانية تعديل المخططات في مستوى دون التأثير على المستوى الأعلى."
        },
        {
          id: "tf3",
          text: "التطبيع (Normalization) لا علاقة له بتقليل تكرار البيانات.",
          correctAnswer: "false",
          marks: 1,
          topic: "Normalization Motivation",
          correctionOptions: [
            "التطبيع يهدف أساساً إلى تقليل تكرار البيانات (Data Redundancy) ومنع حدوث شوائب التعديل (Update Anomalies).",
            "التطبيع يهدف فقط إلى زيادة عدد الجداول دون فائدة.",
            "التطبيع خاص بلغات البرمجة وليس قواعد البيانات."
          ],
          correctCorrectionIndex: 0,
          explanation: "خطأ؛ الهدف الجوهري للتطبيع هو الحد من التكرار غير المنضبط وتفادي شوائب الإضافة والحذف والتعديل."
        },
        {
          id: "tf4",
          text: "العلاقة الثنائية من النوع (1:1) لها أكثر من استراتيجية معتمدة للتحويل إلى جداول علائقية.",
          correctAnswer: "true",
          marks: 1,
          topic: "ER-to-Relational Mapping (1:1)",
          correctionOptions: [],
          explanation: "صحيح؛ توجد 3 طرق: طريقة المفتاح الأجنبي (Foreign Key Approach)، وطريقة دمج العلاقتين، وطريقة جدول الربط المستقل."
        },
        {
          id: "tf5",
          text: "عملية الاختيار (Selection) تختار الأعمدة، بينما عملية الإسقاط (Projection) تختار الصفوف.",
          correctAnswer: "false",
          marks: 1,
          topic: "Relational Algebra (σ & π)",
          correctionOptions: [
            "العكس تماماً؛ الاختيار (σ) يختار الصفوف (Rows) وفق شرط، بينما الإسقاط (π) يختار الأعمدة (Columns).",
            "كلا العمليتين تختاران الصفوف فقط.",
            "كلا العمليتين تختاران الأعمدة فقط."
          ],
          correctCorrectionIndex: 0,
          explanation: "خطأ؛ الاختيار هو Restricting rows والإسقاط هو Selecting columns."
        },
        {
          id: "tf6",
          text: "في عملية الإسقاط (Projection)، يكون عدد الصفوف في النتيجة دائماً مساوياً لعدد الصفوف في الجدول الأصلي.",
          correctAnswer: "false",
          marks: 1,
          topic: "Projection Duplicate Elimination",
          correctionOptions: [
            "قد يكون عدد الصفوف في النتيجة أقل، لأن عملية الإسقاط تقوم بحذف الصفوف المكررة تلقائياً (Eliminates Duplicates).",
            "عدد الصفوف دائماً ضعف الجدول الأصلي.",
            "الإسقاط لا يؤثر إطلاقاً على تكرار الصفوف."
          ],
          correctCorrectionIndex: 0,
          explanation: "خطأ؛ الإسقاط يزيل الصفوف المكررة جبرياً لأن النتيجة هي مجموعة رياضية."
        },
        {
          id: "tf7",
          text: "المفتاح الجزئي (Partial Key / Discriminator) يُستخدم مع الكيان الضعيف (Weak Entity).",
          correctAnswer: "true",
          marks: 1,
          topic: "Weak Entities",
          correctionOptions: [],
          explanation: "صحيح؛ الكيان الضعيف يمتلك مفتاحاً جزئياً يُميز أفراده التابعين لنفس الكيان القوي المالك ويُرسم بخط متقطع."
        },
        {
          id: "tf8",
          text: "كل جدول في صيغة BCNF هو بالضرورة في صيغة 3NF.",
          correctAnswer: "true",
          marks: 1,
          topic: "BCNF vs 3NF",
          correctionOptions: [],
          explanation: "صحيح؛ لأن شروط BCNF تلغي استثناء السمة الرئيسية، فكل علاقة في BCNF تكون حتماً في 3NF."
        },
        {
          id: "tf9",
          text: "خلل التحديث (Update Anomaly) يُعد من مؤشرات سوء تصميم قاعدة البيانات.",
          correctAnswer: "true",
          marks: 1,
          topic: "Design Anomalies",
          correctionOptions: [],
          explanation: "صحيح؛ ينشأ بسبب تكرار البيانات غير المضبوط في الجداول غير المطبعة."
        },
        {
          id: "tf10",
          text: "في علاقة (1:N)، يوضع المفتاح الأجنبي دائماً في جدول جهة الـ (1).",
          correctAnswer: "false",
          marks: 1,
          topic: "ER-to-Relational Mapping (1:N)",
          correctionOptions: [
            "يوضع المفتاح الأجنبي دائماً في جدول الكيان الموجود في جهة الـ (N).",
            "يوضع في كلا الجدولين في نفس الوقت.",
            "يتم إنشاء جدول ثالث دائماً."
          ],
          correctCorrectionIndex: 0,
          explanation: "خطأ؛ القاعدة الصارمة تنص على نقل مفتاح جهة الـ (1) كـ Foreign Key في جدول جهة الـ (N)."
        }
      ]
    },
    {
      id: "sec-mcq",
      title: "السؤال الثاني: المفاهيم والاختيار من متعدد (15 درجة)",
      description: "اختر الإجابة الصحيحة من بين الخيارات المتاحة.",
      marks: 15,
      questions: [
        {
          id: "mcq1",
          text: "القدرة على تغيير هيكل التخزين الفيزيائي أو الفهارس دون التأثير على المخطط المفاهيمي أو التطبيقات تُسمى:",
          options: [
            "استقلالية البيانات المنطقية (Logical Data Independence)",
            "استقلالية البيانات الفيزيائية (Physical Data Independence)",
            "تكامل الكيان (Entity Integrity)",
            "التطبيع (Normalization)"
          ],
          correctIndex: 1,
          marks: 1.5,
          topic: "Data Independence",
          explanation: "تغيير الفهارس والأقراص هو استقلالية بيانات فيزيائية."
        },
        {
          id: "mcq2",
          text: "أي من المستويات التالية في معمارية ANSI-SPARC يخلو تماماً من أي تفاصيل فيزيائية للتخزين ويمثل رؤية المجتمع الشاملة للمؤسسة؟",
          options: [
            "المستوى الداخلي (Internal Level)",
            "المستوى الخارجي (External Level)",
            "المستوى المفاهيمي / المنطقي (Conceptual Level)",
            "المستوى التخزيني (Physical Storage)"
          ],
          correctIndex: 2,
          marks: 1.5,
          topic: "ANSI-SPARC Conceptual Level",
          explanation: "المستوى المفاهيمي هو الهيكل المنطقي الشامل والخالي من تفاصيل الأقراص والفهارس."
        },
        {
          id: "mcq3",
          text: "إذا كانت العلاقة R تحتوي على 4 أعمدة و 20 صفاً، والعلاقة S تحتوي على 3 أعمدة و 10 صفوف، فإن درجة (Degree) حاصل الضرب الديكارتي R × S هي:",
          options: ["7 أعمدة", "12 عموداً", "200 عمود", "1 عمود"],
          correctIndex: 0,
          marks: 1.5,
          topic: "Cartesian Product Degree",
          explanation: "درجة حاصل الضرب الديكارتي هي مجموع درجتي الجدولين: 4 + 3 = 7 أعمدة."
        },
        {
          id: "mcq4",
          text: "وعدد صفوف (Cardinality) حاصل الضرب الديكارتي R × S في السؤال السابق هو:",
          options: ["30 صفاً", "200 صف", "70 صفاً", "240 صفاً"],
          correctIndex: 1,
          marks: 1.5,
          topic: "Cartesian Product Cardinality",
          explanation: "عدد صفوف حاصل الضرب الديكارتي هو حاصل ضرب عدد صفوفهما: 20 × 10 = 200 صف."
        },
        {
          id: "mcq5",
          text: "أي قيد من قيود التكامل ينص صراحة على أن: 'أي جزء من المفتاح الأساسي (Primary Key) لا يجوز إطلاقاً أن يحتوي على القيمة الفارغة (NULL)'؟",
          options: [
            "قيد التكامل المرجعي (Referential Integrity)",
            "قيد تكامل الكيان (Entity Integrity Constraint)",
            "قيد تكامل المجال (Domain Integrity)",
            "قيد قواعد العمل (Enterprise Constraint)"
          ],
          correctIndex: 1,
          marks: 1.5,
          topic: "Entity Integrity",
          explanation: "قيد تكامل الكيان يمنع تماماً احتواء أي جزء من المفتاح الأساسي على NULL."
        },
        {
          id: "mcq6",
          text: "المفتاح المرشح (Candidate Key) يتميز بخاصيتين أساسيتين هما:",
          options: [
            "التكرار والسرعة",
            "التميز الفريد (Uniqueness) والأصغرية (Minimality)",
            "قبول القيمة الفارغة والتركيب",
            "التبعية للمفتاح الأجنبي"
          ],
          correctIndex: 1,
          marks: 1.5,
          topic: "Candidate Key Properties",
          explanation: "المفتاح المرشح هو مفتاح فائق بحده الأدنى، ويجمع بين التميز الفريد والأصغرية."
        },
        {
          id: "mcq7",
          text: "لتطبيق عملية الاتحاد (Union) أو الفرق (Difference) بين علاقتين R و S، يجب أن يتوفر شرط:",
          options: [
            "أن يكون لهما نفس اسم الجدول",
            "التوافقية للاتحاد (Union Compatibility: نفس الدرجة وتطابق المجالات)",
            "أن يكون لهما نفس المفتاح الأساسي",
            "أن يكون عدد صفوفهما متطابقاً"
          ],
          correctIndex: 1,
          marks: 1.5,
          topic: "Union Compatibility",
          explanation: "شرط التوافقية يتطلب تساوي الدرجة وتطابق مجالات الأعمدة المتقابلة بالترتيب."
        },
        {
          id: "mcq8",
          text: "في نموذج ER، تُرسم الصفة متعددة القيم (Multivalued Attribute) بواسطة:",
          options: [
            "شكل بيضاوي متقطع الإطار (Dashed Oval)",
            "شكل بيضاوي مزدوج الإطار (Double Oval)",
            "شكل بيضاوي بخط تحتي متصل",
            "مستطيل مزدوج الإطار"
          ],
          correctIndex: 1,
          marks: 1.5,
          topic: "ER Multivalued Attribute",
          explanation: "الصفة متعددة القيم تُرسم بشكل بيضاوي مزدوج الإطار."
        },
        {
          id: "mcq9",
          text: "في نموذج EER، إذا كانت الفئة العامة PERSON تضم فئات فرعية CAMPER و BIKER، ويسمح للشخص بالجمع بينهما، مع وجود أشخاص لا يمارسون أياً منهما، فإن القيد هو:",
          options: [
            "Total, Disjoint (خط مزدوج مع d)",
            "Partial, Overlapping (خط مفرد مع o)",
            "Total, Overlapping (خط مزدوج مع o)",
            "Partial, Disjoint (خط مفرد مع d)"
          ],
          correctIndex: 1,
          marks: 1.5,
          topic: "EER Constraints",
          explanation: "الجمع بين الفئات يعني Overlapping (o)، ووجود أشخاص خارج الفئات يعني Partial (خط مفرد)."
        },
        {
          id: "mcq10",
          text: "عملية الربط الطبيعي (Natural Join - ⋈) تقوم تلقائياً بـ:",
          options: [
            "الربط على الأعمدة المتشابهة بالاسم مع حذف الأعمدة المكررة من الناتج",
            "مضاعفة عدد الأعمدة المتشابهة",
            "تطبيق شرط أكبر من دائماً",
            "حذف جميع الصفوف غير المتطابقة وملئها بـ NULL"
          ],
          correctIndex: 0,
          marks: 1.5,
          topic: "Natural Join Definition",
          explanation: "الربط الطبيعي هو ربط تساوي على الأعمدة المتطابقة بالاسم مع حذف العمود المكرر."
        }
      ]
    },
    {
      id: "sec-norm",
      title: "السؤال الثالث: التطبيع والاعتماديات الوظيفية (12 درجة)",
      description: "أجب عن الأسئلة التطبيقية التالية المتعلقة بنظرية التطبيع وإغلاق الصفات.",
      marks: 12,
      questions: [
        {
          id: "norm1",
          text: `
في جدول STUDENT_RECORD(Student#, CRN, CourseName, StudentName, Major, Grade) مع الاعتماديات:
- FD1: {Student#, CRN} -> Grade
- FD2: CRN -> CourseName
- FD3: Student# -> StudentName, Major

لماذا لا يعتبر هذا الجدول في الصيغة المعيارية الثانية (2NF)؟
          `,
          options: [
            "لأنه يحتوي على قيم متعددة في الخلية الواحدة",
            "لاحتوائه على اعتماديات وظيفية جزئية (Partial FDs) حيث تعتمد سمات غير مفتاحية على جزء من المفتاح المركب",
            "لأنه يحتوي على اعتماديات متعدية فقط",
            "لأن مفتاحه الأساسي يتكون من عمود واحد"
          ],
          correctIndex: 1,
          marks: 3,
          topic: "2NF Violation",
          explanation: "FD2 و FD3 اعتماديات جزئية تنتهك شرط 2NF لأن CourseName يعتمد على جزء من المفتاح (CRN) و StudentName يعتمد على (Student#)."
        },
        {
          id: "norm2",
          text: "ما هي الجداول الناتجة عن تحويل جدول STUDENT_RECORD السابق إلى الصيغة المعيارية الثانية (2NF)؟",
          options: [
            "جدولان: COURSE و STUDENT فقط مع حذف Grade",
            "3 جداول: COURSE(CRN, CourseName) و STUDENT(Student#, StudentName, Major) و ENROLLMENT(Student#, CRN, Grade)",
            "جدول واحد يضم كافة السمات دون تعديل",
            "4 جداول لكل سمة جدول مستقل"
          ],
          correctIndex: 1,
          marks: 3,
          topic: "2NF Decomposition",
          explanation: "نحصل على 3 جداول: جدول المقرر، جدول الطالب، وجدول التسجيل والدرجة."
        },
        {
          id: "norm3",
          text: "بالاعتماد على العلاقة R(A, B, C, D, E) والاعتماديات: F = { A -> B,  {B, C} -> D,  D -> E }. ما هو الإغلاق الكامل لمجموعة السمات {A, C}+ ؟",
          options: [
            "{A, C}",
            "{A, B, C}",
            "{A, B, C, D, E} (أي R كاملة)",
            "{D, E}"
          ],
          correctIndex: 2,
          marks: 3,
          topic: "Attribute Closure Calculation",
          explanation: "A->B يضيف B فيصبح {A,B,C}. ثم {B,C}->D يضيف D فيصبح {A,B,C,D}. ثم D->E يضيف E فيصبح {A,B,C,D,E} = R."
        },
        {
          id: "norm4",
          text: "هل تمثل المجموعة {A, C} في السؤال السابق مفتاحاً مرشحاً (Candidate Key) للعلاقة R؟",
          options: [
            "نعم، لأن إغلاقها يساوي R كاملة وحذف أي سمة منها ينتج إغلاقاً ناقصاً (Minimal Superkey)",
            "لا، لأنها تتكون من سمتين والمفتاح المرشح يجب أن يتكون من سمة واحدة فقط",
            "لا، لأن D -> E تمنع ذلك",
            "نعم، ولكنها مفتاح ثانوي فقط"
          ],
          correctIndex: 0,
          marks: 3,
          topic: "Candidate Key Verification",
          explanation: "إغلاق {A,C} يساوي R، وإغلاق {A} = {A,B} ناقص، وإغلاق {C} = {C} ناقص، إذن هي Minimal Superkey."
        }
      ]
    },
    {
      id: "sec-design",
      title: "السؤال الرابع: التصميم والجبر العلائقي (13 درجة)",
      description: "أجب عن الأسئلة التطبيقية في نمذجة EER والتحويل والجبر العلائقي.",
      marks: 13,
      questions: [
        {
          id: "des1",
          text: "عند تحويل علاقة متعدد إلى متعدد (M:N) مثل علاقة تسجيل الطلاب في المقررات، الإجراء التصميمي الإلزامي هو:",
          options: [
            "وضع المفتاح الأساسي للطالب في جدول المقرر",
            "استحداث جدول جديد مستقل للربط يحوي المفتاحين الأساسيين كـ Foreign Keys ويكون المفتاح الأساسي مركباً منهما",
            "دمج جدولي الطالب والمقرر في جدول واحد",
            "وضع المفتاح الأساسي للمقرر في جدول الطالب"
          ],
          correctIndex: 1,
          marks: 3,
          topic: "M:N Mapping Rule",
          explanation: "علاقة M:N تتطلب حتماً إنشاء جدول وسيط جديد للربط مفتاحه الأساسي مركب من مفتاحي الكيانين."
        },
        {
          id: "des2",
          text: "عند تحويل الصفة متعددة القيم (Multivalued Attribute) مثل 'فروع الشركة' التابعة لكيان الشركة COMPANY(CompanyID):",
          options: [
            "توضع الصفة متعددة القيم كمصفوفة داخل جدول الشركة",
            "ننشئ جدولاً جديداً مستقلاً يحوي الصفة ومفتاح الكيان كـ FK، ومفتاحه الأساسي مركب منهما",
            "ننشئ 10 أعمدة في جدول الشركة",
            "يتم حذف الصفة من التصميم"
          ],
          correctIndex: 1,
          marks: 3,
          topic: "Multivalued Attribute Mapping",
          explanation: "الخطوة السابعة من خوارزمية التحويل تقتضي إنشاء جدول جديد للصفة متعددة القيم مع مفتاح مركب."
        },
        {
          id: "des3",
          text: "الاستعلام الجبري الذي يستخرج أسماء وتخصصات الطلاب الذين يدرسون في الفرع رقم 5 من جدول STUDENT(StNo, SName, Major, Bno) هو:",
          options: [
            "σ_Bno=5(π_SName,Major(STUDENT))",
            "π_SName, Major( σ_Bno=5(STUDENT) )",
            "STUDENT ⋈ Bno=5",
            "π_Bno=5(STUDENT)"
          ],
          correctIndex: 1,
          marks: 3.5,
          topic: "Relational Algebra Query Composition",
          explanation: "نطبق الاختيار أولاً لاختيار صفوف الفرع 5: σ_Bno=5(STUDENT)، ثم نسقط على الأعمدة المطلوبة π_SName,Major."
        },
        {
          id: "des4",
          text: "في نموذج EER، الفئة الجامعة (Category / UNION Type) تُرسم برمز:",
          options: [
            "دائرة بداخلها حرف 'd'",
            "دائرة بداخلها حرف 'o'",
            "دائرة بداخلها رمز الاتحاد 'U'",
            "معين مزدوج الإطار"
          ],
          correctIndex: 2,
          marks: 3.5,
          topic: "EER Category Symbol",
          explanation: "الفئة الجامعة (Category) التي تمثل اتحاد عدة فئات عامة تُرسم بدائرة تحوي رمز الاتحاد 'U'."
        }
      ]
    }
  ]
};

export class MockExamEngine {
  constructor(examData = EXAM_DATA) {
    this.exam = examData;
    this.userAnswers = {};
    this.timerInterval = null;
    this.remainingSeconds = this.exam.durationMinutes * 60;
    this.isRunning = false;
    this.isSubmitted = false;
  }

  start(durationMinutes = 60) {
    this.userAnswers = {};
    this.isSubmitted = false;
    this.remainingSeconds = durationMinutes * 60;
    this.isRunning = true;
    document.body.classList.add("exam-lock-mode");
  }

  setAnswer(questionId, answer) {
    if (this.isSubmitted) return;
    this.userAnswers[questionId] = answer;
  }

  getAnswer(questionId) {
    return this.userAnswers[questionId];
  }

  submitExam() {
    if (this.isSubmitted) return null;
    this.isSubmitted = true;
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    document.body.classList.remove("exam-lock-mode");

    return this.gradeExam();
  }

  gradeExam() {
    let totalEarnedMarks = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const sectionBreakdowns = [];
    const questionDetails = [];
    const topicStats = {};

    for (const section of this.exam.sections) {
      let secEarned = 0;
      let secMax = section.marks;

      for (const q of section.questions) {
        const studentAns = this.userAnswers[q.id];
        let isCorrect = false;
        let earned = 0;

        if (section.id === "sec-tf") {
          // TF question: answer could be { choice: "true"|"false", correctionIndex: 0 }
          const ansChoice = studentAns && studentAns.choice;
          if (ansChoice === q.correctAnswer) {
            if (q.correctAnswer === "false") {
              // must also select right correction
              if (studentAns.correctionIndex === q.correctCorrectionIndex) {
                isCorrect = true;
                earned = q.marks;
              } else {
                earned = q.marks * 0.5; // partial credit
              }
            } else {
              isCorrect = true;
              earned = q.marks;
            }
          }
        } else {
          // MCQ / Normalization / Design
          if (studentAns !== undefined && Number(studentAns) === q.correctIndex) {
            isCorrect = true;
            earned = q.marks;
          }
        }

        totalEarnedMarks += earned;
        secEarned += earned;

        if (isCorrect) correctCount++;
        else wrongCount++;

        if (!topicStats[q.topic]) {
          topicStats[q.topic] = { total: 0, earned: 0 };
        }
        topicStats[q.topic].total += q.marks;
        topicStats[q.topic].earned += earned;

        questionDetails.push({
          questionId: q.id,
          text: q.text,
          topic: q.topic,
          isCorrect,
          earned,
          maxMarks: q.marks,
          studentAnswer: studentAns,
          explanation: q.explanation
        });
      }

      sectionBreakdowns.push({
        sectionId: section.id,
        title: section.title,
        earnedMarks: secEarned,
        maxMarks: secMax,
        percentage: Math.round((secEarned / secMax) * 100)
      });
    }

    const masteredTopics = [];
    const reviewTopics = [];

    for (const [topic, stat] of Object.entries(topicStats)) {
      const pct = Math.round((stat.earned / stat.total) * 100);
      if (pct >= 80) masteredTopics.push({ topic, percentage: pct });
      else reviewTopics.push({ topic, percentage: pct });
    }

    const result = {
      score: Math.round(totalEarnedMarks * 10) / 10,
      maxScore: this.exam.totalMarks,
      percentage: Math.round((totalEarnedMarks / this.exam.totalMarks) * 100),
      durationSeconds: (this.exam.durationMinutes * 60) - this.remainingSeconds,
      correctCount,
      wrongCount,
      totalQuestions: questionDetails.length,
      sectionBreakdowns,
      masteredTopics,
      reviewTopics,
      questionDetails
    };

    progressManager.addExamAttempt(result);
    return result;
  }
}

