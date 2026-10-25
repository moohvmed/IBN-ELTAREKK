import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserAccount, UserRole } from '../types/auth';
import { auth, db, firebaseConfigured, googleProvider } from '../lib/firebase';

interface LoginFormProps {
  onLoginSuccess: (user: UserAccount) => void;
  onOpenForgotPassword: (email: string) => void;
  onOpenRegistration: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onOpenForgotPassword,
  onOpenRegistration,
}) => {
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProfile = async (uid: string): Promise<UserAccount> => {
    const profileSnapshot = await getDoc(doc(db, 'users', uid));
    if (!profileSnapshot.exists()) {
      throw new Error('الحساب غير مفعّل في المركز. تواصل مع الإدارة.');
    }

    const profile = profileSnapshot.data() as Partial<UserAccount>;
    if (!profile.role || !['student', 'parent', 'tutor'].includes(profile.role)) {
      throw new Error('بيانات الحساب غير مكتملة. تواصل مع إدارة المركز.');
    }

    return {
      id: uid,
      name: profile.name || auth.currentUser?.displayName || 'مستخدم',
      email: profile.email || auth.currentUser?.email || '',
      role: profile.role,
      avatar: profile.avatar || auth.currentUser?.photoURL || '',
      specializationOrGrade: profile.specializationOrGrade || '',
      phone: profile.phone || undefined,
      linkedParentPhone: profile.linkedParentPhone || undefined,
      linkedParentName: profile.linkedParentName || undefined,
      linkedStudentPhone: profile.linkedStudentPhone || undefined,
      linkedStudentName: profile.linkedStudentName || undefined,
      linkedStudentId: profile.linkedStudentId || undefined,
      loginMethod: 'email',
    };
  };

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!firebaseConfigured) {
      setErrorMessage('أعدّ إعدادات Firebase قبل تسجيل الدخول.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMessage('أدخل البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const profile = await loadProfile(result.user.uid);
      if (profile.role !== role) {
        throw new Error('نوع الحساب المختار لا يطابق صلاحيات الحساب.');
      }
      onLoginSuccess(profile);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      const message =
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
          : error instanceof Error
            ? error.message
            : 'تعذر تسجيل الدخول. حاول مرة أخرى.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    if (!firebaseConfigured) {
      setErrorMessage('أعدّ إعدادات Firebase قبل تسجيل الدخول.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await loadProfile(result.user.uid);
      if (profile.role !== 'tutor') {
        throw new Error('هذا الحساب غير مسجل كمعلم في المركز.');
      }
      onLoginSuccess({
        ...profile,
        loginMethod: 'gmail',
        googleEmail: result.user.email || undefined,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'تعذر تسجيل الدخول بحساب Google.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { value: UserRole; label: string; icon: typeof GraduationCap }[] = [
    { value: 'student', label: 'طالب', icon: GraduationCap },
    { value: 'parent', label: 'ولي أمر', icon: Users },
    { value: 'tutor', label: 'معلم', icon: ShieldCheck },
  ];
  const fieldClass =
    'w-full rounded-xl border border-slate-700 bg-[#08182B] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20';

  return (
    <div className="w-full" dir="rtl">
      <div className="mb-5">
        <label className="mb-2 block text-xs font-semibold text-slate-400">
          نوع الحساب
        </label>
        <div className="grid grid-cols-3 gap-2">
          {roles.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setRole(value);
                setErrorMessage('');
              }}
              aria-pressed={role === value}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition ${
                role === value
                  ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-200'
                  : 'border-slate-700 bg-[#061426] text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {role === 'tutor' ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-300">
            دخول المعلمين متاح لحساب Google المرتبط بملف معلم معتمد في المركز.
          </p>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'جارٍ تسجيل الدخول…' : 'المتابعة باستخدام Google'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-xs font-semibold text-slate-300"
            >
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="login-email"
                className={`${fieldClass} pr-10`}
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-xs font-semibold text-slate-300"
              >
                كلمة المرور
              </label>
              <button
                type="button"
                onClick={() => onOpenForgotPassword(email.trim())}
                className="text-xs text-emerald-300 transition hover:text-emerald-200"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="login-password"
                className={`${fieldClass} px-10`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      )}

      {role !== 'tutor' && (
        <p className="mt-5 text-center text-xs text-slate-400">
          لا تملك حسابًا بعد؟{' '}
          <button
            type="button"
            onClick={onOpenRegistration}
            className="font-semibold text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
          >
            أرسل طلب تسجيل
          </button>
        </p>
      )}
    </div>
  );
};
