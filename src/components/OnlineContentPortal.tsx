import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { BookOpen, ExternalLink, FileText, Plus, Trash2, Video } from 'lucide-react';
import { auth } from '../lib/firebase';

type ContentType = 'link' | 'video' | 'pdf' | 'text';

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  url?: string;
  gradeLevel?: string;
  published: boolean;
}

interface OnlineContentPortalProps {
  userRole: 'student' | 'parent' | 'tutor';
}

const typeLabels: Record<ContentType, string> = {
  link: 'رابط',
  video: 'فيديو',
  pdf: 'ملف PDF',
  text: 'نص',
};

const getErrorMessage = async (response: Response) => {
  const result = await response.json().catch(() => ({}));
  return typeof result.error === 'string'
    ? result.error
    : 'تعذر تنفيذ الطلب. حاول مرة أخرى.';
};

const assertJsonResponse = (response: Response) => {
  if (!(response.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('خدمة المحتوى غير متاحة. تحقق من إعداد الـAPI.');
  }
};

const isSafeHttpsUrl = (value?: string) => {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export const OnlineContentPortal: React.FC<OnlineContentPortalProps> = ({
  userRole,
}) => {
  const isTutor = userRole === 'tutor';
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ContentType>('link');
  const [url, setUrl] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [published, setPublished] = useState(true);

  const getToken = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('انتهت الجلسة. سجّل الدخول مرة أخرى.');
    return currentUser.getIdToken();
  }, []);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = await getToken();
      const response = await fetch(
        isTutor ? '/api/content?includeDrafts=true' : '/api/content',
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error(await getErrorMessage(response));
      assertJsonResponse(response);
      const result = (await response.json()) as { items?: ContentItem[] };
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'تعذر تحميل المحتوى.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isTutor]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setFormMessage('');
    setIsSaving(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          url: url.trim(),
          published,
          gradeLevel: gradeLevel.trim(),
        }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      assertJsonResponse(response);
      const result = (await response.json().catch(() => null)) as { id?: string } | null;
      if (!result?.id) throw new Error('لم يؤكد الخادم حفظ المحتوى.');
      setTitle('');
      setDescription('');
      setType('link');
      setUrl('');
      setGradeLevel('');
      setPublished(true);
      setFormMessage('تم حفظ المحتوى.');
      await loadItems();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'تعذر حفظ المحتوى.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async (item: ContentItem) => {
    setErrorMessage('');
    setBusyItemId(item.id);
    try {
      const token = await getToken();
      const response = await fetch(`/api/content/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: !item.published }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      assertJsonResponse(response);
      await loadItems();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'تعذر تحديث حالة المحتوى.',
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDelete = async (item: ContentItem) => {
    if (!window.confirm(`حذف «${item.title}» من مكتبة المحتوى؟`)) return;
    setErrorMessage('');
    setBusyItemId(item.id);
    try {
      const token = await getToken();
      const response = await fetch(`/api/content/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      if (response.status !== 204) assertJsonResponse(response);
      await loadItems();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'تعذر حذف المحتوى.',
      );
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <section className="space-y-6" dir="rtl">
      <header>
        <div className="flex items-center gap-2 text-emerald-300">
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-semibold">مكتبة المحتوى</span>
        </div>
        <h2 className="mt-2 text-2xl font-black text-white">المواد المنشورة</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {isTutor
            ? 'أضف روابط المواد التي تريد إتاحتها للطلاب. لا يتم رفع ملفات إلى هذا الموقع.'
            : 'المواد المنشورة من إدارة المركز تظهر هنا.'}
        </p>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-200"
        >
          {errorMessage}
        </div>
      )}

      {isTutor && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-slate-800 bg-[#091B2F] p-5"
        >
          <div className="flex items-center gap-2 text-white">
            <Plus className="h-4 w-4 text-emerald-300" />
            <h3 className="font-bold">إضافة مادة أو رابط</h3>
          </div>
          {formMessage && (
            <p role="status" className="text-sm text-emerald-300">
              {formMessage}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-300">
              العنوان *
              <input
                required
                maxLength={180}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#061426] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400"
              />
            </label>
            <label className="text-xs text-slate-300">
              النوع
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ContentType)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#061426] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs text-slate-300">
            وصف مختصر
            <textarea
              rows={2}
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#061426] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400"
            />
          </label>
          {type !== 'text' && (
            <label className="block text-xs text-slate-300">
              رابط HTTPS *
              <input
                required
                type="url"
                pattern="https://.+"
                maxLength={2048}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://"
                dir="ltr"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#061426] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400"
              />
            </label>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              المرحلة (اختياري)
              <input
                maxLength={120}
                value={gradeLevel}
                onChange={(event) => setGradeLevel(event.target.value)}
                className="w-48 rounded-lg border border-slate-700 bg-[#061426] px-2.5 py-2 text-sm text-white outline-none focus:border-emerald-400"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
                className="accent-emerald-500"
              />
              نشر للطلاب فور الحفظ
            </label>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {isSaving ? 'جارٍ الحفظ…' : 'حفظ المحتوى'}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="rounded-xl border border-slate-800 bg-[#091B2F] p-5 text-sm text-slate-300">
          جارٍ تحميل المحتوى…
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-[#091B2F]/70 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-3 font-semibold text-slate-200">لا يوجد محتوى منشور</p>
          <p className="mt-1 text-sm text-slate-400">
            ستظهر المواد هنا بعد إضافتها ونشرها من إدارة المركز.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#091B2F] p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] text-emerald-200">
                    {typeLabels[item.type] || 'مادة'}
                  </span>
                  {item.gradeLevel && (
                    <span className="text-xs text-slate-400">{item.gradeLevel}</span>
                  )}
                  {isTutor && !item.published && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-2.5 py-1 text-[11px] text-amber-200">
                      مسودة
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-bold text-white">{item.title}</h3>
                {item.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {item.published && isSafeHttpsUrl(item.url) && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-500"
                  >
                    <ExternalLink className="h-4 w-4" />
                    فتح الرابط
                    {item.type === 'video' && <Video className="h-4 w-4" />}
                  </a>
                )}
                {isTutor && (
                  <>
                    <button
                      type="button"
                      disabled={busyItemId === item.id}
                      onClick={() => void handlePublishToggle(item)}
                      className="min-h-10 rounded-xl border border-slate-700 px-3 text-xs text-slate-200 transition hover:border-emerald-500/50 disabled:opacity-50"
                    >
                      {item.published ? 'إلغاء النشر' : 'نشر'}
                    </button>
                    <button
                      type="button"
                      disabled={busyItemId === item.id}
                      onClick={() => void handleDelete(item)}
                      aria-label={`حذف ${item.title}`}
                      className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-rose-900/60 px-3 text-xs text-rose-200 transition hover:bg-rose-950/40 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
