import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { verifyNewsClaim, searchWorldNews, getTrendingNewsAndRumors } from './verifier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, 'data'));
const uploadDir = path.join(dataDir, 'uploads');
const dbPath = path.resolve(process.env.DATABASE_FILE || path.join(dataDir, 'veritas.sqlite'));
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    Id TEXT PRIMARY KEY,
    Email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    profile TEXT NOT NULL DEFAULT 'Member_c' CHECK(profile IN ('Admin_c', 'Member_c')),
    is_active INTEGER NOT NULL DEFAULT 1,
    session_version INTEGER NOT NULL DEFAULT 0,
    FirstName TEXT NOT NULL DEFAULT '',
    LastName TEXT NOT NULL DEFAULT '',
    phone_c TEXT NOT NULL DEFAULT '',
    city_c TEXT NOT NULL DEFAULT '',
    organisation_c TEXT NOT NULL DEFAULT '',
    language_c TEXT NOT NULL DEFAULT 'English',
    newsletter_c INTEGER NOT NULL DEFAULT 0,
    CreatedOn TEXT NOT NULL,
    ModifiedOn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS help_articles_c (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    category_c TEXT NOT NULL DEFAULT 'Getting started',
    summary_c TEXT NOT NULL DEFAULT '',
    body_c TEXT NOT NULL DEFAULT '',
    published_c INTEGER NOT NULL DEFAULT 0,
    read_time_c INTEGER NOT NULL DEFAULT 1,
    CreatedOn TEXT NOT NULL,
    ModifiedOn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS support_tickets_c (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    category_c TEXT NOT NULL DEFAULT 'Other',
    priority_c TEXT NOT NULL DEFAULT 'Medium',
    status_c TEXT NOT NULL DEFAULT 'Open',
    message_c TEXT NOT NULL DEFAULT '',
    admin_reply_c TEXT NOT NULL DEFAULT '',
    Owner TEXT NOT NULL REFERENCES users(Id),
    CreatedOn TEXT NOT NULL,
    ModifiedOn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS invitations (
    Id TEXT PRIMARY KEY,
    email TEXT NOT NULL COLLATE NOCASE,
    profile TEXT NOT NULL CHECK(profile IN ('Admin_c', 'Member_c')),
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    CreatedOn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS password_resets (
    Id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(Id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    CreatedOn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS files (
    Id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(Id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    stored_name TEXT NOT NULL UNIQUE,
    CreatedOn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expired INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS verification_history (
    Id TEXT PRIMARY KEY,
    user_id TEXT,
    claim TEXT NOT NULL,
    score INTEGER NOT NULL,
    verdict TEXT NOT NULL,
    status TEXT NOT NULL,
    details_json TEXT NOT NULL,
    CreatedOn TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS tickets_owner_created ON support_tickets_c(Owner, CreatedOn);
  CREATE INDEX IF NOT EXISTS articles_published_modified ON help_articles_c(published_c, ModifiedOn);
  CREATE INDEX IF NOT EXISTS verification_history_created ON verification_history(CreatedOn DESC);
`);

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const token = () => crypto.randomBytes(32).toString('base64url');
const tokenHash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();

const userById = db.prepare('SELECT * FROM users WHERE Id = ?');

class SqliteSessionStore extends session.Store {
  constructor(database) {
    super();
    this.database = database;
    this.read = database.prepare('SELECT sess, expired FROM sessions WHERE sid = ?');
    this.write = database.prepare(`INSERT INTO sessions (sid, sess, expired) VALUES (?, ?, ?)
      ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expired = excluded.expired`);
    this.remove = database.prepare('DELETE FROM sessions WHERE sid = ?');
  }

  get(sid, callback) {
    try {
      const row = this.read.get(sid);
      if (!row || row.expired <= Date.now()) {
        if (row) this.remove.run(sid);
        return callback(null, null);
      }
      callback(null, JSON.parse(row.sess));
    } catch (error) { callback(error); }
  }

  set(sid, sess, callback) {
    try {
      const expires = sess.cookie?.expires ? new Date(sess.cookie.expires).getTime() : Date.now() + Number(sess.cookie?.maxAge || 0);
      this.write.run(sid, JSON.stringify(sess), expires);
      callback?.(null);
    } catch (error) { callback?.(error); }
  }

  touch(sid, sess, callback) {
    this.set(sid, sess, callback);
  }

  destroy(sid, callback) {
    try {
      this.remove.run(sid);
      callback?.(null);
    } catch (error) { callback?.(error); }
  }
}

function destroyUserSessions(userId, exceptSid = null) {
  const removeSession = db.prepare('DELETE FROM sessions WHERE sid = ?');
  const rows = db.prepare('SELECT sid, sess FROM sessions').all();
  for (const row of rows) {
    try {
      if (row.sid !== exceptSid && JSON.parse(row.sess).userId === userId) removeSession.run(row.sid);
    } catch { }
  }
}
function publicUser(row) {
  if (!row) return null;
  return {
    Id: row.Id,
    userId: row.Id,
    profile: row.profile,
    Email: row.Email,
    emailAddress: row.Email,
    Name: [row.FirstName, row.LastName].filter(Boolean).join(' ') || row.Email,
    FirstName: row.FirstName,
    LastName: row.LastName,
    phone_c: row.phone_c,
    city_c: row.city_c,
    organisation_c: row.organisation_c,
    language_c: row.language_c,
    newsletter_c: Boolean(row.newsletter_c),
    CreatedOn: row.CreatedOn,
    ModifiedOn: row.ModifiedOn,
  };
}

async function bootstrapAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    const existingAdmin = db.prepare("SELECT Id FROM users WHERE profile = 'Admin_c' AND is_active = 1 LIMIT 1").get();
    if (!existingAdmin) console.warn('No initial admin configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before inviting users.');
    return;
  }
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = db.prepare('SELECT Id FROM users WHERE Email = ?').get(email);
  if (existing) {
    db.prepare(`UPDATE users SET password_hash = ?, profile = 'Admin_c', is_active = 1,
      session_version = session_version + 1, ModifiedOn = ? WHERE Id = ?`)
      .run(passwordHash, now(), existing.Id);
    destroyUserSessions(existing.Id);
    console.log(`Provisioned administrator account for ${email}`);
    return;
  }
  const timestamp = now();
  db.prepare(`INSERT INTO users (Id, Email, password_hash, profile, FirstName, CreatedOn, ModifiedOn)
    VALUES (?, ?, ?, 'Admin_c', 'Administrator', ?, ?)`)
    .run(uid(), email, passwordHash, timestamp, timestamp);
  console.log(`Created initial administrator account for ${email}`);
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '1mb' }));

const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : crypto.randomBytes(32).toString('hex'));
if (!sessionSecret || sessionSecret.length < 32 || (process.env.NODE_ENV === 'production' && sessionSecret.includes('replace-with'))) {
  throw new Error('Set SESSION_SECRET to a random value of at least 32 characters.');
}
app.use(session({
  name: 'veritas.sid',
  secret: sessionSecret,
  store: new SqliteSessionStore(db),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

const mailer = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
}) : null;
const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;
const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

function requireUser(req, res, next) {
  const user = req.session.userId ? userById.get(req.session.userId) : null;
  if (!user || !user.is_active || user.session_version !== req.session.sessionVersion) {
    return res.status(401).json({ message: 'Sign in to continue.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.profile !== 'Admin_c') return res.status(403).json({ message: 'Administrator access required.' });
  next();
}

function requireMember(req, res, next) {
  if (req.user?.profile !== 'Member_c') return res.status(403).json({ message: 'Member access required.' });
  next();
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 12 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});
const mutationLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/auth/me', (req, res) => {
  const user = req.session.userId ? userById.get(req.session.userId) : null;
  if (!user || !user.is_active || user.session_version !== req.session.sessionVersion) return res.json({ user: null });
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (password.length > 128) return res.status(400).json({ message: 'Password is too long.' });
    const timestamp = now();
    const id = uid();
    const firstName = String(req.body?.firstName ?? '').trim();
    const lastName = String(req.body?.lastName ?? '').trim();
    try {
      db.prepare(`INSERT INTO users (Id, Email, password_hash, profile, FirstName, LastName, CreatedOn, ModifiedOn)
        VALUES (?, ?, ?, 'Member_c', ?, ?, ?, ?)`)
        .run(id, email, await bcrypt.hash(password, 12), firstName, lastName, timestamp, timestamp);
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ message: 'An account with that email already exists.' });
      throw err;
    }
    req.session.userId = id;
    req.session.sessionVersion = 0;
    res.status(201).json({ user: publicUser(userById.get(id)) });
  } catch (err) { next(err); }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');
    const user = db.prepare('SELECT * FROM users WHERE Email = ?').get(email);
    const valid = user?.is_active && await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Email or password is incorrect.' });
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.Id;
      req.session.sessionVersion = user.session_version;
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.json({ user: publicUser(user) });
      });
    });
  } catch (err) { next(err); }
});

app.post('/api/auth/logout', requireUser, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('veritas.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ success: true });
  });
});

app.post('/api/auth/change-password', requireUser, authLimiter, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body ?? {};
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
    if (String(newPassword ?? '').length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const user = userById.get(req.user.Id);
    if (!await bcrypt.compare(String(currentPassword ?? ''), user.password_hash)) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    db.prepare('UPDATE users SET password_hash = ?, session_version = session_version + 1, ModifiedOn = ? WHERE Id = ?')
      .run(await bcrypt.hash(newPassword, 12), now(), user.Id);
    req.session.sessionVersion += 1;
    destroyUserSessions(user.Id, req.sessionID);
    res.json({ success: true });
  } catch (err) { next(err); }
});

app.post('/api/auth/forgot-password', authLimiter, async (req, res, next) => {
  try {
    if (!mailer || !fromEmail) return res.status(503).json({ message: 'Password reset email is not configured on this server.' });
    const email = normalizeEmail(req.body?.email);
    const user = db.prepare('SELECT * FROM users WHERE Email = ?').get(email);
    if (user) {
      const rawToken = token();
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      db.prepare('INSERT INTO password_resets (Id, user_id, token_hash, expires_at, CreatedOn) VALUES (?, ?, ?, ?, ?)')
        .run(uid(), user.Id, tokenHash(rawToken), expires, now());
      const link = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
      await mailer.sendMail({ from: fromEmail, to: user.Email, subject: 'Reset your Veritas password', text: `Reset your password using this link (expires in one hour): ${link}` });
    }
    res.json({ success: true, message: 'If an account exists, password reset instructions will be sent.' });
  } catch (err) { next(err); }
});

app.post('/api/auth/reset-password', authLimiter, async (req, res, next) => {
  try {
    const rawToken = String(req.body?.token ?? '');
    const password = String(req.body?.newPassword ?? '');
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const reset = db.prepare('SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > ?').get(tokenHash(rawToken), now());
    if (!reset) return res.status(400).json({ message: 'This reset link is invalid or expired.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const update = db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ?, session_version = session_version + 1, ModifiedOn = ? WHERE Id = ?').run(passwordHash, now(), reset.user_id);
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(reset.user_id);
    });
    update();
    destroyUserSessions(reset.user_id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

app.post('/api/auth/accept-invitation', authLimiter, async (req, res, next) => {
  try {
    const rawToken = String(req.body?.token ?? '');
    const password = String(req.body?.password ?? '');
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const invitation = db.prepare('SELECT * FROM invitations WHERE token_hash = ? AND expires_at > ?').get(tokenHash(rawToken), now());
    if (!invitation) return res.status(400).json({ message: 'This invitation is invalid or expired.' });
    const id = uid();
    const timestamp = now();
    db.transaction(() => {
      db.prepare(`INSERT INTO users (Id, Email, password_hash, profile, CreatedOn, ModifiedOn) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(id, invitation.email, bcrypt.hashSync(password, 12), invitation.profile, timestamp, timestamp);
      db.prepare('DELETE FROM invitations WHERE Id = ?').run(invitation.Id);
    })();
    req.session.userId = id;
    req.session.sessionVersion = 0;
    res.status(201).json({ user: publicUser(userById.get(id)) });
  } catch (err) { next(err); }
});

const tableFields = {
  help_articles_c: ['Id', 'Name', 'category_c', 'summary_c', 'body_c', 'published_c', 'read_time_c', 'CreatedOn', 'ModifiedOn'],
  support_tickets_c: ['Id', 'Name', 'category_c', 'priority_c', 'status_c', 'message_c', 'admin_reply_c', 'Owner', 'CreatedOn', 'ModifiedOn'],
};

function sqlField(table, field) {
  if (!tableFields[table]?.includes(field)) throw Object.assign(new Error(`Unsupported field: ${field}`), { status: 400 });
  return field === 'Owner' ? 'Owner' : `"${field}"`;
}

function compileFilter(table, node, params) {
  if (!node) return '';
  const op = node.op;
  if (op === 'and' || op === 'or') {
    const children = (node.items ?? []).map((item) => compileFilter(table, item, params)).filter(Boolean);
    return children.length ? `(${children.join(op === 'and' ? ' AND ' : ' OR ')})` : '';
  }
  const field = sqlField(table, node.field);
  if (op === 'contains') {
    params.push(`%${String(node.value ?? '').toLowerCase()}%`);
    return `LOWER(${field}) LIKE ?`;
  }
  if (op === 'in') {
    const values = Array.isArray(node.value) ? node.value : [];
    if (!values.length) return '0';
    params.push(...values.map((value) => typeof value === 'boolean' ? Number(value) : value));
    return `${field} IN (${values.map(() => '?').join(',')})`;
  }
  if (!['eq', 'ne', 'gt', 'gte', 'lt', 'lte'].includes(op)) throw Object.assign(new Error('Unsupported filter operator.'), { status: 400 });
  const sqlOp = { eq: '=', ne: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' }[op];
  params.push(typeof node.value === 'boolean' ? Number(node.value) : node.value);
  return `${field} ${sqlOp} ?`;
}

function scopedWhere(req, table, query, params) {
  const clauses = [];
  const user = req.session.userId ? userById.get(req.session.userId) : null;
  const activeUser = user?.is_active && user.session_version === req.session.sessionVersion ? user : null;
  if (table === 'help_articles_c' && activeUser?.profile !== 'Admin_c') clauses.push('published_c = 1');
  if (table === 'support_tickets_c') {
    if (!activeUser) {
      throw Object.assign(new Error('Sign in to view tickets.'), { status: 401 });
    }
    if (activeUser.profile !== 'Admin_c') { clauses.push('Owner = ?'); params.push(activeUser.Id); }
  }
  if (query.where) {
    const filter = compileFilter(table, query.where, params);
    if (filter) clauses.push(filter);
  }
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
}

function mapRow(table, row) {
  if (!row) return row;
  if (table === 'support_tickets_c') {
    const owner = userById.get(row.Owner);
    return { ...row, published_c: undefined, Owner: owner ? { Id: owner.Id, Name: publicUser(owner).Name, Email: owner.Email } : null };
  }
  return { ...row, published_c: table === 'help_articles_c' ? Boolean(row.published_c) : row.published_c };
}

app.get('/api/data/:table', (req, res, next) => {
  try {
    const { table } = req.params;
    if (!tableFields[table]) return res.status(404).json({ message: 'Data table not found.' });
    const query = req.query.q ? JSON.parse(req.query.q) : {};
    const params = [];
    const where = scopedWhere(req, table, query, params);
    const allowedFields = tableFields[table];
    const fields = Array.isArray(query.fields) && query.fields.length
      ? query.fields.map((field) => {
        const name = typeof field === 'string' ? field : field.field;
        if (!allowedFields.includes(name)) throw Object.assign(new Error(`Unsupported field: ${name}`), { status: 400 });
        return name === 'Owner' ? 'Owner' : `"${name}"`;
      })
      : allowedFields.map((field) => field === 'Owner' ? 'Owner' : `"${field}"`);
    const sortField = query.sort ? sqlField(table, query.sort.field) : '"ModifiedOn"';
    const direction = query.sort?.direction === 'asc' ? 'ASC' : 'DESC';
    if (query.aggregate?.length) {
      const aggregators = query.aggregate.map((item) => {
        const aggParams = [];
        const base = scopedWhere(req, table, {}, aggParams);
        const extra = item.where ? compileFilter(table, item.where, aggParams) : '';
        const conditions = [base.replace(/^WHERE\s*/, ''), extra].filter(Boolean);
        const clause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const count = db.prepare(`SELECT COUNT(*) AS count FROM "${table}" ${clause}`).get(...aggParams).count;
        return { id: item.id, data: { count } };
      });
      return res.json({ success: true, data: [], total: 1, hasMore: false, aggregators });
    }
    const total = db.prepare(`SELECT COUNT(*) AS count FROM "${table}" ${where}`).get(...params).count;
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
    const offset = Math.max(Number(query.offset) || 0, 0);
    const rows = db.prepare(`SELECT ${fields.join(', ')} FROM "${table}" ${where} ORDER BY ${sortField} ${direction} LIMIT ? OFFSET ?`)
      .all(...params, limit, offset).map((row) => mapRow(table, row));
    res.json({ success: true, data: rows, total, hasMore: offset + rows.length < total });
  } catch (err) { next(err); }
});

app.get('/api/data/:table/:id', (req, res, next) => {
  try {
    const { table, id } = req.params;
    if (!tableFields[table]) return res.status(404).json({ message: 'Data table not found.' });
    const params = [id];
    const scope = scopedWhere(req, table, {}, params);
    const row = db.prepare(`SELECT * FROM "${table}" WHERE Id = ? ${scope ? `AND ${scope.replace(/^WHERE\s*/, '')}` : ''}`).get(...params);
    if (!row) return res.status(404).json({ message: 'Record not found.' });
    res.json({ success: true, data: mapRow(table, row) });
  } catch (err) { next(err); }
});

app.post('/api/data/:table', requireUser, mutationLimiter, (req, res, next) => {
  try {
    const { table } = req.params;
    if (!tableFields[table]) return res.status(404).json({ message: 'Data table not found.' });
    const isAdmin = req.user.profile === 'Admin_c';
    if (table === 'help_articles_c' && !isAdmin) return res.status(403).json({ message: 'Administrator access required.' });
    const body = { ...req.body };
    body.Name = String(body.Name ?? '').trim();
    if (!body.Name) return res.status(400).json({ message: 'A subject or title is required.' });
    const timestamp = now();
    const id = uid();
    if (table === 'support_tickets_c') {
      body.message_c = String(body.message_c ?? '').trim();
      if (!body.message_c) return res.status(400).json({ message: 'A ticket message is required.' });
      body.Owner = req.user.Id;
      body.status_c = 'Open';
      body.admin_reply_c = '';
    } else if (body.read_time_c !== undefined) {
      body.read_time_c = Math.max(1, Math.trunc(Number(body.read_time_c) || 1));
    }
    const allowed = tableFields[table].filter((field) => !['Id', 'CreatedOn', 'ModifiedOn'].includes(field));
    const fields = allowed.filter((field) => Object.hasOwn(body, field));
    const values = fields.map((field) => field === 'published_c' ? Number(Boolean(body[field])) : body[field]);
    const insertFields = ['Id', ...fields, 'CreatedOn', 'ModifiedOn'];
    const insertValues = [id, ...values, timestamp, timestamp];
    db.prepare(`INSERT INTO "${table}" (${insertFields.map((f) => `"${f}"`).join(',')}) VALUES (${insertFields.map(() => '?').join(',')})`).run(...insertValues);
    const row = db.prepare(`SELECT * FROM "${table}" WHERE Id = ?`).get(id);
    res.status(201).json({ success: true, data: [mapRow(table, row)] });
  } catch (err) { next(err); }
});

app.patch('/api/data/:table/:id', requireUser, mutationLimiter, (req, res, next) => {
  try {
    const { table, id } = req.params;
    if (!tableFields[table]) return res.status(404).json({ message: 'Data table not found.' });
    const current = db.prepare(`SELECT * FROM "${table}" WHERE Id = ?`).get(id);
    if (!current) return res.status(404).json({ message: 'Record not found.' });
    const isAdmin = req.user.profile === 'Admin_c';
    if (table === 'help_articles_c' && !isAdmin) return res.status(403).json({ message: 'Administrator access required.' });
    if (table === 'support_tickets_c' && !isAdmin && current.Owner !== req.user.Id) return res.status(404).json({ message: 'Record not found.' });
    const allowed = tableFields[table].filter((field) => !['Id', 'Owner', 'CreatedOn', 'ModifiedOn'].includes(field));
    const fields = allowed.filter((field) => Object.hasOwn(req.body ?? {}, field));
    if (table === 'support_tickets_c' && !isAdmin) {
      for (const protectedField of ['status_c', 'admin_reply_c']) {
        const fieldIndex = fields.indexOf(protectedField);
        if (fieldIndex !== -1) fields.splice(fieldIndex, 1);
      }
    }
    if (fields.includes('Name') && !String(req.body.Name ?? '').trim()) return res.status(400).json({ message: 'A subject or title is required.' });
    if (fields.includes('message_c') && !String(req.body.message_c ?? '').trim()) return res.status(400).json({ message: 'A ticket message is required.' });
    if (fields.includes('read_time_c')) req.body.read_time_c = Math.max(1, Math.trunc(Number(req.body.read_time_c) || 1));
    const values = fields.map((field) => field === 'published_c' ? Number(Boolean(req.body[field])) : req.body[field]);
    db.prepare(`UPDATE "${table}" SET ${[...fields.map((f) => `"${f}" = ?`), 'ModifiedOn = ?'].join(', ')} WHERE Id = ?`)
      .run(...values, now(), id);
    const row = db.prepare(`SELECT * FROM "${table}" WHERE Id = ?`).get(id);
    res.json({ success: true, data: [mapRow(table, row)] });
  } catch (err) { next(err); }
});

app.delete('/api/data/:table/:id', requireUser, mutationLimiter, (req, res, next) => {
  try {
    const { table, id } = req.params;
    if (!tableFields[table]) return res.status(404).json({ message: 'Data table not found.' });
    const row = db.prepare(`SELECT * FROM "${table}" WHERE Id = ?`).get(id);
    if (!row) return res.status(404).json({ message: 'Record not found.' });
    const isAdmin = req.user.profile === 'Admin_c';
    if (table === 'help_articles_c' && !isAdmin) return res.status(403).json({ message: 'Administrator access required.' });
    if (table === 'support_tickets_c' && !isAdmin && row.Owner !== req.user.Id) return res.status(404).json({ message: 'Record not found.' });
    db.prepare(`DELETE FROM "${table}" WHERE Id = ?`).run(id);
    res.json({ success: true, data: [] });
  } catch (err) { next(err); }
});

app.get('/api/admin/users', requireUser, requireAdmin, (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const total = db.prepare('SELECT COUNT(*) AS count FROM users WHERE is_active = 1').get().count;
  const data = db.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY CreatedOn DESC LIMIT ? OFFSET ?').all(limit, offset).map(publicUser);
  res.json({ success: true, data, total, hasMore: offset + data.length < total });
});

app.get('/api/admin/users/:id', requireUser, (req, res) => {
  if (req.user.profile !== 'Admin_c' && req.user.Id !== req.params.id) return res.status(403).json({ message: 'Not allowed.' });
  const user = userById.get(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ success: true, data: publicUser(user) });
});

app.patch('/api/admin/users/:id', requireUser, (req, res) => {
  if (req.user.profile !== 'Admin_c' && req.user.Id !== req.params.id) return res.status(403).json({ message: 'Not allowed.' });
  const fields = ['FirstName', 'LastName', 'phone_c', 'city_c', 'organisation_c', 'language_c', 'newsletter_c'];
  const changes = fields.filter((field) => Object.hasOwn(req.body ?? {}, field));
  const values = changes.map((field) => field === 'newsletter_c' ? Number(Boolean(req.body[field])) : String(req.body[field] ?? '').trim());
  if (changes.length) db.prepare(`UPDATE users SET ${[...changes.map((field) => `"${field}" = ?`), 'ModifiedOn = ?'].join(', ')} WHERE Id = ?`).run(...values, now(), req.params.id);
  res.json({ success: true, data: publicUser(userById.get(req.params.id)) });
});

async function sendInvitation(email, profile, recordId) {
  if (!mailer || !fromEmail) throw Object.assign(new Error('Configure SMTP_HOST and MAIL_FROM before sending invitations.'), { status: 503 });
  const rawToken = token();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('UPDATE invitations SET token_hash = ?, expires_at = ? WHERE Id = ?').run(tokenHash(rawToken), expires, recordId);
  const link = `${appUrl}/accept-invite?token=${encodeURIComponent(rawToken)}`;
  await mailer.sendMail({ from: fromEmail, to: email, subject: 'You are invited to Veritas', text: `Accept your ${profile === 'Admin_c' ? 'administrator' : 'member'} invitation: ${link}` });
}

app.get('/api/team/members', requireUser, requireAdmin, (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const total = db.prepare('SELECT COUNT(*) AS count FROM users WHERE is_active = 1').get().count;
  const data = db.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY CreatedOn DESC LIMIT ? OFFSET ?').all(limit, offset).map((user) => ({
    id: user.Id, userId: user.Id, name: publicUser(user).Name, email: user.Email, profile: user.profile, createdAt: user.CreatedOn,
  }));
  res.json({ data, total, hasMore: offset + data.length < total });
});

