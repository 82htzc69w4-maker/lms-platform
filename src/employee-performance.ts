import { renderLayout } from './layout';

const bodyHtml = `
  <div class="panel" style="margin-bottom: 20px;">
    <div class="panel-header">
      <div class="panel-title">Employee Performance</div>
      <div class="panel-sub">Training history, assessments, incident reports, and productivity metrics in one place</div>
    </div>
    <div class="panel-body">
      <select id="employee-select" style="width:100%; max-width:400px;">
        <option value="">Select a learner&hellip;</option>
      </select>
    </div>
  </div>

  <div id="performance-content" style="display:none;">

    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-header">
        <div class="panel-title">Training History</div>
      </div>
      <div class="panel-body">
        <div id="training-history-wrap"><div class="empty-state">Loading&hellip;</div></div>
      </div>
    </div>

    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-header">
        <div class="panel-title">Assessment History</div>
      </div>
      <div class="panel-body">
        <div id="assessment-history-wrap"><div class="empty-state">Loading&hellip;</div></div>
      </div>
    </div>

    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-header">
        <div class="panel-title">Incident Reports</div>
      </div>
      <div class="panel-body">
        <div id="incident-reports-wrap" style="margin-bottom: 16px;"><div class="empty-state">Loading&hellip;</div></div>

        <div class="stat-label" style="margin-bottom: 8px;">Log a New Incident</div>
        <div class="form-row">
          <input type="date" id="incident-date" style="flex:1;" />
          <select id="incident-type" style="flex:1;">
            <option value="injury">Injury</option>
            <option value="near_miss">Near Miss</option>
            <option value="property_damage">Property Damage</option>
            <option value="safety_violation">Safety Violation</option>
            <option value="other">Other</option>
          </select>
          <select id="incident-severity" style="flex:1;">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <textarea id="incident-description" rows="3" placeholder="What happened?" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px;"></textarea>
        </div>
        <button class="btn" id="log-incident-btn" style="margin-top: 10px;">Log Incident</button>
        <div id="incident-message" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Productivity Metrics</div>
      </div>
      <div class="panel-body">
        <div id="productivity-metrics-wrap" style="margin-bottom: 16px;"><div class="empty-state">Loading&hellip;</div></div>

        <div class="stat-label" style="margin-bottom: 8px;">Log a New Metric</div>
        <div class="form-row">
          <input type="text" id="metric-name" placeholder="Metric name (e.g. Units Produced)" style="flex:2;" />
          <input type="number" id="metric-value" placeholder="Value" style="flex:1;" />
          <input type="text" id="metric-unit" placeholder="Unit (optional)" style="flex:1;" />
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <input type="date" id="metric-date" style="flex:1;" />
          <input type="text" id="metric-notes" placeholder="Notes (optional)" style="flex:2;" />
        </div>
        <button class="btn" id="log-metric-btn" style="margin-top: 10px;">Log Metric</button>
        <div id="metric-message" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
      </div>
    </div>

    <div class="panel" style="margin-top: 20px;">
      <div class="panel-header">
        <div class="panel-title">Portfolio Evidence</div>
        <div class="panel-sub">Videos, photos, and documents uploaded by this employee, awaiting or already reviewed</div>
      </div>
      <div class="panel-body">
        <div id="evidence-review-wrap"><div class="empty-state">Loading&hellip;</div></div>
      </div>
    </div>

    <div class="panel" style="margin-top: 20px;">
      <div class="panel-header">
        <div class="panel-title">Workplace Observations</div>
      </div>
      <div class="panel-body">
        <div id="observations-wrap" style="margin-bottom: 16px;"><div class="empty-state">Loading&hellip;</div></div>

        <div class="stat-label" style="margin-bottom: 8px;">Log a New Observation</div>
        <div class="form-row">
          <input type="date" id="observation-date" style="flex:1;" />
          <input type="text" id="observation-task" placeholder="Task observed (e.g. Forklift operation)" style="flex:2;" />
          <select id="observation-outcome" style="flex:1;">
            <option value="competent">Competent</option>
            <option value="not_yet_competent">Not Yet Competent</option>
            <option value="needs_improvement">Needs Improvement</option>
          </select>
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <textarea id="observation-notes" rows="3" placeholder="What did you observe?" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px;"></textarea>
        </div>
        <button class="btn" id="log-observation-btn" style="margin-top: 10px;">Log Observation</button>
        <div id="observation-message" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
      </div>
    </div>

    <div class="panel" style="margin-top: 20px;">
      <div class="panel-header">
        <div class="panel-title">Performance Appraisals</div>
      </div>
      <div class="panel-body">
        <div id="appraisals-wrap" style="margin-bottom: 16px;"><div class="empty-state">Loading&hellip;</div></div>

        <div class="stat-label" style="margin-bottom: 8px;">Log a New Appraisal</div>
        <div class="form-row">
          <input type="date" id="appraisal-date" style="flex:1;" />
          <select id="appraisal-rating" style="flex:1;">
            <option value="exceeds">Exceeds Expectations</option>
            <option value="meets">Meets Expectations</option>
            <option value="below">Below Expectations</option>
            <option value="unsatisfactory">Unsatisfactory</option>
          </select>
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <textarea id="appraisal-comments" rows="3" placeholder="Appraisal comments" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px;"></textarea>
        </div>
        <div class="form-row" style="margin-top: 8px;">
          <input type="text" id="appraisal-gaps" placeholder="Identified development areas, comma-separated (e.g. Leadership, Communication)" style="width:100%;" />
        </div>
        <button class="btn" id="log-appraisal-btn" style="margin-top: 10px;">Log Appraisal</button>
        <div id="appraisal-message" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
      </div>
    </div>

    <div class="panel" style="margin-top: 20px;">
      <div class="panel-header">
        <div class="panel-title">Learning Plans</div>
        <div class="panel-sub">Training + coaching auto-connected to appraisal-identified gaps, with effectiveness tracking (not financial ROI — the LMS has no cost data to calculate a real dollar return)</div>
      </div>
      <div class="panel-body">
        <div id="learning-plans-wrap"><div class="empty-state">Loading&hellip;</div></div>
      </div>
    </div>

  </div>
`;

