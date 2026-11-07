/**
 * ASH - DBMS Learning Platform - Interactive Simulators Lab
 * 1. Attribute Closure & Candidate Keys Calculator (with BCNF Checker)
 * 2. Normalization Visualizer (UNF -> 1NF -> 2NF -> 3NF -> BCNF)
 * 3. 7-Step ER-to-Relational Mapper
 * 4. Relational Algebra Playground (Real Execution Engine)
 */

import { SIMULATOR_PRESETS } from "./content-data.js";
import { escapeHtml } from "./utils.js";

// ==========================================
// 1. ATTRIBUTE CLOSURE & CANDIDATE KEYS
// ==========================================

export class ClosureCalculator {
  static parseAttributes(str) {
    if (!str) return [];
    return str
      .split(/[,\s]+/)
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);
  }

  static parseFDs(str) {
    if (!str) return [];
    const lines = str.split(/[\n;]+/).map(l => l.trim()).filter(l => l.length > 0);
    const fds = [];

    for (const line of lines) {
      const parts = line.split(/->|→/);
      if (parts.length === 2) {
        const left = ClosureCalculator.parseAttributes(parts[0]);
        const right = ClosureCalculator.parseAttributes(parts[1]);
        if (left.length > 0 && right.length > 0) {
          fds.push({ from: left, to: right });
        }
      }
    }
    return fds;
  }

  static isSubset(subset, superset) {
    const superSetObj = new Set(superset);
    return subset.every(item => superSetObj.has(item));
  }

  static computeClosure(attributes, fds, queryAttrs) {
    const closureSet = new Set(queryAttrs.map(a => a.toUpperCase()));
    const normFDs = fds.map(fd => ({
      from: fd.from.map(a => a.toUpperCase()),
      to: fd.to.map(a => a.toUpperCase())
    }));
    const steps = [];

    steps.push({
      stepNumber: 0,
      description: "الحالة الابتدائية (Initial State)",
      appliedFD: "X ⊆ X+",
      added: [...closureSet],
      currentClosure: [...closureSet]
    });

    let changed = true;
    let stepCount = 1;

    while (changed) {
      changed = false;
      for (const fd of normFDs) {
        if (ClosureCalculator.isSubset(fd.from, [...closureSet])) {
          const newAttrs = fd.to.filter(attr => !closureSet.has(attr));
          if (newAttrs.length > 0) {
            newAttrs.forEach(a => closureSet.add(a));
            changed = true;
            steps.push({
              stepNumber: stepCount++,
              description: `تطبيق الاعتمادية: { ${fd.from.join(", ")} } → { ${fd.to.join(", ")} }`,
              appliedFD: `${fd.from.join(", ")} → ${fd.to.join(", ")}`,
              added: newAttrs,
              currentClosure: [...closureSet]
            });
          }
        }
      }
    }

    const finalClosure = [...closureSet];
    const allAttributes = attributes.map(a => a.toUpperCase());
    const isSuperkey = allAttributes.every(a => closureSet.has(a));

    return {
      query: queryAttrs,
      steps,
      finalClosure,
      isSuperkey
    };
  }

  static findCandidateKeys(attributes, fds) {
    const allAttrs = attributes.map(a => a.toUpperCase());
    const leftAttrs = new Set();
    const rightAttrs = new Set();

    for (const fd of fds) {
      fd.from.forEach(a => leftAttrs.add(a));
      fd.to.forEach(a => rightAttrs.add(a));
    }

    const L = allAttrs.filter(a => leftAttrs.has(a) && !rightAttrs.has(a));
    const R = allAttrs.filter(a => rightAttrs.has(a) && !leftAttrs.has(a));
    const B = allAttrs.filter(a => leftAttrs.has(a) && rightAttrs.has(a));
    const N = allAttrs.filter(a => !leftAttrs.has(a) && !rightAttrs.has(a));

    const mandatory = [...L, ...N];
    const candidateKeys = [];
    const classificationSteps = [];

    classificationSteps.push({
      L,
      R,
      B,
      N,
      mandatory
    });

    // Check closure of mandatory
    const mandatoryClosure = ClosureCalculator.computeClosure(allAttrs, fds, mandatory);

    if (mandatoryClosure.isSuperkey) {
      candidateKeys.push(mandatory);
    } else {
      // Test combinations with B
      const getCombinations = (arr, k) => {
        if (k === 0) return [[]];
        if (arr.length === 0) return [];
        const head = arr[0];
        const tail = arr.slice(1);
        const withHead = getCombinations(tail, k - 1).map(c => [head, ...c]);
        const withoutHead = getCombinations(tail, k);
        return [...withHead, ...withoutHead];
      };

      for (let size = 1; size <= B.length; size++) {
        const combs = getCombinations(B, size);
        for (const comb of combs) {
          const candidate = [...mandatory, ...comb];
          // Check if candidate is a superset of an already found candidate key (minimality)
          const isMinimal = !candidateKeys.some(existingKey =>
            ClosureCalculator.isSubset(existingKey, candidate)
          );

          if (isMinimal) {
            const cl = ClosureCalculator.computeClosure(allAttrs, fds, candidate);
            if (cl.isSuperkey) {
              candidateKeys.push(candidate);
            }
          }
        }
      }
    }

    return {
      classification: { L, R, B, N, mandatory },
      candidateKeys
    };
  }

  static checkBCNF(attributes, fds) {
    const allAttrs = attributes.map(a => a.toUpperCase());
    const violations = [];
    const validFDs = [];

    for (const fd of fds) {
      // check if trivial
      const isTrivial = ClosureCalculator.isSubset(fd.to, fd.from);
      if (isTrivial) continue;

      const cl = ClosureCalculator.computeClosure(allAttrs, fds, fd.from);
      if (cl.isSuperkey) {
        validFDs.push({ fd, closure: cl.finalClosure });
      } else {
        violations.push({
          fd,
          closure: cl.finalClosure,
          reason: `الطرف الأيسر { ${fd.from.join(", ")} } ليس مفتاحاً فائقاً (Superkey) لأن إغلاقه لا يغطي كافة سمات الجدول { ${cl.finalClosure.join(", ")} } ≠ R.`
        });
      }
    }

    return {
      isBCNF: violations.length === 0,
      validFDs,
      violations
    };
  }
}

