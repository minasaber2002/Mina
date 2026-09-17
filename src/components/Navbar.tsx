import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  GraduationCap, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  RefreshCw, 
  ChevronDown,
  Sparkles,
  BookOpen,
  Crown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, users, switchUser, logout, resetAllData } = useSchool();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md shadow-blue-600/20 border border-blue-500/30 flex items-center justify-center bg-blue-600 shrink-0">
              <img
                src="/src/assets/images/school_blue_emblem_1789621822676.jpg"
                alt="شعار المدرسة"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to icon if image fails
                  e.currentTarget.style.display = 'none';
                }}
              />
              <GraduationCap className="w-6 h-6 text-white absolute pointer-events-none -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-slate-900 tracking-tight">منصة الحضور والغياب</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  المدرسية الذكية
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">نظام المتابعة اليومية للطلبة وهيئة التدريس</p>
            </div>
          </div>

          {/* Right side: User info, Quick switcher, and Actions */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                {/* User Role Badge & Name */}
                <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                  <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm ${
                    currentUser.role === 'super_admin'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentUser.role === 'super_admin' ? (
                      <Crown className="w-4 h-4 text-amber-600" />
                    ) : currentUser.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-blue-700" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        currentUser.role === 'super_admin'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : currentUser.role === 'admin' 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {currentUser.role === 'super_admin' 
                          ? 'المشرف العام' 
                          : currentUser.role === 'admin' 
                          ? 'مدير المدرسة' 
                          : 'معلم'}
                      </span>
                    </div>
                    {currentUser.subject ? (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span>مادة {currentUser.subject}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400">
                        {currentUser.role === 'super_admin' ? 'الإدارة والرقابة العليا' : 'إدارة المدرسة والتقارير'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Account Switcher for Demo */}
                <div className="relative">
                  <button
                    id="quick-switch-dropdown-btn"
                    onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
                    title="التبديل السريع بين الأدمن والمدرسين للاختبار"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">تبديل الحساب (تجريبي)</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showSwitchMenu && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-500">
                        اختر حساباً للمعاينة الفورية:
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {users.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              switchUser(user);
                              setShowSwitchMenu(false);
                            }}
                            className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                              currentUser.id === user.id ? 'bg-blue-50 text-blue-900 font-bold' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                user.role === 'super_admin' 
                                  ? 'bg-amber-500' 
                                  : user.role === 'admin' 
                                  ? 'bg-indigo-500' 
                                  : 'bg-blue-500'
                              }`}></span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {user.role === 'super_admin' && (
                                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded font-black">
                                      سوبر أدمن
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {user.role === 'super_admin' 
                                    ? 'لوحة الإشراف العليا الأكبر' 
                                    : user.role === 'admin' 
                                    ? `${user.title || 'مدير المدرسة'} - لوحة الإدارة` 
                                    : `مادة ${user.subject || 'عام'}`}
                                </div>
                              </div>
                            </div>
                            {currentUser.id === user.id && (
                              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">الحالي</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset Data Button */}
                <button
                  id="reset-demo-data-btn"
                  onClick={() => setShowResetConfirm(true)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="استعادة البيانات الافتراضية"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Logout Button */}
                <button
                  id="logout-btn"
                  onClick={logout}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl text-right">
            <h3 className="font-bold text-slate-900 text-base mb-2">استعادة بيانات النظام الأولية؟</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              سيتم إعادة تعيين المدرسين، الفصول، الطلاب، وسجلات الحضور إلى البيانات النموذجية الأصلية.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg shadow-xs"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
