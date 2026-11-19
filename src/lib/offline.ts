import { set, get, del } from 'idb-keyval';

export interface SavedRespondentProgress {
  sessionId: string;
  slug: string;
  step: string;
  index: number;
  answers: Record<
    string,
    {
      optionIds?: string[];
      textAnswer?: string;
      hasLocalVideo?: boolean;
      videoPath?: string;
    }
  >;
  updatedAt: number;
}

export const saveRecording = (sid: string, qid: string, blob: Blob) =>
  set(`tic:rec:${sid}:${qid}`, blob);

export const loadRecording = (sid: string, qid: string) =>
  get<Blob>(`tic:rec:${sid}:${qid}`);

export const clearRecording = (sid: string, qid: string) =>
  del(`tic:rec:${sid}:${qid}`);

export const saveProgress = (slug: string, progress: SavedRespondentProgress) =>
  set(`tic:progress:${slug}`, progress);

export const loadProgress = (slug: string) =>
  get<SavedRespondentProgress>(`tic:progress:${slug}`);

export const clearProgress = (slug: string) =>
  del(`tic:progress:${slug}`);

export async function uploadWithRetry(
  url: string,
  blob: Blob,
  tries = 4
): Promise<{ ok: boolean; videoPath?: string }> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': blob.type || 'video/webm',
        },
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { videoPath?: string };
        return { ok: true, videoPath: data.videoPath };
      }
    } catch {
      // Network offline or transient error, retry with exponential backoff
    }
    if (i < tries - 1) {
      await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    }
  }
  return { ok: false };
}
