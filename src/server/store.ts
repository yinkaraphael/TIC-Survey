import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  Organisation,
  Profile,
  Survey,
  SurveySession,
  QuestionResponse,
  SessionWithResponses,
} from '../lib/types.ts';

interface StoredProfile extends Profile {
  passwordHash?: string;
}

interface AuthSession {
  token: string;
  profileId: string;
  createdAt: string;
}

interface DatabaseSchema {
  organisations: Organisation[];
  profiles: StoredProfile[];
  authSessions: AuthSession[];
  surveys: Survey[];
  sessions: SurveySession[];
  responses: QuestionResponse[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function createInitialData(): DatabaseSchema {
  const org1Id = '11111111-1111-4111-8111-111111111111';
  const org2Id = '22222222-2222-4222-8222-222222222222';
  const user1Id = 'aaaa1111-1111-4111-8111-111111111111';
  const user2Id = 'bbbb2222-2222-4222-8222-222222222222';
  const survey1Id = '55551111-1111-4111-8111-111111111111';
  const survey2Id = '66662222-2222-4222-8222-222222222222';

  const now = new Date().toISOString();

  const upshiftSurvey: Survey = {
    id: survey1Id,
    organisationId: org1Id,
    title: 'UPSHIFT Youth Inclusion Survey',
    description:
      'Accessible Ghana Sign Language survey for deaf and hard-of-hearing youth applying to the UPSHIFT social innovation programme.',
    slug: 'upshift-2026',
    status: 'published',
    introVideoPath: '/media/presenter-intro.mp4',
    outroVideoPath: '/media/presenter-intro.mp4',
    createdBy: user1Id,
    createdAt: now,
    updatedAt: now,
    questions: [
      {
        id: 'q-age',
        surveyId: survey1Id,
        position: 0,
        kind: 'text',
        required: true,
        videoPath: '/media/presenter-question.mp4',
        thumbPath: '/media/presenter-question.jpg',
        promptText: 'What is your age?',
        internalNote: 'Q1 Demographic age check',
        options: [],
      },
      {
        id: 'q-gender',
        surveyId: survey1Id,
        position: 1,
        kind: 'single',
        required: true,
        videoPath: '/media/presenter-question.mp4',
        thumbPath: '/media/presenter-question.jpg',
        promptText: 'What gender do you identify as?',
        internalNote: 'Q2 Gender single choice',
        options: [
          {
            id: 'opt-gender-male',
            questionId: 'q-gender',
            position: 0,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Male',
          },
          {
            id: 'opt-gender-female',
            questionId: 'q-gender',
            position: 1,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Female',
          },
          {
            id: 'opt-gender-other',
            questionId: 'q-gender',
            position: 2,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Other',
          },
        ],
      },
      {
        id: 'q-family',
        surveyId: survey1Id,
        position: 2,
        kind: 'single',
        required: true,
        videoPath: '/media/presenter-question.mp4',
        thumbPath: '/media/presenter-question.jpg',
        promptText: 'How many people stay in your family home?',
        internalNote: 'Q3 Household size',
        options: [
          {
            id: 'opt-fam-1-4',
            questionId: 'q-family',
            position: 0,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: '1-4',
          },
          {
            id: 'opt-fam-5-7',
            questionId: 'q-family',
            position: 1,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: '5-7',
          },
          {
            id: 'opt-fam-8-10',
            questionId: 'q-family',
            position: 2,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: '8-10',
          },
          {
            id: 'opt-fam-10plus',
            questionId: 'q-family',
            position: 3,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Above 10',
          },
          {
            id: 'opt-fam-prefer',
            questionId: 'q-family',
            position: 4,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Prefer not to say',
          },
        ],
      },
      {
        id: 'q-skills',
        surveyId: survey1Id,
        position: 3,
        kind: 'multi',
        required: true,
        videoPath: '/media/presenter-question.mp4',
        thumbPath: '/media/presenter-question.jpg',
        promptText: 'Which areas excite you most to explore in UPSHIFT?',
        internalNote: 'Q4 Multi-select interests',
        options: [
          {
            id: 'opt-skill-tech',
            questionId: 'q-skills',
            position: 0,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Digital Skills',
          },
          {
            id: 'opt-skill-biz',
            questionId: 'q-skills',
            position: 1,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Small Business',
          },
          {
            id: 'opt-skill-edu',
            questionId: 'q-skills',
            position: 2,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Community Advocacy',
          },
        ],
      },
      {
        id: 'q-upshift-why',
        surveyId: survey1Id,
        position: 4,
        kind: 'signed',
        required: true,
        videoPath: '/media/presenter-question.mp4',
        thumbPath: '/media/presenter-question.jpg',
        promptText: 'Why do you want to participate in the UPSHIFT programme?',
        internalNote: 'Q5 Open GSL signed video motivation',
        options: [],
      },
    ],
  };

  const schoolSurvey: Survey = {
    id: survey2Id,
    organisationId: org2Id,
    title: 'Term 2 Campus Accessibility Check',
    description: 'Private survey belonging to Accra School for the Deaf.',
    slug: 'accra-campus-term-2',
    status: 'published',
    introVideoPath: '/media/presenter-intro.mp4',
    outroVideoPath: '/media/presenter-intro.mp4',
    createdBy: user2Id,
    createdAt: now,
    updatedAt: now,
    questions: [
      {
        id: 'q-accra-1',
        surveyId: survey2Id,
        position: 0,
        kind: 'single',
        required: true,
        videoPath: '/media/presenter-question.mp4',
        thumbPath: '/media/presenter-question.jpg',
        promptText: 'Do you feel safe in the learning spaces at school?',
        internalNote: 'Campus safety indicator',
        options: [
          {
            id: 'opt-accra-yes',
            questionId: 'q-accra-1',
            position: 0,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Yes, always',
          },
          {
            id: 'opt-accra-sometimes',
            questionId: 'q-accra-1',
            position: 1,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Sometimes',
          },
        ],
      },
    ],
  };

  const sampleSession1: SurveySession = {
    id: 'sess-sample-1',
    surveyId: survey1Id,
    status: 'completed',
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 240000).toISOString(),
  };

  const sampleSession2: SurveySession = {
    id: 'sess-sample-2',
    surveyId: survey1Id,
    status: 'completed',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000 + 310000).toISOString(),
  };

