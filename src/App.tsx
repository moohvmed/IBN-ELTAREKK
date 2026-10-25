import React, { Suspense, lazy, useState } from 'react';
import { ArrowRight, Home, LogIn } from 'lucide-react';
import { TopographicBackground } from './components/TopographicBackground';
import type { UserAccount } from './types/auth';

const AuthModalForgotPassword = lazy(() =>
  import('./components/AuthModalForgotPassword').then((module) => ({
    default: module.AuthModalForgotPassword,
  })),
);
const CenterDashboard = lazy(() =>
  import('./components/CenterDashboard').then((module) => ({
    default: module.CenterDashboard,
  })),
);
const HomePage = lazy(() =>
  import('./components/HomePage').then((module) => ({
    default: module.HomePage,
  })),
);
const LoginForm = lazy(() =>
  import('./components/LoginForm').then((module) => ({
    default: module.LoginForm,
  })),
);
const RegistrationForm = lazy(() =>
  import('./components/RegistrationForm').then((module) => ({
    default: module.RegistrationForm,
  })),
);

type View = 'home' | 'auth' | 'portal';
type AuthMode = 'login' | 'register';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const openAuth = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setView('auth');
  };

  const handleLogout = async () => {
    const [{ auth, firebaseConfigured }, { signOut }] = await Promise.all([
      import('./lib/firebase'),
      import('firebase/auth'),
    ]);
    if (firebaseConfigured) await signOut(auth);
    setCurrentUser(null);
    setAuthMode('login');
    setView('auth');
  };

  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="flex min-h-screen items-center justify-center bg-[#061224] text-sm text-slate-300"
          dir="rtl"
        >
          جارٍ التحميل…
        </div>
      }
    >
      {view === 'home' ? (
        <HomePage
          onOpenPortal={() =>
            currentUser ? setView('portal') : openAuth('login')
          }
          onOpenAuth={openAuth}
        />
      ) : view === 'portal' && currentUser ? (
        <CenterDashboard
          user={currentUser}
          onLogout={handleLogout}
          onNavigateToHome={() => setView('home')}
        />
      ) : (
        <div
          className="relative min-h-screen overflow-x-hidden bg-[#061224] font-sans text-slate-100"
          dir="rtl"
        >
          <TopographicBackground />

          <header className="relative z-10 border-b border-slate-800/80 bg-[#061224]/90">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
              <span className="text-sm font-black text-white sm:text-lg">
                سنتر ابن الطارق
              </span>
              <button
                type="button"
                onClick={() => setView('home')}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-200 transition hover:border-emerald-500/50"
              >
                <Home className="h-4 w-4" />
                الرئيسية
              </button>
            </div>
          </header>

          <main className="relative z-10 mx-auto grid min-h-[calc(100vh-9rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
            <section className="max-w-xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                <LogIn className="h-4 w-4" />
                بوابة الحسابات
              </div>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">
                {authMode === 'register' ? 'طلب تسجيل جديد' : 'تسجيل الدخول'}
              </h1>
              <p className="text-sm leading-7 text-slate-300">
                {authMode === 'register'
                  ? 'أرسل بيانات الطالب إلى إدارة المركز للمراجعة. الطلب لا ينشئ حسابًا تلقائيًا.'
                  : 'استخدم بيانات حسابك المعتمدة للوصول إلى لوحة الطالب أو المعلم.'}
              </p>
              <button
                type="button"
                onClick={() => setView('home')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
              >
                العودة إلى الصفحة الرئيسية
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>

            <section
              id="auth-card"
              className="rounded-2xl border border-slate-800 bg-[#091B2F]/95 p-5 shadow-2xl sm:p-8"
            >
              {authMode === 'register' ? (
                <RegistrationForm
                  onBackToLogin={() => setAuthMode('login')}
                  onSuccessRegistration={() => setAuthMode('login')}
                />
              ) : (
                <LoginForm
                  onLoginSuccess={(user) => {
                    setCurrentUser(user);
                    setView('portal');
                  }}
                  onOpenForgotPassword={(email) => {
                    setForgotPasswordEmail(email);
                    setForgotPasswordOpen(true);
                  }}
                  onOpenRegistration={() => setAuthMode('register')}
                />
              )}
            </section>
          </main>

          <footer className="relative z-10 border-t border-slate-800 bg-[#061224]/90 py-4 text-center text-xs text-slate-400">
            سنتر ابن الطارق · التاريخ والجغرافيا
          </footer>

          {forgotPasswordOpen && (
            <AuthModalForgotPassword
              isOpen
              initialEmail={forgotPasswordEmail}
              onClose={() => setForgotPasswordOpen(false)}
            />
          )}
        </div>
      )}
    </Suspense>
  );
}
