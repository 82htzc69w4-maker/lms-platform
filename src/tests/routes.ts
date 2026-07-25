import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON } from '../lib/kv';
import type { Test, Question, Attempt, QuestionResult } from './types';
import { getSessionUser } from '../auth/session';
import type { Course, Enrollment } from '../courses/types';
import type { CoachingNotification, AttemptSnapshot } from '../coaching/types';
import type { User } from '../auth/types';

const tests = new Hono<{ Bindings: Env }>();

// GET /api/tests/:blockId
tests.get('/:blockId', async (c) => {
  const blockId = c.req.param('blockId');
  const test = await kvGetJSON<Test>(c.env, `course:test:${blockId}`);
  return c.json({ questions: test?.questions ?? [], passingRatePercent: test?.passingRatePercent });
});

// PUT /api/tests/:blockId/passing-rate — set the minimum score (%) to pass
tests.put('/:blockId/passing-rate', async (c) => {
  const blockId = c.req.param('blockId');
  const body = await c.req.json<{ passingRatePercent: number | null }>();

  const test: Test = (await kvGetJSON<Test>(c.env, `course:test:${blockId}`)) ?? { blockId, questions: [] };
  test.passingRatePercent = body.passingRatePercent ?? undefined;
  await kvPutJSON(c.env, `course:test:${blockId}`, test);
  return c.json({ ok: true, passingRatePercent: test.passingRatePercent });
});

// PUT /api/tests/:blockId/max-attempts — set how many times a learner may attempt this test
tests.put('/:blockId/max-attempts', async (c) => {
  const blockId = c.req.param('blockId');
  const body = await c.req.json<{ maxAttempts: number | null }>();

  const test: Test = (await kvGetJSON<Test>(c.env, `course:test:${blockId}`)) ?? { blockId, questions: [] };
  test.maxAttempts = body.maxAttempts ?? undefined;
  await kvPutJSON(c.env, `course:test:${blockId}`, test);
  return c.json({ ok: true, maxAttempts: test.maxAttempts });
});

// POST /api/tests/:blockId/questions — add a new question
tests.post('/:blockId/questions', async (c) => {
  const blockId = c.req.param('blockId');
  const body = await c.req.json<Omit<Question, 'id'>>();

  if (!body.type || !body.text) {
    return c.json({ error: 'type and text are required' }, 400);
  }

  const test: Test = (await kvGetJSON<Test>(c.env, `course:test:${blockId}`)) ?? {
    blockId,
    questions: [],
  };

  const question: Question = { id: crypto.randomUUID(), ...body };
  test.questions.push(question);
  await kvPutJSON(c.env, `course:test:${blockId}`, test);
  return c.json({ ok: true, questions: test.questions });
});

// PUT /api/tests/:blockId/questions/:questionId — edit a question
tests.put('/:blockId/questions/:questionId', async (c) => {
  const blockId = c.req.param('blockId');
  const questionId = c.req.param('questionId');
  const body = await c.req.json<Omit<Question, 'id'>>();

  const test = await kvGetJSON<Test>(c.env, `course:test:${blockId}`);
  if (!test) return c.json({ error: 'Test not found' }, 404);

  const index = test.questions.findIndex((q) => q.id === questionId);
  if (index === -1) return c.json({ error: 'Question not found' }, 404);

  test.questions[index] = { id: questionId, ...body };
  await kvPutJSON(c.env, `course:test:${blockId}`, test);
  return c.json({ ok: true, questions: test.questions });
});

// DELETE /api/tests/:blockId/questions/:questionId
tests.delete('/:blockId/questions/:questionId', async (c) => {
  const blockId = c.req.param('blockId');
  const questionId = c.req.param('questionId');

  const test = await kvGetJSON<Test>(c.env, `course:test:${blockId}`);
  if (!test) return c.json({ error: 'Test not found' }, 404);

  test.questions = test.questions.filter((q) => q.id !== questionId);
  await kvPutJSON(c.env, `course:test:${blockId}`, test);
  return c.json({ ok: true, questions: test.questions });
});

// PUT /api/tests/:blockId/questions-reorder
tests.put('/:blockId/questions-reorder', async (c) => {
  const blockId = c.req.param('blockId');
  const body = await c.req.json<{ questionIds: string[] }>();

  const test = await kvGetJSON<Test>(c.env, `course:test:${blockId}`);
  if (!test) return c.json({ error: 'Test not found' }, 404);

  const byId = new Map(test.questions.map((q) => [q.id, q]));
  const reordered = body.questionIds
    .map((id) => byId.get(id))
    .filter((q): q is Question => Boolean(q));
  test.questions = reordered;
  await kvPutJSON(c.env, `course:test:${blockId}`, test);
  return c.json({ ok: true, questions: test.questions });
});

