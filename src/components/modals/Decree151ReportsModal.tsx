import React, { useState, useRef, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student, StudentDecree151Grades } from '../../types';
import { DECREE_151_WEEKS, calculateDecree151Totals } from '../../utils/decree151Grades';
import { StudentGradeModal } from './StudentGradeModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { MinistryEmblem } from '../common/MinistryEmblem';
import {
  FileText,
  Download,
  Printer,
  X,
  Settings,
  Calendar,
  BookOpen,
  School,
  Edit3,
  Sparkles,
  Save,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Layers,
  FileCheck,
  Check,
  Loader2,
  Table,
} from 'lucide-react';

interface Decree151ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassId?: string;
  defaultSubject?: string;
}

type ReportPageType =
  | 'opening_protocol' // محضر فتح السجل (صفحة 2)
  | 'classwork' // كراسة الحصة (صفحة 1)
  | 'homework' // الواجب المنزلي (صفحة 3)
  | 'weekly_assessment' // التقييم الأسبوعي (صفحة 4)
  | 'behavior' // المواظبة والسلوك (صفحة 5)
  | 'grand_summary' // كشف رصد الدرجات النهائي 40 درجة (صفحة 6)
  | 'closing_protocol' // محضر غلق السجل (صفحة 7)
  | 'batch_editor'; // شاشة الرصد السريع المباشر