// ==========================================
// 2. NORMALIZATION VISUALIZER
// ==========================================

export const NORMALIZATION_CASES = {
  dreamhome: {
    title: "تقرير تأجير عقارات شركة DreamHome (المحاضرة 8.2)",
    steps: [
      {
        stage: "UNF",
        title: "الصيغة غير المطبعة (UNF)",
        tableName: "Customer_Rental_Table",
        attributes: [
          { name: "Customer_No", pk: false },
          { name: "CName", pk: false },
          { name: "Property_No", pk: false },
          { name: "PAddress", pk: false },
          { name: "RentStart", pk: false },
          { name: "RentFinish", pk: false },
          { name: "Rent", pk: false },
          { name: "Owner_No", pk: false },
          { name: "OName", pk: false }
        ],
        problem: "وجود خلايا متعددة القيم وتكرارات ومجموعات مكررة لبيانات العقارات لكل عميل.",
        action: "تفكيك المجموعات المكررة وجعل كافة القيم ذرية وتحديد المفتاح المركب {Customer_No, Property_No}."
      },
      {
        stage: "1NF",
        title: "الصيغة المعيارية الأولى (1NF)",
        tableName: "Client_Rental (1NF)",
        attributes: [
          { name: "Customer_No", pk: true },
          { name: "Property_No", pk: true },
          { name: "CName", pk: false },
          { name: "PAddress", pk: false },
          { name: "RentStart", pk: false },
          { name: "RentFinish", pk: false },
          { name: "Rent", pk: false },
          { name: "Owner_No", pk: false },
          { name: "OName", pk: false }
        ],
        problem: "وجود اعتماديات جزئية (Partial FDs): Customer_No -> CName، و Property_No -> PAddress, Rent, Owner_No, OName.",
        action: "فصل الجداول حسب محددات الاعتماديات الجزئية للوصول إلى 2NF."
      },
      {
        stage: "2NF",
        title: "الصيغة المعيارية الثانية (2NF)",
        tables: [
          {
            name: "Customer_Relation",
            attributes: [{ name: "Customer_No", pk: true }, { name: "CName", pk: false }]
          },
          {
            name: "Rental_Relation",
            attributes: [
              { name: "Customer_No", pk: true, fk: true },
              { name: "Property_No", pk: true, fk: true },
              { name: "RentStart", pk: false },
              { name: "RentFinish", pk: false }
            ]
          },
          {
            name: "Property_Owner_Relation",
            attributes: [
              { name: "Property_No", pk: true },
              { name: "PAddress", pk: false },
              { name: "Rent", pk: false },
              { name: "Owner_No", pk: false },
              { name: "OName", pk: false }
            ]
          }
        ],
        problem: "في جدول Property_Owner_Relation توجد اعتمادية متعدية (Transitive FD): Owner_No -> OName.",
        action: "فصل السمة المتعدية إلى جدول المالك المستقل Owner_Relation."
      },
      {
        stage: "3NF",
        title: "الصيغة المعيارية الثالثة (3NF)",
        tables: [
          {
            name: "Customer",
            attributes: [{ name: "Customer_No", pk: true }, { name: "CName", pk: false }]
          },
          {
            name: "Rental",
            attributes: [
              { name: "Customer_No", pk: true, fk: true },
              { name: "Property_No", pk: true, fk: true },
              { name: "RentStart", pk: false },
              { name: "RentFinish", pk: false }
            ]
          },
          {
            name: "Property_for_Rent",
            attributes: [
              { name: "Property_No", pk: true },
              { name: "PAddress", pk: false },
              { name: "Rent", pk: false },
              { name: "Owner_No", pk: false, fk: true }
            ]
          },
          {
            name: "Owner",
            attributes: [{ name: "Owner_No", pk: true }, { name: "OName", pk: false }]
          }
        ],
        problem: "تمت إزالة كافة الشوائب والاعتماديات المتعدية والجزئية بنجاح.",
        action: "التصميم الآن في 3NF و BCNF مستقر وخالٍ من شوائب التعديل والحذف والإضافة."
      }
    ]
  },
  student_record: {
    title: "مسألة درجات الطلاب STUDENT_RECORD (المحاضرة 8.1)",
    steps: [
      {
        stage: "1NF",
        title: "الصيغة المعيارية الأولى (1NF)",
        tableName: "STUDENT_RECORD",
        attributes: [
          { name: "Student#", pk: true },
          { name: "CRN", pk: true },
          { name: "StudentName", pk: false },
          { name: "Major", pk: false },
          { name: "CourseName", pk: false },
          { name: "Grade", pk: false }
        ],
        problem: "اعتماديات جزئية: Student# -> StudentName, Major (FD3) و CRN -> CourseName (FD2).",
        action: "فصل كل اعتمادية جزئية في جدول مستقل مع محددها كـ PK."
      },
      {
        stage: "2NF",
        title: "الصيغة المعيارية الثانية (2NF)",
        tables: [
          {
            name: "STUDENT",
            attributes: [{ name: "Student#", pk: true }, { name: "StudentName", pk: false }, { name: "Major", pk: false }]
          },
          {
            name: "COURSE",
            attributes: [{ name: "CRN", pk: true }, { name: "CourseName", pk: false }]
          },
          {
            name: "ENROLLMENT",
            attributes: [
              { name: "Student#", pk: true, fk: true },
              { name: "CRN", pk: true, fk: true },
              { name: "Grade", pk: false }
            ]
          }
        ],
        problem: "لا توجد أي اعتمادية متعدية في الجداول الناتجة.",
        action: "الجداول في 2NF وتعتبر تلقائياً في 3NF لعدم وجود Non-prime -> Non-prime."
      },
      {
        stage: "3NF",
        title: "الصيغة المعيارية الثالثة (3NF)",
        tables: [
          {
            name: "STUDENT",
            attributes: [{ name: "Student#", pk: true }, { name: "StudentName", pk: false }, { name: "Major", pk: false }]
          },
          {
            name: "COURSE",
            attributes: [{ name: "CRN", pk: true }, { name: "CourseName", pk: false }]
          },
          {
            name: "ENROLLMENT",
            attributes: [
              { name: "Student#", pk: true, fk: true },
              { name: "CRN", pk: true, fk: true },
              { name: "Grade", pk: false }
            ]
          }
        ],
        problem: "الجداول مطبعة بالكامل وجميع المحددات مفاتيح فائقة.",
        action: "اكتمل التطبيع بنجاح."
      }
    ]
  }
};

