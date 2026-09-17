import React, { useState, useEffect } from 'react';
import { User, ClassRoom, DirectorPrivileges } from '../../types';
import { X, ShieldCheck, Save, AlertCircle, Phone, Mail, Lock, UserCheck } from 'lucide-react';

interface DirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (directorData: Omit<User, 'id' | 'createdAt' | 'role'>) => void;
  classes: ClassRoom[];
  initialDirector?: User | null;
}

export const DirectorModal: React.FC<DirectorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  initialDirector,
}) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('مدير المدرسة');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('admin');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [privileges, setPrivileges] = useState<DirectorPrivileges>({
    canManageTeachers: true,
    canManageClasses: true,
    canEditOldAttendance: true,
    canExportReports: true,
    canSendGuardianAlerts: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialDirector) {
      setName(initialDirector.name);
      setTitle(initialDirector.title || 'مدير المدرسة');
      setEmail(initialDirector.email);
      setPassword(initialDirector.password || 'admin');
      setPhone(initialDirector.phone || '');
      setStatus(initialDirector.status || 'active');
      setAssignedClassIds(initialDirector.assignedClassIds || classes.map((c) => c.id));
      if (initialDirector.privileges) {
        setPrivileges(initialDirector.privileges);
      }
    } else {
      setName('');
      setTitle('مدير المدرسة');
      setEmail('');
      setPassword('admin');
      setPhone('');
      setStatus('active');
      setAssignedClassIds(classes.map((c) => c.id));
      setPrivileges({
        canManageTeachers: true,
        canManageClasses: true,
        canEditOldAttendance: true,
        canExportReports: true,
        canSendGuardianAlerts: true,
      });
    }
    setError('');
  }, [initialDirector, isOpen, classes]);

  if (!isOpen) return null;

  const handleTogglePrivilege = (key: keyof DirectorPrivileges) => {
    setPrivileges((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAllClasses = () => {
    if (assignedClassIds.length === classes.length) {
      setAssignedClassIds([]);
    } else {
      setAssignedClassIds(classes.map((c) => c.id));
    }
  };

  const handleToggleClass = (classId: string) => {
    setAssignedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم المدير كاملاً');
      return;
    }
    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني الخاص بالمدير');
      return;
    }

    onSave({
      name: name.trim(),
      title: title.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim() || 'admin',
      phone: phone.trim(),
      status,
      assignedClassIds,
      privileges,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {initialDirector ? 'تعديل بيانات وصلاحيات المدير' : 'تعيين مدير مدرسة / وكيل جديد'}
              </h2>
              <p className="text-xs text-blue-200">
                الإدارة العليا (Super Admin) - التحكم في القيادات المدرسية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم المدير / المسؤول <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أ/ مصطفى كمال"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المسمى والمنصب الوظيفي <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مدير المدرسة للمرحلة الثانوية"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني للدخول <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@school.edu"
                  className="w-full px-3 py-2 pl-8 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white font-mono"
                  required
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3 py-2 pl-8 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white font-mono"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3 py-2 pl-8 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white font-mono"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حالة الحساب</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white font-bold"
              >
                <option value="active">نشط ومفعل (صلاحيات سارية)</option>
                <option value="suspended">معلق مؤقتاً (إيقاف الوصول)</option>
              </select>
            </div>
          </div>

          {/* Privileges Matrix (Super Admin Power) */}
          <div className="border border-indigo-100 bg-indigo-50/40 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>مصفوفة الصلاحيات الممنوحة للمدير من المشرف العام:</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                تحكم كامل
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={privileges.canManageTeachers}
                  onChange={() => handleTogglePrivilege('canManageTeachers')}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800 font-semibold">إدارة وتعيين المعلمين</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={privileges.canManageClasses}
                  onChange={() => handleTogglePrivilege('canManageClasses')}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800 font-semibold">إنشاء وتعديل الفصول</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={privileges.canEditOldAttendance}
                  onChange={() => handleTogglePrivilege('canEditOldAttendance')}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800 font-semibold">تعديل كشوفات سابقة</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={privileges.canExportReports}
                  onChange={() => handleTogglePrivilege('canExportReports')}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800 font-semibold">تصدير وطباعة التقارير</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={privileges.canSendGuardianAlerts}
                  onChange={() => handleTogglePrivilege('canSendGuardianAlerts')}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-slate-800 font-semibold">إرسال إنذارات الغياب لأولياء الأمور</span>
              </label>
            </div>
          </div>

          {/* Assigned Classes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                نطاق الإشراف الأكاديمي (الفصول المخصصة):
              </label>
              <button
                type="button"
                onClick={handleSelectAllClasses}
                className="text-xs text-blue-700 font-bold hover:underline"
              >
                {assignedClassIds.length === classes.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الفصول'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
              {classes.map((cls) => {
                const isSelected = assignedClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleToggleClass(cls.id)}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between text-xs ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 font-bold text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cls.name}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>{initialDirector ? 'حفظ تعديلات المدير' : 'اعتماد تعيين المدير'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