function gradeQuestion(question: Question, answer: any): QuestionResult {
  const marks = question.marks ?? 1;

  if (question.type === 'multipleChoice') {
    const correctOption = question.options?.find((o) => o.isCorrect);
    const selectedOptionId = answer?.selectedOptionId;
    const correct = !!correctOption && selectedOptionId === correctOption.id;
    return {
      questionId: question.id,
      type: 'multipleChoice',
      correct,
      pointsEarned: correct ? marks : 0,
      pointsPossible: marks,
      correctAnswerSummary: correctOption ? `Correct answer: ${correctOption.text}` : undefined,
      questionText: question.text,
    };
  }

  if (question.type === 'trueFalse') {
    const correct = answer?.selectedBoolean === question.correctBoolean;
    return {
      questionId: question.id,
      type: 'trueFalse',
      correct,
      pointsEarned: correct ? marks : 0,
      pointsPossible: marks,
      correctAnswerSummary: `Correct answer: ${question.correctBoolean ? 'True' : 'False'}`,
      questionText: question.text,
    };
  }

  if (question.type === 'written') {
    return {
      questionId: question.id,
      type: 'written',
      correct: null,
      pointsEarned: 0,
      pointsPossible: 0,
      questionText: question.text,
    };
  }

  if (question.type === 'matching') {
    const pairs = question.pairs ?? [];
    const submittedMatches: Array<{ pairId: string; selectedRight: string }> = answer?.matches ?? [];
    let correctPairs = 0;
    for (const pair of pairs) {
      const submitted = submittedMatches.find((m) => m.pairId === pair.id);
      if (submitted && submitted.selectedRight === pair.right) correctPairs += 1;
    }
    const earned = pairs.length > 0 ? (correctPairs / pairs.length) * marks : 0;
    return {
      questionId: question.id,
      type: 'matching',
      correct: correctPairs === pairs.length,
      pointsEarned: Math.round(earned * 100) / 100,
      pointsPossible: marks,
      correctAnswerSummary: pairs.map((p) => `${p.left} \u2194 ${p.right}`).join('; '),
      questionText: question.text,
    };
  }

  if (question.type === 'ordering') {
    const correctOrder = question.orderedItems ?? [];
    const submittedOrder: string[] = answer?.orderedTexts ?? [];
    let correctPositions = 0;
    correctOrder.forEach((item, i) => {
      if (submittedOrder[i] === item) correctPositions += 1;
    });
    const earned = correctOrder.length > 0 ? (correctPositions / correctOrder.length) * marks : 0;
    return {
      questionId: question.id,
      type: 'ordering',
      correct: correctPositions === correctOrder.length,
      pointsEarned: Math.round(earned * 100) / 100,
      pointsPossible: marks,
      correctAnswerSummary: 'Correct order: ' + correctOrder.join(' \u2192 '),
      questionText: question.text,
    };
  }

  return { questionId: question.id, type: question.type, correct: null, pointsEarned: 0, pointsPossible: 0, questionText: question.text };
}

// POST /api/tests/:blockId/submit — grades the learner's answers and stores the attempt
tests.post('/:blockId/submit', async (c) => {
  const blockId = c.req.param('blockId');
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const test = await kvGetJSON<Test>(c.env, `course:test:${blockId}`);
  if (!test) return c.json({ error: 'Test not found' }, 404);

  const body = await c.req.json<{
    answers: Array<{ questionId: string } & Record<string, any>>;
    courseId?: string;
  }>();
  const answersByQuestionId = new Map(body.answers.map((a) => [a.questionId, a]));

  const results: QuestionResult[] = test.questions.map((q) => gradeQuestion(q, answersByQuestionId.get(q.id)));

  const score = results.reduce((sum, r) => sum + r.pointsEarned, 0);
  const maxScore = results.reduce((sum, r) => sum + r.pointsPossible, 0);
  const passingRatePercent = test.passingRatePercent;
  const passed =
    maxScore > 0 && passingRatePercent != null ? (score / maxScore) * 100 >= passingRatePercent : null;
  const failedQuestionTexts = results
    .filter((r) => r.correct === false)
    .map((r) => r.questionText || r.questionId);

  const historyKey = `test:attempts:${blockId}:${session.username}`;
  const history: Attempt[] = (await kvGetJSON<Attempt[]>(c.env, historyKey)) ?? [];

  const attempt: Attempt = {
    blockId,
    courseId: body.courseId,
    username: session.username,
    attemptNumber: history.length + 1,
    results,
    score,
    maxScore,
    passingRatePercent,
    passed,
    failedQuestionTexts,
    submittedAt: new Date().toISOString(),
  };
  history.push(attempt);
  await kvPutJSON(c.env, historyKey, history);

  // If a max-attempts limit is set and the learner has now used it up
  // without passing, block the course and raise a coaching notification.
  let blocked = false;
  if (test.maxAttempts && history.length >= test.maxAttempts && passed !== true && body.courseId) {
    blocked = true;

    const enrollmentKey = `enrollment:${session.username}:${body.courseId}`;
    const enrollment = await kvGetJSON<Enrollment>(c.env, enrollmentKey);
    if (enrollment) {
      enrollment.blocked = true;
      await kvPutJSON(c.env, enrollmentKey, enrollment);
    }

    const learnerUser = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);
    const course = await kvGetJSON<Course>(c.env, `course:def:${body.courseId}`);

    const attemptSnapshots: AttemptSnapshot[] = history.map((a) => ({
      attemptNumber: a.attemptNumber,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : null,
      failedQuestionTexts: a.failedQuestionTexts,
      submittedAt: a.submittedAt,
    }));

    const notification: CoachingNotification = {
      id: crypto.randomUUID(),
      username: session.username,
      learnerName: learnerUser?.name || session.username,
      courseId: body.courseId,
      courseTitle: course?.title || body.courseId,
      blockId,
      attempts: attemptSnapshots,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    await kvPutJSON(c.env, `coaching:notification:${notification.id}`, notification);
  }

  return c.json({ ok: true, attempt, blocked });
});

// GET /api/tests/:blockId/my-attempt — the logged-in learner's latest attempt, if any
tests.get('/:blockId/my-attempt', async (c) => {
  const blockId = c.req.param('blockId');
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const history = await kvGetJSON<Attempt[]>(c.env, `test:attempts:${blockId}:${session.username}`);
  const attempt = history && history.length > 0 ? history[history.length - 1] : null;
  return c.json({ attempt });
});

export default tests;