// ==========================================
// 3. 7-STEP ER MAPPER
// ==========================================

export const MAPPING_STEPS_DATA = [
  {
    step: 1,
    title: "الخطوة 1: الكيانات القوية (Strong Entities)",
    rule: "لكل كيان قوي E ننشئ جدولاً R يحوي كافة صفاته البسيطة، مع تجزئة الصفات المركبة إلى صفاتها الذرية الأولية.",
    pkRule: "الصفة المفتاحية للكيان القوي تكون هي المفتاح الأساسي (PK) مع وضع خط متصل.",
    fkRule: "لا توجد مفاتيح أجنبية في هذه الخطوة.",
    example: "كيان الطالب STUDENT(StudentID [PK], Name(Fname, Lname), GPA)",
    resultSchema: "STUDENT ( StudentID [PK] , Fname , Lname , GPA )"
  },
  {
    step: 2,
    title: "الخطوة 2: الكيانات الضعيفة (Weak Entities)",
    rule: "لكل كيان ضعيف W مرتبط بكيان مالك E، ننشئ جدولاً W يحوي صفاته البسيطة، ونضيف المفتاح الأساسي للكيان المالك كـ Foreign Key.",
    pkRule: "مركب إجباري من: (مفتاح المالك الأجنبي + المفتاح الجزئي Discriminator).",
    fkRule: "مفتاح الكيان المالك يوضع كـ FK مشيراً إلى جدول الكيان القوي.",
    example: "كيان الموظف EMPLOYEE(SSN) والتابع DEPENDENT(DepName [Partial], Sex)",
    resultSchema: "DEPENDENT ( SSN [FK] , DepName , Sex )  -> PK: {SSN, DepName}"
  },
  {
    step: 3,
    title: "الخطوة 3: العلاقات الثنائية 1:1 (Binary 1:1)",
    rule: "نختار أحد الجدولين ونضيف المفتاح الأساسي للآخر كمفتاح أجنبي (FK). يُفضل وضع الـ FK في جدول الطرف ذي المشاركة الكلية (Total Participation).",
    pkRule: "المفتاح الأساسي الأصلي للجدول المضاف إليه يظل كما هو.",
    fkRule: "المفتاح الأساسي للطرف الآخر يضاف كـ FK.",
    example: "الطالب STUDENT والسجل الطبي MEDICAL_RECORD (كل سجل طبي يخص طالباً إجبارياً Total).",
    resultSchema: "MEDICAL_RECORD ( RecordID [PK] , ExamDate , Hospital , StudentID [FK] )"
  },
  {
    step: 4,
    title: "الخطوة 4: العلاقات الثنائية 1:N (Binary 1:N)",
    rule: "نأخذ المفتاح الأساسي للكيان في جهة الـ (1) ونضعه كـ مفتاح أجنبي (Foreign Key) في جدول الكيان الموجود في جهة الـ (N).",
    pkRule: "المفتاح الأساسي الأصلي لجدول جهة الـ (N).",
    fkRule: "مفتاح جهة (1) يوضع في جهة (N).",
    example: "القسم DEPARTMENT (1) والموظف EMPLOYEE (N).",
    resultSchema: "EMPLOYEE ( EmpNo [PK] , Name , Salary , DeptNo [FK] )"
  },
  {
    step: 5,
    title: "الخطوة 5: العلاقات الثنائية M:N (Binary M:N)",
    rule: "استحداث جدول جديد تماماً للربط (Relationship Table) يحوي المفتاحين الأساسيين للكيانين كـ Foreign Keys مع أي صفات وصفية للعلاقة.",
    pkRule: "مركب إجباري من المفتاحين الأجنبيين معاً {PK_A + PK_B}.",
    fkRule: "المفتاحان يعملان معاً كـ FKs إلى الجدولين الأصليين.",
    example: "الطالب STUDENT والمقرر COURSE في علاقة تسجيل المواد ENROLLMENT.",
    resultSchema: "ENROLLMENT ( StudentID [FK] , CourseID [FK] , Semester , Grade )  -> PK: {StudentID, CourseID}"
  },
  {
    step: 6,
    title: "الخطوة 6: العلاقات فوق الثنائية / الثلاثية (Ternary / N-ary)",
    rule: "استحداث جدول جديد مستقل يحوي المفاتيح الأساسية لكافة الكيانات المشاركة كمفاتيح أجنبية (FKs) مع صفات العلاقة.",
    pkRule: "مركب افتراضياً من مفاتيح كافة الكيانات المشاركة.",
    fkRule: "جميع مفاتيح الكيانات المشاركة.",
    example: "صيانة الأجهزة MAINTENANCE بين الفني TECHNICIAN والجهاز DEVICE وقطعة الغيار SPARE_PART.",
    resultSchema: "MAINTENANCE ( TechID [FK] , DeviceID [FK] , PartID [FK] , Date , Cost )"
  },
  {
    step: 7,
    title: "الخطوة 7: الصفات متعددة القيم (Multivalued Attributes)",
    rule: "لكل صفة متعددة القيم ننشئ جدولاً مستقلاً يحوي قيمة الصفة ومفتاح الكيان الأصلي كـ Foreign Key.",
    pkRule: "مركب إجباري من: (مفتاح الكيان الأصلي كـ FK + قيمة الصفة).",
    fkRule: "مفتاح الكيان الأصلي.",
    example: "كيان الشركة COMPANY(CompanyID, Name) مع صفة متعددة القيم Locations.",
    resultSchema: "COMPANY_LOCATIONS ( CompanyID [FK] , Location )  -> PK: {CompanyID, Location}"
  }
];

