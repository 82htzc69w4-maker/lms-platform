import { renderLayout } from './layout';

const MODULE_LABELS: Record<string, string> = {
  evidence: 'Evidence Portfolio',
  coach: 'AI Performance Coach',
  risk: 'Competence Risk Dashboard',
  appraisal: 'Training + Appraisal Integration',
  career: 'Skills-Based Career Pathing',
  roi: 'Training ROI Calculator',
  incidents: 'Learning From Incidents',
  assessments: 'AI Assessment Builder',
  compliance: 'Intelligent Compliance Engine',
};

export function renderModulePlaceholder(moduleKey: string): string {
  const label = MODULE_LABELS[moduleKey] ?? moduleKey;

  const bodyHtml = `
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">${label}</div>
        <div class="panel-sub">Backend routes are live under /api/${moduleKey === 'risk' ? 'risk' : moduleKey}/*</div>
      </div>
      <div class="empty-state">
        This module's frontend hasn't been built yet. The API stub is already responding —
        ask to build this one out next when you're ready.
      </div>
    </div>
  `;

  return renderLayout({
    title: label,
    activePath: `/modules/${moduleKey}`,
    eyebrowSuffix: 'Under Construction',
    heading: label,
    bodyHtml,
  });
}
