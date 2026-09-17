import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student, StudentDecree151Grades, WeeklyGradeRecord } from '../../types';
import { DECREE_151_WEEKS, calculateDecree151Totals } from '../../utils/decree151Grades';
import {
  X,
  Save,
  Sparkles,
  RotateCcw,
  GraduationCap,
  Calculator,
  CheckCircle2,
  Calendar,
  BookOpen,
} from 'lucide-react';

interface StudentGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  subject?: string;
  semester?: 'first' | 'second';
  onSaved?: () => void;
}

export const StudentGradeModal: React.FC<StudentGradeModalProps> = ({
  isOpen,
  onClose,
  student,
  subject = 'الرياضيات',
  semester = 'first',
  onSaved,
}) => {
  const { getStudentDecree151Grades, updateStudentDecree151Grades, classes, settings } = useSchool();

  const [currentSubject, setCurrentSubject] = useState(subject);
  const [currentSemester, setCurrentSemester] = useState<'first' | 'second'>(semester);
  const [activeSubTab, setActiveSubTab] = useState<'all_weeks' | 'summary_tests'>('all_weeks');

  const [weeklyGrades, setWeeklyGrades] = useState<Record<number, WeeklyGradeRecord>>({});
  const [monthTest1, setMonthTest1] = useState<number>(14);
  const [monthTest2, setMonthTest2] = useState<number>(15);

  useEffect(() => {
    if (student) {
      setCurrentSubject(subject);
      setCurrentSemester(semester);
      const existing = getStudentDecree151Grades(student.id, subject, semester);
      setWeeklyGrades(existing.weeklyGrades || {});
      setMonthTest1(existing.monthTest1 ?? 14);
      setMonthTest2(existing.monthTest2 ?? 15);
    }
  }, [student, subject, semester]);

  if (!isOpen || !student) return null;

  const currentClass = classes.find((c) => c.id === student.classId);

  // Calculate live totals
  const liveTotals = calculateDecree151Totals(weeklyGrades, monthTest1, monthTest2);

  const handleWeekGradeChange = (
    weekNum: number,
    field: 'homework' | 'classwork' | 'weeklyAssessment' | 'behavior',
    value: string
  ) => {
    const num = value === '' ? undefined : Number(value);
    setWeeklyGrades((prev) => ({
      ...prev,
      [weekNum]: {
        ...(prev[weekNum] || { weekNumber: weekNum }),
        weekNumber: weekNum,
        dateStr: DECREE_151_WEEKS[weekNum - 1]?.dateStr,
        [field]: num,
      },
    }));
  };

  const handleAutoFillExcellent = () => {
    const newGrades: Record<number, WeeklyGradeRecord> = {};
    for (let w = 1; w <= 17; w++) {
      newGrades[w] = {
        weekNumber: w,
        dateStr: DECREE_151_WEEKS[w - 1]?.dateStr,
        homework: 5,
        classwork: 5,
        weeklyAssessment: 10,
        behavior: 5,
      };
    }
    setWeeklyGrades(newGrades);
    setMonthTest1(15);
    setMonthTest2(15);
  };

  const handleResetZero = () => {
    const newGrades: Record<number, WeeklyGradeRecord> = {};
    for (let w = 1; w <= 17; w++) {
      newGrades[w] = {
        weekNumber: w,
        dateStr: DECREE_151_WEEKS[w - 1]?.dateStr,
        homework: 0,
        classwork: 0,
        weeklyAssessment: 0,
        behavior: 0,
      };
    }
    setWeeklyGrades(newGrades);
    setMonthTest1(0);
    setMonthTest2(0);
  };

  const handleSave = () => {
    const updated: StudentDecree151Grades = {
      id: `grade-${student.id}-${currentSubject}-${currentSemester}`,
      studentId: student.id,
      classId: student.classId,
      subject: currentSubject,
      academicYear: settings?.academicYear || '2026 / 2027 م',
      semester: currentSemester,
      weeklyGrades,
      monthTest1,
      monthTest2,
      ...liveTotals,
      updatedAt: Date.now(),
    };

    updateStudentDecree151Grades(updated);
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  رصد درجات الطالب: {student.name}
                </h3>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  القرار الوزاري 151 لسنة 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                فصل: <span className="text-slate-200 font-bold">{currentClass?.name || 'غير محدد'}</span> | كود الطالب: {student.studentNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar: Subject & Semester */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-600">المادة:</label>
              <select
                value={currentSubject}
                onChange={(e) => {
                  setCurrentSubject(e.target.value);
                  const ex = getStudentDecree151Grades(student.id, e.target.value, currentSemester);
                  setWeeklyGrades(ex.weeklyGrades || {});
                  setMonthTest1(ex.monthTest1 ?? 14);
                  setMonthTest2(ex.monthTest2 ?? 15);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
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

            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-600">الفصل الدراسي:</label>
              <select
                value={currentSemester}
                onChange={(e) => {
                  const sem = e.target.value as 'first' | 'second';
                  setCurrentSemester(sem);
                  const ex = getStudentDecree151Grades(student.id, currentSubject, sem);
                  setWeeklyGrades(ex.weeklyGrades || {});
                  setMonthTest1(ex.monthTest1 ?? 14);
                  setMonthTest2(ex.monthTest2 ?? 15);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
              >
                <option value="first">الفصل الدراسي الأول</option>
                <option value="second">الفصل الدراسي الثاني</option>
              </select>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFillExcellent}
              type="button"
              className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-1 transition text-xs"
              title="ملء تلقائي بتقديرات نموذجية كاملة"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>تعبئة نموذجية (كاملة)</span>
            </button>
            <button
              onClick={handleResetZero}
              type="button"
              className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1 transition text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير</span>
            </button>
          </div>
        </div>

        {/* Live KPI Cards according to Decree 151 */}
        <div className="p-4 sm:p-6 bg-blue-900/5 border-b border-blue-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="block text-[10px] text-slate-500 font-bold mb-0.5">متوسط كراس الواجب</span>
            <span className="text-base font-extrabold text-blue-700">{liveTotals.homeworkAvg}</span>
            <span className="text-[10px] text-slate-400 mr-1">/ 5</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="block text-[10px] text-slate-500 font-bold mb-0.5">متوسط كراسة الحصة</span>
            <span className="text-base font-extrabold text-indigo-700">{liveTotals.classworkAvg}</span>
            <span className="text-[10px] text-slate-400 mr-1">/ 5</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="block text-[10px] text-slate-500 font-bold mb-0.5">متوسط التقييم الأسبوعي</span>
            <span className="text-base font-extrabold text-emerald-700">{liveTotals.weeklyAssessmentAvg}</span>
            <span className="text-[10px] text-slate-400 mr-1">/ 10</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="block text-[10px] text-slate-500 font-bold mb-0.5">متوسط المواظبة والسلوك</span>
            <span className="text-base font-extrabold text-amber-700">{liveTotals.behaviorAvg}</span>
            <span className="text-[10px] text-slate-400 mr-1">/ 5</span>
          </div>

          <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 shadow-xs">
            <span className="block text-[10px] text-blue-800 font-bold mb-0.5">أعمال الفصل (المتوسط)</span>
            <span className="text-base font-extrabold text-blue-900">{liveTotals.semesterActivitiesAvg}</span>
            <span className="text-[10px] text-blue-500 mr-1">/ 25</span>
          </div>

          <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 shadow-xs">
            <span className="block text-[10px] text-amber-800 font-bold mb-0.5">متوسط اختباري الشهر</span>
            <span className="text-base font-extrabold text-amber-900">{liveTotals.testsAvg}</span>
            <span className="text-[10px] text-amber-500 mr-1">/ 15</span>
          </div>

          <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md border border-emerald-700 col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="block text-[10px] text-emerald-100 font-bold mb-0.5">المجموع النهائي</span>
            <span className="text-lg font-black text-white">{liveTotals.finalTotal}</span>
            <span className="text-[10px] text-emerald-200 mr-1">/ 40</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Monthly Tests Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>اختبارات الشهور (15 درجة لكل اختبار - يحسب المتوسط):</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-xs text-slate-700">الاختبار الأول:</span>
                  <span className="text-[11px] text-slate-500">الدرجة العظمى (15)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={15}
                    step={0.5}
                    value={monthTest1}
                    onChange={(e) => setMonthTest1(Number(e.target.value))}
                    className="w-20 text-center font-extrabold text-sm border-2 border-slate-300 rounded-lg py-1.5 focus:border-blue-600 focus:outline-hidden"
                  />
                  <span className="font-bold text-slate-400 text-xs">/ 15</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-xs text-slate-700">الاختبار الثاني:</span>
                  <span className="text-[11px] text-slate-500">الدرجة العظمى (15)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={15}
                    step={0.5}
                    value={monthTest2}
                    onChange={(e) => setMonthTest2(Number(e.target.value))}
                    className="w-20 text-center font-extrabold text-sm border-2 border-slate-300 rounded-lg py-1.5 focus:border-blue-600 focus:outline-hidden"
                  />
                  <span className="font-bold text-slate-400 text-xs">/ 15</span>
                </div>
              </div>
            </div>
          </div>

          {/* 17 Weeks Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>التقييمات الأسبوعية المفصلة (17 أسبوعاً وفق المواعيد الرسمية):</span>
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                كراس الواجب (5) | كراسة الحصة (5) | التقييم الأسبوعي (10) | السلوك والمواظبة (5)
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-[380px]">
                <table className="w-full text-center text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-2.5 border-l border-slate-200 w-12">الأسبوع</th>
                      <th className="p-2.5 border-l border-slate-200 min-w-[90px]">التاريخ</th>
                      <th className="p-2.5 border-l border-slate-200 text-blue-700 bg-blue-50/50 min-w-[100px]">
                        كراس الواجب (5)
                      </th>
                      <th className="p-2.5 border-l border-slate-200 text-indigo-700 bg-indigo-50/50 min-w-[100px]">
                        كراسة الحصة (5)
                      </th>
                      <th className="p-2.5 border-l border-slate-200 text-emerald-700 bg-emerald-50/50 min-w-[110px]">
                        التقييم الأسبوعي (10)
                      </th>
                      <th className="p-2.5 text-amber-700 bg-amber-50/50 min-w-[100px]">
                        المواظبة والسلوك (5)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {DECREE_151_WEEKS.map((w) => {
                      const record = weeklyGrades[w.number] || {};
                      return (
                        <tr key={w.number} className="hover:bg-slate-50/80 transition">
                          <td className="p-2 font-extrabold text-slate-600 bg-slate-50/50 border-l border-slate-200">
                            {w.number}
                          </td>
                          <td className="p-2 font-mono text-[11px] text-slate-500 border-l border-slate-200">
                            {w.dateStr}
                          </td>
                          {/* Homework (5) */}
                          <td className="p-1.5 border-l border-slate-200 bg-blue-50/20">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              step={0.5}
                              value={record.homework ?? ''}
                              placeholder="5"
                              onChange={(e) => handleWeekGradeChange(w.number, 'homework', e.target.value)}
                              className="w-16 text-center font-bold text-xs py-1 border border-slate-300 rounded-md focus:border-blue-600 focus:bg-white focus:outline-hidden"
                            />
                          </td>
                          {/* Classwork (5) */}
                          <td className="p-1.5 border-l border-slate-200 bg-indigo-50/20">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              step={0.5}
                              value={record.classwork ?? ''}
                              placeholder="5"
                              onChange={(e) => handleWeekGradeChange(w.number, 'classwork', e.target.value)}
                              className="w-16 text-center font-bold text-xs py-1 border border-slate-300 rounded-md focus:border-indigo-600 focus:bg-white focus:outline-hidden"
                            />
                          </td>
                          {/* Weekly Assessment (10) */}
                          <td className="p-1.5 border-l border-slate-200 bg-emerald-50/20">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={record.weeklyAssessment ?? ''}
                              placeholder="10"
                              onChange={(e) => handleWeekGradeChange(w.number, 'weeklyAssessment', e.target.value)}
                              className="w-16 text-center font-bold text-xs py-1 border border-slate-300 rounded-md focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                            />
                          </td>
                          {/* Behavior (5) */}
                          <td className="p-1.5 bg-amber-50/20">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              step={0.5}
                              value={record.behavior ?? ''}
                              placeholder="5"
                              onChange={(e) => handleWeekGradeChange(w.number, 'behavior', e.target.value)}
                              className="w-16 text-center font-bold text-xs py-1 border border-slate-300 rounded-md focus:border-amber-600 focus:bg-white focus:outline-hidden"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-semibold">
            المجموع النهائي الحالي: <span className="font-extrabold text-emerald-700 text-sm">{liveTotals.finalTotal} / 40</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ ورصد درجات الطالب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