// ==========================================
// 4. RELATIONAL ALGEBRA PLAYGROUND
// ==========================================

export class RelationalEngine {
  constructor(database) {
    this.db = database || SIMULATOR_PRESETS.relationalTables;
  }

  getTable(name) {
    const table = this.db[name];
    if (!table) throw new Error(`الجدول "${name}" غير موجود في قاعدة البيانات.`);
    return {
      name,
      columns: [...table.columns],
      types: [...table.types],
      data: table.data.map(row => [...row])
    };
  }

  // 1. Selection (σ)
  select(tableName, conditionStr) {
    const table = this.getTable(tableName);
    if (!conditionStr || conditionStr.trim() === "") {
      return table;
    }

    // Match conditions like: Column OP Value (e.g. Salary > 20000 or City = 'Tripoli')
    const match = conditionStr.match(/^\s*([a-zA-Z0-9_]+)\s*(=|!=|>|<|>=|<=)\s*(.+)\s*$/);
    if (!match) {
      throw new Error("صيغة الشرط غير صحيحة. مثال: Salary > 20000 أو City = 'Tripoli'");
    }

    const colName = match[1];
    const op = match[2];
    let val = match[3].trim();

    // Strip quotes if string
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.substring(1, val.length - 1);
    } else if (!isNaN(val)) {
      val = Number(val);
    }

