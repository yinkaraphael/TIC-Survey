import { create } from 'zustand';

export type RespondentStep =
  | 'welcome'
  | 'practice-intro'
  | 'practice-q'
  | 'permission'
  | 'practice-record'
  | 'ready'
  | 'question'
  | 'review'
  | 'done';

export interface RespondentAnswer {
  optionIds?: string[];
  textAnswer?: string;
  videoPath?: string;
  hasLocalVideo?: boolean;
}

interface FlowState {
  sessionId: string | null;
  step: RespondentStep;
  practiceIndex: number;
  index: number;
  answers: Record<string, RespondentAnswer>;
  practiceAnswers: Record<string, RespondentAnswer>;
  initSession: (sessionId: string, saved?: { step?: RespondentStep; index?: number; answers?: Record<string, RespondentAnswer> }) => void;
  go: (step: RespondentStep) => void;
  setPracticeIndex: (i: number) => void;
  answerPractice: (qid: string, a: RespondentAnswer) => void;
  answer: (qid: string, a: RespondentAnswer) => void;
  next: (total: number) => void;
  back: () => void;
  jumpTo: (i: number) => void;
  reset: () => void;
}

export const useFlow = create<FlowState>((set, get) => ({
  sessionId: null,
  step: 'welcome',
  practiceIndex: 0,
  index: 0,
  answers: {},
  practiceAnswers: {},
  initSession: (sessionId, saved) =>
    set({
      sessionId,
      step: saved?.step || 'welcome',
      index: saved?.index ?? 0,
      answers: saved?.answers || {},
    }),
  go: (step) => set({ step }),
  setPracticeIndex: (practiceIndex) => set({ practiceIndex }),
  answerPractice: (qid, a) =>
    set((s) => ({
      practiceAnswers: { ...s.practiceAnswers, [qid]: a },
    })),
  answer: (qid, a) =>
    set((s) => ({
      answers: { ...s.answers, [qid]: a },
    })),
  next: (total) => {
    const { index } = get();
    if (index + 1 >= total) {
      set({ step: 'review' });
    } else {
      set({ index: index + 1, step: 'question' });
    }
  },
  back: () => set((s) => ({ index: Math.max(0, s.index - 1) })),
  jumpTo: (i) => set({ index: i, step: 'question' }),
  reset: () =>
    set({
      sessionId: null,
      step: 'welcome',
      practiceIndex: 0,
      index: 0,
      answers: {},
      practiceAnswers: {},
    }),
}));
