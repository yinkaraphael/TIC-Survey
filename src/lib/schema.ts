import { z } from 'zod';

export const optionInputSchema = z.object({
  id: z.string().min(1).optional(),
  videoPath: z.string().min(1, 'Option video is required'),
  thumbPath: z.string().optional(),
  label: z.string().min(1, 'Option label is required'),
});

export const questionInputSchema = z
  .object({
    id: z.string().min(1).optional(),
    kind: z.enum(['single', 'multi', 'signed', 'text']),
    videoPath: z.string().min(1, 'Add a sign language video for this question'),
    thumbPath: z.string().optional(),
    promptText: z.string().min(1, 'Add a question prompt'),
    internalNote: z.string().optional(),
    required: z.boolean().default(true),
    options: z.array(optionInputSchema).max(5).default([]),
  })
  .refine(
    (q) => (q.kind !== 'single' && q.kind !== 'multi') || q.options.length >= 2,
    {
      message: 'Choice questions need at least two options',
      path: ['options'],
    }
  );

export const surveyUpdateSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  introVideoPath: z.string().min(1),
  outroVideoPath: z.string().min(1),
  questions: z.array(questionInputSchema).min(1, 'Add at least one question'),
});

export const respondentStartSchema = z.object({
  slug: z.string().min(1),
  preview: z.boolean().optional(),
});

export const respondentSubmitSchema = z.object({
  sessionId: z.string().min(1),
  answers: z.record(
    z.string(),
    z.object({
      optionIds: z.array(z.string()).optional(),
      textAnswer: z.string().optional(),
      videoPath: z.string().optional(),
    })
  ),
});

export type OptionInput = z.infer<typeof optionInputSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type SurveyUpdateInput = z.infer<typeof surveyUpdateSchema>;
