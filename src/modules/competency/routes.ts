import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../../lib/kv';
import type {
  Competency,
  CompetencyLink,
  CompetencyStatus,
  EmployeeSkillsMatrix,
} from './types';
import { evaluateCompetency } from './evaluate';

const competency = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Competency definitions (the catalog of skills/certifications)
// ---------------------------------------------------------------------------

// GET /api/competency/definitions
competency.get('/definitions', async (c) => {
  const list = await kvListByPrefix(c.env, 'competency:def:');
  const defs: Competency[] = [];
  for (const key of list.keys) {
    const def = await kvGetJSON<Competency>(c.env, key.name);
    if (def) defs.push(def);
  }
  return c.json({ definitions: defs });
});

// POST /api/competency/definitions
// Creates or updates a competency definition (skill or certification)
competency.post('/definitions', async (c) => {
  const body = await c.req.json<Competency>();
  if (!body.id || !body.name || !body.type) {
    return c.json({ error: 'id, name, and type are required' }, 400);
  }
  await kvPutJSON(c.env, `competency:def:${body.id}`, body);
  return c.json({ ok: true, definition: body });
});

// ---------------------------------------------------------------------------
// Employee skills matrix
// ---------------------------------------------------------------------------

// GET /api/competency/employees/:id/matrix
competency.get('/employees/:id/matrix', async (c) => {
  const id = c.req.param('id');
  const matrix = await kvGetJSON<EmployeeSkillsMatrix>(c.env, `competency:matrix:${id}`);
  return c.json(matrix ?? { employeeId: id, statuses: {}, links: [] });
});

// POST /api/competency/employees/:id/links
// Records a new piece of evidence (course completion, assessment result,
// observation, coaching session, practical task) and re-evaluates that
// competency's status automatically.
competency.post('/employees/:id/links', async (c) => {
  const id = c.req.param('id');
  const link = await c.req.json<CompetencyLink>();

  if (!link.competencyId || !link.sourceType || !link.result || !link.date) {
    return c.json(
      { error: 'competencyId, sourceType, result, and date are required' },
      400
    );
  }

  const def = await kvGetJSON<Competency>(c.env, `competency:def:${link.competencyId}`);
  if (!def) {
    return c.json({ error: `Unknown competency: ${link.competencyId}` }, 404);
  }

  const matrix: EmployeeSkillsMatrix = (await kvGetJSON(c.env, `competency:matrix:${id}`)) ?? {
    employeeId: id,
    statuses: {},
    links: [],
  };

  matrix.links.push(link);

  const existingStatus = matrix.statuses[link.competencyId];
  const recalculated = evaluateCompetency(def, matrix.links);

  // Preserve a manual override unless the new evidence is itself the override trigger.
  // Here, a new link always re-runs auto-calculation; if a supervisor wants to keep
  // a manual override in place despite new evidence, they can re-apply it via the
  // override endpoint below after this call.
  const newStatus: CompetencyStatus = {
    ...recalculated,
    overriddenBy: existingStatus?.autoCalculated === false ? existingStatus.overriddenBy : undefined,
    overrideReason: existingStatus?.autoCalculated === false ? existingStatus.overrideReason : undefined,
  };

  matrix.statuses[link.competencyId] = newStatus;
  await kvPutJSON(c.env, `competency:matrix:${id}`, matrix);

  return c.json({ ok: true, status: newStatus });
});

// POST /api/competency/employees/:id/override
// Supervisor manually overrides a competency's status, bypassing auto-calculation.
competency.post('/employees/:id/override', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    competencyId: string;
    status: CompetencyStatus['status'];
    overriddenBy: string;
    overrideReason: string;
  }>();

  if (!body.competencyId || !body.status || !body.overriddenBy) {
    return c.json(
      { error: 'competencyId, status, and overriddenBy are required' },
      400
    );
  }

  const matrix: EmployeeSkillsMatrix = (await kvGetJSON(c.env, `competency:matrix:${id}`)) ?? {
    employeeId: id,
    statuses: {},
    links: [],
  };

  matrix.statuses[body.competencyId] = {
    competencyId: body.competencyId,
    status: body.status,
    autoCalculated: false,
    overriddenBy: body.overriddenBy,
    overrideReason: body.overrideReason,
    lastEvaluated: new Date().toISOString(),
  };

  await kvPutJSON(c.env, `competency:matrix:${id}`, matrix);
  return c.json({ ok: true, status: matrix.statuses[body.competencyId] });
});

// POST /api/competency/employees/:id/reevaluate
// Re-runs auto-calculation for every competency the employee has links for,
// clearing any manual overrides. Useful for periodic batch re-evaluation
// (e.g. a nightly job checking for newly expired certifications).
competency.post('/employees/:id/reevaluate', async (c) => {
  const id = c.req.param('id');
  const matrix: EmployeeSkillsMatrix | null = await kvGetJSON(c.env, `competency:matrix:${id}`);

  if (!matrix) {
    return c.json({ employeeId: id, statuses: {} });
  }

  const competencyIds = new Set(matrix.links.map((l) => l.competencyId));
  for (const competencyId of competencyIds) {
    const def = await kvGetJSON<Competency>(c.env, `competency:def:${competencyId}`);
    if (!def) continue;
    matrix.statuses[competencyId] = evaluateCompetency(def, matrix.links);
  }

  await kvPutJSON(c.env, `competency:matrix:${id}`, matrix);
  return c.json({ ok: true, statuses: matrix.statuses });
});

// ---------------------------------------------------------------------------
// Gap detection across the workforce
// ---------------------------------------------------------------------------

// GET /api/competency/gaps
// Returns every employee/competency pair that is not_competent, needs_refresher,
// or expired — the raw material for the risk dashboard and career pathing.
competency.get('/gaps', async (c) => {
  const list = await kvListByPrefix(c.env, 'competency:matrix:');
  const gaps: Array<{
    employeeId: string;
    competencyId: string;
    status: CompetencyStatus['status'];
  }> = [];

  for (const key of list.keys) {
    const matrix = await kvGetJSON<EmployeeSkillsMatrix>(c.env, key.name);
    if (!matrix) continue;

    for (const status of Object.values(matrix.statuses)) {
      if (status.status !== 'competent') {
        gaps.push({
          employeeId: matrix.employeeId,
          competencyId: status.competencyId,
          status: status.status,
        });
      }
    }
  }

  return c.json({ gaps });
});

export default competency;