const scripts = `
  // ---------- Role gate: Instructor, Admin, and Administrator only ----------
  fetch('/api/auth/me')
    .then(r => {
      if (!r.ok) throw new Error('not logged in');
      return r.json();
    })
    .then(data => {
      const role = data.user.role;
      if (role !== 'instructor' && role !== 'admin' && role !== 'administrator') {
        window.location.href = '/';
      }
    })
    .catch(() => {
      window.location.href = '/login';
    });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  let selectedUsername = '';

  fetch('/api/users')
    .then(r => r.json())
    .then(data => {
      const learners = (data.users || []).filter(u => u.role === 'learner');
      const select = document.getElementById('employee-select');
      learners.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.username;
        opt.textContent = u.name || u.username;
        select.appendChild(opt);
      });
    });

  document.getElementById('employee-select').addEventListener('change', (e) => {
    selectedUsername = e.target.value;
    if (!selectedUsername) {
      document.getElementById('performance-content').style.display = 'none';
      return;
    }
    document.getElementById('performance-content').style.display = 'block';
    loadTrainingHistory();
    loadAssessmentHistory();
    loadIncidentReports();
    loadProductivityMetrics();
    loadEvidenceForReview();
    loadObservations();
    loadAppraisals();
    loadLearningPlans();
  });

  function loadTrainingHistory() {
    fetch('/api/courses/employee-training-history/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const history = data.history || [];
        const wrap = document.getElementById('training-history-wrap');
        if (history.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No course enrollments on record.</div>';
          return;
        }
        wrap.innerHTML = history.map(h => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtml(h.courseTitle)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted);">Enrolled: \${new Date(h.registeredAt).toLocaleDateString()}\${h.completedAt ? ' — Completed: ' + new Date(h.completedAt).toLocaleDateString() : ''}</div>
            </div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:13px; color:\${h.status === 'completed' ? 'var(--competent)' : 'var(--refresher)'};">\${h.status === 'completed' ? 'Completed' : 'In Progress'}</div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('training-history-wrap').innerHTML = '<div class="empty-state">Could not load training history.</div>';
      });
  }

  function loadAssessmentHistory() {
    fetch('/api/tests/assessment-history/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const attempts = data.attempts || [];
        const wrap = document.getElementById('assessment-history-wrap');
        if (attempts.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No assessment attempts on record.</div>';
          return;
        }
        wrap.innerHTML = attempts.map(a => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">Attempt \${a.attemptNumber} — \${a.score}/\${a.maxScore}\${a.passingRatePercent != null ? ' (passing rate ' + a.passingRatePercent + '%)' : ''}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted);">\${new Date(a.submittedAt).toLocaleString()}</div>
            </div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:13px; color:\${a.passed === true ? 'var(--competent)' : a.passed === false ? 'var(--risk)' : 'var(--text-muted)'};">\${a.passed === true ? 'PASS' : a.passed === false ? 'FAIL' : 'PENDING'}</div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('assessment-history-wrap').innerHTML = '<div class="empty-state">Could not load assessment history.</div>';
      });
  }

  function loadIncidentReports() {
    fetch('/api/incidents/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const reports = data.reports || [];
        const wrap = document.getElementById('incident-reports-wrap');
        if (reports.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No incidents on record.</div>';
          return;
        }
        wrap.innerHTML = reports.map(r => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:6px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:2px;">\${escapeHtml(r.incidentType.replace('_',' '))} — \${escapeHtml(r.severity)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:4px;">\${new Date(r.incidentDate).toLocaleDateString()} — reported by \${escapeHtml(r.reportedByName)}</div>
              <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary);">\${escapeHtml(r.description)}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('incident-reports-wrap').innerHTML = '<div class="empty-state">Could not load incident reports.</div>';
      });
  }

  function loadProductivityMetrics() {
    fetch('/api/productivity-metrics/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const metrics = data.metrics || [];
        const wrap = document.getElementById('productivity-metrics-wrap');
        if (metrics.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No productivity metrics on record.</div>';
          return;
        }
        wrap.innerHTML = metrics.map(m => \`
          <div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtml(m.metricName)}: \${m.value}\${m.unit ? ' ' + escapeHtml(m.unit) : ''}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted);">\${new Date(m.recordedDate).toLocaleDateString()}\${m.notes ? ' — ' + escapeHtml(m.notes) : ''}</div>
            </div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('productivity-metrics-wrap').innerHTML = '<div class="empty-state">Could not load productivity metrics.</div>';
      });
  }

  document.getElementById('log-incident-btn').addEventListener('click', () => {
    const msgEl = document.getElementById('incident-message');
    const dateVal = document.getElementById('incident-date').value;
    const descVal = document.getElementById('incident-description').value.trim();

    if (!dateVal || !descVal) {
      msgEl.textContent = 'Please provide a date and description.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: selectedUsername,
        incidentDate: dateVal,
        incidentType: document.getElementById('incident-type').value,
        severity: document.getElementById('incident-severity').value,
        description: descVal
      })
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to log incident');
        return data;
      })
      .then(() => {
        document.getElementById('incident-description').value = '';
        document.getElementById('incident-date').value = '';
        loadIncidentReports();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });

  document.getElementById('log-metric-btn').addEventListener('click', () => {
    const msgEl = document.getElementById('metric-message');
    const nameVal = document.getElementById('metric-name').value.trim();
    const valueVal = document.getElementById('metric-value').value;
    const dateVal = document.getElementById('metric-date').value;

    if (!nameVal || !valueVal || !dateVal) {
      msgEl.textContent = 'Please provide a metric name, value, and date.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    fetch('/api/productivity-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: selectedUsername,
        metricName: nameVal,
        value: parseFloat(valueVal),
        unit: document.getElementById('metric-unit').value.trim(),
        recordedDate: dateVal,
        notes: document.getElementById('metric-notes').value.trim()
      })
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to log metric');
        return data;
      })
      .then(() => {
        document.getElementById('metric-name').value = '';
        document.getElementById('metric-value').value = '';
        document.getElementById('metric-unit').value = '';
        document.getElementById('metric-date').value = '';
        document.getElementById('metric-notes').value = '';
        loadProductivityMetrics();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });
  function loadEvidenceForReview() {
    fetch('/api/portfolio-evidence/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const items = data.evidence || [];
        const wrap = document.getElementById('evidence-review-wrap');

        if (items.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No evidence uploaded by this employee yet.</div>';
          return;
        }

        const statusColors = { pending: 'var(--refresher)', signed_off: 'var(--competent)', rejected: 'var(--risk)' };
        const statusLabels = { pending: 'Pending Review', signed_off: 'Signed Off', rejected: 'Not Signed Off' };

        wrap.innerHTML = items.map(e => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:10px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:2px;">\${escapeHtml(e.title)} <span style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); text-transform:uppercase;">(\${e.evidenceType})</span></div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:4px;">Uploaded \${new Date(e.uploadedAt).toLocaleDateString()}\${e.relatedSkill ? ' — ' + escapeHtml(e.relatedSkill) : ''}</div>
              \${e.description ? '<div style="font-family:\\'Inter\\',sans-serif; font-size:13px; color:var(--text-primary); margin-bottom:6px;">' + escapeHtml(e.description) + '</div>' : ''}
              <a href="\${e.fileDataUrl}" download="\${escapeHtml(e.fileName)}" class="btn" style="text-decoration:none; display:inline-block;">Open</a>
              \${e.status === 'pending' ? \`
                <div style="margin-top:8px;">
                  <input type="text" id="signoff-notes-\${e.id}" placeholder="Notes (optional)" style="width:100%; margin-bottom:6px;" />
                  <button class="btn sign-off-btn" data-evidence-id="\${e.id}" style="margin-right:6px;">Sign Off</button>
                  <button class="btn reject-evidence-btn" data-evidence-id="\${e.id}" style="background:var(--panel-alt); color:var(--text-primary); border:1px solid var(--grid-line);">Reject</button>
                </div>
              \` : ''}
            </div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:\${statusColors[e.status]}; font-weight:600; white-space:nowrap;">\${statusLabels[e.status]}</div>
          </div>
        \`).join('');

        function submitSignOff(evidenceId, decision) {
          const notes = document.getElementById('signoff-notes-' + evidenceId).value.trim();
          fetch('/api/portfolio-evidence/' + evidenceId + '/sign-off', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision, notes })
          })
            .then(r => r.json())
            .then(() => loadEvidenceForReview())
            .catch(() => alert('Failed to submit review.'));
        }

        wrap.querySelectorAll('.sign-off-btn').forEach(btn => {
          btn.addEventListener('click', () => submitSignOff(btn.dataset.evidenceId, 'signed_off'));
        });
        wrap.querySelectorAll('.reject-evidence-btn').forEach(btn => {
          btn.addEventListener('click', () => submitSignOff(btn.dataset.evidenceId, 'rejected'));
        });
      })
      .catch(() => {
        document.getElementById('evidence-review-wrap').innerHTML = '<div class="empty-state">Could not load evidence.</div>';
      });
  }

  function loadObservations() {
    fetch('/api/workplace-observations/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const observations = data.observations || [];
        const wrap = document.getElementById('observations-wrap');

        if (observations.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No observations on record for this employee.</div>';
          return;
        }

        const outcomeColors = { competent: 'var(--competent)', not_yet_competent: 'var(--risk)', needs_improvement: 'var(--refresher)' };
        const outcomeLabels = { competent: 'Competent', not_yet_competent: 'Not Yet Competent', needs_improvement: 'Needs Improvement' };

        wrap.innerHTML = observations.map(o => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:2px;">\${escapeHtml(o.taskObserved)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:4px;">\${new Date(o.observationDate).toLocaleDateString()} — observed by \${escapeHtml(o.observedByName)}</div>
              <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary);">\${escapeHtml(o.notes)}</div>
            </div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:\${outcomeColors[o.outcome]}; font-weight:600; white-space:nowrap;">\${outcomeLabels[o.outcome]}</div>
          </div>
        \`).join('');
      })
      .catch(() => {
        document.getElementById('observations-wrap').innerHTML = '<div class="empty-state">Could not load observations.</div>';
      });
  }

  document.getElementById('log-observation-btn').addEventListener('click', () => {
    const msgEl = document.getElementById('observation-message');
    const dateVal = document.getElementById('observation-date').value;
    const taskVal = document.getElementById('observation-task').value.trim();
    const notesVal = document.getElementById('observation-notes').value.trim();

    if (!dateVal || !taskVal || !notesVal) {
      msgEl.textContent = 'Please provide a date, task, and notes.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    fetch('/api/workplace-observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: selectedUsername,
        observationDate: dateVal,
        taskObserved: taskVal,
        outcome: document.getElementById('observation-outcome').value,
        notes: notesVal
      })
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to log observation');
        return data;
      })
      .then(() => {
        document.getElementById('observation-date').value = '';
        document.getElementById('observation-task').value = '';
        document.getElementById('observation-notes').value = '';
        loadObservations();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });

  function loadAppraisals() {
    fetch('/api/performance-appraisals/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const appraisals = data.appraisals || [];
        const wrap = document.getElementById('appraisals-wrap');

        if (appraisals.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No appraisals on record for this employee.</div>';
          return;
        }

        const ratingColors = { exceeds: 'var(--competent)', meets: 'var(--competent)', below: 'var(--refresher)', unsatisfactory: 'var(--risk)' };
        const ratingLabels = { exceeds: 'Exceeds Expectations', meets: 'Meets Expectations', below: 'Below Expectations', unsatisfactory: 'Unsatisfactory' };

        wrap.innerHTML = appraisals.map(a => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:8px;">
            <div style="flex:1;">
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:4px;">\${new Date(a.appraisalDate).toLocaleDateString()} — reviewed by \${escapeHtml(a.reviewerName)}</div>
              <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary); margin-bottom:8px;">\${escapeHtml(a.comments)}</div>
              \${(a.identifiedGaps || []).map(g => \`
                <span style="display:inline-block; background:var(--panel-alt); border:1px solid var(--grid-line); border-radius:2px; padding:4px 10px; font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--text-primary); margin-right:6px; margin-bottom:6px;">
                  \${escapeHtml(g)}
                  <button type="button" class="generate-plan-btn" data-appraisal-id="\${a.id}" data-gap="\${escapeHtml(g)}" style="margin-left:8px; background:none; border:none; color:var(--hazard); font-family:'IBM Plex Mono',monospace; font-size:11px; text-decoration:underline; cursor:pointer; padding:0;">Generate Learning Plan</button>
                </span>
              \`).join('')}
            </div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:\${ratingColors[a.rating]}; font-weight:600; white-space:nowrap;">\${ratingLabels[a.rating]}</div>
          </div>
        \`).join('');

        wrap.querySelectorAll('.generate-plan-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            btn.textContent = 'Generating…';
            btn.disabled = true;
            fetch('/api/learning-plans/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appraisalId: btn.dataset.appraisalId, gap: btn.dataset.gap })
            })
              .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed to generate learning plan');
                return data;
              })
              .then(() => {
                loadLearningPlans();
                loadAppraisals();
              })
              .catch((err) => {
                alert(err.message);
                btn.textContent = 'Generate Learning Plan';
                btn.disabled = false;
              });
          });
        });
      })
      .catch(() => {
        document.getElementById('appraisals-wrap').innerHTML = '<div class="empty-state">Could not load appraisals.</div>';
      });
  }

  document.getElementById('log-appraisal-btn').addEventListener('click', () => {
    const msgEl = document.getElementById('appraisal-message');
    const dateVal = document.getElementById('appraisal-date').value;
    const commentsVal = document.getElementById('appraisal-comments').value.trim();

    if (!dateVal || !commentsVal) {
      msgEl.textContent = 'Please provide a date and comments.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    fetch('/api/performance-appraisals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: selectedUsername,
        appraisalDate: dateVal,
        rating: document.getElementById('appraisal-rating').value,
        comments: commentsVal,
        identifiedGaps: document.getElementById('appraisal-gaps').value.split(',').map(g => g.trim()).filter(Boolean)
      })
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to log appraisal');
        return data;
      })
      .then(() => {
        document.getElementById('appraisal-date').value = '';
        document.getElementById('appraisal-comments').value = '';
        document.getElementById('appraisal-gaps').value = '';
        loadAppraisals();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });

  function loadLearningPlans() {
    fetch('/api/learning-plans/' + encodeURIComponent(selectedUsername))
      .then(r => r.json())
      .then(data => {
        const plans = data.plans || [];
        const wrap = document.getElementById('learning-plans-wrap');

        if (plans.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No learning plans yet — generate one from an appraisal\\'s identified development area above.</div>';
          return;
        }

        const trendLabels = {
          improved: '\\u2191 Improved since baseline',
          same: 'Unchanged since baseline',
          declined: '\\u2193 Declined since baseline',
          not_yet_reassessed: 'Not yet reassessed'
        };
        const trendColors = {
          improved: 'var(--competent)',
          same: 'var(--text-muted)',
          declined: 'var(--risk)',
          not_yet_reassessed: 'var(--text-muted)'
        };

        wrap.innerHTML = plans.map(p => {
          const coursesHtml = p.assignedCourseTitles.length > 0
            ? p.assignedCourseTitles.map(t => escapeHtml(t)).join(', ')
            : 'No matching published courses were found';

          const coachingHtml = p.coachingCompleted
            ? '<div style="font-family:\\'Inter\\',sans-serif; font-size:13px; color:var(--competent);">Coaching logged \\u2014 ' + new Date(p.coachingDate).toLocaleDateString() + ': ' + escapeHtml(p.coachingNotes) + '</div>'
            : \`
              <div style="margin-top:8px;">
                <div class="form-row" style="margin-bottom:6px;">
                  <input type="date" id="plan-coaching-date-\${p.id}" style="flex:1;" />
                  <input type="text" id="plan-coaching-notes-\${p.id}" placeholder="Coaching notes" style="flex:2;" />
                </div>
                <button type="button" class="log-plan-coaching-btn" data-plan-id="\${p.id}">Log Coaching</button>
              </div>
            \`;

          return \`
            <div class="panel" style="margin-bottom: 16px; \${p.status !== 'active' ? 'opacity:0.7;' : ''}">
              <div class="panel-header">
                <div class="panel-title">\${escapeHtml(p.identifiedGap)}</div>
                <div class="panel-sub">Created \${new Date(p.createdAt).toLocaleDateString()} by \${escapeHtml(p.createdByName)} — status: \${p.status}</div>
              </div>
              <div class="panel-body">
                <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary); margin-bottom:8px;"><strong>Training assigned:</strong> \${coursesHtml}</div>
                \${p.completionPercent != null ? \`
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <div style="width:120px; height:8px; background:var(--panel-alt); border-radius:4px; overflow:hidden;">
                      <div style="width:\${p.completionPercent}%; height:100%; background:var(--hazard);"></div>
                    </div>
                    <span style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--text-muted);">\${p.completedCount}/\${p.assignedCourseIds.length} courses completed</span>
                  </div>
                \` : ''}
                \${coachingHtml}
                <div style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:\${trendColors[p.ratingTrend]}; font-weight:600; margin-top:8px;">\${trendLabels[p.ratingTrend]}</div>
              </div>
            </div>
          \`;
        }).join('');

        wrap.querySelectorAll('.log-plan-coaching-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const planId = btn.dataset.planId;
            const dateVal = document.getElementById('plan-coaching-date-' + planId).value;
            const notesVal = document.getElementById('plan-coaching-notes-' + planId).value.trim();

            if (!dateVal || !notesVal) {
              alert('Please provide a date and notes.');
              return;
            }

            fetch('/api/learning-plans/' + planId + '/log-coaching', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coachingDate: dateVal, coachingNotes: notesVal })
            })
              .then(r => r.json())
              .then(() => loadLearningPlans())
              .catch(() => alert('Failed to log coaching.'));
          });
        });
      })
      .catch(() => {
        document.getElementById('learning-plans-wrap').innerHTML = '<div class="empty-state">Could not load learning plans.</div>';
      });
  }
`;

export const employeePerformanceHtml = renderLayout({
  title: 'Employee Performance',
  activePath: '/',
  eyebrowSuffix: 'Employee Performance',
  heading: 'Employee Performance',
  bodyHtml,
  scripts,
});
