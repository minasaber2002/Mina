import React, { useState, useRef, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ClassRoom } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { MinistryEmblem } from '../common/MinistryEmblem';
import {
  FileText,
  Download,
  Printer,
  X,
  Check,
  Settings,
  Calendar,
  BookOpen,
  School,
  UserCheck,
  Eye,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface MonthlyAttendancePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassId?: string;
}

const MONTHS_LIST = [
  { id: '10', name: 'أكتوبر', daysCount: 31, defaultWeek: 1 },
  { id: '11', name: 'نوفمبر', daysCount: 30, defaultWeek: 1 },
  { id: '12', name: 'ديسمبر', daysCount: 31, defaultWeek: 1 },
  { id: '01', name: 'يناير', daysCount: 31, defaultWeek: 1 },
  { id: '02', name: 'فبراير', daysCount: 28, defaultWeek: 1 },
  { id: '03', name: 'مارس', daysCount: 31, defaultWeek: 1 },
  { id: '04', name: 'أبريل', daysCount: 30, defaultWeek: 1 },
  { id: '05', name: 'مايو', daysCount: 31, defaultWeek: 1 },
];

const DAYS_NAMES = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export const MonthlyAttendancePdfModal: React.FC<MonthlyAttendancePdfModalProps> = ({
  isOpen,
  onClose,
  defaultClassId,
}) => {
  const { classes, students, attendance, users, settings, currentUser } = useSchool();

  const sheetRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form settings
  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId || classes[0]?.id || ''
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('10'); // October by default
  const [academicYear, setAcademicYear] = useState<string>(settings?.academicYear || '2026 / 2027 م');
  const [subject, setSubject] = useState<string>('الرياضيات');
  const [governorate, setGovernorate] = useState<string>('محافظة الإسكندرية - إدارة التعليم العام');
  const [supervision, setSupervision] = useState<string>('توجيه عام الرياضيات - إدارة وسط');
  const [schoolName, setSchoolName] = useState<string>(settings?.schoolName || 'مدرسة المتفوقين الثانوية');
  
  // Signature names
  const [teacherName, setTeacherName] = useState<string>('أ/ شريف عادل محمود');
  const [supervisorTeacher, setSupervisorTeacher] = useState<string>('أ/ أحمد ممدوح إبراهيم');
  const [inspectorName, setInspectorName] = useState<string>('د/ خالد عبد الله الشريف');
  const [directorName, setDirectorName] = useState<string>(
    users.find((u) => u.role === 'admin')?.name || 'أ/ مصطفى كمال (مدير المدرسة)'
  );

  // Configuration options
  const [fillRecordedData, setFillRecordedData] = useState<boolean>(true);
  const [absentSymbol, setAbsentSymbol] = useState<'غ' | 'X'>('غ');
  const [showPresentSymbol, setShowPresentSymbol] = useState<boolean>(false);
  const [totalRowsTarget, setTotalRowsTarget] = useState<number>(43); // 43 rows matching the user's sample document
  const [weeksCount, setWeeksCount] = useState<number>(4); // 4 weeks as in official register
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Selected Class details
  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  // Students belonging to the selected class
  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    return students.filter((s) => s.classId === currentClass.id);
  }, [students, currentClass]);

  // Selected month name
  const monthName = useMemo(() => {
    return MONTHS_LIST.find((m) => m.id === selectedMonth)?.name || 'أكتوبر';
  }, [selectedMonth]);

  // Determine dates for each week slot (Saturday through Thursday)
  // Maps weekIndex (0..weeksCount-1) and dayIndex (0..5) to actual ISO date string
  const weekDaysSchedule = useMemo(() => {
    const yearNum = selectedMonth === '01' || selectedMonth === '02' || selectedMonth === '03' || selectedMonth === '04' || selectedMonth === '05' ? 2027 : 2026;
    const monthNum = parseInt(selectedMonth, 10);

    // Build day slots for 4 or 5 weeks
    const schedule: { weekNumber: number; days: { dayName: string; dateStr: string; dayOfMonth: number }[] }[] = [];

    // Find the first Saturday of the month or start from day 1
    let dayCursor = 1;
    for (let w = 1; w <= weeksCount; w++) {
      const weekDays: { dayName: string; dateStr: string; dayOfMonth: number }[] = [];
      for (let d = 0; d < 6; d++) {
        const dateString = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayCursor).padStart(2, '0')}`;
        weekDays.push({
          dayName: DAYS_NAMES[d],
          dateStr: dateString,
          dayOfMonth: dayCursor,
        });
        dayCursor++;
        if (dayCursor > 31) dayCursor = 1; // wrap or overflow
      }
      schedule.push({ weekNumber: w, days: weekDays });
    }

    return schedule;
  }, [selectedMonth, weeksCount]);

  // Lookup student attendance for a specific date
  const getAttendanceMark = (studentId: string, dateStr: string): string => {
    if (!fillRecordedData) return '';
    const record = attendance.find((a) => a.studentId === studentId && a.date === dateStr);
    if (!record) return '';
    if (record.status === 'absent') return absentSymbol;
    if (record.status === 'late') return 'ت';
    if (record.status === 'excused') return 'ع';
    if (record.status === 'present') return showPresentSymbol ? '✓' : '';
    return '';
  };

  // Compute final rows: real students + optional blank rows up to totalRowsTarget
  const renderedRows = useMemo(() => {
    const rows = [...classStudents];
    const target = Math.max(classStudents.length, totalRowsTarget);
    const blanksCount = target - classStudents.length;

    const blankStudents = Array.from({ length: blanksCount }).map((_, idx) => ({
      id: `blank-${idx}`,
      name: '',
      studentNumber: '',
      classId: selectedClassId,
      gender: 'male' as const,
      createdAt: '',
      isBlank: true,
    }));

    return [...rows, ...blankStudents];
  }, [classStudents, totalRowsTarget, selectedClassId]);

  // Export to direct PDF using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = sheetRef.current;
      
      // Render to canvas at high resolution
      const canvas = await html2canvas(element, {
        scale: 2, // crisp high DPI
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const target = clonedDoc.getElementById('official-monthly-attendance-sheet');
          if (target) {
            target.style.boxShadow = 'none';
            target.style.transform = 'none';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: orientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = orientation === 'portrait' ? 210 : 297;
      const pageHeight = orientation === 'portrait' ? 297 : 210;

      // Fit the image onto standard A4 page with 4mm margin maintaining exact aspect ratio
      const margin = 4;
      const availWidth = pageWidth - margin * 2;
      const availHeight = pageHeight - margin * 2;

      let renderWidth = availWidth;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (renderHeight > availHeight) {
        renderHeight = availHeight;
        renderWidth = (canvas.width * renderHeight) / canvas.height;
      }

      const posX = margin + (availWidth - renderWidth) / 2;
      const posY = margin + (availHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);
      
      const fileName = `سجل_غياب_${currentClass?.name || 'فصل'}_شهر_${monthName}_${selectedMonth}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('تعذر استخراج ملف PDF مباشرة، يرجى استخدام خيار "طباعة / حفظ كـ PDF" لحفظه بسهولة وبدقة عالية.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Browser print to PDF configured strictly for A4
  const handleBrowserPrint = () => {
    const styleId = 'a4-monthly-print-rules';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: A4 ${orientation}; margin: 3mm 4mm; }`;
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      {/* Modal Container */}
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-[1300px] max-h-[96vh] flex flex-col border border-slate-300 overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Modal Top Header (Hidden when printing) */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-6 py-4 flex items-center justify-between border-b border-blue-800/40 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>تصدير كشف وسجل الغياب الشهري الرسمي (PDF)</span>
                <span className="text-[11px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full font-normal">
                  مطابق للنموذج الوزاري المعتمد
                </span>
              </h2>
              <p className="text-xs text-blue-200/80">
                تقسيمة كشف الغياب المعتمدة بـ 4 أسابيع وأيام (السبت - الخميس) مع التوقيعات الرسمية للأدمن والتوجيه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBrowserPrint}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-white/20 shadow-xs"
              title="طباعة مباشرة أو حفظ بتنسيق PDF من المتصفح"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span className="hidden sm:inline">طباعة / حفظ كـ PDF</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-md shadow-blue-900/30"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تصدير PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تحميل كملف PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Settings Bar + Live Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col lg:flex-row gap-5">
          
          {/* Controls & Customization Sidebar (Hidden when printing) */}
          <div className="w-full lg:w-80 bg-white rounded-2xl border border-slate-200 p-4 shrink-0 space-y-4 text-xs print:hidden shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-800 text-sm">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>إعدادات وتخصيص السجل</span>
            </div>

            {/* Class Selection */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">الفصل الدراسي:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 outline-hidden focus:border-blue-600 bg-slate-50"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month & Academic Year */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">الشهر:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 font-bold text-slate-800 outline-hidden focus:border-blue-600 bg-slate-50"
                >
                  {MONTHS_LIST.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">المادة:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="الرياضيات"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            {/* Academic Year */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">العام الدراسي:</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-hidden focus:border-blue-600"
              />
            </div>

            {/* Governorate & Educational Directorate */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">المحافظة والإدارة:</label>
              <input
                type="text"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-hidden focus:border-blue-600"
              />
            </div>

            {/* School & Supervision */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">التوجيه العام:</label>
              <input
                type="text"
                value={supervision}
                onChange={(e) => setSupervision(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-hidden focus:border-blue-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم المدرسة:</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-hidden focus:border-blue-600"
              />
            </div>

            {/* Signatures Names */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 block">أسماء الموقعين في التذييل:</label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="معلم المادة"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-[11px]"
                />
                <input
                  type="text"
                  placeholder="المعلم المشرف"
                  value={supervisorTeacher}
                  onChange={(e) => setSupervisorTeacher(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-[11px]"
                />
                <input
                  type="text"
                  placeholder="موجه المادة"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-[11px]"
                />
                <input
                  type="text"
                  placeholder="مدير المدرسة"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-[11px]"
                />
              </div>
            </div>

            {/* Attendance Fill Toggle */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">تعبئة الغياب المسجل بالمنظومة:</span>
                <input
                  type="checkbox"
                  checked={fillRecordedData}
                  onChange={(e) => setFillRecordedData(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {fillRecordedData && (
                <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span>رمز الغياب:</span>
                    <div className="flex gap-2 font-bold">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="absentSymbol"
                          checked={absentSymbol === 'غ'}
                          onChange={() => setAbsentSymbol('غ')}
                        />
                        <span>حرف (غ)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="absentSymbol"
                          checked={absentSymbol === 'X'}
                          onChange={() => setAbsentSymbol('X')}
                        />
                        <span>علامة (X)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span>إظهار علامة الحاضر:</span>
                    <input
                      type="checkbox"
                      checked={showPresentSymbol}
                      onChange={(e) => setShowPresentSymbol(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Layout Options */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {/* Orientation Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">اتجاه ورقة A4 للطباعة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center border transition-colors cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>أفقي Landscape</span>
                    <span className="text-[9px] opacity-85">297 × 210 مم (الافتراضي)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-1.5 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center border transition-colors cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>رأسي Portrait</span>
                    <span className="text-[9px] opacity-85">210 × 297 مم</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">إكمال الصفوف حتى (كما بالورقة الرسمية):</label>
                <select
                  value={totalRowsTarget}
                  onChange={(e) => setTotalRowsTarget(parseInt(e.target.value, 10))}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 bg-slate-50"
                >
                  <option value={classStudents.length}>عدد طلاب الفصل فقط ({classStudents.length})</option>
                  <option value={30}>30 صفاً (صفحة A4 متناسقة)</option>
                  <option value={35}>35 صفاً</option>
                  <option value={43}>43 صفاً (مطابق لنموذج الصورة تماماً)</option>
                  <option value={50}>50 صفاً</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">عدد الأسابيع:</span>
                <div className="flex gap-2 font-bold text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="weeks"
                      checked={weeksCount === 4}
                      onChange={() => setWeeksCount(4)}
                    />
                    <span>4 أسابيع (الرسمي)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="weeks"
                      checked={weeksCount === 5}
                      onChange={() => setWeeksCount(5)}
                    />
                    <span>5 أسابيع</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Live Document Preview Pane */}
          <div className="flex-1 bg-slate-200/70 p-2 sm:p-4 rounded-2xl flex flex-col items-center justify-start overflow-x-auto shadow-inner print:p-0 print:bg-white print:shadow-none">
            
            {/* A4 Sheet Status Banner (Hidden in Print) */}
            <div className="w-full max-w-[1080px] mb-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 font-bold print:hidden shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  صفحة A4 قياسية جاهزة للطباعة والتصدير |{' '}
                  <span className="font-extrabold text-blue-950">
                    {orientation === 'landscape' ? 'A4 أفقية Landscape (297 × 210 مم)' : 'A4 رأسية Portrait (210 × 297 مم)'}
                  </span>
                </span>
              </div>
              <span className="text-slate-600 font-normal">
                دفتر الغياب الشهري الرسمي • مهيأ تماماً لمقاس ورق الطباعة A4
              </span>
            </div>

            {/* THE OFFICIAL EGYPTIAN MINISTRY ATTENDANCE REGISTER (A4 Sheet) */}
            <div
              id="official-monthly-attendance-sheet"
              ref={sheetRef}
              className={`a4-print-sheet bg-white text-black p-4 sm:p-6 shadow-2xl border-2 border-black font-sans leading-tight select-none relative print:w-full print:min-w-0 print:border-none print:shadow-none print:p-2 ${
                orientation === 'landscape' ? 'w-[1080px] min-w-[1080px]' : 'w-[794px] min-w-[794px]'
              }`}
              style={{
                fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
                color: '#000000',
                minHeight: orientation === 'landscape' ? '740px' : '1080px',
              }}
            >
              
              {/* TOP OFFICIAL HEADER */}
              <div className="flex items-start justify-between pb-3 border-b-2 border-black mb-3">
                {/* Official Circular Seal (Ministry of Education) on Left or Right */}
                <div className="w-20 h-20 shrink-0 flex flex-col items-center justify-center text-center">
                  <MinistryEmblem size={64} />
                </div>

                {/* Right Header: Directorate, Department, School & Teacher Details */}
                <div className="text-right space-y-1 text-[11px] font-bold text-black flex-1 pr-6">
                  <div className="flex items-center justify-start gap-4">
                    <span>{governorate}</span>
                  </div>
                  <div className="flex items-center justify-start gap-4">
                    <span>{supervision}</span>
                  </div>
                  <div className="flex items-center justify-start gap-4">
                    <span>مدرسة / <span className="font-black underline">{schoolName}</span></span>
                  </div>
                  <div className="flex items-center justify-start gap-6 text-[11px] pt-0.5">
                    <span>المعلم / <span className="font-black underline">{teacherName}</span></span>
                    <span>الفصل / <span className="font-black underline">{currentClass?.section || currentClass?.name}</span></span>
                  </div>
                </div>
              </div>

              {/* CENTER TITLE BOX (Exact wording from the official sheet) */}
              <div className="border border-black bg-slate-50 py-1.5 px-3 text-center mb-3 text-[12px] font-bold flex items-center justify-center gap-2 flex-wrap text-black">
                <span>سجل غياب فصل</span>
                <span className="font-black underline px-1">{currentClass?.section || currentClass?.name}</span>
                <span>/</span>
                <span className="font-black px-1">{currentClass?.grade || 'المرحلة الثانوية'}</span>
                <span>مادة</span>
                <span className="font-black underline px-1">{subject}</span>
                <span>شهر</span>
                <span className="font-black underline px-1">{monthName}</span>
                <span>للعام الدراسي</span>
                <span className="font-black px-1">{academicYear}</span>
              </div>

              {/* MAIN REGISTER TABLE */}
              <table className="w-full border-collapse border-2 border-black text-center text-[10px] text-black">
                <thead>
                  {/* Top Header Row: Weeks */}
                  <tr className="bg-slate-100 border-b border-black font-bold">
                    <th
                      rowSpan={2}
                      className="border border-black w-7 py-1 px-0.5 text-center text-[10px] font-black"
                    >
                      م
                    </th>
                    <th
                      rowSpan={2}
                      className="border border-black w-48 text-right pr-2 py-1 text-[11px] font-black"
                    >
                      الاسم
                    </th>
                    {weekDaysSchedule.map((week) => (
                      <th
                        key={week.weekNumber}
                        colSpan={6}
                        className="border border-black py-1 text-center font-black bg-slate-50 text-[10px]"
                      >
                        الأسبوع {week.weekNumber === 1 ? 'الأول' : week.weekNumber === 2 ? 'الثاني' : week.weekNumber === 3 ? 'الثالث' : week.weekNumber === 4 ? 'الرابع' : 'الخامس'}
                        <span className="text-[8px] font-normal text-slate-600 mr-1">
                          ({week.days[0]?.dayOfMonth} - {week.days[5]?.dayOfMonth} {monthName})
                        </span>
                      </th>
                    ))}
                  </tr>

                  {/* Sub-Header Row: Days (السبت - الخميس) for each week */}
                  <tr className="bg-slate-50 border-b-2 border-black font-black text-[9px]">
                    {weekDaysSchedule.map((week) => (
                      <React.Fragment key={`sub-${week.weekNumber}`}>
                        {week.days.map((d, dIdx) => (
                          <th
                            key={`${week.weekNumber}-${dIdx}`}
                            className="border border-black py-1 px-0.5 text-center w-6"
                          >
                            {d.dayName}
                          </th>
                        ))}
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {renderedRows.map((student, sIdx) => {
                    const studentNumber = sIdx + 1;
                    const isBlank = 'isBlank' in student && student.isBlank;

                    return (
                      <tr
                        key={student.id || `row-${sIdx}`}
                        className={`border-b border-black h-5 ${
                          sIdx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                        }`}
                      >
                        {/* Number */}
                        <td className="border border-black font-bold text-center text-[10px]">
                          {studentNumber}
                        </td>

                        {/* Student Name */}
                        <td className="border border-black text-right pr-2 font-bold text-[10.5px] truncate max-w-[200px]">
                          {student.name || ''}
                        </td>

                        {/* Attendance Columns for each day of each week */}
                        {weekDaysSchedule.map((week) => (
                          <React.Fragment key={`att-row-${sIdx}-w${week.weekNumber}`}>
                            {week.days.map((d, dIdx) => {
                              const mark = isBlank ? '' : getAttendanceMark(student.id, d.dateStr);

                              return (
                                <td
                                  key={`cell-${sIdx}-${week.weekNumber}-${dIdx}`}
                                  className={`border border-black text-center font-black ${
                                    mark === 'غ' || mark === 'X'
                                      ? 'text-red-700 bg-red-50/50'
                                      : mark === 'ت'
                                      ? 'text-amber-700'
                                      : mark === 'ع'
                                      ? 'text-blue-700'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {mark}
                                </td>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* OFFICIAL SIGNATURES FOOTER (Exact 4 columns from the uploaded image) */}
              <div className="grid grid-cols-4 gap-4 mt-6 pt-3 text-center text-[11px] font-bold text-black border-t border-slate-300">
                <div className="space-y-4">
                  <div className="font-black">معلم المادة</div>
                  <div className="text-[10px] text-slate-800 font-semibold">{teacherName}</div>
                  <div className="text-[9px] text-slate-400">التوقيع: .....................</div>
                </div>

                <div className="space-y-4">
                  <div className="font-black">المعلم المشرف</div>
                  <div className="text-[10px] text-slate-800 font-semibold">{supervisorTeacher}</div>
                  <div className="text-[9px] text-slate-400">التوقيع: .....................</div>
                </div>

                <div className="space-y-4">
                  <div className="font-black">موجه المادة</div>
                  <div className="text-[10px] text-slate-800 font-semibold">{inspectorName}</div>
                  <div className="text-[9px] text-slate-400">التوقيع: .....................</div>
                </div>

                <div className="space-y-4">
                  <div className="font-black">مدير المدرسة</div>
                  <div className="text-[10px] text-slate-800 font-semibold">{directorName}</div>
                  <div className="text-[9px] text-slate-400">الخاتم والتوقيع: .................</div>
                </div>
              </div>

              {/* Official Seal Watermark / Verification stamp */}
              <div className="mt-4 pt-1 flex items-center justify-between text-[9px] text-slate-500 border-t border-dotted border-slate-300">
                <span>تاريخ استخراج الكشف: {new Date().toLocaleDateString('ar-EG')}</span>
                <span>منظومة الحضور والغياب المدرسية الذكية | كشف معتمد مطابق للقرار الوزاري</span>
                <span>صفحة 1 من 1</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
