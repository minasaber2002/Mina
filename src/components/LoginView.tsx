import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BarChart3,
  Clock,
  Users,
  Crown,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { users, login, switchUser } = useSchool();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('يرجى كتابة البريد الإلكتروني وكلمة المرور');
      return;
    }

    const success = login(email, password);
    if (!success) {
      setError('بيانات الدخول غير صحيحة. كلمة المرور للمشرف العام: super, وللمدير: admin, وللمعلمين: 123');
    }
  };

  const superAdmin = users.find((u) => u.role === 'super_admin');
  const directors = users.filter((u) => u.role === 'admin');
  const teachers = users.filter((u) => u.role === 'teacher');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left / Hero Showcase Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden border border-blue-800/40">
          {/* Ambient light glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            {/* Top Brand Tag */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border border-blue-400/30 shrink-0 bg-blue-700">
                <img
                  src="/src/assets/images/school_blue_emblem_1789621822676.jpg"
                  alt="شعار المنصة"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                  الجيل الذكي للإدارة
                </span>
                <h2 className="text-lg font-black text-white">منصة الحضور المدرسية</h2>
              </div>
            </div>

            {/* Visual Graphic Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-xl my-3 group">
              <img
                src="/src/assets/images/school_blue_banner_1789621842459.jpg"
                alt="School Digital Attendance Art"
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                <div className="flex items-center gap-2 text-white text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>تسجيل إلكتروني فوري ورصد ذكي للغياب</span>
                </div>
              </div>
            </div>

            {/* Feature Badges Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 text-sky-300 text-xs font-bold mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>تحضير فوري</span>
                </div>
                <p className="text-[10px] text-slate-300">تحضير الفصل كاملاً بنقرة واحدة</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-bold mb-0.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>رسوم بيانية</span>
                </div>
                <p className="text-[10px] text-slate-300">مؤشرات دقيقة ونسب انضباط حية</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>نظام آمن ومعتمد للمدارس</span>
            <span className="flex items-center gap-1 text-sky-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> جاهز للعمل
            </span>
          </div>
        </div>

        {/* Right / Login & Demo Selection Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-2">
                <GraduationCap className="w-4 h-4" />
                <span>تسجيل الدخول للمنظومة</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                مرحباً بك في بوابة الحضور
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                اختر حسابك للتجربة السريعة أو أدخل بيانات الدخول الخاصة بك
              </p>
            </div>

            {/* Quick Demo Access Buttons */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>دخول تجريبي مباشر بدون كتابة كلمة مرور:</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  جاهز للنقر
                </span>
              </div>

              <div className="space-y-2.5">
                {superAdmin && (
                  <button
                    type="button"
                    onClick={() => switchUser(superAdmin)}
                    className="w-full text-right p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-amber-400/30 hover:border-amber-400 flex items-center justify-between transition-all group shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-black">
                        <Crown className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>{superAdmin.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                            Super Admin
                          </span>
                        </div>
                        <div className="text-[11px] text-blue-200 font-medium">المشرف العام (أعلى سلطة - تحكم في المديرين والداش بورد الأكبر)</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-300 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                      دخول المشرف <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </button>
                )}

                {directors[0] && (
                  <button
                    type="button"
                    onClick={() => switchUser(directors[0])}
                    className="w-full text-right p-3 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 flex items-center justify-between transition-all group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">{directors[0].name}</div>
                        <div className="text-[11px] text-indigo-700 font-medium">{directors[0].title || 'مدير المدرسة'} (إشراف ميداني وتقارير)</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                      دخول المدير <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </button>
                )}

                {teachers.slice(0, 1).map((teacher) => (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => switchUser(teacher)}
                    className="w-full text-right p-3 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition-all group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">{teacher.name}</div>
                        <div className="text-[11px] text-blue-700 font-medium">معلم مادة {teacher.subject} (فصوله وطلابه فقط)</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                      دخول المعلم <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[11px] text-slate-400">
                <span className="bg-white px-3 font-semibold">أو تسجيل الدخول اليدوي</span>
              </div>
            </div>

            {/* Manual Form */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@school.edu"
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>تسجيل الدخول للنظام</span>
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-4">
            نظام متكامل لتسجيل الحضور اليومي، المتابعة المدرسية، والتقارير الرسومية
          </p>
        </div>
      </div>
    </div>
  );
};
