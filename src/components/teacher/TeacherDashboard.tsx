import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student, AttendanceStatus, ClassRoom } from '../../types';
import { getTodayDateStr, getPastDateStr } from '../../data/initialData';
import { StudentModal } from '../modals/StudentModal';
import { MonthlyAttendancePdfModal } from '../modals/MonthlyAttendancePdfModal';
import { Decree151ReportsModal } from '../modals/Decree151ReportsModal';
import { StudentGradeModal } from '../modals/StudentGradeModal';
import { TeacherClassCharts } from '../charts/TeacherClassCharts';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  UserPlus,
  Users,
  Calendar,
  Save,
  Search,
  BookOpen,
  Check,
  X,
  Phone,
  Edit2,
  Trash2,
  AlertTriangle,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Bell,
  Award,
  FileCheck,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const {
    currentUser,
    classes,
    students,
    attendance,
    announcements,
    saveClassAttendance,
    getAttendanceForClassAndDate,
    getStudentAttendanceSummary,
    getStudentDecree151Grades,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useSchool();

  // Get teacher's assigned classes, fallback to all classes if none assigned
  const teacherClasses: ClassRoom[] = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.assignedClassIds && currentUser.assignedClassIds.length > 0) {
      return classes.filter((c) => currentUser.assignedClassIds.includes(c.id));
    }
    return classes;
  }, [currentUser, classes]);

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return teacherClasses[0]?.id || classes[0]?.id || '';
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [activeTab, setActiveTab] = useState<'record' | 'students' | 'history'>('record');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showMonthlyPdfModal, setShowMonthlyPdfModal] = useState(false);
  const [showDecree151Modal, setShowDecree151Modal] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<Student | null>(null);
  const [showStudentGradeModal, setShowStudentGradeModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local attendance edits for the active date & class before saving
  const existingAttendanceMap = useMemo(() => {
    return getAttendanceForClassAndDate(selectedClassId, selectedDate);
  }, [selectedClassId, selectedDate, attendance, getAttendanceForClassAndDate]);

  const [localStatusMap, setLocalStatusMap] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});

  // Sync local status map whenever class or date changes
  React.useEffect(() => {
    const initialMap: Record<string, { status: AttendanceStatus; note: string }> = {};
    const classStudents = students.filter((s) => s.classId === selectedClassId);

    classStudents.forEach((s) => {
      if (existingAttendanceMap[s.id]) {
        initialMap[s.id] = {
          status: existingAttendanceMap[s.id].status,
          note: existingAttendanceMap[s.id].note || '',
        };
      } else {
        // Default to present for quick, painless submission
        initialMap[s.id] = {
          status: 'present',
          note: '',
        };
      }
    });

    setLocalStatusMap(initialMap);
  }, [selectedClassId, selectedDate, existingAttendanceMap, students]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId)
      .filter((s) => (searchQuery ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentNumber.includes(searchQuery) : true));
  }, [students, selectedClassId, searchQuery]);

  // Status statistics for the currently selected class & date
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    (Object.values(localStatusMap) as { status: AttendanceStatus; note: string }[]).forEach((val) => {
      if (val.status === 'present') present++;
      if (val.status === 'absent') absent++;
      if (val.status === 'late') late++;
      if (val.status === 'excused') excused++;
    });

    return {
      total: classStudents.length,
      present,
      absent,
      late,
      excused,
    };
  }, [localStatusMap, classStudents]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalStatusMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleSetNote = (studentId: string, note: string) => {
    setLocalStatusMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setLocalStatusMap((prev) => {
      const updated = { ...prev };
      classStudents.forEach((s) => {
        updated[s.id] = {
          status,
          note: prev[s.id]?.note || '',
        };
      });
      return updated;
    });
    showToast(status === 'present' ? 'تم تحديد جميع الطلاب كـ حاضرين' : 'تم تحديد جميع الطلاب كـ غائبين');
  };

  const handleSaveAttendance = () => {
    const entries = Object.entries(localStatusMap) as [string, { status: AttendanceStatus; note: string }][];
    const submissions = entries.map(([studentId, data]) => ({
      studentId,
      status: data.status,
      note: data.note ? data.note.trim() : undefined,
    }));

    saveClassAttendance(selectedDate, selectedClassId, submissions);
    showToast('تم حفظ كشف الحضور بنجاح!');
  };

  const handleAddOrEditStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    if (editingStudent) {
      updateStudent(editingStudent.id, studentData);
      showToast('تم تحديث بيانات الطالب بنجاح');
      setEditingStudent(null);
    } else {
      addStudent(studentData);
      showToast('تم إضافة الطالب إلى الفصل بنجاح');
    }
  };

  const handleDeleteStudent = (student: Student) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب "${student.name}" نهائياً من الفصل؟`)) {
      deleteStudent(student.id);
      showToast('تم حذف الطالب بنجاح');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Super Admin Directives / Circulars Banner for Teachers */}
      {announcements.filter((a) => a.active && (a.targetAudience === 'all' || a.targetAudience === 'teachers')).length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>تعميم إداري صادر من الإدارة العليا:</span>
                <span className="font-bold underline">
                  {announcements.find((a) => a.active && (a.targetAudience === 'all' || a.targetAudience === 'teachers'))?.title}
                </span>
              </div>
              <p className="text-xs text-amber-800 line-clamp-1 mt-0.5">
                {announcements.find((a) => a.active && (a.targetAudience === 'all' || a.targetAudience === 'teachers'))?.content}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
            توجيه إلزامي
          </span>
        </div>
      )}

      {/* Teacher Profile Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-800 to-indigo-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-sky-200 text-xs font-semibold mb-1">
              <BookOpen className="w-4 h-4" />
              <span>لوحة تحكم المعلم | مادة {currentUser?.subject || 'التعليم العام'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">أهلاً بك، {currentUser?.name}</h1>
            <p className="text-xs text-sky-100 mt-1">
              لديك <span className="font-bold underline">{teacherClasses.length} فصول</span> معتمدة للمتابعة وتسجيل الحضور والغياب اليومي.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowMonthlyPdfModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/30 border border-emerald-500/40"
              title="تصدير كشف وسجل الغياب الشهري الرسمي للفصل بصيغة PDF"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>سجل الغياب الشهري (PDF)</span>
            </button>

            <button
              onClick={() => setShowDecree151Modal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-amber-950/30 border border-amber-400/40"
              title="سجلات وتقارير درجات القرار الوزاري 151 (كراسة الحصة، الواجب، التقييم الأسبوعي، السلوك، واختبارات الشهور)"
            >
              <Award className="w-4 h-4 text-amber-200" />
              <span>سجل درجات القرار 151 (PDF)</span>
            </button>

            <button
              id="teacher-add-student-banner-btn"
              onClick={() => {
                setEditingStudent(null);
                setShowAddStudentModal(true);
              }}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl backdrop-blur-xs border border-white/20 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-sky-300" />
              <span>إضافة طالب جديد للفصل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar: Class Selection & Date Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Class Selection Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">اختر الفصل الدراسي:</label>
          <div className="flex flex-wrap gap-2">
            {teacherClasses.map((cls) => {
              const count = students.filter((s) => s.classId === cls.id).length;
              const isSelected = selectedClassId === cls.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{cls.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count} طالب
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-1.5 min-w-[240px]">
          <label className="text-xs font-bold text-slate-700 block">تاريخ كشف الحضور:</label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white text-slate-800"
            />
            <button
              onClick={() => setSelectedDate(getTodayDateStr())}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition ${
                selectedDate === getTodayDateStr()
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setSelectedDate(getPastDateStr(1))}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition ${
                selectedDate === getPastDateStr(1)
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              أمس
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex gap-2 sm:gap-6">
          <button
            onClick={() => setActiveTab('record')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'record'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تسجيل كشف الحضور اليومي</span>
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
            <span>إدارة طلاب الفصل ({stats.total})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>سجل الغياب والتقارير</span>
          </button>
        </div>

        {/* Print / Export button for report */}
        {activeTab === 'history' && (
          <button
            onClick={() => window.print()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>طباعة التقرير</span>
          </button>
        )}
      </div>

      {/* TAB 1: RECORD ATTENDANCE */}
      {activeTab === 'record' && (
        <div className="space-y-4">
          {/* Visual Graphic Analytics for Class */}
          <TeacherClassCharts
            classNameStr={currentClass?.name || 'الفصل الدراسي'}
            stats={stats}
          />

          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن طالب بالاسم أو رقم القيد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-slate-800 p-1"
                >
                  إلغاء البحث
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>تحضير الكل (حاضر)</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>تحديد الكل غائب</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>حفظ كشف اليوم</span>
              </button>
            </div>
          </div>

          {/* Attendance List */}
          {classStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">لا يوجد طلاب في هذا الفصل</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">يمكنك إضافة طلاب لهذا الفصل للبدء في أخذ الحضور.</p>
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setShowAddStudentModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة طالب الآن</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
              {classStudents.map((student, idx) => {
                const currentStatus = localStatusMap[student.id]?.status || 'present';
                const currentNote = localStatusMap[student.id]?.note || '';
                const studentSummary = getStudentAttendanceSummary(student.id);
                const grades151 = getStudentDecree151Grades(student.id);

                return (
                  <div
                    key={student.id}
                    className={`p-3.5 sm:p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      currentStatus === 'absent'
                        ? 'bg-rose-50/40'
                        : currentStatus === 'late'
                        ? 'bg-amber-50/40'
                        : currentStatus === 'excused'
                        ? 'bg-indigo-50/40'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Student Details */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-6 text-center">{idx + 1}</span>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shadow-2xs">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{student.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            #{student.studentNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              studentSummary.rate >= 90
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : studentSummary.rate >= 75
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                            title={`حضر ${studentSummary.presentDays} من أصل ${studentSummary.totalDays} يوم`}
                          >
                            مواظبة: {studentSummary.rate}%
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setGradingStudent(student);
                              setShowStudentGradeModal(true);
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            title="رصد وتعديل درجات أعمال السنة والشهور للقرار 151"
                          >
                            <Award className="w-3 h-3 text-amber-600" />
                            <span>القرار 151: {grades151.finalTotal} / 40</span>
                          </button>
                        </div>
                        {student.guardianPhone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>ولي الأمر: {student.guardianPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attendance Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                      {/* 4 Status Buttons */}
                      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'present')}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                            currentStatus === 'present'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-blue-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>حاضر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'absent')}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'late')}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>متأخر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, 'excused')}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                            currentStatus === 'excused'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-indigo-700'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>عذر</span>
                        </button>
                      </div>

                      {/* Note Input */}
                      <div className="min-w-[170px]">
                        <input
                          type="text"
                          placeholder="ملاحظة أو سبب الغياب..."
                          value={currentNote}
                          onChange={(e) => handleSetNote(student.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Bottom Save Bar */}
          <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              كشف فصل <span className="font-bold text-slate-900">{currentClass?.name}</span> لتاريخ{' '}
              <span className="font-bold text-slate-900">{selectedDate}</span>
            </div>
            <button
              type="button"
              onClick={handleSaveAttendance}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتأكيد كشف الحضور</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE CLASS STUDENTS */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">قائمة طلاب {currentClass?.name}</h2>
              <p className="text-xs text-slate-500">يمكنك إضافة أو تعديل أو حذف طلاب هذا الفصل مباشرة.</p>
            </div>
            <button
              onClick={() => {
                setEditingStudent(null);
                setShowAddStudentModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
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
                    <th className="py-3 px-4">رقم القيد</th>
                    <th className="py-3 px-4">النوع</th>
                    <th className="py-3 px-4">ولي الأمر</th>
                    <th className="py-3 px-4">رقم الهاتف</th>
                    <th className="py-3 px-4 text-center text-amber-900 bg-amber-50/70 font-black">درجات القرار 151</th>
                    <th className="py-3 px-4">ملاحظات</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((student, idx) => {
                    const grades151 = getStudentDecree151Grades(student.id);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{student.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{student.studentNumber}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              student.gender === 'male'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {student.gender === 'male' ? 'طالب' : 'طالبة'}
                          </span>
                        </td>
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
                        <td className="py-3 px-4 text-center bg-amber-50/20">
                          <button
                            type="button"
                            onClick={() => {
                              setGradingStudent(student);
                              setShowStudentGradeModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition shadow-2xs"
                            title="رصد وتعديل درجات القرار 151 لهذا الطالب"
                          >
                            <Award className="w-3 h-3 text-amber-700" />
                            <span>{grades151.finalTotal} / 40</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{student.notes || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingStudent(student);
                                setShowAddStudentModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="حذف"
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

      {/* TAB 3: ATTENDANCE HISTORY & STATS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">إحصائيات ونسب الغياب التراكمية</h2>
              <p className="text-xs text-slate-500">
                متابعة معدلات حضور وغياب كل طالب في {currentClass?.name} للتعرف على الطلاب كثيري الغياب.
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
                    <th className="py-3 px-4">رقم القيد</th>
                    <th className="py-3 px-4 text-center">أيام الحضور</th>
                    <th className="py-3 px-4 text-center">مرات الغياب</th>
                    <th className="py-3 px-4 text-center">التأخير</th>
                    <th className="py-3 px-4 text-center">الأعذار</th>
                    <th className="py-3 px-4 text-center">نسبة الالتزام</th>
                    <th className="py-3 px-4 text-center">حالة التنبيه</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((student, idx) => {
                    const summ = getStudentAttendanceSummary(student.id);
                    const isHighAbsence = summ.absentDays >= 3;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{student.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{student.studentNumber}</td>
                        <td className="py-3 px-4 text-center font-bold text-blue-700">{summ.presentDays}</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-700">{summ.absentDays}</td>
                        <td className="py-3 px-4 text-center font-bold text-amber-600">{summ.lateDays}</td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-600">{summ.excusedDays}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-xs">{summ.attendanceRate}%</span>
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  summ.attendanceRate >= 85
                                    ? 'bg-blue-600'
                                    : summ.attendanceRate >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${summ.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isHighAbsence ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>إنذار غياب</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Check className="w-3 h-3" />
                              <span>منتظم</span>
                            </span>
                          )}
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

      {/* Student Add/Edit Modal */}
      <StudentModal
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          setEditingStudent(null);
        }}
        onSave={handleAddOrEditStudent}
        classes={classes}
        initialStudent={editingStudent}
        defaultClassId={selectedClassId}
      />

      <MonthlyAttendancePdfModal
        isOpen={showMonthlyPdfModal}
        onClose={() => setShowMonthlyPdfModal(false)}
        defaultClassId={selectedClassId}
      />

      <Decree151ReportsModal
        isOpen={showDecree151Modal}
        onClose={() => setShowDecree151Modal(false)}
        defaultClassId={selectedClassId}
      />

      <StudentGradeModal
        isOpen={showStudentGradeModal}
        onClose={() => {
          setShowStudentGradeModal(false);
          setGradingStudent(null);
        }}
        student={gradingStudent}
        onSaved={() => {
          setToastMessage('تم حفظ ورصد درجات الطالب بنجاح');
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />
    </div>
  );
};
