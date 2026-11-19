export type QuestionKind = 'single' | 'multi' | 'signed' | 'text';
export type SurveyStatus = 'draft' | 'published' | 'closed';
export type UserRole = 'owner' | 'creator' | 'reviewer';

export interface Organisation {
  id: string;
  name: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  organisationId: string;
  organisationName: string;
  role: UserRole;
}

export interface SurveyOption {
  id: string;
  questionId: string;
  position: number;
  videoPath: string;
  thumbPath?: string;
  label: string;
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  position: number;
  kind: QuestionKind;
  required: boolean;
  videoPath: string;
  thumbPath?: string;
  promptText: string;
  internalNote?: string;
  options: SurveyOption[];
}

export interface Survey {
  id: string;
  organisationId: string;
  title: string;
  description?: string;
  slug: string;
  status: SurveyStatus;
  introVideoPath: string;
  outroVideoPath: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  questions: SurveyQuestion[];
  responseCount?: number;
}

export interface SurveySession {
  id: string;
  surveyId: string;
  status: 'in_progress' | 'completed';
  startedAt: string;
  completedAt?: string;
}

export interface QuestionResponse {
  id: string;
  sessionId: string;
  questionId: string;
  optionIds?: string[];
  textAnswer?: string;
  videoPath?: string;
  transcript?: string;
  reviewed: boolean;
  updatedAt: string;
}

export interface SessionWithResponses extends SurveySession {
  responses: QuestionResponse[];
}
