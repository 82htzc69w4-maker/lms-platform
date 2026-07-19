import { Hono } from 'hono';
import type { Env } from '../../types';

const coach = new Hono<{ Bindings: Env }>();

// POST /api/coach/ask
// Learner or supervisor asks a question; AI responds using company-approved
// procedures (learner) or performance analysis (supervisor).
coach.post('/ask', async (c) => {
  const body = await c.req.json<{ role: 'learner' | 'supervisor'; question: string }>();
  // TODO: wire up to Anthropic API with RAG over SOPs / performance data
  return c.json({
    role: body.role,
    question: body.question,
    answer: 'Coach integration not yet implemented.',
  });
});

export default coach;