app.get('/api/team/invitations', requireUser, requireAdmin, (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const total = db.prepare('SELECT COUNT(*) AS count FROM invitations').get().count;
  const data = db.prepare('SELECT * FROM invitations ORDER BY CreatedOn DESC LIMIT ? OFFSET ?').all(limit, offset).map((item) => ({
    invitationId: item.Id, invitedEmail: item.email, profileName: item.profile, expiresAt: item.expires_at, createdAt: item.CreatedOn,
  }));
  res.json({ data, total, hasMore: offset + data.length < total });
});

app.post('/api/team/invitations', requireUser, requireAdmin, authLimiter, async (req, res, next) => {
  try {
    if (!mailer || !fromEmail) return res.status(503).json({ message: 'Configure SMTP before sending invitations.' });
    const invites = Array.isArray(req.body?.invitations) ? req.body.invitations : [];
    const sent = [];
    for (const item of invites) {
      const email = normalizeEmail(item.email);
      const profile = item.profileName === 'Admin_c' ? 'Admin_c' : 'Member_c';
      if (!/^\S+@\S+\.\S+$/.test(email)) throw Object.assign(new Error('Enter a valid email address.'), { status: 400 });
      if (db.prepare('SELECT 1 FROM users WHERE Email = ?').get(email)) throw Object.assign(new Error(`${email} already has an account.`), { status: 409 });
      const id = uid();
      db.prepare('INSERT INTO invitations (Id, email, profile, token_hash, expires_at, CreatedOn) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, email, profile, '', new Date(0).toISOString(), now());
      await sendInvitation(email, profile, id);
      sent.push({ invitationId: id, invitedEmail: email, profileName: profile });
    }
    res.status(201).json({ data: sent });
  } catch (err) { next(err); }
});

app.post('/api/team/invitations/:id/resend', requireUser, requireAdmin, async (req, res, next) => {
  try {
    const invite = db.prepare('SELECT * FROM invitations WHERE Id = ?').get(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invitation not found.' });
    await sendInvitation(invite.email, invite.profile, invite.Id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

app.delete('/api/team/invitations/:id', requireUser, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM invitations WHERE Id = ?').run(req.params.id);
  res.json({ success: true });
});

app.patch('/api/team/members/:id/profile', requireUser, requireAdmin, (req, res) => {
  const profile = req.body?.profile;
  if (!['Admin_c', 'Member_c'].includes(profile)) return res.status(400).json({ message: 'Invalid role.' });
  if (req.params.id === req.user.Id && profile !== 'Admin_c') return res.status(400).json({ message: 'You cannot remove your own administrator role.' });
  const target = userById.get(req.params.id);
  if (!target) return res.status(404).json({ message: 'Member not found.' });
  if (target.profile === 'Admin_c' && profile !== 'Admin_c' && db.prepare("SELECT COUNT(*) AS count FROM users WHERE profile = 'Admin_c' AND is_active = 1").get().count <= 1) {
    return res.status(400).json({ message: 'The last administrator cannot be demoted.' });
  }
  db.prepare('UPDATE users SET profile = ?, ModifiedOn = ? WHERE Id = ?').run(profile, now(), req.params.id);
  res.json({ success: true });
});

app.delete('/api/team/members/:id', requireUser, requireAdmin, (req, res) => {
  const target = userById.get(req.params.id);
  if (!target) return res.status(404).json({ message: 'Member not found.' });
  if (target.Id === req.user.Id) return res.status(400).json({ message: 'You cannot remove your own account.' });
  if (target.profile === 'Admin_c' && db.prepare("SELECT COUNT(*) AS count FROM users WHERE profile = 'Admin_c' AND is_active = 1").get().count <= 1) {
    return res.status(400).json({ message: 'The last administrator cannot be removed.' });
  }
  db.prepare('UPDATE users SET is_active = 0, session_version = session_version + 1, ModifiedOn = ? WHERE Id = ?').run(now(), req.params.id);
  destroyUserSessions(req.params.id);
  res.json({ success: true });
});

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, _file, callback) => callback(null, `${uid()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

app.post('/api/files', requireUser, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose a file to upload.' });
    const id = uid();
    db.prepare('INSERT INTO files (Id, owner_id, name, type, size, stored_name, CreatedOn) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.user.Id, path.basename(req.file.originalname), req.file.mimetype, req.file.size, req.file.filename, now());
    res.status(201).json({ Id: id, Name: path.basename(req.file.originalname), Type: req.file.mimetype, Size: req.file.size / 1024 });
  } catch (err) { next(err); }
});

app.get('/api/files/:id', requireUser, (req, res, next) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE Id = ?').get(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found.' });
    if (file.owner_id !== req.user.Id && req.user.profile !== 'Admin_c') return res.status(404).json({ message: 'File not found.' });
    res.type(file.type || 'application/octet-stream');
    const inlineSafe = file.type === 'application/pdf' || /^(image|audio|video)\//.test(file.type);
    const disposition = req.query.download === '1' || !inlineSafe ? 'attachment' : 'inline';
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.sendFile(path.join(uploadDir, file.stored_name));
  } catch (err) { next(err); }
});

// Veritas News & Rumor Verification Endpoints
app.post('/api/news/verify', async (req, res, next) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Please provide news text or a claim to verify.' });

    const result = await verifyNewsClaim(text);

    // Record in verification history
    try {
      const historyId = uid();
      const userId = req.session?.userId || null;
      db.prepare(`
        INSERT INTO verification_history (Id, user_id, claim, score, verdict, status, details_json, CreatedOn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        historyId,
        userId,
        result.claim.slice(0, 300),
        result.score,
        result.verdict.label,
        result.status,
        JSON.stringify(result),
        now()
      );
    } catch (saveErr) {
      console.warn('Could not record verification history:', saveErr.message);
    }

    res.json({ success: true, result });
  } catch (err) { next(err); }
});

app.get('/api/news/search', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    const category = String(req.query.category || 'all').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 30);
    const data = await searchWorldNews(query, category, limit);
    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
});

app.get('/api/news/trending', async (req, res, next) => {
  try {
    const data = await getTrendingNewsAndRumors();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

app.get('/api/news/history', (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const rows = db.prepare(`
      SELECT Id, claim, score, verdict, status, CreatedOn
      FROM verification_history
      ORDER BY CreatedOn DESC
      LIMIT ?
    `).all(limit);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(rootDir, 'dist')));
  app.get('*path', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(rootDir, 'dist', 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  const status = Number(err.status) || (err.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 409 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'The server could not complete the request.' : err.message });
});

const port = Number(process.env.PORT || 3001);
await bootstrapAdmin();
app.listen(port, () => console.log(`Veritas API listening on http://localhost:${port}`));