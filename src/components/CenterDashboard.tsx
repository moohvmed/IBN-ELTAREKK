import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  CalendarCheck,
  GraduationCap,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { UserAccount } from '../types/auth';
import { auth } from '../lib/firebase';
import { OnlineContentPortal } from './OnlineContentPortal';

interface GradeRecord {
  id: string;
  studentId: string;
  examTitle: string;
  score: number;
  totalScore: number;
  notes?: string;
  createdAt?: unknown;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  lectureNumber: number;
  date: string;
  status: 'present' | 'late' | 'excused' | 'absent';
  notes?: string;
}

type DashboardTab = 'overview' | 'grades' | 'attendance' | 'content' | 'profile';

interface CenterDashboardProps {
  user: UserAccount;
  onLogout: () => void | Promise<void>;
  onNavigateToHome?: () => void;
}

const readItems = <T,>(payload: unknown): T[] => {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'items' in payload &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: T[] }).items;
  }
  return [];
};

const getErrorMessage = async (response: Response) => {
  const result = await response.json().catch(() => ({}));
  return typeof result.error === 'string'
    ? result.error
    : 'تعذر تحميل بيانات الحساب.';
};

const assertJsonResponse = (response: Response) => {
  if (!(response.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('خدمة بيانات الحساب غير متاحة. تحقق من إعداد الـAPI.');
  }
};

const recordTime = (value: unknown) => {
  if (typeof value === 'string') {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    '_seconds' in value &&
    typeof (value as { _seconds?: unknown })._seconds === 'number'
  ) {
    return (value as { _seconds: number })._seconds * 1000;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds?: unknown }).seconds === 'number'
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }
  return 0;
};

const formatDate = (value: unknown) => {
  const timestamp = recordTime(value);
  return timestamp
    ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(timestamp)
    : '—';
};

const statusLabels: Record<AttendanceRecord['status'], string> = {
  present: 'حاضر',
  late: 'متأخر',
  excused: 'بعذر',
  absent: 'غائب',
};