    const colIdx = table.columns.findIndex(c => c.toLowerCase() === colName.toLowerCase());
    if (colIdx === -1) {
      throw new Error(`العمود "${colName}" غير موجود في الجدول "${tableName}".`);
    }

    const filteredData = table.data.filter(row => {
      let cell = row[colIdx];
      let targetVal = val;
      if (typeof cell === "number" && typeof targetVal !== "number") {
        targetVal = Number(targetVal);
      }
      if (typeof cell === "string") {
        cell = cell.toLowerCase();
        if (typeof targetVal === "string") targetVal = targetVal.toLowerCase();
      }

      switch (op) {
        case "=": return cell === targetVal;
        case "!=": return cell !== targetVal;
        case ">": return cell > targetVal;
        case "<": return cell < targetVal;
        case ">=": return cell >= targetVal;
        case "<=": return cell <= targetVal;
        default: return false;
      }
    });

    return {
      name: `σ_${conditionStr}(${tableName})`,
      columns: table.columns,
      types: table.types,
      data: filteredData,
      degree: table.columns.length,
      cardinality: filteredData.length,
      originalCardinality: table.data.length
    };
  }

  // 2. Projection (π)
  project(tableName, selectedColumns) {
    const table = this.getTable(tableName);
    if (!selectedColumns || selectedColumns.length === 0) {
      throw new Error("يجب اختيار عمود واحد على الأقل للإسقاط.");
    }

    const indices = [];
    const validCols = [];
    const validTypes = [];

    for (const col of selectedColumns) {
      const idx = table.columns.findIndex(c => c.toLowerCase() === col.toLowerCase());
      if (idx !== -1) {
        indices.push(idx);
        validCols.push(table.columns[idx]);
        validTypes.push(table.types[idx]);
      }
    }

    if (indices.length === 0) {
      throw new Error("لم يتم العثور على الأعمدة المحددة.");
    }

    const rawRows = table.data.map(row => indices.map(i => row[i]));
    const uniqueRows = [];
    const seen = new Set();

    for (const r of rawRows) {
      const key = JSON.stringify(r);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(r);
      }
    }

    const duplicatesRemoved = rawRows.length - uniqueRows.length;

    return {
      name: `π_${validCols.join(",")}(${tableName})`,
      columns: validCols,
      types: validTypes,
      data: uniqueRows,
      degree: validCols.length,
      cardinality: uniqueRows.length,
      originalCardinality: rawRows.length,
      duplicatesRemoved
    };
  }

  // 3. Cartesian Product (×)
  cartesian(table1Name, table2Name) {
    const t1 = this.getTable(table1Name);
    const t2 = this.getTable(table2Name);

    const cols = [
      ...t1.columns.map(c => `${t1.name}.${c}`),
      ...t2.columns.map(c => `${t2.name}.${c}`)
    ];
    const types = [...t1.types, ...t2.types];

    const data = [];
    for (const r1 of t1.data) {
      for (const r2 of t2.data) {
        data.push([...r1, ...r2]);
      }
    }

    return {
      name: `${t1.name} × ${t2.name}`,
      columns: cols,
      types: types,
      data: data,
      degree: cols.length,
      cardinality: data.length
    };
  }

  // 4. Union Compatibility Check
  checkUnionCompatibility(t1, t2) {
    if (t1.columns.length !== t2.columns.length) {
      return {
        compatible: false,
        reason: `درجة الجدول الأول (${t1.columns.length}) لا تساوي درجة الجدول الثاني (${t2.columns.length}). شرط التوافقية يقتضي تساوي الدرجة تماماً.`
      };
    }
    for (let i = 0; i < t1.types.length; i++) {
      if (t1.types[i] !== t2.types[i]) {
        return {
          compatible: false,
          reason: `نوع العمود رقم ${i + 1} (${t1.types[i]}) لا يطابق نوع العمود المقابل (${t2.types[i]}). المجالات يجب أن تكون متطابقة.`
        };
      }
    }
    return { compatible: true };
  }

  // 5. Union (∪)
  union(table1Name, table2Name) {
    const t1 = this.getTable(table1Name);
    const t2 = this.getTable(table2Name);

    const check = this.checkUnionCompatibility(t1, t2);
    if (!check.compatible) {
      throw new Error(`شرط التوافقية للاتحاد (Union Compatibility) غير متحقق:\n${check.reason}\nالحل الأكاديمي: استخدام عملية الإسقاط (π) لاختيار أعمدة متطابقة.`);
    }

    const seen = new Set();
    const data = [];

    for (const row of [...t1.data, ...t2.data]) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) {
        seen.add(key);
        data.push([...row]);
      }
    }

    return {
      name: `${t1.name} ∪ ${t2.name}`,
      columns: t1.columns,
      types: t1.types,
      data: data,
      degree: t1.columns.length,
      cardinality: data.length
    };
  }

  // 6. Intersection (∩)
  intersection(table1Name, table2Name) {
    const t1 = this.getTable(table1Name);
    const t2 = this.getTable(table2Name);

    const check = this.checkUnionCompatibility(t1, t2);
    if (!check.compatible) {
      throw new Error(`شرط التوافقية للتقاطع غير متحقق:\n${check.reason}`);
    }

    const set2 = new Set(t2.data.map(r => JSON.stringify(r)));
    const data = t1.data.filter(r => set2.has(JSON.stringify(r)));

    return {
      name: `${t1.name} ∩ ${t2.name}`,
      columns: t1.columns,
      types: t1.types,
      data: data,
      degree: t1.columns.length,
      cardinality: data.length
    };
  }

  // 7. Difference (−)
  difference(table1Name, table2Name) {
    const t1 = this.getTable(table1Name);
    const t2 = this.getTable(table2Name);

    const check = this.checkUnionCompatibility(t1, t2);
    if (!check.compatible) {
      throw new Error(`شرط التوافقية للطرح غير متحقق:\n${check.reason}`);
    }

    const set2 = new Set(t2.data.map(r => JSON.stringify(r)));
    const data = t1.data.filter(r => !set2.has(JSON.stringify(r)));

    return {
      name: `${t1.name} − ${t2.name}`,
      columns: t1.columns,
      types: t1.types,
      data: data,
      degree: t1.columns.length,
      cardinality: data.length
    };
  }

  // 8. Natural Join (⋈)
  naturalJoin(table1Name, table2Name) {
    const t1 = this.getTable(table1Name);
    const t2 = this.getTable(table2Name);

    // Find shared columns
    const commonCols = t1.columns.filter(c1 =>
      t2.columns.some(c2 => c2.toLowerCase() === c1.toLowerCase())
    );

    if (commonCols.length === 0) {
      throw new Error(`لا توجد أعمدة مشتركة بالاسم بين ${t1.name} و ${t2.name} لإجراء الربط الطبيعي. الناتج سيكون ضرباً ديكارتياً.`);
    }

    const commonIndices1 = commonCols.map(c => t1.columns.indexOf(c));
    const commonIndices2 = commonCols.map(c =>
      t2.columns.findIndex(c2 => c2.toLowerCase() === c.toLowerCase())
    );

    // Result columns: t1 columns + t2 columns except common ones
    const t2UniqueIndices = t2.columns
      .map((c, i) => (!commonIndices2.includes(i) ? i : -1))
      .filter(i => i !== -1);

    const resultCols = [...t1.columns, ...t2UniqueIndices.map(i => t2.columns[i])];
    const resultTypes = [...t1.types, ...t2UniqueIndices.map(i => t2.types[i])];

    const data = [];

    for (const r1 of t1.data) {
      for (const r2 of t2.data) {
        let match = true;
        for (let k = 0; k < commonCols.length; k++) {
          if (String(r1[commonIndices1[k]]).toLowerCase() !== String(r2[commonIndices2[k]]).toLowerCase()) {
            match = false;
            break;
          }
        }
        if (match) {
          const row = [...r1, ...t2UniqueIndices.map(i => r2[i])];
          data.push(row);
        }
      }
    }

    return {
      name: `${t1.name} ⋈ ${t2.name}`,
      columns: resultCols,
      types: resultTypes,
      data: data,
      degree: resultCols.length,
      cardinality: data.length,
      commonCols
    };
  }
}
