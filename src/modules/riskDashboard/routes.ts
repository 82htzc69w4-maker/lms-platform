import { Hono } from 'hono';
import type { Env } from '../../types';
import { kvGetJSON, kvListByPrefix } from '../../lib/kv';
import { getSessionUser } from '../../auth/session';
import type { LearnerProfile } from '../../users/types';
import type { IssuedCertificate } from '../../issuedCertificates/types';
import type { CertificateUploadSubmission } from '../../certificateUploads/types';
import type { Attempt } from '../../tests/types';
import type { Enrollment } from '../../courses/types';
import type { IncidentReport } from '../../incidentReports/types';
import type { PerformanceAppraisal } from '../../performanceAppraisals/types';

const riskDashboard = new Hono<{ Bindings: Env }>();

function isStaff(role: string): boolean {
  return role === 'instructor' || role === 'admin' || role === 'administrator';
}

type DepartmentBreakdown = {
  department: string;
  expiredCertifications: number;
  failedAssessments: number;
  highSeverityIncidents: number;
  skillGaps: number;
  poorAppraisals: number;
  riskScore: number;
  riskLevel: 'high' | 'medium' | 'low';
};

// GET /api/risk/departments — Real-Time Competence Risk Dashboard.
// This is deliberately NOT training-compliance reporting (did people finish
// their courses) — it's a business-risk signal per department, built from
// five real factors already tracked elsewhere in the LMS: expired
// certifications, failed assessments, incident history, skill gaps
// (courses currently blocked), and performance appraisals.
//
// Scoring is a simple, transparent weighted sum — not a hidden model:
//   expired certification  = 2 points each
//   failed assessment      = 1 point each
//   high/critical incident = 3 points each
//   skill gap (blocked)    = 2 points each
//   poor appraisal         = 2 points each
// riskScore 0 -> low, 1-4 -> medium, 5+ -> high.
// (Instructor/Admin/Administrator only)
riskDashboard.get('/departments', async (c) => {
  const session = await getSessionUser(c);
  if (!session || !isStaff(session.role)) {
    return c.json({ error: 'Not authorized' }, 403);
  }

  // Map every learner to their department, from real profile data.
  const profileList = await kvListByPrefix(c.env, 'learner:profile:');
  const departmentByUsername: Record<string, string> = {};
  for (const key of profileList.keys) {
    const profile = await kvGetJSON<LearnerProfile>(c.env, key.name);
    if (profile && profile.department) departmentByUsername[profile.username] = profile.department;
  }

  const breakdowns: Record<string, DepartmentBreakdown> = {};
  function bucket(department: string): DepartmentBreakdown {
    if (!breakdowns[department]) {
      breakdowns[department] = {
        department,
        expiredCertifications: 0,
        failedAssessments: 0,
        highSeverityIncidents: 0,
        skillGaps: 0,
        poorAppraisals: 0,
        riskScore: 0,
        riskLevel: 'low',
      };
    }
    return breakdowns[department];
  }

  const now = Date.now();

  // 1. Expired certifications (issued course certs + external uploads)
  const issuedCertList = await kvListByPrefix(c.env, 'certificate:issued:');
  for (const key of issuedCertList.keys) {
    const cert = await kvGetJSON<IssuedCertificate>(c.env, key.name);
    if (!cert || !cert.expiryDate || new Date(cert.expiryDate).getTime() > now) continue;
    const dept = departmentByUsername[cert.username];
    if (dept) bucket(dept).expiredCertifications += 1;
  }
  const uploadedCertList = await kvListByPrefix(c.env, 'certificate-upload:');
  for (const key of uploadedCertList.keys) {
    const sub = await kvGetJSON<CertificateUploadSubmission>(c.env, key.name);
    if (!sub || !sub.expiryDate || new Date(sub.expiryDate).getTime() > now) continue;
    const dept = departmentByUsername[sub.username];
    if (dept) bucket(dept).expiredCertifications += 1;
  }

  // 2. Failed assessments
  const attemptList = await kvListByPrefix(c.env, 'test:attempts:');
  for (const key of attemptList.keys) {
    const history = await kvGetJSON<Attempt[]>(c.env, key.name);
    if (!history) continue;
    for (const attempt of history) {
      if (attempt.passed !== false) continue;
      const dept = departmentByUsername[attempt.username];
      if (dept) bucket(dept).failedAssessments += 1;
    }
  }

  // 3. High/critical severity incidents
  const incidentList = await kvListByPrefix(c.env, 'incident-report:');
  for (const key of incidentList.keys) {
    const report = await kvGetJSON<IncidentReport>(c.env, key.name);
    if (!report || (report.severity !== 'high' && report.severity !== 'critical')) continue;
    const dept = report.department || departmentByUsername[report.username];
    if (dept) bucket(dept).highSeverityIncidents += 1;
  }

  // 4. Skill gaps — currently blocked courses (failed max attempts, awaiting coaching)
  const enrollmentList = await kvListByPrefix(c.env, 'enrollment:');
  for (const key of enrollmentList.keys) {
    const enrollment = await kvGetJSON<Enrollment>(c.env, key.name);
    if (!enrollment || !enrollment.blocked) continue;
    const dept = departmentByUsername[enrollment.username];
    if (dept) bucket(dept).skillGaps += 1;
  }

  // 5. Poor performance appraisals
  const appraisalList = await kvListByPrefix(c.env, 'performance-appraisal:');
  for (const key of appraisalList.keys) {
    const appraisal = await kvGetJSON<PerformanceAppraisal>(c.env, key.name);
    if (!appraisal || (appraisal.rating !== 'below' && appraisal.rating !== 'unsatisfactory')) continue;
    const dept = appraisal.department || departmentByUsername[appraisal.username];
    if (dept) bucket(dept).poorAppraisals += 1;
  }

  // Every department that has at least one learner should show up, even
  // with a clean record (that's the "Low" case being genuinely earned).
  for (const dept of Object.values(departmentByUsername)) {
    bucket(dept);
  }

  const results = Object.values(breakdowns).map((d) => {
    const riskScore =
      d.expiredCertifications * 2 +
      d.failedAssessments * 1 +
      d.highSeverityIncidents * 3 +
      d.skillGaps * 2 +
      d.poorAppraisals * 2;
    const riskLevel: DepartmentBreakdown['riskLevel'] = riskScore >= 5 ? 'high' : riskScore >= 1 ? 'medium' : 'low';
    return { ...d, riskScore, riskLevel };
  });

  results.sort((a, b) => b.riskScore - a.riskScore);

  return c.json({ departments: results });
});

export default riskDashboard;
