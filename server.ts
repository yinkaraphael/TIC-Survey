import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import {
  surveyUpdateSchema,
  respondentStartSchema,
  respondentSubmitSchema,
} from './src/lib/schema.ts';
import {
  getUploadDir,
  signupProfile,
  loginProfile,
  getProfileByToken,
  logoutToken,
  listSurveysForOrg,
  getSurveyForOrg,
  createSurveyForOrg,
  updateSurveyForOrg,
  setSurveyStatusForOrg,
  deleteSurveyForOrg,
  getResponsesForSurvey,
  updateResponseReview,
  startRespondentSession,
  validateActiveSession,
  submitRespondentAnswers,
} from './src/server/store.ts';

const isProd = process.env.NODE_ENV === 'production';

function resolvePort(): number {
  const portFlagIdx = process.argv.indexOf('--port');
  if (portFlagIdx !== -1 && process.argv[portFlagIdx + 1]) {
    const parsed = Number(process.argv[portFlagIdx + 1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (isProd && process.env.PORT) {
    const parsed = Number(process.env.PORT);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}

const PORT = resolvePort();

function getTokenFromReq(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)tic_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function startServer() {
  const app = express();

  // Raw binary media uploads (creator question videos & respondent signed answers)
  app.put(
    '/api/respondent/upload/:sessionId/:questionId',
    express.raw({ type: '*/*', limit: '60mb' }),
    (req, res) => {
      const { sessionId, questionId } = req.params;
      const session = validateActiveSession(sessionId);
      if (!session) {
        return res.status(403).json({ error: 'Invalid or completed session' });
      }
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Empty video payload' });
      }
      const contentType = String(req.headers['content-type'] || 'video/webm');
      const ext = contentType.includes('mp4') ? 'mp4' : 'webm';
      const safeName = `resp_${sessionId.replace(/[^a-zA-Z0-9-]/g, '')}_${questionId.replace(/[^a-zA-Z0-9-]/g, '')}_${Date.now()}.${ext}`;
      const filePath = path.join(getUploadDir(), safeName);
      fs.writeFileSync(filePath, req.body);
      return res.json({ videoPath: `/api/media/${safeName}` });
    }
  );

  app.post(
    '/api/upload',
    express.raw({ type: '*/*', limit: '60mb' }),
    (req, res) => {
      const profile = getProfileByToken(getTokenFromReq(req));
      if (!profile) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Empty upload payload' });
      }
      const contentType = String(req.headers['content-type'] || 'video/mp4');
      let ext = 'mp4';
      if (contentType.includes('webm')) ext = 'webm';
      else if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';

      const filename = `creator_${crypto.randomUUID()}.${ext}`;
      fs.writeFileSync(path.join(getUploadDir(), filename), req.body);
      return res.json({ path: `/api/media/${filename}` });
    }
  );

  app.use(express.json({ limit: '5mb' }));

  // Serve uploaded media files with proper Range support for HTML5 video scrubbing
  app.get('/api/media/:filename', (req, res) => {
    const safeFile = path.basename(req.params.filename);
    const fullPath = path.join(getUploadDir(), safeFile);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Media not found' });
    }
    return res.sendFile(fullPath);
  });

  function setAuthCookie(req: express.Request, res: express.Response, token: string) {
    const isHttps =
      req.secure || req.headers['x-forwarded-proto'] === 'https';
    const flags = isHttps
      ? 'Path=/; HttpOnly; SameSite=None; Secure; Max-Age=604800'
      : 'Path=/; HttpOnly; SameSite=Lax; Max-Age=604800';
    res.setHeader('Set-Cookie', `tic_token=${encodeURIComponent(token)}; ${flags}`);
  }

  // Auth routes
  app.post('/api/auth/signup', (req, res) => {
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    const fullName = String(req.body?.fullName || '').trim();
    const organisationName = String(req.body?.organisationName || '').trim();
    const result = signupProfile({ email, password, fullName, organisationName });
    if (result.error || !result.token || !result.profile) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    setAuthCookie(req, res, result.token);
    return res.status(201).json({ token: result.token, profile: result.profile });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body?.email || '').trim();
    const password =
      typeof req.body?.password === 'string' ? req.body.password : undefined;
    const demo = Boolean(req.body?.demo);
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    const result = loginProfile({ email, password, demo });
    if (result.error || !result.token || !result.profile) {
      return res.status(result.status || 401).json({ error: result.error });
    }
    setAuthCookie(req, res, result.token);
    return res.json({ token: result.token, profile: result.profile });
  });

  app.get('/api/auth/me', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Not signed in' });
    return res.json({ profile });
  });

  app.post('/api/auth/logout', (req, res) => {
    logoutToken(getTokenFromReq(req));
    res.setHeader('Set-Cookie', 'tic_token=; Path=/; HttpOnly; Max-Age=0');
    return res.json({ ok: true });
  });

  // Creator Survey routes (organisation-scoped)
  app.get('/api/surveys', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    return res.json({ surveys: listSurveysForOrg(profile.organisationId) });
  });

  app.post('/api/surveys', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    if (title.length < 2) {
      return res.status(400).json({ error: 'Survey title must be at least 2 characters' });
    }
    const survey = createSurveyForOrg(profile, title, description);
    return res.status(201).json({ survey });
  });

  app.get('/api/surveys/:id', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const survey = getSurveyForOrg(req.params.id, profile.organisationId);
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    return res.json({ survey });
  });

  app.put('/api/surveys/:id', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const parsed = surveyUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid survey payload',
      });
    }
    const updated = updateSurveyForOrg(
      req.params.id,
      profile.organisationId,
      parsed.data
    );
    if (!updated) return res.status(404).json({ error: 'Survey not found' });
    return res.json({ survey: updated });
  });

  app.post('/api/surveys/:id/publish', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const result = setSurveyStatusForOrg(
      req.params.id,
      profile.organisationId,
      'published'
    );
    if (result.error) return res.status(400).json({ error: result.error });
    return res.json({ survey: result.survey });
  });

  app.post('/api/surveys/:id/close', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const result = setSurveyStatusForOrg(
      req.params.id,
      profile.organisationId,
      'closed'
    );
    if (result.error) return res.status(400).json({ error: result.error });
    return res.json({ survey: result.survey });
  });

  app.delete('/api/surveys/:id', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const deleted = deleteSurveyForOrg(req.params.id, profile.organisationId);
    if (!deleted) return res.status(404).json({ error: 'Survey not found' });
    return res.json({ ok: true });
  });

  app.get('/api/surveys/:id/responses', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const data = getResponsesForSurvey(req.params.id, profile.organisationId);
    if (!data) return res.status(404).json({ error: 'Survey not found' });
    return res.json(data);
  });

  app.patch('/api/responses/:id', (req, res) => {
    const profile = getProfileByToken(getTokenFromReq(req));
    if (!profile) return res.status(401).json({ error: 'Unauthorized' });
    const updated = updateResponseReview(req.params.id, profile.organisationId, {
      transcript:
        typeof req.body?.transcript === 'string' ? req.body.transcript : undefined,
      reviewed:
        typeof req.body?.reviewed === 'boolean' ? req.body.reviewed : undefined,
    });
    if (!updated) return res.status(404).json({ error: 'Response not found' });
    return res.json({ response: updated });
  });

  // Public Respondent API (anonymous, no login)
  app.post('/api/respondent/start', (req, res) => {
    const parsed = respondentStartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Bad request' });
    }
    const result = startRespondentSession(parsed.data.slug, parsed.data.preview);
    if (result.error || !result.session || !result.survey) {
      return res.status(404).json({ error: result.error || 'Survey unavailable' });
    }
    return res.json({
      sessionId: result.session.id,
      survey: result.survey,
    });
  });

  app.post('/api/respondent/upload-url', (req, res) => {
    const sessionId = String(req.body?.sessionId || '');
    const questionId = String(req.body?.questionId || '');
    if (!sessionId || !questionId) {
      return res.status(400).json({ error: 'Missing sessionId or questionId' });
    }
    const session = validateActiveSession(sessionId);
    if (!session) {
      return res.status(403).json({ error: 'Invalid session' });
    }
    return res.json({
      uploadUrl: `/api/respondent/upload/${encodeURIComponent(sessionId)}/${encodeURIComponent(questionId)}`,
    });
  });

  app.post('/api/respondent/submit', (req, res) => {
    const parsed = respondentSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid submission payload' });
    }
    const result = submitRespondentAnswers(
      parsed.data.sessionId,
      parsed.data.answers
    );
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ ok: true });
  });

  // Vite dev middleware or production static assets
  if (!isProd) {
    const vitePromise = createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TIC Survey server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TIC Survey server:', err);
  process.exit(1);
});
