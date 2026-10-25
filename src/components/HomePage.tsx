import React, { useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  Compass,
  GraduationCap,
  Globe2,
  LogIn,
  Menu,
  UserPlus,
  X,
} from 'lucide-react';
import { CompassRose } from './CompassRose';
import { TopographicBackground } from './TopographicBackground';

interface HomePageProps {
  onOpenPortal: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

const subjects = [
  {
    title: 'التاريخ',
    description: 'مواد التاريخ ومراجعتها ضمن المحتوى الذي يضيفه المركز.',
    icon: BookOpen,
    color: 'blue',
  },
  {
    title: 'الجغرافيا',
    description: 'مواد الجغرافيا والخرائط ضمن المحتوى الذي يضيفه المركز.',
    icon: Globe2,
    color: 'emerald',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  onOpenPortal,
  onOpenAuth,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#061224] font-sans text-slate-100"
      dir="rtl"
    >
      <TopographicBackground />

      <header className="relative z-20 border-b border-slate-800/80 bg-[#061224]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
          <a href="#home" className="flex min-w-0 items-center gap-3">
            <CompassRose size={38} interactive={false} />
            <span className="truncate text-sm font-black text-white sm:text-lg">
              سنتر ابن الطارق
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#subjects" className="transition hover:text-emerald-300">
              المواد
            </a>
            <a href="#registration" className="transition hover:text-emerald-300">
              التسجيل
            </a>
            <button
              type="button"
              onClick={onOpenPortal}
              className="transition hover:text-emerald-300"
            >
              بوابة الطالب
            </button>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
            >
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-200 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <nav className="space-y-1 border-t border-slate-800 px-4 py-3 md:hidden">
            <a
              href="#subjects"
              onClick={closeMenu}
              className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              المواد
            </a>
            <a
              href="#registration"
              onClick={closeMenu}
              className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              التسجيل
            </a>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onOpenPortal();
              }}
              className="block w-full rounded-lg px-3 py-2 text-right text-sm text-slate-200 hover:bg-white/5"
            >
              بوابة الطالب
            </button>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onOpenAuth('login');
              }}
              className="block w-full rounded-lg px-3 py-2 text-right text-sm text-emerald-300 hover:bg-white/5"
            >
              تسجيل الدخول
            </button>
          </nav>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 sm:py-20">
        <section id="home" className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <Compass className="h-4 w-4" />
              التاريخ والجغرافيا
            </div>
            <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">
              سنتر ابن الطارق
              <span className="mt-2 block text-emerald-300">
                بوابة الطلاب والمحتوى الدراسي
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              سجّل الدخول لمتابعة بياناتك، أو أرسل طلب تسجيل جديد. المواد المنشورة
              تظهر داخل البوابة بعد إضافتها من إدارة المركز.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                <UserPlus className="h-4 w-4" />
                تقديم طلب تسجيل
              </button>
              <button
                type="button"
                onClick={onOpenPortal}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#0A1F36] px-5 text-sm font-bold text-slate-100 transition hover:border-emerald-500/50"
              >
                <LogIn className="h-4 w-4" />
                دخول الطلاب
              </button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="flex h-64 w-64 items-center justify-center rounded-full border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-blue-950/30 sm:h-80 sm:w-80">
              <CompassRose size={176} interactive={false} />
            </div>
          </div>
        </section>

        <section id="subjects" className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              المواد
            </h2>
            <p className="text-sm leading-6 text-slate-300">
              يعرض هذا الموقع بوابة الحساب والمحتوى الذي تنشره إدارة المركز.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map(({ title, description, icon: Icon, color }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-800 bg-[#091B2F]/90 p-6"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${
                    color === 'blue'
                      ? 'border-blue-500/30 bg-blue-950/50 text-blue-300'
                      : 'border-emerald-500/30 bg-emerald-950/50 text-emerald-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="registration"
          className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-emerald-800/50 bg-[#091B2F]/90 p-6 sm:flex-row sm:items-center sm:p-8"
        >
          <div>
            <div className="flex items-center gap-2 text-emerald-300">
              <GraduationCap className="h-5 w-5" />
              <h2 className="text-lg font-bold text-white">طلب تسجيل</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              الطلب يُرسل إلى إدارة المركز للمراجعة. تقديم الطلب لا ينشئ حسابًا
              ولا يؤكد حجز مقعد.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAuth('register')}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            ابدأ التسجيل
            <ChevronLeft className="h-4 w-4" />
          </button>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-800 bg-[#061224]/90 py-5 text-center text-xs text-slate-400">
        سنتر ابن الطارق · التاريخ والجغرافيا
      </footer>
    </div>
  );
};
