import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { IncidentReport } from './types';
import { getSessionUser } from '../auth/session';
import type { User } from '../auth/types';
import type { LearnerProfile } from '../users/types';
import type { Course } from '../courses/types';

const incidentReports = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

// POST /api/incidents — log a new incident report (staff only)
incidentReports.post('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const body = await c.req.json<{
    username: string;
    incidentDate: string;
    incidentType: IncidentReport['incidentType'];
    severity: IncidentReport['severity'];
    description: string;
    courseId?: string;
  }>();

  if (!body.username || !body.incidentDate || !body.incidentType || !body.severity || !body.description?.trim()) {
    return c.json({ error: 'username, incidentDate, incidentType, severity, and description are required' }, 400);
  }

  const employeeUser = await kvGetJSON<User>(c.env, `auth:user:${body.username}`);
  const employeeProfile = await kvGetJSON<LearnerProfile>(c.env, `learner:profile:${body.username}`);
  const reporterUser = await kvGetJSON<User>(c.env, `auth:user:${session.username}`);

  let courseTitle: string | undefined;
  if (body.courseId) {
    const course = await kvGetJSON<Course>(c.env, `course:def:${body.courseId}`);
    courseTitle = course?.title;
  }

  const report: IncidentReport = {
    id: crypto.randomUUID(),
    username: body.username,
    employeeName: employeeUser?.name || body.username,
    department: employeeProfile?.department,
    incidentDate: body.incidentDate,
    incidentType: body.incidentType,
    severity: body.severity,
    description: body.description.trim(),
    courseId: body.courseId,
    courseTitle,
    reportedByUsername: session.username,
    reportedByName: reporterUser?.name || session.username,
    createdAt: new Date().toISOString(),
  };
  await kvPutJSON(c.env, `incident-report:${report.id}`, report);
  return c.json({ ok: true, report });
});

// GET /api/incidents — every incident report on record (staff only)
incidentReports.get('/', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const list = await kvListByPrefix(c.env, 'incident-report:');
  const reports: IncidentReport[] = [];
  for (const key of list.keys) {
    const r = await kvGetJSON<IncidentReport>(c.env, key.name);
    if (r) reports.push(r);
  }
  reports.sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
  return c.json({ reports });
});

// GET /api/incidents/:username — every incident report for one employee (staff only)
incidentReports.get('/:username', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  const username = c.req.param('username');
  const list = await kvListByPrefix(c.env, 'incident-report:');
  const reports: IncidentReport[] = [];
  for (const key of list.keys) {
    const r = await kvGetJSON<IncidentReport>(c.env, key.name);
    if (r && r.username === username) reports.push(r);
  }
  reports.sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
  return c.json({ reports });
});

export default incidentReports;
