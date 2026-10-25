const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 10, memory: '256MiB' });
const db = getFirestore();
const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean), credentials: false }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));

const fail = (res, status, message) => res.status(status).json({ error: message });
const text = (v, max = 200) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

async function requireUser(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return fail(res, 401, 'Authentication required');
    const decoded = await getAuth().verifyIdToken(match[1], true);
    const snap = await db.collection('users').doc(decoded.uid).get();
    if (!snap.exists) return fail(res, 403, 'Account profile is not activated');
    req.user = { uid: decoded.uid, email: decoded.email || '', ...snap.data() };
    req.user.uid = decoded.uid;
    next();
  } catch (e) {
    return fail(res, 401, 'Invalid or expired authentication token');
  }
}
function requireTutor(req, res, next) {
  if (req.user?.role !== 'tutor') return fail(res, 403, 'Tutor permissions required');
  next();
}
function validateId(id) { return typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id); }
function relatedStudentIds(user) {
  if (user.role === 'student') return [user.uid];
  if (user.role === 'parent' && typeof user.linkedStudentId === 'string') return [user.linkedStudentId];
  return [];
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'ibn-eltarek-api', timestamp: new Date().toISOString() }));

// Public registration creates a pending request only. It never grants a login or role.
app.post('/api/registration-requests', rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false }), async (req, res) => {
  const { name, email = '', studentPhone = '', parentPhone = '', gradeLevel = '', subjects = [], learningGoal = '' } = req.body || {};
  if (!text(name, 120) || (!text(email, 160) && !text(studentPhone, 30))) return fail(res, 400, 'Name and a valid email or phone are required');
  if (typeof email !== 'string' || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return fail(res, 400, 'Invalid email address');
  if (typeof studentPhone !== 'string' || (studentPhone && !/^[+0-9()\s-]{8,20}$/.test(studentPhone))) return fail(res, 400, 'Invalid student phone');
  if (typeof parentPhone !== 'string' || (parentPhone && !/^[+0-9()\s-]{8,20}$/.test(parentPhone))) return fail(res, 400, 'Invalid parent phone');
  if (!Array.isArray(subjects) || subjects.length > 12 || subjects.some(s => !text(s, 120))) return fail(res, 400, 'Invalid subjects');
  if (typeof gradeLevel !== 'string' || (gradeLevel && !text(gradeLevel, 120))) return fail(res, 400, 'Invalid grade level');
  if (typeof learningGoal !== 'string' || (learningGoal && !text(learningGoal, 500))) return fail(res, 400, 'Invalid learning goal');
  try {
    const ref = await db.collection('registrationRequests').add({
      name: name.trim(), email: email.trim().toLowerCase(), studentPhone: studentPhone.trim(), parentPhone: parentPhone.trim(),
      gradeLevel: gradeLevel.trim(), subjects, learningGoal: learningGoal.trim(), status: 'pending',
      createdAt: FieldValue.serverTimestamp(), source: 'website'
    });
    return res.status(201).json({ ok: true, requestId: ref.id, message: 'Registration request received for review' });
  } catch (e) {
    console.error('Registration request failed', e);
    return fail(res, 500, 'Could not save registration request');
  }
});

app.use('/api', requireUser);
app.get('/api/registration-requests', requireTutor, async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
    if (!['pending', 'approved', 'rejected', 'all'].includes(status)) return fail(res, 400, 'Invalid status filter');
    let q = db.collection('registrationRequests').orderBy('createdAt', 'desc').limit(200);
    if (status !== 'all') q = db.collection('registrationRequests').where('status', '==', status).limit(200);
    const snap = await q.get();
    res.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { console.error(e); return fail(res, 500, 'Could not load registration requests'); }
});
app.patch('/api/registration-requests/:id', requireTutor, async (req, res) => {
  const { status, adminNote = '' } = req.body || {};
  if (!validateId(req.params.id) || !['approved', 'rejected'].includes(status) || (adminNote && !text(adminNote, 500))) return fail(res, 400, 'Invalid request update');
  try {
    await db.collection('registrationRequests').doc(req.params.id).update({ status, adminNote: String(adminNote).trim(), reviewedAt: FieldValue.serverTimestamp(), reviewedBy: req.user.uid });
    res.json({ ok: true });
  } catch (e) { console.error(e); return fail(res, 500, 'Could not update registration request'); }
});

app.get('/api/me', (req, res) => {
  const { uid, name, email, role, phone, avatar, specializationOrGrade, linkedStudentId, linkedStudentName, linkedParentPhone } = req.user;
  res.json({ uid, name, email, role, phone, avatar, specializationOrGrade, linkedStudentId, linkedStudentName, linkedParentPhone });
});

