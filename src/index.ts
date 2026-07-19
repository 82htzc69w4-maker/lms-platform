import { Hono } from 'hono';
import type { Env } from './types';
import { dashboardHtml } from './dashboard';
import { employeesHtml } from './employees';
import { renderModulePlaceholder } from './module-placeholder';
import { adminHtml } from './admin';

import competency from './modules/competency/routes';
import evidence from './modules/evidence/routes';
import coach from './modules/coach/routes';
import riskDashboard from './modules/riskDashboard/routes';
import appraisal from './modules/appraisal/routes';
import careerPathing from './modules/careerPathing/routes';
import roi from './modules/roi/routes';
import incidents from './modules/incidents/routes';
import assessmentBuilder from './modules/assessmentBuilder/routes';
import compliance from './modules/compliance/routes';
import settings from './settings/routes';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.html(dashboardHtml));
app.get('/employees', (c) => c.html(employeesHtml));
app.get('/admin', (c) => c.html(adminHtml));
app.get('/modules/:name', (c) => c.html(renderModulePlaceholder(c.req.param('name'))));
app.get('/health', (c) => c.json({ status: 'ok', service: 'lms-platform' }));

app.route('/api/competency', competency);
app.route('/api/evidence', evidence);
app.route('/api/coach', coach);
app.route('/api/risk', riskDashboard);
app.route('/api/appraisal', appraisal);
app.route('/api/career', careerPathing);
app.route('/api/roi', roi);
app.route('/api/incidents', incidents);
app.route('/api/assessment-builder', assessmentBuilder);
app.route('/api/compliance', compliance);
app.route('/api/settings', settings);

export default app;