  const sampleResponses: QuestionResponse[] = [
    {
      id: 'resp-1-1',
      sessionId: 'sess-sample-1',
      questionId: 'q-age',
      textAnswer: '19',
      reviewed: true,
      updatedAt: now,
    },
    {
      id: 'resp-1-2',
      sessionId: 'sess-sample-1',
      questionId: 'q-gender',
      optionIds: ['opt-gender-male'],
      reviewed: true,
      updatedAt: now,
    },
    {
      id: 'resp-1-3',
      sessionId: 'sess-sample-1',
      questionId: 'q-family',
      optionIds: ['opt-fam-1-4'],
      reviewed: true,
      updatedAt: now,
    },
    {
      id: 'resp-1-4',
      sessionId: 'sess-sample-1',
      questionId: 'q-skills',
      optionIds: ['opt-skill-tech', 'opt-skill-biz'],
      reviewed: true,
      updatedAt: now,
    },
    {
      id: 'resp-1-5',
      sessionId: 'sess-sample-1',
      questionId: 'q-upshift-why',
      videoPath: '/media/presenter-question.mp4',
      transcript: 'I want to build accessible mobile tools for deaf youth in Kumasi.',
      reviewed: true,
      updatedAt: now,
    },
    {
      id: 'resp-2-1',
      sessionId: 'sess-sample-2',
      questionId: 'q-age',
      textAnswer: '21',
      reviewed: false,
      updatedAt: now,
    },
    {
      id: 'resp-2-2',
      sessionId: 'sess-sample-2',
      questionId: 'q-gender',
      optionIds: ['opt-gender-female'],
      reviewed: false,
      updatedAt: now,
    },
    {
      id: 'resp-2-3',
      sessionId: 'sess-sample-2',
      questionId: 'q-family',
      optionIds: ['opt-fam-5-7'],
      reviewed: false,
      updatedAt: now,
    },
    {
      id: 'resp-2-4',
      sessionId: 'sess-sample-2',
      questionId: 'q-skills',
      optionIds: ['opt-skill-edu'],
      reviewed: false,
      updatedAt: now,
    },
    {
      id: 'resp-2-5',
      sessionId: 'sess-sample-2',
      questionId: 'q-upshift-why',
      videoPath: '/media/presenter-intro.mp4',
      transcript: '',
      reviewed: false,
      updatedAt: now,
    },
  ];

