import { Hono } from 'hono';
import type { Env } from './types';
import { dashboardHtml } from './dashboard';
import { employeesHtml } from './employees';
import { renderModulePlaceholder } from './module-placeholder';
import { adminHtml } from './admin';
import { loginHtml } from './login';

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
import auth from './auth/routes';
import users from './users/routes';
import courses from './courses/routes';
import certificates from './certificates/routes';
import lookups from './lookups/routes';
import { learnerHtml } from './learner';
import { courseDeliveryHtml } from './course-delivery';
import { courseDevelopmentHtml } from './course-development';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.html(dashboardHtml));
app.get('/employees', (c) => c.html(employeesHtml));
app.get('/admin', (c) => c.html(adminHtml));
app.get('/login', (c) => c.html(loginHtml));
app.get('/learner', (c) => c.html(learnerHtml));
app.get('/course-delivery', (c) => c.html(courseDeliveryHtml));
app.get('/course-development/:id', (c) => c.html(courseDevelopmentHtml));
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
app.route('/api/auth', auth);
app.route('/api/users', users);
app.route('/api/courses', courses);
app.route('/api/certificates', certificates);
app.route('/api/lookups', lookups);

export default app;
