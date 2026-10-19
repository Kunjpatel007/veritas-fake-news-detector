import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veritas-api-smoke-'));
const port = await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port: assignedPort } = server.address();
    server.close((error) => error ? reject(error) : resolve(assignedPort));
  });
});
const origin = `http://127.0.0.1:${port}`;
const testEmail = `admin-${crypto.randomUUID()}@example.test`;
const adminPassword = 'lowerabc';
const memberEmail = `member-${crypto.randomUUID()}@example.test`;
const memberPassword = 'lowerabc';
let output = '';
const server = spawn(process.execPath, ['server/index.js'], {
  cwd: rootDir,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: String(port),
    DATA_DIR: tempDir,
    DATABASE_FILE: path.join(tempDir, 'app.sqlite'),
    SESSION_SECRET: 'smoke-test-session-secret-which-is-long-enough',
    ADMIN_EMAIL: testEmail,
    ADMIN_PASSWORD: adminPassword,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.on('data', (chunk) => { output += chunk.toString(); });
server.stderr.on('data', (chunk) => { output += chunk.toString(); });

async function waitForServer() {
  const end = Date.now() + 10000;
  while (Date.now() < end) {
    if (server.exitCode !== null) throw new Error(`API server exited early.\n${output}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch { }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`API server did not start.\n${output}`);
}

async function call(route, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${origin}${route}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response.json();
  const setCookie = response.headers.getSetCookie?.()[0];
  return { response, value, cookie: setCookie?.split(';')[0] };
}

try {
  await waitForServer();

  const tooShort = await call('/api/auth/register', {
    method: 'POST', body: { email: `short-${crypto.randomUUID()}@example.test`, password: 'lowerab' },
  });
  assert.equal(tooShort.response.status, 400);

  const registered = await call('/api/auth/register', { method: 'POST', body: { email: memberEmail, password: memberPassword } });
  assert.equal(registered.response.status, 201);
  assert.equal(registered.value.user.profile, 'Member_c');
  assert.ok(registered.cookie);

  const current = await call('/api/auth/me', { cookie: registered.cookie });
  assert.equal(current.value.user.Email, memberEmail);

  const createdTicket = await call('/api/data/support_tickets_c', {
    method: 'POST', cookie: registered.cookie,
    body: { Name: 'Smoke test ticket', message_c: 'Testing owned API', admin_reply_c: 'not allowed' },
  });
  assert.equal(createdTicket.response.status, 201);
  assert.equal(createdTicket.value.data[0].Owner.Id, registered.value.user.Id);
  assert.equal(createdTicket.value.data[0].admin_reply_c, '');

  const unauthorizedTickets = await call('/api/data/support_tickets_c');
  assert.equal(unauthorizedTickets.response.status, 401);

  const memberArticleWrite = await call('/api/data/help_articles_c', {
    method: 'POST', cookie: registered.cookie, body: { Name: 'Not allowed' },
  });
  assert.equal(memberArticleWrite.response.status, 403);

  const adminLogin = await call('/api/auth/login', {
    method: 'POST', body: { email: testEmail, password: adminPassword },
  });
  assert.equal(adminLogin.response.status, 200);
  assert.ok(adminLogin.cookie);

  const publishedArticle = await call('/api/data/help_articles_c', {
    method: 'POST', cookie: adminLogin.cookie,
    body: { Name: 'Smoke test article', body_c: 'Visible after publishing.', published_c: false },
  });
  assert.equal(publishedArticle.response.status, 201);
  assert.equal(publishedArticle.value.data[0].published_c, false);

  const hiddenList = await call('/api/data/help_articles_c');
  assert.equal(hiddenList.value.data.some((article) => article.Id === publishedArticle.value.data[0].Id), false);

  await call(`/api/data/help_articles_c/${publishedArticle.value.data[0].Id}`, {
    method: 'PATCH', cookie: adminLogin.cookie, body: { published_c: true },
  });
  const visibleList = await call('/api/data/help_articles_c');
  assert.equal(visibleList.value.data.some((article) => article.Id === publishedArticle.value.data[0].Id), true);

  const otherMemberSession = await call('/api/auth/login', {
    method: 'POST', body: { email: memberEmail, password: memberPassword },
  });
  assert.equal(otherMemberSession.response.status, 200);
  assert.notEqual(otherMemberSession.cookie, registered.cookie);

  const changedPassword = await call('/api/auth/change-password', {
    method: 'POST', cookie: registered.cookie,
    body: { currentPassword: memberPassword, newPassword: 'lowerabd', confirmPassword: 'lowerabd' },
  });
  assert.equal(changedPassword.response.status, 200);
  const currentSession = await call('/api/data/support_tickets_c', { cookie: registered.cookie });
  assert.equal(currentSession.response.status, 200);
  const invalidatedSession = await call('/api/data/support_tickets_c', { cookie: otherMemberSession.cookie });
  assert.equal(invalidatedSession.response.status, 401);

  // News verification & search tests
  const verifiedRumor = await call('/api/news/verify', {
    method: 'POST',
    body: { text: 'UNESCO declared Indian national anthem best in the world' },
  });
  assert.equal(verifiedRumor.response.status, 200);
  assert.equal(verifiedRumor.value.success, true);
  assert.ok(verifiedRumor.value.result.score < 40);
  assert.equal(verifiedRumor.value.result.verdict.key, 'fake');

  const history = await call('/api/news/history');
  assert.equal(history.response.status, 200);
  assert.ok(history.value.data.length >= 1);

  const searchResults = await call('/api/news/search?q=technology&limit=3');
  assert.equal(searchResults.response.status, 200);
  assert.equal(searchResults.value.success, true);

  console.log('API smoke tests passed: registration, sessions, ticket ownership, admin publishing, password invalidation, and news verification engine.');
} catch (error) {
  console.error(error);
  console.error(output);
  process.exitCode = 1;
} finally {
  server.kill();
  await new Promise((resolve) => server.once('exit', resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
}