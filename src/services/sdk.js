async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const contentType = response.headers.get('content-type') ?? '';
  const value = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    throw Object.assign(new Error(value?.message || `Request failed (${response.status})`), { status: response.status, body: value });
  }
  return value;
}

async function requestFile(path) {
  const response = await fetch(path, { credentials: 'same-origin' });
  if (!response.ok) {
    const message = await response.json().catch(() => ({}));
    throw new Error(message.message || `File request failed (${response.status})`);
  }
  return response.blob();
}

function queryParam(query) {
  return `?q=${encodeURIComponent(JSON.stringify(query))}`;
}

class TableQuery {
  constructor(table) {
    this.table = table;
    this.query = {};
  }

  select(fields) {
    this.query.fields = fields.map((field) => typeof field === 'string' ? field : field.field);
    return this;
  }

  where(filter) {
    this.query.where = this.query.where ? { op: 'and', items: [this.query.where, filter] } : filter;
    return this;
  }

  orderBy(field) {
    this.query.sort = { field, direction: 'asc' };
    return this;
  }

  orderByDesc(field) {
    this.query.sort = { field, direction: 'desc' };
    return this;
  }

  limit(limit, offset = 0) {
    this.query.limit = limit;
    this.query.offset = offset;
    return this;
  }

  page(page, pageSize) {
    this.query.limit = pageSize;
    this.query.offset = (page - 1) * pageSize;
    return this;
  }

  aggregate(items) {
    this.query.aggregate = items;
    return this;
  }

  fetch() {
    return request(`/api/data/${encodeURIComponent(this.table)}${queryParam(this.query)}`);
  }

  async get(id) {
    const result = await request(`/api/data/${encodeURIComponent(this.table)}/${encodeURIComponent(id)}`);
    return { ...result, data: result.data };
  }

  create(data) {
    return request(`/api/data/${encodeURIComponent(this.table)}`, { method: 'POST', body: JSON.stringify(data) });
  }

  update(data) {
    return request(`/api/data/${encodeURIComponent(this.table)}/${encodeURIComponent(data.Id)}`, {
      method: 'PATCH', body: JSON.stringify(data),
    });
  }

  remove(id) {
    return request(`/api/data/${encodeURIComponent(this.table)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}

const listeners = new Set();
let currentUser = null;
let initFailed = false;

function emitSession() {
  const status = currentUser ? 'authenticated' : 'anonymous';
  for (const listener of listeners) listener({ status, user: currentUser });
}

async function authResult(path, body) {
  try {
    const result = await request(path, { method: 'POST', body: JSON.stringify(body) });
    if (result.user) currentUser = result.user;
    initFailed = false;
    emitSession();
    return { ok: true, value: result.user ?? result };
  } catch (error) {
    return { ok: false, error: { message: error.message, status: error.status } };
  }
}

const session = {
  get initFailed() { return initFailed; },
  user: () => currentUser,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async getUser() {
    try {
      const result = await request('/api/auth/me');
      currentUser = result.user;
      initFailed = false;
      return currentUser;
    } catch (error) {
      initFailed = true;
      currentUser = null;
      throw error;
    }
  },
  async retry() {
    try {
      await this.getUser();
      emitSession();
    } catch {
      initFailed = true;
    }
  },
  login: (credentials) => authResult('/api/auth/login', credentials),
  register: (credentials) => authResult('/api/auth/register', credentials),
  changePassword: (credentials) => authResult('/api/auth/change-password', credentials),
  sendResetLink: (credentials) => authResult('/api/auth/forgot-password', credentials),
  resetPassword: (credentials) => authResult('/api/auth/reset-password', credentials),
  acceptInvitation: (credentials) => authResult('/api/auth/accept-invitation', credentials),
  async logout() {
    try { await request('/api/auth/logout', { method: 'POST' }); } catch {}
    finally { currentUser = null; emitSession(); }
  },
};

const admin = {
  async get(_resource, id) { return request(`/api/admin/users/${encodeURIComponent(id)}`); },
  async fetch(_resource, options = {}) {
    const pagingInfo = options.pagingInfo ?? {};
    const query = new URLSearchParams({ limit: pagingInfo.limit ?? 50, offset: pagingInfo.offset ?? 0 });
    return request(`/api/admin/users?${query}`);
  },
  async update(_resource, data) {
    return request(`/api/admin/users/${encodeURIComponent(data.Id)}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
};

const teams = {
  getMembers: (offset = 0, limit = 20) => request(`/api/team/members?offset=${offset}&limit=${limit}`),
  getInvitedMembers: (offset = 0, limit = 20) => request(`/api/team/invitations?offset=${offset}&limit=${limit}`),
  inviteUsers: ({ invitations }) => request('/api/team/invitations', { method: 'POST', body: JSON.stringify({ invitations }) }),
  updateMemberProfile: (id, data) => request(`/api/team/members/${encodeURIComponent(id)}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMember: (id) => request(`/api/team/members/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  resendInvitation: (id) => request(`/api/team/invitations/${encodeURIComponent(id)}/resend`, { method: 'POST', body: '{}' }),
  deleteInvitation: (id) => request(`/api/team/invitations/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

const storage = {
  validate(file, config = {}) {
    const extensions = String(config.supportedExtensions ?? '').split(',').map((ext) => ext.trim().toLowerCase()).filter(Boolean);
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    const sizeKb = file.size / 1024;
    if (extensions.length && !extensions.includes(ext)) return { valid: false, error: `File type ${ext} is not supported.` };
    if (sizeKb < (Number(config.minValue) || 0)) return { valid: false, error: 'File is too small.' };
    if (Number(config.maxValue) > 0 && sizeKb > Number(config.maxValue)) return { valid: false, error: 'File is too large.' };
    return { valid: true };
  },
  async upload(file, options = {}) {
    const form = new FormData();
    form.append('file', file);
    const result = await request('/api/files', { method: 'POST', body: form });
    options.onProgress?.(100);
    return result;
  },
  async preview(file) {
    const blob = await requestFile(`/api/files/${encodeURIComponent(file.Id)}`);
    return { url: URL.createObjectURL(blob) };
  },
  async download(file) {
    const blob = await requestFile(`/api/files/${encodeURIComponent(file.Id)}?download=1`);
    return { url: URL.createObjectURL(blob), name: file.Name };
  },
};

export const sdk = {
  session,
  admin,
  teams,
  storage,
  table: (table) => new TableQuery(table),
  functions: {
    async invoke(name, body) {
      return request(`/api/functions/${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify(body) });
    },
  },
};
