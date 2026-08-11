import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvListByPrefix } from '../lib/kv';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { Course, Enrollment } from '../courses/types';
import type { CourseContent } from '../courses/content-types';
import type { Attempt } from '../tests/types';
import type { IncidentReport } from '../incidentReports/types';
import type { ProductivityMetric } from '../productivityMetrics/types';

const aiCoach = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function callClaude(apiKey: string, system: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText.slice(0, 300)}`);
  }

  const data = await response.json<{ content: Array<{ type: string; text?: string }> }>();
  const textBlock = data.content?.find((b) => b.type === 'text');
  return textBlock?.text || 'No response was generated.';
}

// POST /api/ai-coach/ask — a learner asks a procedural/how-to question.
// Answers are grounded only in the actual text content of published
// courses (headings, subtitles, text, and text+image blocks) — nothing
// from the model's general training knowledge is presented as company
// procedure. If the courses don't cover it, the model is instructed to
// say so plainly rather than guess.
aiCoach.post('/ask', async (c) => {
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const body = await c.req.json<{ question: string }>();
  if (!body.question || !body.question.trim()) {
    return c.json({ error: 'question is required' }, 400);
  }

  const courseList = await kvListByPrefix(c.env, 'course:def:');
  const procedureChunks: string[] = [];

  for (const key of courseList.keys) {
    const course = await kvGetJSON<Course>(c.env, key.name);
    if (!course || course.status !== 'published') continue;

    const content = await kvGetJSON<CourseContent>(c.env, `course:content:${course.id}`);
    if (!content) continue;

    const textBlocks = content.blocks.filter((b) =>
      ['heading', 'subtitle', 'text', 'textImage'].includes(b.type) && b.title && b.title.trim()
    );
    if (textBlocks.length === 0) continue;

    const courseText = textBlocks.map((b) => stripHtml(b.title)).filter(Boolean).join('\n');
    if (courseText) {
      procedureChunks.push(`--- Course: ${course.title} (Category: ${course.category || 'Uncategorized'}) ---\n${courseText}`);
    }
  }

  if (procedureChunks.length === 0) {
    return c.json({
      answer:
        "I don't have any company procedures on file yet to answer that from — no published course has text content loaded. Please check with your facilitator directly.",
    });
  }

  const systemPrompt = `You are a workplace performance coach for learners at this company. Answer ONLY using the company-approved procedures provided below, which are pulled directly from the company's published training courses. Do not use any outside general knowledge about the topic — if the provided procedures don't cover the question, say clearly that this isn't covered in current training material and the learner should ask their facilitator, rather than guessing or using general knowledge. Keep answers practical and concise. Cite which course the guidance came from when you use it.

COMPANY-APPROVED PROCEDURES:
${procedureChunks.join('\n\n')}`;

  try {
    const answer = await callClaude(c.env.ANTHROPIC_API_KEY, systemPrompt, body.question.trim());
    return c.json({ answer });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'AI Coach request failed' }, 502);
  }
});

// POST /api/ai-coach/analyze-employee — a supervisor asks about a specific
// employee's performance. Grounded only in that employee's real training
// history, assessment history, incident reports, and productivity metrics
// already on record — nothing fabricated. (Instructor/Admin/Administrator only)
aiCoach.post('/analyze-employee', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const body = await c.req.json<{ username: string; question: string }>();
  if (!body.username || !body.question || !body.question.trim()) {
    return c.json({ error: 'username and question are required' }, 400);
  }

  const employeeUser = await kvGetJSON<User>(c.env, `auth:user:${body.username}`);
  if (!employeeUser) return c.json({ error: 'Employee not found' }, 404);

  // Training history
  const enrollmentList = await kvListByPrefix(c.env, `enrollment:${body.username}:`);
  const trainingLines: string[] = [];
  for (const key of enrollmentList.keys) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, key.name);
    if (!enrollment) continue;
    const course = await kvGetJSON<Course>(c.env, `course:def:${enrollment.courseId}`);
    trainingLines.push(
      `- ${course?.title || enrollment.courseId}: ${enrollment.status}` +
        (enrollment.completedAt ? `, completed ${enrollment.completedAt.slice(0, 10)}` : '') +
        `, enrolled ${enrollment.registeredAt.slice(0, 10)}` +
        (enrollment.blocked ? ' [CURRENTLY BLOCKED — pending coaching]' : '')
    );
  }

  // Assessment history
  const testList = await kvListByPrefix(c.env, 'test:attempts:');
  const assessmentLines: string[] = [];
  for (const key of testList.keys) {
    const history = await kvGetJSON<Attempt[]>(c.env, key.name);
    if (!history) continue;
    for (const attempt of history) {
      if (attempt.username !== body.username) continue;
      assessmentLines.push(
        `- Attempt ${attempt.attemptNumber}: ${attempt.score}/${attempt.maxScore}` +
          (attempt.passed === true ? ' PASS' : attempt.passed === false ? ' FAIL' : ' PENDING') +
          `, ${attempt.submittedAt.slice(0, 10)}`
      );
    }
  }

  // Incident reports
  const incidentList = await kvListByPrefix(c.env, 'incident-report:');
  const incidentLines: string[] = [];
  for (const key of incidentList.keys) {
    const r = await kvGetJSON<IncidentReport>(c.env, key.name);
    if (!r || r.username !== body.username) continue;
    incidentLines.push(`- ${r.incidentDate.slice(0, 10)}: ${r.incidentType} (${r.severity}) — ${r.description}`);
  }

  // Productivity metrics
  const metricList = await kvListByPrefix(c.env, 'productivity-metric:');
  const metricLines: string[] = [];
  for (const key of metricList.keys) {
    const m = await kvGetJSON<ProductivityMetric>(c.env, key.name);
    if (!m || m.username !== body.username) continue;
    metricLines.push(`- ${m.recordedDate.slice(0, 10)}: ${m.metricName} = ${m.value}${m.unit ? ' ' + m.unit : ''}${m.notes ? ' (' + m.notes + ')' : ''}`);
  }

  const hasAnyData =
    trainingLines.length > 0 || assessmentLines.length > 0 || incidentLines.length > 0 || metricLines.length > 0;

  if (!hasAnyData) {
    return c.json({
      answer: `There's no training, assessment, incident, or productivity data on record for ${employeeUser.name} yet, so I don't have anything to analyze.`,
    });
  }

  const systemPrompt = `You are a workplace performance coach helping a supervisor understand an employee's performance. Base your analysis ONLY on the real data provided below for this specific employee — do not invent, assume, or generalize beyond what's given. If the data is insufficient to answer confidently, say so plainly. Be concise, practical, and specific — reference actual dates, scores, and incidents from the data when relevant.

EMPLOYEE: ${employeeUser.name} (${body.username})

TRAINING HISTORY:
${trainingLines.length > 0 ? trainingLines.join('\n') : 'No enrollments on record.'}

ASSESSMENT HISTORY:
${assessmentLines.length > 0 ? assessmentLines.join('\n') : 'No test attempts on record.'}

INCIDENT REPORTS:
${incidentLines.length > 0 ? incidentLines.join('\n') : 'No incidents on record.'}

PRODUCTIVITY METRICS:
${metricLines.length > 0 ? metricLines.join('\n') : 'No productivity metrics on record.'}`;

  try {
    const answer = await callClaude(c.env.ANTHROPIC_API_KEY, systemPrompt, body.question.trim());
    return c.json({ answer });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'AI Coach request failed' }, 502);
  }
});

export default aiCoach;
