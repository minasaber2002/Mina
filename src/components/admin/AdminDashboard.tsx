import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { User, Student, ClassRoom, AttendanceStatus } from '../../types';
import { getTodayDateStr, getPastDateStr } from '../../data/initialData';
import { TeacherModal } from '../modals/TeacherModal';
import { StudentModal } from '../modals/StudentModal';
import { ClassModal } from '../modals/ClassModal';
import { MonthlyAttendancePdfModal } from '../modals/MonthlyAttendancePdfModal';
import { Decree151ReportsModal } from '../modals/Decree151ReportsModal';
import { StudentGradeModal } from '../modals/StudentGradeModal';
import { AdminAnalyticsCharts } from '../charts/AdminAnalyticsCharts';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  UserPlus,
  Plus,
  Edit2,
  Trash2,
  Search,
  LogIn,
  AlertTriangle,
  Printer,
  Download,
  Filter,
  Phone,
  BarChart3,
  Check,
  Crown,
  Bell,
  Award,
  FileCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    classes,
    students,
    attendance,
    announcements,
    switchUser,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    updateStudent,
    deleteStudent,
    saveClassAttendance,
    getStudentAttendanceSummary,
    getStudentDecree151Grades,
  } = useSchool();

  const superAdmin = users.find((u) => u.role === 'super_admin');

  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'teachers' | 'classes' | 'students' | 'alerts'>('overview');
  const [overviewViewMode, setOverviewViewMode] = useState<'both' | 'charts' | 'classes'>('both');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  const [showMonthlyPdfModal, setShowMonthlyPdfModal] = useState(false);
  const [pdfModalClassId, setPdfModalClassId] = useState<string | undefined>(undefined);

  const [showDecree151Modal, setShowDecree151Modal] = useState(false);
  const [decree151ClassId, setDecree151ClassId] = useState<string | undefined>(undefined);
  const [studentForGrades, setStudentForGrades] = useState<Student | null>(null);
  const [showStudentGradeModal, setShowStudentGradeModal] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const teachers = useMemo(() => users.filter((u) => u.role === 'teacher'), [users]);

  // Daily statistics for selected date
  const dateAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  const schoolStats = useMemo(() => {
    const present = dateAttendance.filter((a) => a.status === 'present').length;
    const absent = dateAttendance.filter((a) => a.status === 'absent').length;
    const late = dateAttendance.filter((a) => a.status === 'late').length;
    const excused = dateAttendance.filter((a) => a.status === 'excused').length;
    const totalRecorded = dateAttendance.length;

    const rate = totalRecorded > 0 ? Math.round(((present + late * 0.5) / totalRecorded) * 100) : 0;

    return {
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalStudents: students.length,
      todayPresent: present,
      todayAbsent: absent,
      todayLate: late,
      todayExcused: excused,
      totalRecorded,
      rate,
    };
  }, [teachers, classes, students, dateAttendance]);

  // Filtered attendance records for Ledger tab
  const filteredAttendance = useMemo(() => {
    return students
      .filter((s) => (filterClassId === 'all' ? true : s.classId === filterClassId))
      .filter((s) =>
        searchQuery
          ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentNumber.includes(searchQuery)
          : true
      )
      .map((student) => {
        const record = dateAttendance.find((a) => a.studentId === student.id);
        const cls = classes.find((c) => c.id === student.classId);
        return {
          student,
          classRoom: cls,
          record: record || null,
          status: record ? record.status : ('unrecorded' as AttendanceStatus | 'unrecorded'),
          note: record?.note || '',
        };
      })
      .filter((item) => (filterStatus === 'all' ? true : item.status === filterStatus));
  }, [students, filterClassId, searchQuery, dateAttendance, classes, filterStatus]);

  // High absence alerts (> 2 absences)
  const alertStudents = useMemo(() => {
    return students
      .map((s) => ({
        student: s,
        summary: getStudentAttendanceSummary(s.id),
        classRoom: classes.find((c) => c.id === s.classId),
      }))
      .filter((item) => item.summary.absentDays >= 2)
      .sort((a, b) => b.summary.absentDays - a.summary.absentDays);
  }, [students, classes, getStudentAttendanceSummary]);

  // Handle Admin directly changing a student's status on attendance ledger
  const handleAdminUpdateStatus = (studentId: string, classId: string, newStatus: AttendanceStatus) => {
    const existing = dateAttendance.find((a) => a.studentId === studentId);
    saveClassAttendance(selectedDate, classId, [
      {
        studentId,
        status: newStatus,
        note: existing?.note,
      },
    ]);
    showToast('تم تحديث حالة الطالب بنجاح');
  };

  const handleDeleteTeacherConfirm = (teacher: User) => {
    if (window.confirm(`هل أنت متأكد من حذف المعلم "${teacher.name}"؟`)) {
      deleteTeacher(teacher.id);
      showToast('تم حذف المعلم بنجاح');
    }
  };

  const handleDeleteClassConfirm = (cls: ClassRoom) => {
    if (window.confirm(`هل أنت متأكد من حذف الفصل "${cls.name}"؟ سيتم حذف الطلاب وسجلات الحضور التابعة له.`)) {
      deleteClass(cls.id);
      showToast('تم حذف الفصل بنجاح');
    }
  };

  const handleDeleteStudentConfirm = (student: Student) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب "${student.name}"؟`)) {
      deleteStudent(student.id);
      showToast('تم حذف الطالب بنجاح');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Super Admin Directives / Circulars Banner */}
      {announcements.filter((a) => a.active && (a.targetAudience === 'all' || a.targetAudience === 'directors')).length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>تعميم إداري صادر من الإدارة العليا:</span>
                <span className="font-bold underline">
                  {announcements.find((a) => a.active && (a.targetAudience === 'all' || a.targetAudience === 'directors'))?.title}
                </span>
              </div>
              <p className="text-xs text-amber-800 line-clamp-1 mt-0.5">
                {announcements.find((a) => a.active && (a.targetAudience === 'all' || a.targetAudience === 'directors'))?.content}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
            ملزم لجميع الإدارات
          </span>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-blue-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-blue-400/30 shrink-0 bg-blue-900 hidden sm:block">
              <img
                src="/src/assets/images/school_blue_emblem_1789621822676.jpg"
                alt="شعار المدرسة"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sky-200 text-xs font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>لوحة إدارة المدرسة ({currentUser?.title || 'مدير المدرسة'}) | تحت إشراف المشرف العام</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">إدارة منظومة الحضور والغياب المدرسية</h1>
              <p className="text-xs text-blue-200 mt-1">
                تحكم في هيئة التدريس، الفصول والمراحل، قوائم الطلاب، وسجلات الغياب اليومية والتراكمية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {superAdmin && (
              <button
                onClick={() => switchUser(superAdmin)}
                className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                title="التبديل إلى لوحة المشرف العام الأكبر"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>لوحة المشرف العام العليا</span>
              </button>
            )}

            <button
              onClick={() => {
                setPdfModalClassId(undefined);
                setShowMonthlyPdfModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/30 border border-emerald-500/40"
              title="تصدير كشوفات وسجلات الغياب الشهرية الرسمية بصيغة PDF (النموذج الوزاري المعتمد)"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>تصدير كشف الغياب الشهري (PDF)</span>
            </button>

            <button
              onClick={() => {
                setDecree151ClassId(undefined);
                setShowDecree151Modal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-amber-950/30 border border-amber-400/40"
              title="سجلات وتقارير درجات القرار الوزاري 151 لسنة 2026 (أعمال السنة واختبارات الشهور وحساب المتوسطات وتصدير PDF)"
            >
              <Award className="w-4 h-4 text-amber-200" />
              <span>سجل درجات القرار 151 (PDF)</span>
            </button>

            <button
              onClick={() => {
                setEditingTeacher(null);
                setShowTeacherModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة معلم</span>
            </button>

            <button
              onClick={() => {
                setEditingClass(null);
                setShowClassModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فصل</span>
            </button>

            <button
              onClick={() => {
                setEditingStudent(null);
                setShowStudentModal(true);
              }}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2 rounded-xl backdrop-blur-xs transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Users className="w-4 h-4" />
              <span>إضافة طالب</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">هيئة التدريس</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{schoolStats.totalTeachers}</div>
          <span className="text-[10px] text-slate-400">معلمين مسجلين</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">الفصول الدراسية</span>
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{schoolStats.totalClasses}</div>
          <span className="text-[10px] text-slate-400">فصول وشعب</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">إجمالي الطلاب</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{schoolStats.totalStudents}</div>
          <span className="text-[10px] text-slate-400">طالب وطالبة</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">نسبة الحضور لليوم</span>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{schoolStats.rate}%</div>
          <span className="text-[10px] text-slate-400">من إجمالي المسجلين</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">الغياب المسجل اليوم</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{schoolStats.todayAbsent}</div>
          <span className="text-[10px] text-slate-400">طالب غائب</span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center justify-between overflow-x-auto pb-px">
        <div className="flex gap-2 sm:gap-6 min-w-max">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>نظرة عامة والغياب اليومي</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>كشف الحضور المدرسي الشامل</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'teachers'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>إدارة هيئة التدريس ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'classes'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الفصول والمراحل ({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>دليل الطلاب ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'alerts'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>إنذارات الغياب ({alertStudents.length})</span>
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="hidden sm:flex text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 items-center gap-1.5 shrink-0"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>طباعة</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & TODAY'S BREAKDOWN */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Date Selector & Class quick filter & View Mode Toggle */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">تاريخ المعاينة:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              />
              <button
                onClick={() => setSelectedDate(getTodayDateStr())}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                  selectedDate === getTodayDateStr()
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                اليوم
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setOverviewViewMode('both')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  overviewViewMode === 'both'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                عرض شامل
              </button>
              <button
                onClick={() => setOverviewViewMode('charts')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  overviewViewMode === 'charts'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>الرسوم البيانية</span>
              </button>
              <button
                onClick={() => setOverviewViewMode('classes')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  overviewViewMode === 'classes'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                بطاقات الفصول
              </button>
            </div>
          </div>

          {/* Interactive Graphic Analytics & Charts */}
          {(overviewViewMode === 'both' || overviewViewMode === 'charts') && (
            <AdminAnalyticsCharts
              classes={classes}
              students={students}
              attendance={attendance}
              selectedDate={selectedDate}
              stats={schoolStats}
            />
          )}

          {/* Section Divider if showing both */}
          {overviewViewMode === 'both' && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-sm text-slate-900">متابعة الفصول والشعب الدراسية</h3>
              </div>
              <span className="text-xs text-slate-500">
                تم تحضير <span className="font-bold text-slate-900">{schoolStats.totalRecorded}</span> من{' '}
                <span className="font-bold text-slate-900">{schoolStats.totalStudents}</span> طالب
              </span>
            </div>
          )}

          {/* Classes Status Grid */}
          {(overviewViewMode === 'both' || overviewViewMode === 'classes') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => {
              const clsStudents = students.filter((s) => s.classId === cls.id);
              const clsAttendance = dateAttendance.filter((a) => a.classId === cls.id);
              const presentCount = clsAttendance.filter((a) => a.status === 'present').length;
              const absentCount = clsAttendance.filter((a) => a.status === 'absent').length;
              const lateCount = clsAttendance.filter((a) => a.status === 'late').length;
              const excusedCount = clsAttendance.filter((a) => a.status === 'excused').length;
              const assignedTeacherNames = teachers
                .filter((t) => t.assignedClassIds.includes(cls.id))
                .map((t) => t.name)
                .join('، ');

              const isComplete = clsAttendance.length >= clsStudents.length && clsStudents.length > 0;

              return (
                <div key={cls.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{cls.name}</h3>
                        {isComplete ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            مكتمل التسجيل
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            تسجيل جزئي / معلق
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        المعلم المسؤول: {assignedTeacherNames || 'لم يتم تعيين معلم بعد'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {clsStudents.length} طلاب
                    </span>
                  </div>

                  {/* Attendance pills for this class */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl">
                      <span className="block text-[10px] font-bold text-blue-700">حاضر</span>
                      <span className="font-black text-blue-800 text-base">{presentCount}</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-2 rounded-xl">
                      <span className="block text-[10px] font-bold text-rose-700">غائب</span>
                      <span className="font-black text-rose-800 text-base">{absentCount}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
                      <span className="block text-[10px] font-bold text-amber-700">متأخر</span>
                      <span className="font-black text-amber-800 text-base">{lateCount}</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-xl">
                      <span className="block text-[10px] font-bold text-indigo-700">عذر</span>
                      <span className="font-black text-indigo-800 text-base">{excusedCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setPdfModalClassId(cls.id);
                        setShowMonthlyPdfModal(true);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition"
                      title="استخراج سجل الغياب الشهري الرسمي PDF لهذا الفصل"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>سجل الغياب الشهري (PDF)</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setFilterClassId(cls.id);
                          setActiveTab('attendance');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        <span>عرض كشف اليوم</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingStudent(null);
                          setShowStudentModal(true);
                        }}
                        className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>إضافة طالب</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPREHENSIVE ATTENDANCE LEDGER */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">التاريخ:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
                />
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">الفصل:</span>
                <select
                  value={filterClassId}
                  onChange={(e) => setFilterClassId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
                >
                  <option value="all">جميع الفصول ({classes.length})</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">الحالة:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
                >
                  <option value="all">كل الحالات</option>
                  <option value="present">حاضر</option>
                  <option value="absent">غائب</option>
                  <option value="late">متأخر</option>
                  <option value="excused">عذر رسمي</option>
                  <option value="unrecorded">غير مسجل بعد</option>
                </select>
              </div>

              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الطالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-8 pl-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setPdfModalClassId(filterClassId !== 'all' ? filterClassId : undefined);
                  setShowMonthlyPdfModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                title="تصدير كشف الغياب الشهري الرسمي PDF وفق النموذج الوزاري"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-200" />
                <span>تصدير سجل الغياب الشهري (PDF)</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                عدد النتائج: <span className="text-blue-700">{filteredAttendance.length}</span>
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">اسم الطالب</th>
                    <th className="py-3 px-4">الفصل</th>
                    <th className="py-3 px-4">رقم القيد</th>
                    <th className="py-3 px-4">هاتف ولي الأمر</th>
                    <th className="py-3 px-4">حالة الحضور اليوم</th>
                    <th className="py-3 px-4">ملاحظات المسجلة</th>
                    <th className="py-3 px-4 text-center">تغيير الحالة المباشر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        لا توجد سجلات تطابق معايير البحث والفلترة المختارة.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.student.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.classRoom?.name || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{item.student.studentNumber}</td>
                        <td className="py-3 px-4">
                          {item.student.guardianPhone ? (
                            <a
                              href={`tel:${item.student.guardianPhone}`}
                              className="text-blue-700 hover:underline flex items-center gap-1 font-mono"
                            >
                              <Phone className="w-3 h-3 text-blue-600" />
                              <span>{item.student.guardianPhone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'present' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> حاضر
                            </span>
                          )}
                          {item.status === 'absent' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> غائب
                            </span>
                          )}
                          {item.status === 'late' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> متأخر
                            </span>
                          )}
                          {item.status === 'excused' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1 w-fit">
                              <FileText className="w-3 h-3" /> عذر
                            </span>
                          )}
                          {item.status === 'unrecorded' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 w-fit">
                              لم يسجل بعد
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{item.note || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          {/* Fast Admin Override Buttons */}
                          <div className="flex items-center justify-center gap-1">
                            <button
                              title="حاضر"
                              onClick={() => handleAdminUpdateStatus(item.student.id, item.student.classId, 'present')}
                              className={`p-1.5 rounded-md text-xs font-bold ${
                                item.status === 'present'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                              }`}
                            >
                              حاضر
                            </button>
                            <button
                              title="غائب"
                              onClick={() => handleAdminUpdateStatus(item.student.id, item.student.classId, 'absent')}
                              className={`p-1.5 rounded-md text-xs font-bold ${
                                item.status === 'absent'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700'
                              }`}
                            >
                              غائب
                            </button>
                            <button
                              title="متأخر"
                              onClick={() => handleAdminUpdateStatus(item.student.id, item.student.classId, 'late')}
                              className={`p-1.5 rounded-md text-xs font-bold ${
                                item.status === 'late'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700'
                              }`}
                            >
                              متأخر
                            </button>
                            <button
                              title="عذر"
                              onClick={() => handleAdminUpdateStatus(item.student.id, item.student.classId, 'excused')}
                              className={`p-1.5 rounded-md text-xs font-bold ${
                                item.status === 'excused'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
                              }`}
                            >
                              عذر
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEACHERS MANAGEMENT */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">إدارة هيئة التدريس والمعلمين</h2>
              <p className="text-xs text-slate-500">
                يمكنك إضافة معلمين جدد، تعديل بياناتهم، إسناد الفصول لهم، أو تسجيل الدخول بحساب المعلم للمعاينة.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTeacher(null);
                setShowTeacherModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة معلم جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => {
              const assignedClasses = classes.filter((c) => teacher.assignedClassIds.includes(c.id));
              const totalTeacherStudents = students.filter((s) => teacher.assignedClassIds.includes(s.classId)).length;

              return (
                <div
                  key={teacher.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                          {teacher.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{teacher.name}</h3>
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            مادة {teacher.subject || 'عام'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">البريد:</span> {teacher.email}
                      </div>
                      <div>
                        <span className="text-slate-400">كلمة المرور:</span>{' '}
                        <span className="font-mono bg-slate-100 px-1 rounded">{teacher.password || '123'}</span>
                      </div>
                      {teacher.phone && (
                        <div>
                          <span className="text-slate-400">الهاتف:</span> {teacher.phone}
                        </div>
                      )}
                    </div>

                    {/* Assigned classes list */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">الفصول المسندة:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {assignedClasses.length > 0 ? (
                          assignedClasses.map((cls) => (
                            <span
                              key={cls.id}
                              className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                            >
                              {cls.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            لم يتم إسناد فصول بعد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => switchUser(teacher)}
                      className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                      title="فتح صفحة هذا المعلم لتسجيل الحضور"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>فتح صفحة المعلم</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTeacher(teacher);
                          setShowTeacherModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacherConfirm(teacher)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: CLASSES MANAGEMENT */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">إدارة الفصول والمراحل الدراسية</h2>
              <p className="text-xs text-slate-500">إضافة أو تعديل فصول وشعب المدرسة.</p>
            </div>
            <button
              onClick={() => {
                setEditingClass(null);
                setShowClassModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فصل دراسي</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const clsStudents = students.filter((s) => s.classId === cls.id);
              const assignedTeachers = teachers.filter((t) => t.assignedClassIds.includes(cls.id));

              return (
                <div
                  key={cls.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{cls.name}</h3>
                        <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                          المرحلة: {cls.grade}
                        </span>
                      </div>
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                        {clsStudents.length} طلاب
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="text-slate-400">العام الدراسي:</span> {cls.academicYear}
                      </div>
                      <div>
                        <span className="text-slate-400">الشعبة / الفصل:</span> {cls.section}
                      </div>
                      <div>
                        <span className="text-slate-400">المدرسون المسندون:</span>{' '}
                        {assignedTeachers.length > 0
                          ? assignedTeachers.map((t) => t.name).join('، ')
                          : 'لا يوجد مدرس بعد'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setFilterClassId(cls.id);
                          setActiveTab('students');
                        }}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900"
                      >
                        عرض طلاب الفصل ({clsStudents.length})
                      </button>

                      <button
                        onClick={() => {
                          setDecree151ClassId(cls.id);
                          setShowDecree151Modal(true);
                        }}
                        className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1 transition"
                        title="سجل ورصد درجات القرار الوزاري 151 لهذا الفصل"
                      >
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>سجل درجات 151</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingClass(cls);
                          setShowClassModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClassConfirm(cls)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: ALL STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن طالب بالاسم أو رقم القيد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
              >
                <option value="all">جميع الفصول ({classes.length})</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingStudent(null);
                setShowStudentModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة طالب جديد</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">اسم الطالب</th>
                    <th className="py-3 px-4">الفصل</th>
                    <th className="py-3 px-4">رقم القيد</th>
                    <th className="py-3 px-4">ولي الأمر</th>
                    <th className="py-3 px-4">رقم الهاتف</th>
                    <th className="py-3 px-4 text-center">نسبة الحضور</th>
                    <th className="py-3 px-4 text-center text-amber-900 bg-amber-50/70 font-black">درجات القرار 151</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter((s) => (filterClassId === 'all' ? true : s.classId === filterClassId))
                    .filter((s) =>
                      searchQuery
                        ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.studentNumber.includes(searchQuery)
                        : true
                    )
                    .map((student, idx) => {
                      const cls = classes.find((c) => c.id === student.classId);
                      const summ = getStudentAttendanceSummary(student.id);
                      const grades151 = getStudentDecree151Grades(student.id);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{student.name}</td>
                          <td className="py-3 px-4 text-slate-600">{cls?.name || '-'}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{student.studentNumber}</td>
                          <td className="py-3 px-4 text-slate-600">{student.guardianName || '-'}</td>
                          <td className="py-3 px-4">
                            {student.guardianPhone ? (
                              <a
                                href={`tel:${student.guardianPhone}`}
                                className="text-blue-700 hover:underline flex items-center gap-1 font-mono"
                              >
                                <Phone className="w-3 h-3 text-blue-600" />
                                <span>{student.guardianPhone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                summ.attendanceRate >= 85
                                  ? 'bg-blue-100 text-blue-800'
                                  : summ.attendanceRate >= 70
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {summ.attendanceRate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center bg-amber-50/20">
                            <button
                              type="button"
                              onClick={() => {
                                setStudentForGrades(student);
                                setShowStudentGradeModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition shadow-2xs"
                              title="رصد وتعديل درجات الطالب للقرار 151 (17 أسبوعاً واختبارات الشهور)"
                            >
                              <Award className="w-3 h-3 text-amber-700" />
                              <span>{grades151.finalTotal} / 40</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingStudent(student);
                                  setShowStudentModal(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudentConfirm(student)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {/* TAB 6: ABSENCE ALERTS & REPORTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">قائمة تنبيهات الغياب والإنذارات</h2>
              <p className="text-xs text-slate-500">
                الطلاب الذين تجاوز عدد أيام غيابهم يومين أو أكثر لاتخاذ إجراءات المتابعة والتواصل مع أولياء الأمور.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">اسم الطالب</th>
                    <th className="py-3 px-4">الفصل</th>
                    <th className="py-3 px-4">رقم القيد</th>
                    <th className="py-3 px-4 text-center">أيام الغياب</th>
                    <th className="py-3 px-4">ولي الأمر</th>
                    <th className="py-3 px-4">هاتف ولي الأمر</th>
                    <th className="py-3 px-4 text-center">مستوى التنبيه</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alertStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        لا يوجد طلاب لديهم غياب متكرر حالياً.
                      </td>
                    </tr>
                  ) : (
                    alertStudents.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.student.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.classRoom?.name || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{item.student.studentNumber}</td>
                        <td className="py-3 px-4 text-center font-black text-rose-600 text-sm">
                          {item.summary.absentDays} أيام
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.student.guardianName || '-'}</td>
                        <td className="py-3 px-4">
                          {item.student.guardianPhone ? (
                            <a
                              href={`tel:${item.student.guardianPhone}`}
                              className="text-blue-700 font-bold hover:underline flex items-center gap-1 font-mono"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>{item.student.guardianPhone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>إنذار واجب المتابعة</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TeacherModal
        isOpen={showTeacherModal}
        onClose={() => {
          setShowTeacherModal(false);
          setEditingTeacher(null);
        }}
        onSave={(data) => {
          if (editingTeacher) {
            updateTeacher(editingTeacher.id, data);
            showToast('تم تحديث بيانات المعلم بنجاح');
          } else {
            addTeacher(data);
            showToast('تم إضافة المعلم الجديد بنجاح');
          }
        }}
        classes={classes}
        initialTeacher={editingTeacher}
      />

      <ClassModal
        isOpen={showClassModal}
        onClose={() => {
          setShowClassModal(false);
          setEditingClass(null);
        }}
        onSave={(data) => {
          if (editingClass) {
            updateClass(editingClass.id, data);
            showToast('تم تحديث الفصل الدراسي');
          } else {
            addClass(data);
            showToast('تم إضافة الفصل الدراسي الجديد');
          }
        }}
        initialClass={editingClass}
      />

      <StudentModal
        isOpen={showStudentModal}
        onClose={() => {
          setShowStudentModal(false);
          setEditingStudent(null);
        }}
        onSave={(data) => {
          if (editingStudent) {
            updateStudent(editingStudent.id, data);
            showToast('تم تحديث بيانات الطالب');
          } else {
            addStudent(data);
            showToast('تم إضافة الطالب بنجاح');
          }
        }}
        classes={classes}
        initialStudent={editingStudent}
      />

      <MonthlyAttendancePdfModal
        isOpen={showMonthlyPdfModal}
        onClose={() => {
          setShowMonthlyPdfModal(false);
          setPdfModalClassId(undefined);
        }}
        defaultClassId={pdfModalClassId}
      />

      <Decree151ReportsModal
        isOpen={showDecree151Modal}
        onClose={() => {
          setShowDecree151Modal(false);
          setDecree151ClassId(undefined);
        }}
        defaultClassId={decree151ClassId}
      />

      <StudentGradeModal
        isOpen={showStudentGradeModal}
        onClose={() => {
          setShowStudentGradeModal(false);
          setStudentForGrades(null);
        }}
        student={studentForGrades}
        onSaved={() => {
          showToast('تم حفظ ورصد درجات الطالب بنجاح');
        }}
      />
    </div>
  );
};
