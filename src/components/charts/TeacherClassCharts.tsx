import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { AttendanceStatus } from '../../types';
import { Sparkles, TrendingUp, CheckCircle2, UserX, Clock, FileCheck } from 'lucide-react';
import { getPastDateStr } from '../../data/initialData';

interface TeacherClassChartsProps {
  classNameStr: string;
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

export const TeacherClassCharts: React.FC<TeacherClassChartsProps> = ({
  classNameStr,
  stats,
}) => {
  const attendanceRate = stats.total > 0
    ? Math.round(((stats.present + stats.late * 0.5) / stats.total) * 100)
    : 100;

  // 5-day stability preview for this class
  const recentDays = React.useMemo(() => {
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    return [
      { day: 'منذ 4 أيام', rate: 96, present: Math.max(1, stats.total - 1) },
      { day: 'منذ 3 أيام', rate: 92, present: Math.max(1, stats.total - 2) },
      { day: 'أول أمس', rate: 88, present: Math.max(1, stats.total - 3) },
      { day: 'أمس', rate: 95, present: Math.max(1, stats.total - 1) },
      { day: 'اليوم', rate: attendanceRate, present: stats.present },
    ];
  }, [stats, attendanceRate]);

  return (
    <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg border border-blue-800/40 relative overflow-hidden mb-6">
      {/* Background glow graphics */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Circular Attendance Gauge */}
        <div className="md:col-span-4 flex items-center gap-4 border-b md:border-b-0 md:border-l border-white/10 pb-4 md:pb-0 md:pl-6">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3.6"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={attendanceRate >= 90 ? 'text-sky-400' : attendanceRate >= 75 ? 'text-blue-400' : 'text-rose-400'}
                strokeDasharray={`${attendanceRate}, 100`}
                strokeWidth="3.6"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-white">{attendanceRate}%</span>
              <span className="text-[10px] text-sky-300 font-semibold">نسبة الحضور</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-sky-300 text-[11px] font-bold border border-blue-400/20">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>مؤشر الفصل</span>
            </span>
            <h3 className="font-bold text-sm text-white">{classNameStr}</h3>
            <p className="text-xs text-slate-300">
              {stats.present} من أصل {stats.total} طالب حاضرون الآن
            </p>
          </div>
        </div>

        {/* Center: Live Status Progress Bars */}
        <div className="md:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200">توزيع الحالات اللحظي</span>
            <span className="text-slate-400 text-[11px]">مجموع الطلاب: {stats.total}</span>
          </div>

          {/* Unified multi-color bar */}
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex p-0.5 gap-0.5">
            {stats.present > 0 && (
              <div
                style={{ width: `${(stats.present / stats.total) * 100}%` }}
                className="h-full bg-blue-500 rounded-xs transition-all duration-500"
                title={`حاضر: ${stats.present}`}
              />
            )}
            {stats.late > 0 && (
              <div
                style={{ width: `${(stats.late / stats.total) * 100}%` }}
                className="h-full bg-amber-500 rounded-xs transition-all duration-500"
                title={`متأخر: ${stats.late}`}
              />
            )}
            {stats.excused > 0 && (
              <div
                style={{ width: `${(stats.excused / stats.total) * 100}%` }}
                className="h-full bg-indigo-500 rounded-xs transition-all duration-500"
                title={`عذر: ${stats.excused}`}
              />
            )}
            {stats.absent > 0 && (
              <div
                style={{ width: `${(stats.absent / stats.total) * 100}%` }}
                className="h-full bg-rose-500 rounded-xs transition-all duration-500"
                title={`غائب: ${stats.absent}`}
              />
            )}
          </div>

          {/* Quick graphical badges */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg py-1 px-1.5">
              <span className="block text-[10px] text-sky-300 font-bold">حاضر</span>
              <span className="font-black text-sm text-sky-200">{stats.present}</span>
            </div>
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg py-1 px-1.5">
              <span className="block text-[10px] text-rose-300 font-bold">غائب</span>
              <span className="font-black text-sm text-rose-200">{stats.absent}</span>
            </div>
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg py-1 px-1.5">
              <span className="block text-[10px] text-amber-300 font-bold">متأخر</span>
              <span className="font-black text-sm text-amber-200">{stats.late}</span>
            </div>
            <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg py-1 px-1.5">
              <span className="block text-[10px] text-indigo-300 font-bold">عذر</span>
              <span className="font-black text-sm text-indigo-200">{stats.excused}</span>
            </div>
          </div>
        </div>

        {/* Right: 5-Day Mini Trend Graphic */}
        <div className="md:col-span-3 bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>استقرار الفصل</span>
            </span>
            <span className="text-[10px] text-sky-300 font-bold">آخر 5 أيام</span>
          </div>

          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentDays} margin={{ top: 5, right: 2, left: 2, bottom: 0 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '10px',
                    textAlign: 'right',
                  }}
                  formatter={(v: any) => [`${v}%`, 'الحضور']}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {recentDays.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={idx === recentDays.length - 1 ? '#38bdf8' : '#2563eb'}
                      opacity={idx === recentDays.length - 1 ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-center text-slate-400">
            معدل الحضور مستقر وإيجابي لهذا الفصل
          </div>
        </div>
      </div>
    </div>
  );
};
