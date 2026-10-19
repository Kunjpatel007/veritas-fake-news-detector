/**
 * Client service for Veritas News & Rumor Verification and Global Search
 */

export async function verifyNewsOnServer(text) {
  const response = await fetch('/api/news/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Verification request failed.');
  }

  const data = await response.json();
  return data.result;
}

export async function searchWorldNewsOnServer(query = '', category = 'all', limit = 15) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  if (limit) params.set('limit', String(limit));

  const response = await fetch(`/api/news/search?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'News search failed.');
  }

  const data = await response.json();
  return data.data || [];
}

export async function getTrendingNewsOnServer() {
  const response = await fetch('/api/news/trending');

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Could not fetch trending news.');
  }

  const data = await response.json();
  return data.data || { news: [], factChecks: [] };
}

export async function getVerificationHistoryOnServer(limit = 10) {
  try {
    const response = await fetch(`/api/news/history?limit=${limit}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}
