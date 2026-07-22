import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON } from '../lib/kv';
import type { Test, Question } from './types';

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

export default tests;
