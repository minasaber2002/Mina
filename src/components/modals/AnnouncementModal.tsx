import React, { useState, useEffect } from 'react';
import { SystemAnnouncement } from '../../types';
import { X, Bell, Save, AlertCircle } from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<SystemAnnouncement, 'id' | 'createdAt' | 'authorName'>) => void;
  initialAnnouncement?: SystemAnnouncement | null;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAnnouncement,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<SystemAnnouncement['priority']>('important');
  const [targetAudience, setTargetAudience] = useState<SystemAnnouncement['targetAudience']>('all');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialAnnouncement) {
      setTitle(initialAnnouncement.title);
      setContent(initialAnnouncement.content);
      setPriority(initialAnnouncement.priority);
      setTargetAudience(initialAnnouncement.targetAudience);
      setActive(initialAnnouncement.active);
    } else {
      setTitle('');
      setContent('');
      setPriority('important');
      setTargetAudience('all');
      setActive(true);
    }
    setError('');
  }, [initialAnnouncement, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى إدخال عنوان التعميم الإداري');
      return;
    }
    if (!content.trim()) {
      setError('يرجى كتابة نص وتفاصيل التعميم');
      return;
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      priority,
      targetAudience,
      active,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {initialAnnouncement ? 'تعديل التعميم الإداري' : 'إصدار تعميم إداري أو توجيه عام'}
              </h2>
              <p className="text-xs text-blue-200">
                يظهر في واجهات مديري المدارس وهيئة التدريس فوراً
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان التعميم / القرار <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تعليمات بشأن قفل كشوفات الغياب الصباحية"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">درجة الأهمية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white font-bold"
              >
                <option value="urgent">عاجل ومهم جداً (تنبيه أحمر)</option>
                <option value="important">هام وتنظيمي (تنبيه أزرق)</option>
                <option value="normal">إعلان إداري عام (تنبيه عادي)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الفئة المستهدفة</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white font-bold"
              >
                <option value="all">كافة منسوبي المدرسة (مديرون ومعلمون)</option>
                <option value="directors">مديرو المدارس والوكلاء فقط</option>
                <option value="teachers">هيئة التدريس والمعلمون فقط</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نص وتفاصيل التعميم <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب التوجيه الإداري بصيغة رسمية واضحة..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden bg-slate-50 focus:bg-white"
              required
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="active-ann"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="active-ann" className="text-xs font-bold text-slate-800 cursor-pointer">
              تفعيل ونشر التعميم فوراً (يظهر كشريط علوي للمستهدفين)
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
              <span>اعتماد ونشر التعميم</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