export const Decree151ReportsModal: React.FC<Decree151ReportsModalProps> = ({
  isOpen,
  onClose,
  defaultClassId,
  defaultSubject = 'الرياضيات',
}) => {
  const {
    classes,
    students,
    settings,
    users,
    currentUser,
    getClassDecree151Grades,
    getStudentDecree151Grades,
    updateStudentDecree151Grades,
    batchUpdateDecree151Grades,
  } = useSchool();

  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Settings & Filters
  const [activePage, setActivePage] = useState<ReportPageType>('grand_summary');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId || classes[0]?.id || ''
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(defaultSubject);
  const [selectedSemester, setSelectedSemester] = useState<'first' | 'second'>('first');
  const [academicYear, setAcademicYear] = useState<string>(settings?.academicYear || '2026 / 2027 م');
  const [isBlankForm, setIsBlankForm] = useState<boolean>(false);
  const [maxRowsCount, setMaxRowsCount] = useState<number>(45);

  // School & Administrative details
  const [governorate, setGovernorate] = useState<string>('محافظة الإسكندرية - إدارة التعليم العام');
  const [supervision, setSupervision] = useState<string>('توجيه عام الرياضيات - إدارة وسط');
  const [schoolName, setSchoolName] = useState<string>(settings?.schoolName || 'مدرسة المتفوقين الرسمية');
  const [teacherName, setTeacherName] = useState<string>(
    currentUser?.role === 'teacher' ? currentUser.name : 'أحمد محمود إسماعيل'
  );
  const [supervisingTeacher, setSupervisingTeacher] = useState<string>('محمد إبراهيم حسن');
  const [inspectorName, setInspectorName] = useState<string>('عمرو فتحي عبد العزيز');
  const [vicePrincipalName, setVicePrincipalName] = useState<string>('إيهاب كمال سالم');
  const [directorName, setDirectorName] = useState<string>('د. خالد السيد منصور');

  // Protocol specific state
  const [openingDate, setOpeningDate] = useState<string>('2026/09/12');
  const [openingDay, setOpeningDay] = useState<string>('السبت');
  const [registerPageFrom, setRegisterPageFrom] = useState<string>('1');
  const [registerPageTo, setRegisterPageTo] = useState<string>('50');
  const [committeeMember1, setCommitteeMember1] = useState<string>('أحمد محمود إسماعيل (معلم أول)');
  const [committeeMember2, setCommitteeMember2] = useState<string>('محمد إبراهيم حسن (المعلم المشرف)');
  const [committeeMember3, setCommitteeMember3] = useState<string>('إيهاب كمال سالم (وكيل المدرسة لشئون الطلاب)');

  // Grade Edit Modal for single student
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  // Quick Batch Edit State
  const [editableClassGrades, setEditableClassGrades] = useState<StudentDecree151Grades[]>([]);

  // Current class and its students
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    return students.filter((s) => s.classId === currentClass.id);
  }, [students, currentClass]);

  // Load class grades
  const classGrades = useMemo(() => {
    if (!currentClass) return [];
    return getClassDecree151Grades(currentClass.id, selectedSubject, selectedSemester);
  }, [currentClass, selectedSubject, selectedSemester, getClassDecree151Grades]);

  // Sync editable grades when classGrades changes or when batch editor opens
  React.useEffect(() => {
    setEditableClassGrades(classGrades);
  }, [classGrades]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Map student to grades
  const studentGradesMap = useMemo(() => {
    const map = new Map<string, StudentDecree151Grades>();
    classGrades.forEach((g) => map.set(g.studentId, g));
    return map;
  }, [classGrades]);

  // Handlers
  const handlePrint = () => {
    const isLandscape = activePage !== 'opening_protocol' && activePage !== 'closing_protocol';
    const styleId = 'a4-decree151-print-rules';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 3mm 4mm; }`;
    window.print();
  };

  const handleExportPdf = async () => {
    if (activePage === 'batch_editor') {
      setActivePage('grand_summary');
      showToast('جاري التحويل لكشف الرصد لتصدير ملف PDF...');
      setTimeout(() => {
        handleExportPdf();
      }, 300);
      return;
    }

    if (!printAreaRef.current) {
      showToast('يرجى فتح إحدى صفحات السجل للمعاينة قبل التصدير');
      return;
    }

    setIsExportingPdf(true);
    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const target = clonedDoc.getElementById('decree151-print-container');
          if (target) {
            target.style.boxShadow = 'none';
            target.style.transform = 'none';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const isLandscape = activePage !== 'opening_protocol' && activePage !== 'closing_protocol';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 4;
      const availWidth = pdfWidth - margin * 2;
      const availHeight = pdfHeight - margin * 2;

      // Fit strictly within standard A4 maintaining exact aspect ratio without distortion
      let renderWidth = availWidth;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (renderHeight > availHeight) {
        renderHeight = availHeight;
        renderWidth = (canvas.width * renderHeight) / canvas.height;
      }

      const posX = margin + (availWidth - renderWidth) / 2;
      const posY = margin + (availHeight - renderHeight) / 2;

      pdf.addImage(
        imgData,
        'JPEG',
        posX,
        posY,
        renderWidth,
        renderHeight
      );

      const pageNameAr =
        activePage === 'grand_summary'
          ? 'كشف_الدرجات_النهائي_قرار_151'
          : activePage === 'classwork'
          ? 'كشف_كراسة_الحصة'
          : activePage === 'homework'
          ? 'كشف_الواجب_المنزلي'
          : activePage === 'weekly_assessment'
          ? 'كشف_التقييم_الأسبوعي'
          : activePage === 'behavior'
          ? 'كشف_المواظبة_والسلوك'
          : activePage === 'opening_protocol'
          ? 'محضر_فتح_سجل_الدرجات'
          : 'محضر_غلق_سجل_الدرجات';

      pdf.save(`${pageNameAr}_${currentClass?.name || 'فصل'}_${selectedSubject}.pdf`);
      showToast('تم استخراج وتحميل ملف الـ PDF بنجاح وفق مقاس ورقة A4');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('تعذر استخراج ملف PDF مباشرة، يمكنك استخدام زر "طباعة فورية" لحفظه كـ PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSaveBatchGrades = () => {
    batchUpdateDecree151Grades(editableClassGrades);
    showToast('تم حفظ جميع درجات الفصل بنجاح وفق القرار الوزاري 151');
  };

  const handleBatchFieldChange = (
    studentId: string,
    field: 'homeworkAvg' | 'classworkAvg' | 'weeklyAssessmentAvg' | 'behaviorAvg' | 'monthTest1' | 'monthTest2',
    val: string
  ) => {
    const num = val === '' ? 0 : Number(val);
    setEditableClassGrades((prev) =>
      prev.map((g) => {
        if (g.studentId !== studentId) return g;
        const updated = { ...g, [field]: num };
        const totals = calculateDecree151Totals(updated.weeklyGrades, updated.monthTest1, updated.monthTest2, {
          homeworkAvg: updated.homeworkAvg,
          classworkAvg: updated.classworkAvg,
          weeklyAssessmentAvg: updated.weeklyAssessmentAvg,
          behaviorAvg: updated.behaviorAvg,
        });
        return { ...updated, ...totals };
      })
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col border border-slate-200 overflow-hidden text-slate-800">
        
        {/* TOP BAR */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/40">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm sm:text-base text-white">
                  سجل وكشوفات تقييم الدرجات الرسمية (القرار الوزاري 151 لسنة 2026)
                </h2>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  النموذج الوزاري المعتمد
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                الحلقة الابتدائية وصفوف النقل | كراسة الحصة، الواجب المنزلي، التقييم الأسبوعي، السلوك، واختبارات الشهور
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
              title="طباعة الصفحة الحالية A4"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">طباعة فورية</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>تحميل PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* OFFICIAL SHEETS NAVIGATION TABS */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 scrollbar-thin">
          <span className="text-[11px] font-extrabold text-slate-400 pl-2 shrink-0">صفحات السجل:</span>
          
          <button
            onClick={() => setActivePage('opening_protocol')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePage === 'opening_protocol'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>محضر فتح السجل</span>
          </button>

          <button
            onClick={() => setActivePage('classwork')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePage === 'classwork'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>كراسة الحصة (5)</span>
          </button>

          <button
            onClick={() => setActivePage('homework')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePage === 'homework'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>الواجب المنزلي (5)</span>
          </button>

          <button
            onClick={() => setActivePage('weekly_assessment')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePage === 'weekly_assessment'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>التقييم الأسبوعي (10)</span>
          </button>

          <button
            onClick={() => setActivePage('behavior')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePage === 'behavior'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>المواظبة والسلوك (5)</span>
          </button>

          <button
            onClick={() => setActivePage('grand_summary')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePage === 'grand_summary'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>كشف الرصد النهائي المجمع (40)</span>
          </button>

          <button
            onClick={() => setActivePage('closing_protocol')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePage === 'closing_protocol'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>محضر غلق السجل</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1 shrink-0" />

          <button
            onClick={() => setActivePage('batch_editor')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activePage === 'batch_editor'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>رصد وتعديل درجات الطلاب</span>
          </button>
        </div>

        {/* CONTROLS STRIP */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500">الفصل:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500">المادة:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800"
              >
                <option value="الرياضيات">الرياضيات</option>
                <option value="اللغة العربية">اللغة العربية</option>
                <option value="العلوم">العلوم</option>
                <option value="الدراسات الاجتماعية">الدراسات الاجتماعية</option>
                <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                <option value="التربية الدينية">التربية الدينية</option>
                <option value="المهارات المهنية">المهارات المهنية</option>
                <option value="تكنولوجيا المعلومات">تكنولوجيا المعلومات</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500">الفصل الدراسي:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as 'first' | 'second')}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800"
              >
                <option value="first">الفصل الدراسي الأول</option>
                <option value="second">الفصل الدراسي الثاني</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-r border-slate-300 pr-3 mr-1">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isBlankForm}
                  onChange={(e) => setIsBlankForm(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <span>تصدير كشف رسمي فارغ (للتدوين اليدوي)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">عدد صفوف الكشف:</span>
            <select
              value={maxRowsCount}
              onChange={(e) => setMaxRowsCount(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800"
            >
              {classStudents.length > 0 && (
                <option value={classStudents.length}>
                  طلاب الفصل الحالي ({classStudents.length} طالباً)
                </option>
              )}
              <option value={25}>25 طالباً (A4 صفحة مريحة)</option>
              <option value={30}>30 طالباً (A4 صفحة نموذجية)</option>
              <option value={35}>35 طالباً</option>
              <option value={40}>40 طالباً</option>
              <option value={45}>45 طالباً</option>
              <option value={50}>50 طالباً (الدفتر الكامل)</option>
            </select>
          </div>
        </div>

        {/* WORKSPACE AREA: TWO VIEWS (BATCH EDITOR OR OFFICIAL PREVIEW) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 flex justify-center items-start print:p-0 print:bg-white">
          
          {/* VIEW A: BATCH GRADES EDITOR */}
          {activePage === 'batch_editor' ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl w-full max-w-6xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
                <div>
                  <h3 className="font-black text-base text-slate-800">
                    رصد الدرجات المباشر لفصل: {currentClass?.name} - مادة {selectedSubject}
                  </h3>
                  <p className="text-xs text-slate-500">
                    يمكنك تعديل متوسطات أعمال السنة (25) واختبارات الشهور (15) لكل طالب، أو النقر على "تفاصيل 17 أسبوعاً".
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveBatchGrades}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ جميع التعديلات</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-center text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-12 border-l border-slate-200">م</th>
                      <th className="p-2.5 min-w-[170px] text-right border-l border-slate-200">اسم الطالب</th>
                      <th className="p-2.5 border-l border-slate-200 text-blue-800 bg-blue-50/70">كراس الواجب (5)</th>
                      <th className="p-2.5 border-l border-slate-200 text-indigo-800 bg-indigo-50/70">كراس الحصة (5)</th>
                      <th className="p-2.5 border-l border-slate-200 text-emerald-800 bg-emerald-50/70">تقييم أسبوعي (10)</th>
                      <th className="p-2.5 border-l border-slate-200 text-amber-800 bg-amber-50/70">المواظبة والسلوك (5)</th>
                      <th className="p-2.5 border-l border-slate-200 text-blue-900 bg-blue-100/70 font-black">أعمال السنة (25)</th>
                      <th className="p-2.5 border-l border-slate-200">اختبار 1 (15)</th>
                      <th className="p-2.5 border-l border-slate-200">اختبار 2 (15)</th>
                      <th className="p-2.5 border-l border-slate-200 text-amber-900 bg-amber-100/70 font-black">متوسط الاختبارين (15)</th>
                      <th className="p-2.5 text-white bg-emerald-700 font-black">المجموع النهائي (40)</th>
                      <th className="p-2.5">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((st, idx) => {
                      const grade = editableClassGrades.find((g) => g.studentId === st.id) || getStudentDecree151Grades(st.id, selectedSubject, selectedSemester);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-2 font-bold text-slate-500 border-l border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-800 text-right border-l border-slate-200">{st.name}</td>
                          {/* Homework */}
                          <td className="p-1 border-l border-slate-200 bg-blue-50/20">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              step={0.5}
                              value={grade.homeworkAvg ?? 5}
                              onChange={(e) => handleBatchFieldChange(st.id, 'homeworkAvg', e.target.value)}
                              className="w-14 text-center font-bold py-1 border border-slate-300 rounded-md focus:border-blue-600 focus:bg-white"
                            />
                          </td>
                          {/* Classwork */}
                          <td className="p-1 border-l border-slate-200 bg-indigo-50/20">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              step={0.5}
                              value={grade.classworkAvg ?? 5}
                              onChange={(e) => handleBatchFieldChange(st.id, 'classworkAvg', e.target.value)}
                              className="w-14 text-center font-bold py-1 border border-slate-300 rounded-md focus:border-indigo-600 focus:bg-white"
                            />
                          </td>
                          {/* Weekly Assessment */}
                          <td className="p-1 border-l border-slate-200 bg-emerald-50/20">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={grade.weeklyAssessmentAvg ?? 10}
                              onChange={(e) => handleBatchFieldChange(st.id, 'weeklyAssessmentAvg', e.target.value)}
                              className="w-14 text-center font-bold py-1 border border-slate-300 rounded-md focus:border-emerald-600 focus:bg-white"
                            />
                          </td>
                          {/* Behavior */}
                          <td className="p-1 border-l border-slate-200 bg-amber-50/20">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              step={0.5}
                              value={grade.behaviorAvg ?? 5}
                              onChange={(e) => handleBatchFieldChange(st.id, 'behaviorAvg', e.target.value)}
                              className="w-14 text-center font-bold py-1 border border-slate-300 rounded-md focus:border-amber-600 focus:bg-white"
                            />
                          </td>
                          {/* Activities Total (25) */}
                          <td className="p-2 font-extrabold text-blue-900 bg-blue-100/50 border-l border-slate-200">
                            {grade.semesterActivitiesAvg ?? 25}
                          </td>
                          {/* Test 1 */}
                          <td className="p-1 border-l border-slate-200">
                            <input
                              type="number"
                              min={0}
                              max={15}
                              step={0.5}
                              value={grade.monthTest1 ?? 14}
                              onChange={(e) => handleBatchFieldChange(st.id, 'monthTest1', e.target.value)}
                              className="w-14 text-center font-bold py-1 border border-slate-300 rounded-md focus:border-blue-600 focus:bg-white"
                            />
                          </td>
                          {/* Test 2 */}
                          <td className="p-1 border-l border-slate-200">
                            <input
                              type="number"
                              min={0}
                              max={15}
                              step={0.5}
                              value={grade.monthTest2 ?? 15}
                              onChange={(e) => handleBatchFieldChange(st.id, 'monthTest2', e.target.value)}
                              className="w-14 text-center font-bold py-1 border border-slate-300 rounded-md focus:border-blue-600 focus:bg-white"
                            />
                          </td>
                          {/* Tests Average (15) */}
                          <td className="p-2 font-extrabold text-amber-900 bg-amber-100/50 border-l border-slate-200">
                            {grade.testsAvg ?? 14.5}
                          </td>
                          {/* Final Total (40) */}
                          <td className="p-2 font-black text-sm text-emerald-800 bg-emerald-100/60 border-l border-slate-200">
                            {grade.finalTotal ?? 39.5}
                          </td>
                          {/* Actions */}
                          <td className="p-2">
                            <button
                              onClick={() => {
                                setEditingStudent(st);
                                setIsGradeModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition"
                              title="فتح تفاصيل الـ 17 أسبوعاً للطالب"
                            >
                              <Edit3 className="w-3 h-3 text-blue-600" />
                              <span>تفاصيل 17 أسبوعاً</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            
            /* VIEW B: OFFICIAL PRINT/PDF SHEETS MATCHING MINISTERIAL DECREE 151 */
            <div
              id="decree151-print-container"
              ref={printAreaRef}
              className="bg-white text-black p-4 sm:p-8 shadow-2xl border-2 border-black font-sans leading-tight select-none relative print:w-full print:min-w-0 print:border-none print:shadow-none print:p-2"
              style={{
                fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
                color: '#000000',
                width: activePage === 'opening_protocol' || activePage === 'closing_protocol' ? '820px' : '1080px',
                minWidth: activePage === 'opening_protocol' || activePage === 'closing_protocol' ? '820px' : '1080px',
              }}
            >

              {/* ========================================================= */}
              {/* 1. محضر فتح سجل الدرجات والغياب (صفحة 2 في ملف الوزارة) */}
              {/* ========================================================= */}
              {activePage === 'opening_protocol' && (
                <div className="space-y-6 py-4 px-2">
                  {/* Top Ministry Header */}
                  <div className="flex items-start justify-between pb-3 border-b-2 border-black">
                    <div className="w-20 h-20 shrink-0 flex flex-col items-center justify-center text-center">
                      <MinistryEmblem size={64} />
                    </div>

                    <div className="text-right space-y-1 text-xs font-bold text-black flex-1 pr-6">
                      <p>وزارة التربية والتعليم والتعليم الفني</p>
                      <p>مديرية التربية والتعليم بـ: {governorate}</p>
                      <p>إدارة: {supervision} التعليمية</p>
                      <p>مدرسة: {schoolName}</p>
                    </div>
                  </div>

                  {/* Frame Heading */}
                  <div className="border-2 border-black rounded-3xl p-4 text-center space-y-2 my-6">
                    <h3 className="font-extrabold text-lg text-black">
                      محضر فتح سجل الدرجات والغياب للعام الدراسي {academicYear}
                    </h3>
                    <div className="inline-block border border-black rounded-full px-6 py-1 font-bold text-sm">
                      {selectedSemester === 'first' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني'}
                    </div>
                  </div>

                  {/* Protocol Legal Text matching Decree 151 */}
                  <div className="text-right leading-relaxed text-sm font-semibold space-y-4 px-2">
                    <p>
                      إنه في يوم <span className="font-bold border-b border-black px-3">{openingDay}</span> الموافق{' '}
                      <span className="font-bold border-b border-black px-3">{openingDate}</span>
                    </p>

                    <p>
                      تم فتح سجل الدرجات والغياب لمادة <span className="font-bold border-b border-black px-4">{selectedSubject}</span>{' '}
                      بمعرفة اللجنة المشكلة والموقعة أدناه بعد التأكد من سلامة الدفتر ومطابقته للقرار الوزاري{' '}
                      <span className="font-extrabold text-base">(151)</span> الصادر بتاريخ{' '}
                      <span className="font-bold">18 / 8 / 2026 م</span> المنظم لنظام الدراسة والتقييم لتلاميذ المرحلة الابتدائية وصفوف النقل.
                    </p>

                    <p>
                      وقد تم ختم السجل بختم المدرسة وأصبح معتمداً وصالحاً للعمل به من التاريخ المحدد،
                    </p>

                    <p>
                      والدفتر مرقم من صفحة ( <span className="font-bold px-2">{registerPageFrom}</span> ) إلى صفحة ({' '}
                      <span className="font-bold px-2">{registerPageTo}</span> ).
                    </p>
                  </div>

                  {/* Committee Members List */}
                  <div className="pt-6 space-y-2 text-right">
                    <h4 className="font-bold text-sm text-black">اللجنة المشرفة على فتح السجل:</h4>
                    <ol className="list-decimal list-inside space-y-2 pr-4 text-xs font-bold">
                      <li>{committeeMember1} .................................................... (التوقيع: ............)</li>
                      <li>{committeeMember2} .................................................... (التوقيع: ............)</li>
                      <li>{committeeMember3} .................................................... (التوقيع: ............)</li>
                    </ol>
                  </div>

                  {/* Official Signatures Row */}
                  <div className="pt-12 grid grid-cols-5 gap-2 text-center text-xs font-bold border-t-2 border-black mt-8">
                    <div>
                      <p className="mb-8">معلم المادة</p>
                      <p className="border-t border-dotted border-black pt-1">{teacherName}</p>
                    </div>
                    <div>
                      <p className="mb-8">المعلم المشرف</p>
                      <p className="border-t border-dotted border-black pt-1">{supervisingTeacher}</p>
                    </div>
                    <div>
                      <p className="mb-8">موجه المادة</p>
                      <p className="border-t border-dotted border-black pt-1">{inspectorName}</p>
                    </div>
                    <div>
                      <p className="mb-8">وكيل المدرسة</p>
                      <p className="border-t border-dotted border-black pt-1">{vicePrincipalName}</p>
                    </div>
                    <div>
                      <p className="mb-8">مدير المدرسة</p>
                      <p className="border-t border-dotted border-black pt-1">{directorName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 2, 3, 4, 5. كشوفات الـ 17 أسبوعاً (الحصة، الواجب، التقييم، السلوك) */}
              {/* ========================================================= */}
              {(activePage === 'classwork' ||
                activePage === 'homework' ||
                activePage === 'weekly_assessment' ||
                activePage === 'behavior') && (
                <div className="space-y-3">
                  {/* Top Header */}
                  <div className="flex items-start justify-between pb-2 border-b-2 border-black">
                    <div className="w-16 h-16 shrink-0 flex flex-col items-center justify-center text-center">
                      <MinistryEmblem size={56} />
                    </div>

                    <div className="text-right text-[11px] font-bold text-black flex-1 pr-4 space-y-0.5">
                      <p>{governorate}</p>
                      <p>{supervision}</p>
                      <p>مدرسة / {schoolName}</p>
                      <p>المعلم / {teacherName} | الفصل: {currentClass?.name}</p>
                    </div>
                  </div>

                  {/* Title Banner */}
                  <div className="text-center space-y-1 my-1">
                    <h3 className="font-extrabold text-sm border-2 border-black py-1 px-4 inline-block rounded-xl bg-slate-50">
                      كشف درجات الحلقة الابتدائية وفقاً للقرار الوزاري (151) لسنة 2026 م للفصل الدراسي {selectedSemester === 'first' ? 'الأول' : 'الثاني'} للعام الدراسي {academicYear}
                    </h3>
                    <div className="font-black text-sm text-black py-0.5 underline">
                      {activePage === 'classwork' && 'كراسة الحصة'}
                      {activePage === 'homework' && 'الواجب المنزلى'}
                      {activePage === 'weekly_assessment' && 'التقييم الاسبوعى'}
                      {activePage === 'behavior' && 'المواظبة والسلوك'}
                    </div>
                  </div>

                  {/* 17-Week Table */}
                  <div className="overflow-x-auto border-2 border-black">
                    <table className="w-full text-center text-[10px] border-collapse border border-black">
                      <thead className="bg-slate-100 font-extrabold border-b-2 border-black">
                        <tr>
                          <th className="border border-black p-1 w-7" rowSpan={2}>م</th>
                          <th className="border border-black p-1 min-w-[140px]" rowSpan={2}>الاســـــــــــــــــــــــــــــــم</th>
                          {DECREE_151_WEEKS.map((w) => (
                            <th key={w.number} className="border border-black p-0.5 text-[8px] leading-tight min-w-[36px] align-bottom">
                              <div
                                className="whitespace-nowrap py-1.5 px-0.5 font-bold text-[8.5px] leading-tight select-none inline-block mx-auto"
                                style={{
                                  writingMode: 'vertical-rl',
                                  textOrientation: 'mixed',
                                }}
                              >
                                {w.label} {w.dateStr}
                              </div>
                            </th>
                          ))}
                          <th className="border border-black p-1 w-10 bg-slate-200" rowSpan={2}>
                            <div className="font-black">المتوسط</div>
                          </th>
                        </tr>
                        {/* Max Grades Row */}
                        <tr className="bg-slate-200 font-black text-[9px]">
                          {DECREE_151_WEEKS.map((w) => (
                            <th key={w.number} className="border border-black p-0.5">
                              {activePage === 'weekly_assessment' ? '10' : '5'}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: maxRowsCount }).map((_, index) => {
                          const student = !isBlankForm ? classStudents[index] : undefined;
                          const grades = student ? studentGradesMap.get(student.id) : undefined;
                          const avgVal =
                            activePage === 'classwork'
                              ? grades?.classworkAvg
                              : activePage === 'homework'
                              ? grades?.homeworkAvg
                              : activePage === 'weekly_assessment'
                              ? grades?.weeklyAssessmentAvg
                              : grades?.behaviorAvg;

                          return (
                            <tr key={index} className="h-5 hover:bg-slate-50">
                              <td className="border border-black p-0.5 font-bold text-center">{index + 1}</td>
                              <td className="border border-black p-0.5 px-1.5 font-bold text-right truncate max-w-[150px]">
                                {student?.name || ''}
                              </td>
                              {DECREE_151_WEEKS.map((w) => {
                                const weekRec = grades?.weeklyGrades?.[w.number];
                                const val =
                                  activePage === 'classwork'
                                    ? weekRec?.classwork
                                    : activePage === 'homework'
                                    ? weekRec?.homework
                                    : activePage === 'weekly_assessment'
                                    ? weekRec?.weeklyAssessment
                                    : weekRec?.behavior;

                                return (
                                  <td key={w.number} className="border border-black p-0.5 font-bold text-center">
                                    {val !== undefined ? val : ''}
                                  </td>
                                );
                              })}
                              <td className="border border-black p-0.5 font-black text-center bg-slate-50">
                                {avgVal !== undefined ? avgVal : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures */}
                  <div className="pt-4 grid grid-cols-3 gap-6 text-center text-xs font-bold border-t-2 border-black mt-4">
                    <div>
                      <p className="mb-6">معلم المادة</p>
                      <p>{teacherName}</p>
                    </div>
                    <div>
                      <p className="mb-6">موجه المادة</p>
                      <p>{inspectorName}</p>
                    </div>
                    <div>
                      <p className="mb-6">مدير المدرسة</p>
                      <p>{directorName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 6. كشف رصد الدرجات النهائي الشامل المجمع (صفحة 6 في الصورة) */}
              {/* ========================================================= */}
              {activePage === 'grand_summary' && (
                <div className="space-y-3">
                  {/* Top Header */}
                  <div className="flex items-start justify-between pb-2 border-b-2 border-black">
                    <div className="w-16 h-16 shrink-0 flex flex-col items-center justify-center text-center">
                      <MinistryEmblem size={56} />
                    </div>

                    <div className="text-right text-[11px] font-bold text-black flex-1 pr-4 space-y-0.5">
                      <p>{governorate}</p>
                      <p>{supervision}</p>
                      <p>مدرسة / {schoolName}</p>
                      <p>المعلم / {teacherName} | الفصل: {currentClass?.name}</p>
                    </div>
                  </div>

                  {/* Title Banner */}
                  <div className="text-center space-y-1 my-1">
                    <h3 className="font-extrabold text-sm border-2 border-black py-1 px-4 inline-block rounded-xl bg-slate-50">
                      كشف درجات الحلقة الابتدائية وفقاً للقرار الوزاري (151) لسنة 2026 م للفصل الدراسي {selectedSemester === 'first' ? 'الأول' : 'الثاني'} للعام الدراسي {academicYear}
                    </h3>
                    <p className="font-black text-xs text-black">
                      سجل الرصد العام الشامل (متوسط الفصل الدراسي 25 + اختبارات الشهور 15 = المجموع النهائي 40 درجة)
                    </p>
                  </div>

                  {/* The Grand Decree 151 Table (Exact match to Page 6) */}
                  <div className="overflow-x-auto border-2 border-black">
                    <table className="w-full text-center text-[10px] border-collapse border border-black">
                      <thead className="bg-slate-100 font-extrabold border-b-2 border-black">
                        <tr>
                          <th className="border border-black p-1 w-8" rowSpan={2}>م</th>
                          <th className="border border-black p-1 min-w-[180px]" rowSpan={2}>الاســـــــــــــــــــــــــــــــم</th>
                          
                          {/* متوسط الفصل الدراسي (25 درجة) */}
                          <th className="border border-black p-1 bg-slate-50" colSpan={5}>
                            متوسط الفصل الدراسي (أعمال السنة)
                          </th>

                          {/* اختبارات الشهور (15 درجة) */}
                          <th className="border border-black p-1 bg-amber-50" colSpan={3}>
                            اختبارات الشهور
                          </th>

                          {/* المجموع النهائي (40 درجة) */}
                          <th className="border border-black p-1 w-16 bg-emerald-100 font-black text-emerald-950" rowSpan={2}>
                            المجموع النهائي
                          </th>
                        </tr>
                        
                        {/* Sub-headers with max scores */}
                        <tr className="bg-slate-200 font-black text-[9px]">
                          <th className="border border-black p-0.5">كراس الواجب (5)</th>
                          <th className="border border-black p-0.5">كراس الحصة (5)</th>
                          <th className="border border-black p-0.5">تقييم أسبوعي (10)</th>
                          <th className="border border-black p-0.5">المواظبة والسلوك (5)</th>
                          <th className="border border-black p-0.5 bg-blue-100 text-blue-950 font-black">المتوسط (25)</th>
                          
                          <th className="border border-black p-0.5">الاختبار الأول (15)</th>
                          <th className="border border-black p-0.5">الاختبار الثاني (15)</th>
                          <th className="border border-black p-0.5 bg-amber-100 text-amber-950 font-black">متوسط الاختبارين (15)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: maxRowsCount }).map((_, index) => {
                          const student = !isBlankForm ? classStudents[index] : undefined;
                          const grades = student ? studentGradesMap.get(student.id) : undefined;

                          return (
                            <tr key={index} className="h-5 hover:bg-slate-50">
                              <td className="border border-black p-0.5 font-bold text-center">{index + 1}</td>
                              <td className="border border-black p-0.5 px-2 font-bold text-right truncate max-w-[200px]">
                                {student?.name || ''}
                              </td>

                              {/* Activities breakdown */}
                              <td className="border border-black p-0.5 font-bold">{grades?.homeworkAvg ?? ''}</td>
                              <td className="border border-black p-0.5 font-bold">{grades?.classworkAvg ?? ''}</td>
                              <td className="border border-black p-0.5 font-bold">{grades?.weeklyAssessmentAvg ?? ''}</td>
                              <td className="border border-black p-0.5 font-bold">{grades?.behaviorAvg ?? ''}</td>
                              <td className="border border-black p-0.5 font-black bg-blue-50/70 text-blue-950">
                                {grades?.semesterActivitiesAvg ?? ''}
                              </td>

                              {/* Monthly tests */}
                              <td className="border border-black p-0.5 font-bold">{grades?.monthTest1 ?? ''}</td>
                              <td className="border border-black p-0.5 font-bold">{grades?.monthTest2 ?? ''}</td>
                              <td className="border border-black p-0.5 font-black bg-amber-50/70 text-amber-950">
                                {grades?.testsAvg ?? ''}
                              </td>

                              {/* Grand Total out of 40 */}
                              <td className="border border-black p-0.5 font-black text-[11px] bg-emerald-50 text-emerald-950">
                                {grades?.finalTotal ?? ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures Row */}
                  <div className="pt-4 grid grid-cols-3 gap-6 text-center text-xs font-bold border-t-2 border-black mt-4">
                    <div>
                      <p className="mb-6">معلم المادة</p>
                      <p>{teacherName}</p>
                    </div>
                    <div>
                      <p className="mb-6">موجه المادة</p>
                      <p>{inspectorName}</p>
                    </div>
                    <div>
                      <p className="mb-6">مدير المدرسة</p>
                      <p>{directorName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 7. محضر غلق سجل الدرجات والغياب (صفحة 7 في ملف الوزارة) */}
              {/* ========================================================= */}
              {activePage === 'closing_protocol' && (
                <div className="space-y-6 py-4 px-2">
                  {/* Top Header */}
                  <div className="flex items-start justify-between pb-3 border-b-2 border-black">
                    <div className="w-20 h-20 shrink-0 flex flex-col items-center justify-center text-center">
                      <MinistryEmblem size={64} />
                    </div>

                    <div className="text-right space-y-1 text-xs font-bold text-black flex-1 pr-6">
                      <p>وزارة التربية والتعليم والتعليم الفني</p>
                      <p>مديرية التربية والتعليم بـ: {governorate}</p>
                      <p>إدارة: {supervision} التعليمية</p>
                      <p>مدرسة: {schoolName}</p>
                    </div>
                  </div>

                  {/* Banner */}
                  <div className="border-2 border-black rounded-3xl p-4 text-center space-y-2 my-6">
                    <h3 className="font-extrabold text-lg text-black">
                      محضر غلق سجل الدرجات والغياب للعام الدراسي {academicYear}
                    </h3>
                    <div className="inline-block border border-black rounded-full px-6 py-1 font-bold text-sm">
                      {selectedSemester === 'first' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني'}
                    </div>
                  </div>

                  {/* Declaration text matching Page 7 */}
                  <div className="text-right leading-loose text-sm font-semibold space-y-6 px-4">
                    <p>
                      أقر أنا / <span className="font-bold border-b border-black px-4">{teacherName}</span> معلم مادة /{' '}
                      <span className="font-bold border-b border-black px-4">{selectedSubject}</span> فصل /{' '}
                      <span className="font-bold border-b border-black px-4">{currentClass?.name}</span>
                    </p>

                    <p>
                      للفصل الدراسي <span className="font-bold border-b border-black px-3">{selectedSemester === 'first' ? 'الأول' : 'الثاني'}</span> للعام الدراسي{' '}
                      <span className="font-bold border-b border-black px-3">{academicYear}</span> بأنني انتهيت من تدريس المنهج كاملاً،
                    </p>

                    <p>
                      وأقر بأن درجات أعمال السنة مطابقة لمستوى تلاميذ الفصل الفعلي، وأي كشط أو شطب أو مزيل أو أية تعديلات في الدرجات تحت مسئوليتي الشخصية ودون أدنى مسئولية على لجنة النظام والمراقبة.
                    </p>

                    <p className="font-bold text-base text-center pt-4">وهذا إقرار مني بذلك،،،</p>

                    <div className="text-left pl-8 pt-2 font-bold text-xs">
                      المقر بما فيه: <span className="border-b border-black px-4">{teacherName}</span> (التوقيع: ............)
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold border-t-2 border-black mt-8">
                    <div>
                      <p className="mb-8">المعلم المشرف</p>
                      <p className="border-t border-dotted border-black pt-1">{supervisingTeacher}</p>
                    </div>
                    <div>
                      <p className="mb-8">وكيل المدرسة</p>
                      <p className="border-t border-dotted border-black pt-1">{vicePrincipalName}</p>
                    </div>
                    <div>
                      <p className="mb-8">مدير المدرسة</p>
                      <p className="border-t border-dotted border-black pt-1">{directorName}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* BOTTOM FOOTER */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-700">
              معتمد ومطابق للقرار الوزاري رقم (151) لسنة 2026
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage('batch_editor')}
              className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl font-bold flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>إدخال وتعديل درجات الطلاب</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة المستند الرسمي</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal for single student detailed 17 weeks grades */}
      <StudentGradeModal
        isOpen={isGradeModalOpen}
        onClose={() => {
          setIsGradeModalOpen(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
        subject={selectedSubject}
        semester={selectedSemester}
        onSaved={() => {
          showToast('تم تحديث درجات الطالب بنجاح');
        }}
      />
    </div>
  );
};
