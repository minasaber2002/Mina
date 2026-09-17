import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { User, ClassRoom, Student } from '../../types';
import { 
  ShieldCheck, 
  Crown, 
  Users, 
  School, 
  GraduationCap, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  Filter, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  RefreshCw, 
  Bell, 
  Settings as SettingsIcon, 
  FileText, 
  Activity,
  LogIn,
  Check,
  UserCheck,
  ChevronLeft,
  Sliders,
  Send,
  Sparkles,
  Phone,
  Mail,
  Lock,
  Layers,
  BarChart3,
  Award
} from 'lucide-react';
import { DirectorModal } from '../modals/DirectorModal';
import { AnnouncementModal } from '../modals/AnnouncementModal';
import { TeacherModal } from '../modals/TeacherModal';
import { ClassModal } from '../modals/ClassModal';
import { StudentModal } from '../modals/StudentModal';
import { MonthlyAttendancePdfModal } from '../modals/MonthlyAttendancePdfModal';
import { Decree151ReportsModal } from '../modals/Decree151ReportsModal';

type SuperAdminTab = 'overview' | 'directors' | 'teachers' | 'classes_students' | 'announcements' | 'audit_logs' | 'settings';

export const SuperAdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    directors,
    teachers,
    classes,
    students,
    attendance,
    settings,
    announcements,
    auditLogs,
    selectedDate,
    setSelectedDate,
    switchUser,
    addDirector,
    updateDirector,
    deleteDirector,
    toggleDirectorStatus,
    updateSettings,
    addAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    updateStudent,
    deleteStudent,
    resetAllData,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');

  // Modals state
  const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false);
  const [editingDirector, setEditingDirector] = useState<User | null>(null);

  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isMonthlyPdfModalOpen, setIsMonthlyPdfModalOpen] = useState(false);
  const [isDecree151ModalOpen, setIsDecree151ModalOpen] = useState(false);
  const [pdfModalClassId, setPdfModalClassId] = useState<string | undefined>(undefined);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [auditFilter, setAuditFilter] = useState<string>('all');

  // Settings form local state
  const [localSettings, setLocalSettings] = useState(settings);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  // Today's attendance computations
  const todayAttendance = useMemo(() => {
    return attendance.filter((r) => r.date === selectedDate);
  }, [attendance, selectedDate]);

  const stats = useMemo(() => {
    const totalStudentsCount = students.length;
    const presentRecords = todayAttendance.filter((r) => r.status === 'present');
    const absentRecords = todayAttendance.filter((r) => r.status === 'absent');
    const lateRecords = todayAttendance.filter((r) => r.status === 'late');
    const excusedRecords = todayAttendance.filter((r) => r.status === 'excused');

    const totalMarkedToday = todayAttendance.length;
    const generalRate = totalMarkedToday > 0 
      ? Math.round(((presentRecords.length + lateRecords.length * 0.5) / totalMarkedToday) * 100) 
      : 0;

    // Check which classes have attendance recorded for selectedDate
    const classesRecordedToday = classes.filter((cls) =>
      todayAttendance.some((r) => r.classId === cls.id)
    );

    const pendingClassesCount = classes.length - classesRecordedToday.length;

    // Teachers who have submitted attendance today
    const teachersSubmittedToday = teachers.filter((t) =>
      todayAttendance.some((r) => r.teacherId === t.id)
    );

    const complianceRate = teachers.length > 0 
      ? Math.round((teachersSubmittedToday.length / teachers.length) * 100) 
      : 100;

    // Students with critical absence (> 3 days absent overall)
    const criticalAbsenceStudents = students.filter((s) => {
      const studentAbsences = attendance.filter((r) => r.studentId === s.id && r.status === 'absent').length;
      return studentAbsences >= settings.absenceWarningThreshold;
    });

    return {
      totalDirectors: directors.length,
      activeDirectors: directors.filter((d) => d.status !== 'suspended').length,
      totalTeachers: teachers.length,
      teachersSubmittedToday: teachersSubmittedToday.length,
      complianceRate,
      totalClasses: classes.length,
      classesRecordedToday: classesRecordedToday.length,
      pendingClassesCount,
      totalStudents: totalStudentsCount,
      presentCount: presentRecords.length,
      absentCount: absentRecords.length,
      lateCount: lateRecords.length,
      excusedCount: excusedRecords.length,
      generalRate,
      criticalAbsenceCount: criticalAbsenceStudents.length,
      criticalAbsenceStudents,
    };
  }, [students, todayAttendance, classes, teachers, directors, attendance, settings]);

  // Export Institutional Comprehensive Report
  const handleExportFullReport = () => {
    const headers = [
      'اسم الطالب',
      'رقم القيد',
      'الفصل الدراسي',
      'تاريخ السجل',
      'حالة الحضور',
      'ملاحظات',
      'اسم المعلم/الراصد',
    ];

    const rows = attendance.map((rec) => {
      const student = students.find((s) => s.id === rec.studentId);
      const cls = classes.find((c) => c.id === rec.classId);
      const teacher = users.find((u) => u.id === rec.teacherId);
      const statusMap = {
        present: 'حاضر',
        absent: 'غائب بدون عذر',
        late: 'متأخر',
        excused: 'عذر رسمي',
      };
      return [
        `"${student?.name || rec.studentId}"`,
        `"${student?.studentNumber || '-'}"`,
        `"${cls?.name || rec.classId}"`,
        `"${rec.date}"`,
        `"${statusMap[rec.status] || rec.status}"`,
        `"${rec.note || ''}"`,
        `"${teacher?.name || rec.teacherId}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `التقرير_المؤسسي_الشامل_للحضور_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(localSettings);
    setSettingsSavedNotice(true);
    setTimeout(() => setSettingsSavedNotice(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" dir="rtl">
      {/* Supreme Authority Command Header */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-blue-900/60 shadow-2xl relative overflow-hidden">
        {/* Background decorative watermark */}
        <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>الإدارة العليا للمنظومة (Super Admin Command Center)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{settings.schoolName}</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold">
                {settings.academicYear}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              مركز الرقابة الاستراتيجية والتحكم الشامل: إدارة قيادات المدارس، متابعة انضباط هيئة التدريس، إصدار التعاميم العليا، ومراقبة المؤشرات الحية على مستوى المنظومة.
            </p>
          </div>

          {/* Quick Date and Master Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/15">
              <Calendar className="w-4 h-4 text-blue-300" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-bold outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={() => {
                setEditingDirector(null);
                setIsDirectorModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>تعيين مدير جديد</span>
            </button>

            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setIsAnnouncementModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>إصدار تعميم عاجل</span>
            </button>

            <button
              onClick={() => {
                setPdfModalClassId(undefined);
                setIsMonthlyPdfModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg border border-emerald-400/40 flex items-center gap-1.5 transition active:scale-95"
              title="تصدير كشف وسجل الغياب الشهري الرسمي (PDF) وفق النموذج الوزاري"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>سجل الغياب الشهري (PDF)</span>
            </button>

            <button
              onClick={() => {
                setPdfModalClassId(undefined);
                setIsDecree151ModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-2xl shadow-lg border border-amber-400/40 flex items-center gap-1.5 transition active:scale-95"
              title="سجلات وتقارير درجات القرار الوزاري 151 لسنة 2026 الرسمية وتصدير PDF"
            >
              <Award className="w-4 h-4 text-amber-200" />
              <span>سجل درجات القرار 151 (PDF)</span>
            </button>

            <button
              onClick={handleExportFullReport}
              className="px-3.5 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 flex items-center gap-1.5 transition"
              title="تصدير كشف شامل لجميع سجلات الحضور"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تقرير شامل</span>
            </button>
          </div>
        </div>

        {/* Master Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-6 pt-6 border-t border-white/10 text-right">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">قيادات ومديرو المدارس</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{stats.totalDirectors}</div>
            <div className="text-[10px] text-slate-400">{stats.activeDirectors} على رأس العمل</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">هيئة التدريس</div>
            <div className="text-xl font-black text-white mt-0.5">{stats.totalTeachers}</div>
            <div className="text-[10px] text-blue-300">{stats.teachersSubmittedToday} رصدوا اليوم</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">الفصول والشعب</div>
            <div className="text-xl font-black text-white mt-0.5">{stats.totalClasses}</div>
            <div className="text-[10px] text-slate-400">{stats.classesRecordedToday} مكتملة اليوم</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">إجمالي الطلاب</div>
            <div className="text-xl font-black text-white mt-0.5">{stats.totalStudents}</div>
            <div className="text-[10px] text-slate-400">طالب وطالبة مقيدين</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">نسبة الحضور اليوم</div>
            <div className="text-xl font-black text-blue-300 mt-0.5">{stats.generalRate}%</div>
            <div className="text-[10px] text-slate-400">{stats.presentCount} طالب حاضر</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-rose-200 font-semibold">غياب بدون عذر</div>
            <div className="text-xl font-black text-rose-400 mt-0.5">{stats.absentCount}</div>
            <div className="text-[10px] text-rose-300">{stats.criticalAbsenceCount} إنذار حرج</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-amber-200 font-semibold">تأخر صباحي</div>
            <div className="text-xl font-black text-amber-400 mt-0.5">{stats.lateCount}</div>
            <div className="text-[10px] text-slate-400">حالة رصدت اليوم</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-indigo-200 font-semibold">التزام المعلمين</div>
            <div className="text-xl font-black text-indigo-300 mt-0.5">{stats.complianceRate}%</div>
            <div className="text-[10px] text-slate-400">{stats.pendingClassesCount} فصل معلق</div>
          </div>
        </div>
      </div>

      {/* Active High-Priority Announcements Notice Bar */}
      {announcements.filter((a) => a.active).length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>تعميم إداري ساري المفعول:</span>
                <span className="font-bold underline">
                  {announcements.find((a) => a.active)?.title}
                </span>
              </div>
              <p className="text-xs text-amber-800 line-clamp-1 mt-0.5">
                {announcements.find((a) => a.active)?.content}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('announcements')}
            className="text-xs font-bold text-amber-900 hover:text-amber-950 underline self-end sm:self-auto shrink-0"
          >
            إدارة كافة التعاميم ({announcements.length})
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>مركز الرقابة العامة والعمليات</span>
        </button>

        <button
          onClick={() => setActiveTab('directors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'directors'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>إدارة القيادات ومديري المدارس ({directors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'teachers'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>رقابة هيئة التدريس والامتثال ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes_students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'classes_students'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <School className="w-4 h-4" />
          <span>الهيكل الأكاديمي والطلاب ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>التعاميم والتوجيهات العليا ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'audit_logs'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>سجل الرقابة وتدقيق العمليات ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-blue-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>السياسات وإعدادات المنظومة</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & REAL-TIME COMMAND RADAR */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real-time Field Compliance Radar */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>رادار الانضباط الميداني وسرعة الرصد اليومي ({selectedDate})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  متابعة حالة رصد كل فصل دراسي في الوقت الفعلي وتحديد الكوادر المتأخرة في التحضير
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {stats.classesRecordedToday} من أصل {stats.totalClasses} فصول مرصودة
                </span>
                {stats.pendingClassesCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {stats.pendingClassesCount} فصول بحاجة لرصد فوري
                  </span>
                )}
              </div>
            </div>

            {/* Classes Grid Radar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {classes.map((cls) => {
                const classRecords = todayAttendance.filter((r) => r.classId === cls.id);
                const isRecorded = classRecords.length > 0;
                const classStudents = students.filter((s) => s.classId === cls.id);
                const presentInClass = classRecords.filter((r) => r.status === 'present').length;
                const absentInClass = classRecords.filter((r) => r.status === 'absent').length;
                const lateInClass = classRecords.filter((r) => r.status === 'late').length;

                // Find assigned teachers for this class
                const assignedTeachers = teachers.filter((t) => t.assignedClassIds?.includes(cls.id));

                return (
                  <div
                    key={cls.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      isRecorded
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-amber-200 bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{cls.name}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {classStudents.length} طلاب مقيدين
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isRecorded
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isRecorded ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> تم الاعتماد
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> معلق في الانتظار
                          </>
                        )}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      {isRecorded ? (
                        <div className="flex items-center gap-3">
                          <span className="text-blue-700 font-bold">{presentInClass} حاضر</span>
                          <span className="text-rose-600 font-bold">{absentInClass} غائب</span>
                          <span className="text-amber-600 font-bold">{lateInClass} متأخر</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-800 font-semibold">
                          المعلم المسؤول: {assignedTeachers[0]?.name || 'غير محدد'}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const directUser = assignedTeachers[0] || directors[0];
                          if (directUser) switchUser(directUser);
                        }}
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-bold hover:underline"
                        title="الدخول الفوري لمعاينة الكشف أو رصده"
                      >
                        معاينة الكشف &larr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategic Columns: High Risk Students & Institutional Quick Supervision */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Absence / At-Risk Students */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>الطلاب المهددون بإنذار الحرمان والغياب المتكرر</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    تجاوزوا الحد الأقصى المسموح به ({settings.absenceWarningThreshold} أيام بدون عذر)
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {stats.criticalAbsenceCount} طلاب
                </span>
              </div>

              {stats.criticalAbsenceStudents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  ممتاز! لا يوجد أي طالب متجاوز لحد الغياب القانوني حالياً.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {stats.criticalAbsenceStudents.map((student) => {
                    const studentClass = classes.find((c) => c.id === student.classId);
                    const absences = attendance.filter((r) => r.studentId === student.id && r.status === 'absent').length;

                    return (
                      <div
                        key={student.id}
                        className="p-3 rounded-2xl border border-rose-100 bg-rose-50/40 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-slate-900">{student.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {studentClass?.name || 'الفصل'} | هاتف ولي الأمر: {student.guardianPhone || 'غير مسجل'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-1 rounded-xl bg-rose-200 text-rose-900">
                            {absences} أيام غياب
                          </span>
                          <button
                            onClick={() => {
                              alert(`تم توجيه إنذار رسمي لولي أمر الطالب ${student.name} بالاتصال برقم: ${student.guardianPhone || 'المسجل'}`);
                            }}
                            className="text-xs px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                          >
                            إرسال إنذار
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Institutional Directors & Executive Hierarchy */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>هيئة القيادة المدرسية الخاضعة للرقابة العليا</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    مديرو المدارس والوكلاء المفوضون بصلاحيات التشغيل
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('directors')}
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  عرض الجميع ({directors.length})
                </button>
              </div>

              <div className="space-y-3">
                {directors.map((dir) => (
                  <div
                    key={dir.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between hover:bg-white transition shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                        <ShieldCheck className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <span>{dir.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            dir.status === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {dir.status === 'suspended' ? 'معلق' : 'نشط'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{dir.title || 'مدير مدرسة'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => switchUser(dir)}
                        className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200 flex items-center gap-1 transition"
                        title="الدخول فوري بحساب المدير"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>دخول بحسابه</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DIRECTORS & PRINCIPALS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'directors' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                <span>إدارة القيادات ومديري المدارس والوكلاء</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد الصلاحيات الممنوحة لكل مدير، تجميد أو تفعيل الحسابات، والدخول الفوري للمعاينة والتدخل المباشر
              </p>
            </div>

            <button
              onClick={() => {
                setEditingDirector(null);
                setIsDirectorModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>تعيين مدير / وكيل جديد</span>
            </button>
          </div>

          {/* Directors Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">المدير / المسؤول</th>
                  <th className="p-3.5">المسمى والمنصب</th>
                  <th className="p-3.5">بيانات الاتصال</th>
                  <th className="p-3.5">مصفوفة الصلاحيات الممنوحة</th>
                  <th className="p-3.5">حالة الحساب</th>
                  <th className="p-3.5 text-center">إجراءات الرقابة العليا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directors.map((dir) => {
                  const priv = dir.privileges || {
                    canManageTeachers: true,
                    canManageClasses: true,
                    canEditOldAttendance: true,
                    canExportReports: true,
                    canSendGuardianAlerts: true,
                  };

                  return (
                    <tr key={dir.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-black text-slate-900">{dir.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {dir.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-700">
                        {dir.title || 'مدير مدرسة'}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="text-slate-800 font-mono">{dir.email}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{dir.phone || 'بدون هاتف'}</div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {priv.canManageTeachers && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                              إدارة المعلمين
                            </span>
                          )}
                          {priv.canManageClasses && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                              إدارة الفصول
                            </span>
                          )}
                          {priv.canEditOldAttendance && (
                            <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                              تعديل الكشوفات
                            </span>
                          )}
                          {priv.canExportReports && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              تصدير تقارير
                            </span>
                          )}
                          {priv.canSendGuardianAlerts && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                              إنذارات الغياب
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => toggleDirectorStatus(dir.id)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${
                            dir.status === 'suspended'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          }`}
                          title="انقر لتغيير حالة الحساب فوراً"
                        >
                          {dir.status === 'suspended' ? <Lock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          <span>{dir.status === 'suspended' ? 'معلق وموقوف' : 'نشط ومفعل'}</span>
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => switchUser(dir)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                            title="الدخول الفوري كمدير مدرسة (Impersonate)"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingDirector(dir);
                              setIsDirectorModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            title="تعديل البيانات والصلاحيات"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من إعفاء وحذف حساب المدير: ${dir.name}؟`)) {
                                deleteDirector(dir.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            title="إعفاء / حذف المدير"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TEACHERS & COMPLIANCE */}
      {/* ========================================================= */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-700" />
                <span>رقابة هيئة التدريس ومتابعة الالتزام اليومي</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة أداء {teachers.length} معلماً، وحالة إقفال كشوفاتهم لتاريخ اليوم ({selectedDate})
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTeacher(null);
                setIsTeacherModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة معلم جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">المعلم</th>
                  <th className="p-3.5">المادة التخصصية</th>
                  <th className="p-3.5">الفصول المسندة إليه</th>
                  <th className="p-3.5">حالة الرصد اليوم ({selectedDate})</th>
                  <th className="p-3.5">بيانات الدخول</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => {
                  const teacherClasses = classes.filter((c) => teacher.assignedClassIds?.includes(c.id));
                  const hasMarkedToday = todayAttendance.some((r) => r.teacherId === teacher.id);

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-black text-slate-900">{teacher.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{teacher.email}</div>
                      </td>

                      <td className="p-3.5 font-bold text-blue-700">
                        {teacher.subject || 'عام'}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {teacherClasses.map((cls) => (
                            <span key={cls.id} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                              {cls.section}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                          hasMarkedToday ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {hasMarkedToday ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {hasMarkedToday ? 'تم رصد الحضور' : 'لم يرصد بعد اليوم'}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-500">
                        Pass: {teacher.password || '123'}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => switchUser(teacher)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                            title="الدخول بحساب المعلم"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setIsTeacherModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            title="تعديل بيانات المعلم"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`حذف حساب المعلم: ${teacher.name}؟`)) {
                                deleteTeacher(teacher.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            title="حذف المعلم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CLASSES & STUDENTS BODY */}
      {/* ========================================================= */}
      {activeTab === 'classes_students' && (
        <div className="space-y-6">
          {/* Classes Overview */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <School className="w-5 h-5 text-blue-700" />
                  <span>الفصول الدراسية والشعب المعتمدة ({classes.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  الهيكل الإداري للفصول في مجمع {settings.schoolName}
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingClass(null);
                  setIsClassModalOpen(true);
                }}
                className="px-4 py-2.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة فصل دراسي</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {classes.map((cls) => {
                const clsStudents = students.filter((s) => s.classId === cls.id);
                return (
                  <div key={cls.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          شعبة {cls.section}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingClass(cls);
                              setIsClassModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف فصل ${cls.name}؟`)) {
                                deleteClass(cls.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 mt-2">{cls.name}</h4>
                      <p className="text-[11px] text-slate-500">{cls.grade}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-bold">{clsStudents.length} طلاب</span>
                      <span className="text-blue-700 font-bold">{cls.academicYear}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Students Master Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-700" />
                  <span>السجل العام للطلاب والدارسين ({students.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  قاعدة البيانات المركزية لكافة الطلاب المسجلين بالمنظومة
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingStudent(null);
                    setIsStudentModalOpen(true);
                  }}
                  className="px-4 py-2.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل طالب جديد</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو رقم القيد أو هاتف ولي الأمر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-600 bg-slate-50"
                />
              </div>

              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden bg-slate-50 font-bold"
              >
                <option value="all">كافة الفصول الدراسية</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-96">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3">رقم القيد</th>
                    <th className="p-3">اسم الطالب</th>
                    <th className="p-3">الفصل الدراسي</th>
                    <th className="p-3">ولي الأمر والهاتف</th>
                    <th className="p-3">إجمالي الغياب التراكمي</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter((s) => {
                      if (selectedGradeFilter !== 'all' && s.classId !== selectedGradeFilter) return false;
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        s.name.toLowerCase().includes(q) ||
                        s.studentNumber.toLowerCase().includes(q) ||
                        (s.guardianPhone && s.guardianPhone.includes(q))
                      );
                    })
                    .map((stu) => {
                      const stuClass = classes.find((c) => c.id === stu.classId);
                      const totalAbsences = attendance.filter((r) => r.studentId === stu.id && r.status === 'absent').length;

                      return (
                        <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-mono font-bold text-slate-500">{stu.studentNumber}</td>
                          <td className="p-3 font-black text-slate-900">{stu.name}</td>
                          <td className="p-3 font-semibold text-blue-700">{stuClass?.name || '-'}</td>
                          <td className="p-3 text-slate-600">
                            {stu.guardianName || 'ولي الأمر'} ({stu.guardianPhone || '-'})
                          </td>
                          <td className="p-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              totalAbsences >= settings.absenceWarningThreshold
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {totalAbsences} يوم
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingStudent(stu);
                                  setIsStudentModalOpen(true);
                                }}
                                className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`حذف الطالب: ${stu.name}؟`)) {
                                    deleteStudent(stu.id);
                                  }
                                }}
                                className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ANNOUNCEMENTS & CIRCULARS */}
      {/* ========================================================= */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <span>التعاميم والتوجيهات الإدارية العليا</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                إصدار قرارات وتوجيهات إلزامية تظهر في لوحات تحكم مديري المدارس وهيئة التدريس فوراً
              </p>
            </div>

            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setIsAnnouncementModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار تعميم جديد</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-5 rounded-2xl border transition-all ${
                  ann.active
                    ? 'border-blue-200 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : ann.priority === 'important'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {ann.priority === 'urgent'
                        ? 'عاجل ومهم جداً'
                        : ann.priority === 'important'
                        ? 'هام وتنظيمي'
                        : 'إعلان عام'}
                    </span>

                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      المستهدف: {ann.targetAudience === 'all' ? 'الكل' : ann.targetAudience === 'directors' ? 'مديرو المدارس' : 'المعلمون'}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">{ann.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAnnouncement(ann.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition ${
                        ann.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {ann.active ? 'منشور وساري' : 'مسودة غير منشورة'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingAnnouncement(ann);
                        setIsAnnouncementModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteAnnouncement(ann.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-black text-slate-900 mt-1">{ann.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.content}</p>
                <div className="text-[10px] text-slate-400 mt-2 font-bold">الجهة المصدرة: {ann.authorName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: AUDIT & ACTIVITY LOGS */}
      {/* ========================================================= */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-700" />
                <span>سجل الرقابة وتدقيق العمليات الأمنية والإدارية</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                توثيق لكافة الحركات والتعديلات التي تمت في النظام مع تسجيل هوية الفاعل والتوقيت الدقيق
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden bg-slate-50 font-bold"
              >
                <option value="all">كافة العمليات</option>
                <option value="attendance">عمليات رصد الحضور</option>
                <option value="director">عمليات إدارة المديرين</option>
                <option value="announcement">التعاميم والقرارات</option>
                <option value="user">تسجيل الدخول والمستخدمين</option>
                <option value="system">إعدادات النظام والفصول</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">التوقيت والتاريخ</th>
                  <th className="p-3.5">الفاعل / المستخدم</th>
                  <th className="p-3.5">الرتبة</th>
                  <th className="p-3.5">الإجراء المتخذ</th>
                  <th className="p-3.5">التفاصيل والبيان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs
                  .filter((log) => auditFilter === 'all' || log.type === auditFilter)
                  .map((log) => {
                    const dateFormatted = new Date(log.timestamp).toLocaleString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short',
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">{dateFormatted}</td>
                        <td className="p-3.5 font-bold text-slate-900">{log.actorName}</td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.actorRole === 'super_admin'
                                ? 'bg-amber-100 text-amber-900'
                                : log.actorRole === 'admin'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {log.actorRole === 'super_admin'
                              ? 'مشرف عام'
                              : log.actorRole === 'admin'
                              ? 'مدير مدرسة'
                              : 'معلم'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-blue-700">{log.action}</td>
                        <td className="p-3.5 text-slate-600 max-w-md">{log.details}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: SETTINGS & INSTITUTION GOVERNANCE */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-blue-700" />
              <span>إعدادات وسياسات المنظومة المدرسية الشاملة</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              التحكم في مواعيد الطابور الصباحي، مدد التأخير، معايير الإنذار، والنسخ الاحتياطي
            </p>
          </div>

          {settingsSavedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>تم حفظ وتعميم الإعدادات الجديدة بنجاح على كامل المنظومة!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المدرسة / المجمع التعليمي
                </label>
                <input
                  type="text"
                  value={localSettings.schoolName}
                  onChange={(e) => setLocalSettings({ ...localSettings, schoolName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الإدارة التعليمية والقطاع
                </label>
                <input
                  type="text"
                  value={localSettings.educationalDistrict}
                  onChange={(e) => setLocalSettings({ ...localSettings, educationalDistrict: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  العام الدراسي الحالي
                </label>
                <input
                  type="text"
                  value={localSettings.academicYear}
                  onChange={(e) => setLocalSettings({ ...localSettings, academicYear: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وقت بدء الطابور الصباحي
                </label>
                <input
                  type="time"
                  value={localSettings.schoolStartTime}
                  onChange={(e) => setLocalSettings({ ...localSettings, schoolStartTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مدة السماح قبل احتساب التأخر (بالدقائق)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={localSettings.lateToleranceMinutes}
                  onChange={(e) => setLocalSettings({ ...localSettings, lateToleranceMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  حد أيام الغياب لإصدار الإنذار الأول (أيام)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.absenceWarningThreshold}
                  onChange={(e) => setLocalSettings({ ...localSettings, absenceWarningThreshold: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 font-mono"
                  required
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.allowTeacherEditAfterHours}
                  onChange={(e) => setLocalSettings({ ...localSettings, allowTeacherEditAfterHours: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  السماح للمعلمين بتعديل كشوفات الحضور بعد انتهاء الدوام الرسمي
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoNotifyGuardians}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoNotifyGuardians: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  تفعيل نظام إرسال الرسائل الفورية لأولياء الأمور عند تسجيل الغياب غير المبرر
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة ضبط المصنع واستعادة البيانات الافتراضية</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md transition"
              >
                حفظ السياسات والاعتمادات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modals */}
      <DirectorModal
        isOpen={isDirectorModalOpen}
        onClose={() => {
          setIsDirectorModalOpen(false);
          setEditingDirector(null);
        }}
        onSave={(data) => {
          if (editingDirector) {
            updateDirector(editingDirector.id, data);
          } else {
            addDirector(data);
          }
        }}
        classes={classes}
        initialDirector={editingDirector}
      />

      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => {
          setIsAnnouncementModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSave={(data) => {
          addAnnouncement(data);
        }}
        initialAnnouncement={editingAnnouncement}
      />

      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setEditingTeacher(null);
        }}
        onSave={(data) => {
          if (editingTeacher) {
            updateTeacher(editingTeacher.id, data);
          } else {
            addTeacher(data);
          }
        }}
        classes={classes}
        initialTeacher={editingTeacher}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => {
          setIsClassModalOpen(false);
          setEditingClass(null);
        }}
        onSave={(data) => {
          if (editingClass) {
            updateClass(editingClass.id, data);
          } else {
            addClass(data);
          }
        }}
        initialClass={editingClass}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={(data) => {
          if (editingStudent) {
            updateStudent(editingStudent.id, data);
          } else {
            addStudent(data);
          }
        }}
        classes={classes}
        initialStudent={editingStudent}
      />

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              تأكيد إعادة ضبط المنظومة الشاملة
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              سيؤدي هذا الإجراء إلى مسح كافة التعديلات الأخيرة واستعادة السجلات والقيادات المدرسية والمعلمين والطلاب إلى حالتهم الافتراضية الأولية.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
              >
                تأكيد الاستعادة الشاملة
              </button>
            </div>
          </div>
        </div>
      )}

      <MonthlyAttendancePdfModal
        isOpen={isMonthlyPdfModalOpen}
        onClose={() => {
          setIsMonthlyPdfModalOpen(false);
          setPdfModalClassId(undefined);
        }}
        defaultClassId={pdfModalClassId}
      />

      <Decree151ReportsModal
        isOpen={isDecree151ModalOpen}
        onClose={() => {
          setIsDecree151ModalOpen(false);
          setPdfModalClassId(undefined);
        }}
        defaultClassId={pdfModalClassId}
      />
    </div>
  );
};