app.get('/api/grades', async (req, res) => {
  try {
    const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : '';
    if (req.user.role === 'tutor') {
      let q = db.collection('grades').orderBy('createdAt', 'desc').limit(200);
      if (studentId) { if (!validateId(studentId)) return fail(res, 400, 'Invalid studentId'); q = db.collection('grades').where('studentId', '==', studentId).limit(200); }
      const snap = await q.get(); return res.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    }
    const allowed = relatedStudentIds(req.user);
    if (!allowed.length || (studentId && !allowed.includes(studentId))) return fail(res, 403, 'You cannot view these grades');
    const target = studentId || allowed[0];
    const snap = await db.collection('grades').where('studentId', '==', target).limit(200).get();
    return res.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { console.error(e); return fail(res, 500, 'Could not load grades'); }
});
app.post('/api/grades', requireTutor, async (req, res) => {
  const { studentId, examTitle, score, totalScore, notes = '' } = req.body || {};
  if (!validateId(studentId) || !text(examTitle, 200) || !Number.isFinite(score) || !Number.isFinite(totalScore) || score < 0 || totalScore <= 0 || score > totalScore || (notes && !text(notes, 500))) return fail(res, 400, 'Invalid grade data');
  try {
    const ref = await db.collection('grades').add({ studentId, examTitle: examTitle.trim(), score, totalScore, notes: String(notes).trim(), createdAt: FieldValue.serverTimestamp(), createdBy: req.user.uid });
    res.status(201).json({ id: ref.id });
  } catch (e) { console.error(e); return fail(res, 500, 'Could not save grade'); }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : '';
    if (req.user.role !== 'tutor') {
      const allowed = relatedStudentIds(req.user);
      if (!allowed.length || (studentId && !allowed.includes(studentId))) return fail(res, 403, 'You cannot view this attendance');
    }
    let q = db.collection('attendance').limit(300);
    const target = studentId || (req.user.role !== 'tutor' ? relatedStudentIds(req.user)[0] : '');
    if (target) q = db.collection('attendance').where('studentId', '==', target).limit(300);
    const snap = await q.get();
    res.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { console.error(e); return fail(res, 500, 'Could not load attendance'); }
});
app.post('/api/attendance', requireTutor, async (req, res) => {
  const { studentId, lectureNumber, date, status, notes = '' } = req.body || {};
  if (!validateId(studentId) || !Number.isInteger(lectureNumber) || lectureNumber < 1 || !text(date, 50) || !['present', 'late', 'excused', 'absent'].includes(status) || (notes && !text(notes, 500))) return fail(res, 400, 'Invalid attendance data');
  try {
    const ref = await db.collection('attendance').add({ studentId, lectureNumber, date: date.trim(), status, notes: String(notes).trim(), createdAt: FieldValue.serverTimestamp(), createdBy: req.user.uid });
    res.status(201).json({ id: ref.id });
  } catch (e) { console.error(e); return fail(res, 500, 'Could not save attendance'); }
});

app.get('/api/content', async (req, res) => {
  try {
    const canViewDrafts = req.user.role === 'tutor' && req.query.includeDrafts === 'true';
    let query = db.collection('content');
    if (!canViewDrafts) query = query.where('published', '==', true);
    const snap = await query.limit(200).get();
    res.json({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { console.error(e); return fail(res, 500, 'Could not load content'); }
});
app.post('/api/content', requireTutor, async (req, res) => {
  const { title, description = '', type = 'link', url = '', published = false, gradeLevel = '' } = req.body || {};
  const validDescription = typeof description === 'string' && (!description || text(description, 1000));
  const validGradeLevel = typeof gradeLevel === 'string' && (!gradeLevel || text(gradeLevel, 120));
  const validUrl = typeof url === 'string'
    && (type === 'text' && !url || (text(url, 2048) && /^https:\/\//i.test(url)));
  if (!text(title, 180) || !validDescription || !validGradeLevel || !['link', 'video', 'pdf', 'text'].includes(type) || !validUrl || typeof published !== 'boolean') return fail(res, 400, 'Invalid content data');
  try {
    const ref = await db.collection('content').add({ title: title.trim(), description: String(description).trim(), type, url: String(url).trim(), published, gradeLevel: String(gradeLevel).trim(), createdAt: FieldValue.serverTimestamp(), createdBy: req.user.uid });
    res.status(201).json({ id: ref.id });
  } catch (e) { console.error(e); return fail(res, 500, 'Could not save content'); }
});
app.patch('/api/content/:id', requireTutor, async (req, res) => {
  if (!validateId(req.params.id)) return fail(res, 400, 'Invalid content id');
  const allowed = ['title', 'description', 'type', 'url', 'published', 'gradeLevel'];
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(update).length) return fail(res, 400, 'No supported fields supplied');
  if (update.title !== undefined && !text(update.title, 180)) return fail(res, 400, 'Invalid title');
  if (update.description !== undefined && !(update.description === '' || text(update.description, 1000))) return fail(res, 400, 'Invalid description');
  if (update.type !== undefined && !['link', 'video', 'pdf', 'text'].includes(update.type)) return fail(res, 400, 'Invalid content type');
  if (update.url !== undefined && (!text(update.url, 2048) || !/^https:\/\//i.test(update.url))) return fail(res, 400, 'Invalid URL');
  if (update.published !== undefined && typeof update.published !== 'boolean') return fail(res, 400, 'Invalid published flag');
  if (update.gradeLevel !== undefined && !(update.gradeLevel === '' || text(update.gradeLevel, 120))) return fail(res, 400, 'Invalid grade level');
  update.updatedAt = FieldValue.serverTimestamp();
  try { await db.collection('content').doc(req.params.id).update(update); res.json({ ok: true }); }
  catch (e) { console.error(e); return fail(res, 500, 'Could not update content'); }
});
app.delete('/api/content/:id', requireTutor, async (req, res) => {
  if (!validateId(req.params.id)) return fail(res, 400, 'Invalid content id');
  try { await db.collection('content').doc(req.params.id).delete(); res.status(204).end(); }
  catch (e) { console.error(e); return fail(res, 500, 'Could not delete content'); }
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled API error', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});
exports.api = onRequest({ cors: false, invoker: 'public' }, app);
