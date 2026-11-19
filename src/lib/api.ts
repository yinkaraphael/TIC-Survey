import type { Profile, Survey, SessionWithResponses, QuestionResponse } from './types';

const TOKEN_KEY = 'tic_auth_token';

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = { ...(extra || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    setStoredToken(null);
  }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  async login(
    email: string,
    password?: string,
    demo = false
  ): Promise<{ token: string; profile: Profile }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, demo }),
    });
    const data = await handleJson<{ token: string; profile: Profile }>(res);
    setStoredToken(data.token);
    return data;
  },

  async signup(payload: {
    email: string;
    password: string;
    fullName: string;
    organisationName: string;
  }): Promise<{ token: string; profile: Profile }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await handleJson<{ token: string; profile: Profile }>(res);
    setStoredToken(data.token);
    return data;
  },

  async me(): Promise<{ profile: Profile }> {
    const res = await fetch('/api/auth/me', {
      headers: authHeaders(),
      credentials: 'include',
    });
    return handleJson(res);
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
    }).catch(() => {});
    setStoredToken(null);
  },

  async listSurveys(): Promise<{ surveys: Survey[] }> {
    const res = await fetch('/api/surveys', {
      headers: authHeaders(),
      credentials: 'include',
    });
    return handleJson(res);
  },

  async createSurvey(title: string, description?: string): Promise<{ survey: Survey }> {
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ title, description }),
    });
    return handleJson(res);
  },

  async getSurvey(id: string): Promise<{ survey: Survey }> {
    const res = await fetch(`/api/surveys/${encodeURIComponent(id)}`, {
      headers: authHeaders(),
      credentials: 'include',
    });
    return handleJson(res);
  },

  async updateSurvey(
    id: string,
    payload: {
      title: string;
      description?: string;
      introVideoPath: string;
      outroVideoPath: string;
      questions: unknown[];
    }
  ): Promise<{ survey: Survey }> {
    const res = await fetch(`/api/surveys/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async publishSurvey(id: string): Promise<{ survey: Survey }> {
    const res = await fetch(`/api/surveys/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
    });
    return handleJson(res);
  },

  async closeSurvey(id: string): Promise<{ survey: Survey }> {
    const res = await fetch(`/api/surveys/${encodeURIComponent(id)}/close`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
    });
    return handleJson(res);
  },

  async deleteSurvey(id: string): Promise<void> {
    const res = await fetch(`/api/surveys/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(),
      credentials: 'include',
    });
    await handleJson(res);
  },

  async getResponses(id: string): Promise<{ survey: Survey; sessions: SessionWithResponses[] }> {
    const res = await fetch(`/api/surveys/${encodeURIComponent(id)}/responses`, {
      headers: authHeaders(),
      credentials: 'include',
    });
    return handleJson(res);
  },

  async updateResponseReview(
    responseId: string,
    patch: { transcript?: string; reviewed?: boolean }
  ): Promise<{ response: QuestionResponse }> {
    const res = await fetch(`/api/responses/${encodeURIComponent(responseId)}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    return handleJson(res);
  },

  async uploadCreatorMedia(blob: Blob): Promise<{ path: string }> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': blob.type || 'video/webm' }),
      credentials: 'include',
      body: blob,
    });
    return handleJson(res);
  },

  async startRespondent(
    slug: string,
    preview = false
  ): Promise<{ sessionId: string; survey: Survey }> {
    const res = await fetch('/api/respondent/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, preview }),
    });
    return handleJson(res);
  },

  async getRespondentUploadUrl(
    sessionId: string,
    questionId: string
  ): Promise<{ uploadUrl: string }> {
    const res = await fetch('/api/respondent/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId }),
    });
    return handleJson(res);
  },

  async submitRespondent(
    sessionId: string,
    answers: Record<string, { optionIds?: string[]; textAnswer?: string; videoPath?: string }>
  ): Promise<{ ok: boolean }> {
    const res = await fetch('/api/respondent/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, answers }),
    });
    return handleJson(res);
  },
};
