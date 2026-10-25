import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, firebaseConfigured } from '../lib/firebase';
import { Mail, CheckCircle2, ArrowLeft, X } from 'lucide-react';

interface AuthModalForgotPasswordProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const AuthModalForgotPassword: React.FC<AuthModalForgotPasswordProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (!firebaseConfigured) throw new Error('إعداد Firebase غير مكتمل بعد.');
      await sendPasswordResetEmail(auth, email.trim());
      setIsSent(true);
    } catch (error) {
      setErrorMessage('تعذر إرسال رسالة الاستعادة. تأكد من إعداد Firebase والبريد ثم حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSent(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0f1b2b] border border-slate-700/60 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-modal-title"
      >
        {/* Soft background glow */}
        <div className="absolute top-0 left-0 w-44 h-44 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-44 h-44 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors focus:outline-none"
          aria-label="إغلاق النافذة"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSent ? (
          <div>
            <div className="w-11 h-11 rounded-xl bg-[#13253b] border border-teal-500/20 flex items-center justify-center mb-4 text-teal-300">
              <Mail className="w-5 h-5" />
            </div>

            <h3
              id="forgot-modal-title"
              className="text-lg font-bold text-white mb-2"
            >
              استعادة كلمة المرور
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              أدخل بريدك الإلكتروني المسجل في المركز (طالب، معلم، أو ولي أمر). سنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور فوراً.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  البريد الإلكتروني التعليمي
                </label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#0a1320] border border-slate-700/80 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              {errorMessage && <p role="alert" className="text-xs text-red-300">{errorMessage}</p>}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1b3a36] hover:bg-[#224843] border border-teal-600/40 text-teal-100 text-xs font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جاري التحقق...</span>
                  ) : (
                    <>
                      <span>إرسال رابط الاستعادة</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              تم إرسال التعليمات بنجاح
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              إذا كان البريد مسجلاً، فستصلك رسالة آمنة لإعادة تعيين كلمة المرور إلى{' '}
              <span className="font-semibold text-teal-300 dir-ltr inline-block">{email}</span>.
              تحقق من صندوق الوارد ومجلد الرسائل غير المرغوب فيها.
            </p>
            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 px-4 bg-[#142336] hover:bg-[#1a2f47] text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