  return {
    organisations: [
      { id: org1Id, name: 'UNICEF Ghana & TIC', createdAt: now },
      { id: org2Id, name: 'Accra School for the Deaf', createdAt: now },
    ],
    profiles: [
      {
        id: user1Id,
        email: 'staff@ticsurvey.org',
        fullName: 'Kwame Boateng',
        organisationId: org1Id,
        organisationName: 'UNICEF Ghana & TIC',
        role: 'owner',
      },
      {
        id: user2Id,
        email: 'research@accradeaf.edu.gh',
        fullName: 'Abena Mensah',
        organisationId: org2Id,
        organisationName: 'Accra School for the Deaf',
        role: 'owner',
      },
    ],
    authSessions: [],
    surveys: [upshiftSurvey, schoolSurvey],
    sessions: [sampleSession1, sampleSession2],
    responses: sampleResponses,
  };
}

function readDb(): DatabaseSchema {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) {
    const initial = createInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    const initial = createInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function writeDb(db: DatabaseSchema) {
  ensureDirs();
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

export function getUploadDir() {
  ensureDirs();
  return UPLOAD_DIR;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function toPublicProfile(p: StoredProfile): Profile {
  return {
    id: p.id,
    email: p.email,
    fullName: p.fullName,
    organisationId: p.organisationId,
    organisationName: p.organisationName,
    role: p.role,
  };
}

export function signupProfile(input: {
  email: string;
  password: string;
  fullName: string;
  organisationName: string;
}): { token?: string; profile?: Profile; error?: string; status?: number } {
  const db = readDb();
  const normalized = input.email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return { error: 'Enter a valid email address.', status: 400 };
  }
  if (input.password.length < 6) {
    return { error: 'Password must be at least 6 characters.', status: 400 };
  }

  const existing = db.profiles.find((p) => p.email.toLowerCase() === normalized);
  if (existing) {
    return {
      error: 'An account with this email already exists. Please sign in.',
      status: 409,
    };
  }

  const orgTitle = (input.organisationName || 'Independent Research Team').trim();
  let org = db.organisations.find(
    (o) => o.name.toLowerCase() === orgTitle.toLowerCase()
  );
  if (!org) {
    org = {
      id: crypto.randomUUID(),
      name: orgTitle,
      createdAt: new Date().toISOString(),
    };
    db.organisations.push(org);
  }

  const created: StoredProfile = {
    id: crypto.randomUUID(),
    email: normalized,
    fullName: input.fullName.trim() || normalized.split('@')[0] || 'Creator',
    organisationId: org.id,
    organisationName: org.name,
    role: 'owner',
    passwordHash: hashPassword(input.password),
  };
  db.profiles.push(created);

  const token = crypto.randomBytes(24).toString('hex');
  db.authSessions.push({
    token,
    profileId: created.id,
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  return { token, profile: toPublicProfile(created) };
}

export function loginProfile(input: {
  email: string;
  password?: string;
  demo?: boolean;
}): { token?: string; profile?: Profile; error?: string; status?: number } {
  const db = readDb();
  const normalized = input.email.trim().toLowerCase();
  const profile = db.profiles.find((p) => p.email.toLowerCase() === normalized);

  if (!profile) {
    return {
      error: 'No account found with that email. Switch to Sign Up to create one.',
      status: 401,
    };
  }

  if (!input.demo && profile.passwordHash) {
    if (!input.password || !verifyPassword(input.password, profile.passwordHash)) {
      return { error: 'Incorrect email or password.', status: 401 };
    }
  }

  const token = crypto.randomBytes(24).toString('hex');
  db.authSessions.push({
    token,
    profileId: profile.id,
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  return { token, profile: toPublicProfile(profile) };
}

export function getProfileByToken(token?: string | null): Profile | null {
  if (!token) return null;
  const db = readDb();
  const auth = db.authSessions.find((s) => s.token === token);
  if (!auth) return null;
  const found = db.profiles.find((p) => p.id === auth.profileId);
  return found ? toPublicProfile(found) : null;
}

export function logoutToken(token?: string | null) {
  if (!token) return;
  const db = readDb();
  db.authSessions = db.authSessions.filter((s) => s.token !== token);
  writeDb(db);
}

export function listSurveysForOrg(organisationId: string): Survey[] {
  const db = readDb();
  return db.surveys
    .filter((s) => s.organisationId === organisationId)
    .map((s) => ({
      ...s,
      responseCount: db.sessions.filter(
        (sess) => sess.surveyId === s.id && sess.status === 'completed'
      ).length,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSurveyForOrg(surveyId: string, organisationId: string): Survey | null {
  const db = readDb();
  const survey = db.surveys.find(
    (s) => s.id === surveyId && s.organisationId === organisationId
  );
  if (!survey) return null;
  return {
    ...survey,
    responseCount: db.sessions.filter(
      (sess) => sess.surveyId === survey.id && sess.status === 'completed'
    ).length,
  };
}

export function createSurveyForOrg(
  profile: Profile,
  title: string,
  description?: string
): Survey {
  const db = readDb();
  const id = crypto.randomUUID();
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32) || 'survey';
  const slug = `${baseSlug}-${id.slice(0, 6)}`;
  const now = new Date().toISOString();

  const survey: Survey = {
    id,
    organisationId: profile.organisationId,
    title: title.trim(),
    description: description?.trim() || '',
    slug,
    status: 'draft',
    introVideoPath: '/media/presenter-intro.mp4',
    outroVideoPath: '/media/presenter-intro.mp4',
    createdBy: profile.id,
    createdAt: now,
    updatedAt: now,
    questions: [
      {
        id: crypto.randomUUID(),
        surveyId: id,
        position: 0,
        kind: 'single',
        required: true,
        videoPath: '/media/presenter-question.mp4',
        thumbPath: '/media/presenter-question.jpg',
        promptText: 'Sample Question 1',
        internalNote: 'Edit this question and upload your GSL sign video',
        options: [
          {
            id: crypto.randomUUID(),
            questionId: '',
            position: 0,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Yes',
          },
          {
            id: crypto.randomUUID(),
            questionId: '',
            position: 1,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'No',
          },
        ],
      },
    ],
  };

  survey.questions[0].options.forEach((o) => {
    o.questionId = survey.questions[0].id;
  });

  db.surveys.push(survey);
  writeDb(db);
  return survey;
}

export function updateSurveyForOrg(
  surveyId: string,
  organisationId: string,
  patch: {
    title: string;
    description?: string;
    introVideoPath: string;
    outroVideoPath: string;
    questions: Array<{
      id?: string;
      kind: 'single' | 'multi' | 'signed' | 'text';
      videoPath: string;
      thumbPath?: string;
      promptText: string;
      internalNote?: string;
      required: boolean;
      options: Array<{
        id?: string;
        videoPath: string;
        thumbPath?: string;
        label: string;
      }>;
    }>;
  }
): Survey | null {
  const db = readDb();
  const idx = db.surveys.findIndex(
    (s) => s.id === surveyId && s.organisationId === organisationId
  );
  if (idx === -1) return null;

  const existing = db.surveys[idx];
  const updatedQuestions = patch.questions.map((q, qIdx) => {
    const qId = q.id || crypto.randomUUID();
    return {
      id: qId,
      surveyId,
      position: qIdx,
      kind: q.kind,
      required: q.required,
      videoPath: q.videoPath,
      thumbPath: q.thumbPath || '/media/presenter-question.jpg',
      promptText: q.promptText,
      internalNote: q.internalNote || '',
      options: (q.kind === 'single' || q.kind === 'multi' ? q.options : []).map(
        (o, oIdx) => ({
          id: o.id || crypto.randomUUID(),
          questionId: qId,
          position: oIdx,
          videoPath: o.videoPath,
          thumbPath: o.thumbPath || '/media/presenter-option.jpg',
          label: o.label,
        })
      ),
    };
  });

  const updated: Survey = {
    ...existing,
    title: patch.title.trim(),
    description: patch.description?.trim() || '',
    introVideoPath: patch.introVideoPath,
    outroVideoPath: patch.outroVideoPath,
    updatedAt: new Date().toISOString(),
    questions: updatedQuestions,
  };

  db.surveys[idx] = updated;
  writeDb(db);
  return updated;
}

export function setSurveyStatusForOrg(
  surveyId: string,
  organisationId: string,
  status: 'draft' | 'published' | 'closed'
): { survey?: Survey; error?: string } {
  const db = readDb();
  const idx = db.surveys.findIndex(
    (s) => s.id === surveyId && s.organisationId === organisationId
  );
  if (idx === -1) return { error: 'Survey not found' };

  const survey = db.surveys[idx];
  if (status === 'published') {
    if (survey.questions.length === 0) {
      return { error: 'Add at least one question before publishing.' };
    }
    for (const q of survey.questions) {
      if (!q.videoPath) {
        return { error: `Question "${q.promptText}" needs a sign language video.` };
      }
      if ((q.kind === 'single' || q.kind === 'multi') && q.options.length < 2) {
        return { error: `Choice question "${q.promptText}" needs at least two options.` };
      }
    }
  }

  db.surveys[idx] = {
    ...survey,
    status,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return { survey: db.surveys[idx] };
}

export function deleteSurveyForOrg(surveyId: string, organisationId: string): boolean {
  const db = readDb();
  const before = db.surveys.length;
  db.surveys = db.surveys.filter(
    (s) => !(s.id === surveyId && s.organisationId === organisationId)
  );
  if (db.surveys.length === before) return false;
  writeDb(db);
  return true;
}

export function getResponsesForSurvey(
  surveyId: string,
  organisationId: string
): { survey: Survey; sessions: SessionWithResponses[] } | null {
  const db = readDb();
  const survey = db.surveys.find(
    (s) => s.id === surveyId && s.organisationId === organisationId
  );
  if (!survey) return null;

  const surveySessions = db.sessions
    .filter((s) => s.surveyId === surveyId && s.status === 'completed')
    .sort((a, b) => (b.completedAt || b.startedAt).localeCompare(a.completedAt || a.startedAt))
    .map((session) => ({
      ...session,
      responses: db.responses.filter((r) => r.sessionId === session.id),
    }));

  return { survey, sessions: surveySessions };
}

export function updateResponseReview(
  responseId: string,
  organisationId: string,
  patch: { transcript?: string; reviewed?: boolean }
): QuestionResponse | null {
  const db = readDb();
  const respIdx = db.responses.findIndex((r) => r.id === responseId);
  if (respIdx === -1) return null;

  const resp = db.responses[respIdx];
  const session = db.sessions.find((s) => s.id === resp.sessionId);
  if (!session) return null;

  const survey = db.surveys.find(
    (sv) => sv.id === session.surveyId && sv.organisationId === organisationId
  );
  if (!survey) return null;

  const updated: QuestionResponse = {
    ...resp,
    transcript: patch.transcript !== undefined ? patch.transcript : resp.transcript,
    reviewed: patch.reviewed !== undefined ? patch.reviewed : resp.reviewed,
    updatedAt: new Date().toISOString(),
  };
  db.responses[respIdx] = updated;
  writeDb(db);
  return updated;
}

export function startRespondentSession(
  slug: string,
  preview = false
): { session?: SurveySession; survey?: Survey; error?: string } {
  const db = readDb();
  const survey = db.surveys.find((s) => s.slug === slug);
  if (!survey) return { error: 'Survey not found' };
  if (!preview && survey.status !== 'published') {
    return { error: 'This survey is not currently accepting responses.' };
  }

  const session: SurveySession = {
    id: crypto.randomUUID(),
    surveyId: survey.id,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
  };
  db.sessions.push(session);
  writeDb(db);
  return { session, survey };
}

export function validateActiveSession(sessionId: string): SurveySession | null {
  const db = readDb();
  const session = db.sessions.find((s) => s.id === sessionId);
  if (!session || session.status !== 'in_progress') return null;
  return session;
}

export function submitRespondentAnswers(
  sessionId: string,
  answers: Record<
    string,
    { optionIds?: string[]; textAnswer?: string; videoPath?: string }
  >
): { ok?: boolean; error?: string } {
  const db = readDb();
  const sessIdx = db.sessions.findIndex((s) => s.id === sessionId);
  if (sessIdx === -1) return { error: 'Invalid session' };

  const session = db.sessions[sessIdx];
  if (session.status !== 'in_progress') {
    return { error: 'Session already completed' };
  }

  const survey = db.surveys.find((s) => s.id === session.surveyId);
  if (!survey) return { error: 'Survey not found' };

  for (const q of survey.questions) {
    if (!q.required) continue;
    const ans = answers[q.id];
    if (!ans) return { error: `Please answer: ${q.promptText}` };
    if ((q.kind === 'single' || q.kind === 'multi') && (!ans.optionIds || ans.optionIds.length === 0)) {
      return { error: `Please choose an option for: ${q.promptText}` };
    }
    if (q.kind === 'text' && !ans.textAnswer?.trim()) {
      return { error: `Please enter an answer for: ${q.promptText}` };
    }
    if (q.kind === 'signed' && !ans.videoPath) {
      return { error: `Please record a video answer for: ${q.promptText}` };
    }
  }

  const now = new Date().toISOString();
  db.responses = db.responses.filter((r) => r.sessionId !== sessionId);

  for (const q of survey.questions) {
    const ans = answers[q.id];
    if (!ans) continue;
    db.responses.push({
      id: crypto.randomUUID(),
      sessionId,
      questionId: q.id,
      optionIds: ans.optionIds,
      textAnswer: ans.textAnswer,
      videoPath: ans.videoPath,
      transcript: '',
      reviewed: false,
      updatedAt: now,
    });
  }

  db.sessions[sessIdx] = {
    ...session,
    status: 'completed',
    completedAt: now,
  };
  writeDb(db);
  return { ok: true };
}
