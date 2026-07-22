import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON } from '../lib/kv';
import type { Test, Question, Attempt, QuestionResult } from './types';
import { getSessionUser } from '../auth/session';

const tests = new Hono<{ Bindings: Env }>();

// GET /api/tests/:blockId
tests.get('/:blockId', async (c) => {
  const blockId = c.req.param('blockId');
  const test = await kvGetJSON<Test>(c.env, `course:test:${blockId}`);
  return c.json({ questions: test?.questions ?? [] });
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
  if (question.type === 'multipleChoice') {
    const correctOption = question.options?.find((o) => o.isCorrect);
    const selectedOptionId = answer?.selectedOptionId;
    const correct = !!correctOption && selectedOptionId === correctOption.id;
    return {
      questionId: question.id,
      type: 'multipleChoice',
      correct,
      pointsEarned: correct ? 1 : 0,
      pointsPossible: 1,
      correctAnswerSummary: correctOption ? `Correct answer: ${correctOption.text}` : undefined,
    };
  }

  if (question.type === 'trueFalse') {
    const correct = answer?.selectedBoolean === question.correctBoolean;
    return {
      questionId: question.id,
      type: 'trueFalse',
      correct,
      pointsEarned: correct ? 1 : 0,
      pointsPossible: 1,
      correctAnswerSummary: `Correct answer: ${question.correctBoolean ? 'True' : 'False'}`,
    };
  }

  if (question.type === 'written') {
    return {
      questionId: question.id,
      type: 'written',
      correct: null,
      pointsEarned: 0,
      pointsPossible: 0,
    };
  }

  if (question.type === 'matching') {
    const pairs = question.pairs ?? [];
    const submittedMatches: Array<{ pairId: string; selectedRight: string }> = answer?.matches ?? [];
    let earned = 0;
    for (const pair of pairs) {
      const submitted = submittedMatches.find((m) => m.pairId === pair.id);
      if (submitted && submitted.selectedRight === pair.right) earned += 1;
    }
    return {
      questionId: question.id,
      type: 'matching',
      correct: earned === pairs.length,
      pointsEarned: earned,
      pointsPossible: pairs.length,
      correctAnswerSummary: pairs.map((p) => `${p.left} \u2194 ${p.right}`).join('; '),
    };
  }

  if (question.type === 'ordering') {
    const correctOrder = question.orderedItems ?? [];
    const submittedOrder: string[] = answer?.orderedTexts ?? [];
    let earned = 0;
    correctOrder.forEach((item, i) => {
      if (submittedOrder[i] === item) earned += 1;
    });
    return {
      questionId: question.id,
      type: 'ordering',
      correct: earned === correctOrder.length,
      pointsEarned: earned,
      pointsPossible: correctOrder.length,
      correctAnswerSummary: 'Correct order: ' + correctOrder.join(' \u2192 '),
    };
  }

  return { questionId: question.id, type: question.type, correct: null, pointsEarned: 0, pointsPossible: 0 };
}

// POST /api/tests/:blockId/submit — grades the learner's answers and stores the attempt
tests.post('/:blockId/submit', async (c) => {
  const blockId = c.req.param('blockId');
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const test = await kvGetJSON<Test>(c.env, `course:test:${blockId}`);
  if (!test) return c.json({ error: 'Test not found' }, 404);

  const body = await c.req.json<{ answers: Array<{ questionId: string } & Record<string, any>> }>();
  const answersByQuestionId = new Map(body.answers.map((a) => [a.questionId, a]));

  const results: QuestionResult[] = test.questions.map((q) => gradeQuestion(q, answersByQuestionId.get(q.id)));

  const score = results.reduce((sum, r) => sum + r.pointsEarned, 0);
  const maxScore = results.reduce((sum, r) => sum + r.pointsPossible, 0);

  const attempt: Attempt = {
    blockId,
    username: session.username,
    results,
    score,
    maxScore,
    submittedAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `test:attempt:${blockId}:${session.username}`, attempt);

  return c.json({ ok: true, attempt });
});

// GET /api/tests/:blockId/my-attempt — the logged-in learner's latest attempt, if any
tests.get('/:blockId/my-attempt', async (c) => {
  const blockId = c.req.param('blockId');
  const session = await getSessionUser(c);
  if (!session) return c.json({ error: 'Not logged in' }, 401);

  const attempt = await kvGetJSON<Attempt>(c.env, `test:attempt:${blockId}:${session.username}`);
  return c.json({ attempt: attempt ?? null });
});

export default tests;
