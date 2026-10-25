import React, { useState } from 'react';
import { ArrowRight, Check, GraduationCap } from 'lucide-react';
import { SUBJECT_DISCIPLINES } from '../data/siteData';

interface RegistrationFormProps {
  onBackToLogin: () => void;
  onSuccessRegistration: (name: string, email: string) => void;
}

const grades = [
  'الصف الثالث الثانوي',
  'الصف الثاني الثانوي',
  'الصف الأول الثانوي',
  'المرحلة الإعدادية',
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onBackToLogin,
  onSuccessRegistration,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [gradeLevel, setGradeLevel] = useState(grades[0]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [learningGoal, setLearningGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !studentPhone.trim()) {
      setErrorMessage('أدخل اسم الطالب ورقم هاتفه.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/registration-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          studentPhone: studentPhone.trim(),
          parentPhone: parentPhone.trim(),
          gradeLevel,
          subjects: selectedSubjects,
          learningGoal: learningGoal.trim(),
        }),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('خدمة التسجيل غير متاحة على هذا العنوان حاليًا.');
      }
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        throw new Error(
          typeof result?.error === 'string'
            ? result.error
            : 'تعذر إرسال الطلب. حاول مرة أخرى لاحقًا.',
        );
      }
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'تعذر إرسال الطلب. حاول مرة أخرى لاحقًا.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-700 bg-[#08182B] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20';
  const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-300';

  return (
    <section className="w-full" dir="rtl">
      <button
        type="button"
        onClick={onBackToLogin}
        className="mb-5 text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
      >
        العودة لتسجيل الدخول
      </button>

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-emerald-300">
          <GraduationCap className="h-5 w-5" />
          <span className="text-xs font-semibold">طلب تسجيل جديد</span>
        </div>
        <h1 className="text-2xl font-black text-white">بيانات الطالب</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          أرسل البيانات إلى إدارة المركز لمراجعتها. لن يُنشأ حساب تلقائيًا.
        </p>
      </div>

      {submitted ? (
        <div
          role="status"
          className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-6"
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="font-bold text-white">تم إرسال طلب التسجيل</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            وصل الطلب إلى إدارة المركز للمراجعة. تقديمه لا ينشئ حسابًا ولا يؤكد
            حجز مقعد.
          </p>
          <button
            type="button"
            onClick={() => onSuccessRegistration(fullName.trim(), email.trim())}
            className="mt-5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-200"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="registration-name">
              اسم الطالب *
            </label>
            <input
              id="registration-name"
              className={fieldClass}
              type="text"
              autoComplete="name"
              maxLength={120}
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="الاسم الكامل"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="registration-student-phone">
                رقم هاتف الطالب *
              </label>
              <input
                id="registration-student-phone"
                className={fieldClass}
                type="tel"
                autoComplete="tel"
                minLength={8}
                maxLength={20}
                required
                value={studentPhone}
                onChange={(event) => setStudentPhone(event.target.value)}
                placeholder="رقم الهاتف"
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="registration-parent-phone">
                رقم هاتف ولي الأمر
              </label>
              <input
                id="registration-parent-phone"
                className={fieldClass}
                type="tel"
                autoComplete="tel"
                maxLength={20}
                value={parentPhone}
                onChange={(event) => setParentPhone(event.target.value)}
                placeholder="اختياري"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="registration-email">
                البريد الإلكتروني
              </label>
              <input
                id="registration-email"
                className={fieldClass}
                type="email"
                autoComplete="email"
                maxLength={160}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="اختياري"
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="registration-grade">
                المرحلة الدراسية *
              </label>
              <select
                id="registration-grade"
                className={fieldClass}
                value={gradeLevel}
                onChange={(event) => setGradeLevel(event.target.value)}
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset>
            <legend className={labelClass}>المواد المطلوبة</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {SUBJECT_DISCIPLINES.map((subject) => {
                const selected = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSubject(subject)}
                    className={`flex min-h-11 items-center justify-between rounded-xl border px-3 text-right text-sm transition ${
                      selected
                        ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-700 bg-[#08182B] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {subject}
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className={labelClass} htmlFor="registration-goal">
              ملاحظة أو هدف دراسي
            </label>
            <textarea
              id="registration-goal"
              className={fieldClass}
              rows={3}
              maxLength={500}
              value={learningGoal}
              onChange={(event) => setLearningGoal(event.target.value)}
              placeholder="اختياري"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'جارٍ إرسال الطلب…' : 'إرسال طلب التسجيل'}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
          <p className="text-xs leading-5 text-slate-400">
            الطلب للمراجعة فقط؛ لا يفعّل حسابًا ولا يضمن توفر مقعد.
          </p>
        </form>
      )}
    </section>
  );
};