export const CenterDashboard: React.FC<CenterDashboardProps> = ({
  user,
  onLogout,
  onNavigateToHome,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutErrorMessage, setLogoutErrorMessage] = useState('');

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('انتهت الجلسة. سجّل الدخول مرة أخرى.');
      }
      const token = await currentUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [gradesResponse, attendanceResponse] = await Promise.all([
        fetch('/api/grades', { headers }),
        fetch('/api/attendance', { headers }),
      ]);
      if (!gradesResponse.ok) {
        throw new Error(await getErrorMessage(gradesResponse));
      }
      if (!attendanceResponse.ok) {
        throw new Error(await getErrorMessage(attendanceResponse));
      }
      assertJsonResponse(gradesResponse);
      assertJsonResponse(attendanceResponse);
      const [gradePayload, attendancePayload] = await Promise.all([
        gradesResponse.json(),
        attendanceResponse.json(),
      ]);
      setGrades(readItems<GradeRecord>(gradePayload));
      setAttendance(readItems<AttendanceRecord>(attendancePayload));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'تعذر تحميل بيانات الحساب.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const sortedGrades = useMemo(
    () => [...grades].sort((a, b) => recordTime(b.createdAt) - recordTime(a.createdAt)),
    [grades],
  );

  const attendanceCount = attendance.length;
  const attendedCount = attendance.filter(
    (item) => item.status === 'present' || item.status === 'late',
  ).length;
  const attendanceRate = attendanceCount
    ? Math.round((attendedCount / attendanceCount) * 100)
    : null;
  const averageGrade = grades.length
    ? Math.round(
        grades.reduce(
          (sum, item) => sum + (item.totalScore ? (item.score / item.totalScore) * 100 : 0),
          0,
        ) / grades.length,
      )
    : null;

  const tabs: { id: DashboardTab; label: string }[] = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'grades', label: `الدرجات (${grades.length})` },
    { id: 'attendance', label: `الحضور (${attendance.length})` },
    { id: 'content', label: 'المحتوى' },
    { id: 'profile', label: 'بيانات الحساب' },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutErrorMessage('');
    try {
      await onLogout();
    } catch {
      setLogoutErrorMessage('تعذر تسجيل الخروج. تحقق من الاتصال وحاول مرة أخرى.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const emptyMessage =
    'لا توجد سجلات بعد. ستظهر البيانات هنا بعد إضافتها من إدارة المركز.';

  return (
    <div
      className="min-h-screen bg-[#061224] font-sans text-slate-100"
      dir="rtl"
    >
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#071528]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-bold text-white">سنتر ابن الطارق</p>
            <p className="text-xs text-slate-400">
              {user.role === 'tutor'
                ? 'حساب معلم'
                : user.role === 'parent'
                  ? 'حساب ولي أمر'
                  : 'حساب طالب'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToHome && (
              <button
                type="button"
                onClick={onNavigateToHome}
                className="min-h-10 rounded-xl border border-slate-700 px-3 text-xs text-slate-200 transition hover:border-slate-500"
              >
                الرئيسية
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-xs text-slate-200 transition hover:border-rose-500/50 hover:text-white disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'جارٍ الخروج…' : 'تسجيل الخروج'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-slate-800 bg-[#091B2F] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-300">مرحبًا،</p>
              <h1 className="mt-1 text-2xl font-black text-white">
                {user.name}
              </h1>
              {user.specializationOrGrade && (
                <p className="mt-1 text-sm text-slate-300">
                  {user.specializationOrGrade}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              disabled={isLoading}
              className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-700 px-3 text-xs text-slate-200 transition hover:border-emerald-500/50 disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </button>
          </div>
        </section>

        {logoutErrorMessage && (
          <p
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200"
          >
            {logoutErrorMessage}
          </p>
        )}

        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="أقسام الحساب">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`min-h-10 shrink-0 rounded-xl border px-4 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-200'
                  : 'border-slate-800 bg-[#091B2F] text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {errorMessage && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="inline-flex min-h-9 items-center gap-2 self-start rounded-lg border border-rose-500/30 px-3 text-xs hover:bg-rose-950/40"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              إعادة المحاولة
            </button>
          </div>
        )}

        {activeTab === 'content' ? (
          <OnlineContentPortal userRole={user.role} />
        ) : activeTab === 'profile' ? (
          <section className="grid gap-3 rounded-2xl border border-slate-800 bg-[#091B2F] p-5 sm:grid-cols-2 sm:p-7">
            <h2 className="text-lg font-bold text-white sm:col-span-2">
              بيانات الحساب
            </h2>
            <InfoRow label="الاسم" value={user.name} />
            <InfoRow label="البريد الإلكتروني" value={user.email || '—'} />
            <InfoRow label="نوع الحساب" value={user.role} />
            <InfoRow label="المرحلة أو التخصص" value={user.specializationOrGrade || '—'} />
            <InfoRow label="رقم الهاتف" value={user.phone || '—'} />
          </section>
        ) : activeTab === 'overview' ? (
          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                label="الاختبارات المسجلة"
                value={isLoading ? '…' : String(grades.length)}
                icon={<Award className="h-5 w-5" />}
              />
              <SummaryCard
                label="سجلات الحضور"
                value={isLoading ? '…' : String(attendance.length)}
                icon={<CalendarCheck className="h-5 w-5" />}
              />
              <SummaryCard
                label="متوسط الدرجات"
                value={
                  isLoading
                    ? '…'
                    : averageGrade === null
                      ? 'لا توجد بيانات'
                      : `${averageGrade}%`
                }
                icon={<GraduationCap className="h-5 w-5" />}
              />
            </section>
            <section className="grid gap-5 lg:grid-cols-2">
              <RecordSection
                title="سجلات الدرجات"
                icon={<Award className="h-4 w-4" />}
                empty={!isLoading && sortedGrades.length === 0}
                emptyMessage={emptyMessage}
              >
                {sortedGrades.slice(0, 4).map((item) => (
                  <GradeRow key={item.id} item={item} />
                ))}
              </RecordSection>
              <RecordSection
                title="سجلات الحضور"
                icon={<CalendarCheck className="h-4 w-4" />}
                empty={!isLoading && attendance.length === 0}
                emptyMessage={emptyMessage}
              >
                {attendance.slice(0, 4).map((item) => (
                  <AttendanceRow key={item.id} item={item} />
                ))}
              </RecordSection>
            </section>
          </div>
        ) : activeTab === 'grades' ? (
          <RecordSection
            title="الدرجات"
            icon={<Award className="h-4 w-4" />}
            empty={!isLoading && sortedGrades.length === 0}
            emptyMessage={emptyMessage}
          >
            {sortedGrades.map((item) => (
              <GradeRow key={item.id} item={item} />
            ))}
          </RecordSection>
        ) : (
          <RecordSection
            title="الحضور"
            icon={<CalendarCheck className="h-4 w-4" />}
            empty={!isLoading && attendance.length === 0}
            emptyMessage={emptyMessage}
          >
            <p className="mb-3 text-xs text-slate-400">
              {attendanceRate === null
                ? 'لا توجد بيانات كافية لحساب نسبة الحضور.'
                : `الحضور والتأخير: ${attendedCount} من ${attendanceCount} سجلًا (${attendanceRate}%).`}
            </p>
            {attendance.map((item) => (
              <AttendanceRow key={item.id} item={item} />
            ))}
          </RecordSection>
        )}

        {isLoading && (
          <p role="status" className="text-center text-xs text-slate-400">
            جارٍ تحميل السجلات…
          </p>
        )}
      </main>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#061426] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#091B2F] p-5">
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-2 text-xl font-black text-white">{value}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/50 text-emerald-300">
        {icon}
      </div>
    </article>
  );
}

function RecordSection({
  title,
  icon,
  empty,
  emptyMessage,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-[#091B2F] p-5">
      <h2 className="flex items-center gap-2 font-bold text-white">
        <span className="text-emerald-300">{icon}</span>
        {title}
      </h2>
      {empty ? (
        <p className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="divide-y divide-slate-800">{children}</div>
      )}
    </section>
  );
}

function GradeRow({ item }: { item: GradeRecord }) {
  return (
    <article className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-semibold text-white">{item.examTitle}</h3>
        {item.notes && <p className="mt-1 text-xs text-slate-400">{item.notes}</p>}
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="font-bold text-emerald-300">
          {item.score} / {item.totalScore}
        </span>
        <span className="text-slate-500">{formatDate(item.createdAt)}</span>
      </div>
    </article>
  );
}

function AttendanceRow({ item }: { item: AttendanceRecord }) {
  return (
    <article className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-semibold text-white">
          الحصة {item.lectureNumber}
        </h3>
        {item.notes && <p className="mt-1 text-xs text-slate-400">{item.notes}</p>}
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span
          className={
            item.status === 'present' || item.status === 'late'
              ? 'font-semibold text-emerald-300'
              : 'font-semibold text-slate-300'
          }
        >
          {statusLabels[item.status] || '—'}
        </span>
        <span className="text-slate-500">{item.date || '—'}</span>
      </div>
    </article>
  );
}
