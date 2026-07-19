export const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Competence Control — Bohs LMS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #14171A;
    --panel: #1B1F23;
    --panel-alt: #21262B;
    --grid-line: #2E3438;
    --text-primary: #ECE8DF;
    --text-muted: #8B9199;
    --hazard: #F2B705;
    --risk: #C1443A;
    --refresher: #D98E2A;
    --competent: #3E9B54;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
  }

  a { color: inherit; }

  .shell {
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px 24px 64px;
  }

  /* ---------- Header ---------- */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1px solid var(--grid-line);
    padding-bottom: 20px;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.14em;
    color: var(--hazard);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  h1 {
    font-family: 'Big Shoulders Display', sans-serif;
    font-weight: 800;
    font-size: 40px;
    letter-spacing: 0.01em;
    margin: 0;
    text-transform: uppercase;
    line-height: 1;
  }

  .clock-block {
    text-align: right;
    font-family: 'IBM Plex Mono', monospace;
  }

  .clock {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .clock-label {
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* ---------- Stat tiles ---------- */
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .stat-tile {
    background: var(--panel);
    border: 1px solid var(--grid-line);
    padding: 18px 20px;
    border-radius: 3px;
  }

  .stat-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .stat-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 38px;
    font-weight: 600;
    line-height: 1;
  }

  .stat-value.risk { color: var(--risk); }
  .stat-value.refresher { color: var(--refresher); }
  .stat-value.total { color: var(--hazard); }

  /* ---------- Heat map panel ---------- */
  .panel {
    background: var(--panel);
    border: 1px solid var(--grid-line);
    border-radius: 3px;
    margin-bottom: 28px;
    overflow: hidden;
  }

  .panel-header {
    position: relative;
    padding: 16px 20px;
    background: var(--panel-alt);
    border-bottom: 3px solid transparent;
    border-image: repeating-linear-gradient(
      -45deg,
      var(--hazard) 0 10px,
      #14171A 10px 20px
    ) 3;
  }

  .panel-title {
    font-family: 'Big Shoulders Display', sans-serif;
    font-weight: 700;
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .panel-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .heatmap {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1px;
    background: var(--grid-line);
  }

  .heat-cell {
    background: var(--panel);
    padding: 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .heat-dept {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .heat-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot.green { background: var(--competent); box-shadow: 0 0 6px var(--competent); }
  .dot.amber { background: var(--refresher); box-shadow: 0 0 6px var(--refresher); }
  .dot.red { background: var(--risk); box-shadow: 0 0 6px var(--risk); }
  .dot.gray { background: var(--text-muted); }

  .status-green { color: var(--competent); }
  .status-amber { color: var(--refresher); }
  .status-red { color: var(--risk); }
  .status-gray { color: var(--text-muted); }

  /* ---------- Gap log table ---------- */
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }

  thead th {
    text-align: left;
    padding: 12px 20px;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
    border-bottom: 1px solid var(--grid-line);
  }

  tbody td {
    padding: 12px 20px;
    border-bottom: 1px solid var(--grid-line);
  }

  tbody tr:last-child td { border-bottom: none; }

  .pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 2px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .pill.not_competent { background: rgba(193, 68, 58, 0.16); color: var(--risk); }
  .pill.needs_refresher { background: rgba(217, 142, 42, 0.16); color: var(--refresher); }
  .pill.expired { background: rgba(193, 68, 58, 0.16); color: var(--risk); }

  .empty-state {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
  }

  footer {
    text-align: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 40px;
    letter-spacing: 0.04em;
  }

  @media (max-width: 640px) {
    .stats { grid-template-columns: 1fr; }
    h1 { font-size: 30px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .stat-value { transition: none !important; }
  }
</style>
</head>
<body>
  <div class="shell">
    <div class="header">
      <div>
        <div class="eyebrow">Bohs LMS — Workforce Readiness</div>
        <h1>Competence Control</h1>
      </div>
      <div class="clock-block">
        <div class="clock" id="clock">--:--:--</div>
        <div class="clock-label" id="clock-date">Loading</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-tile">
        <div class="stat-label">Open Gaps</div>
        <div class="stat-value total" id="stat-total">0</div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">Needs Refresher</div>
        <div class="stat-value refresher" id="stat-refresher">0</div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">Not Competent / Expired</div>
        <div class="stat-value risk" id="stat-risk">0</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Workforce Readiness Heat Map</div>
        <div class="panel-sub">Department-level competence risk — sample layout, connect department tagging to populate live</div>
      </div>
      <div class="heatmap" id="heatmap">
        <!-- populated by JS -->
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Live Gap Log</div>
        <div class="panel-sub">Pulled directly from /api/competency/gaps</div>
      </div>
      <div id="gap-log-wrap">
        <div class="empty-state">Loading gap log&hellip;</div>
      </div>
    </div>

    <footer>Bohs Consultants &mdash; Competence Control build</footer>
  </div>

<script>
  // ---------- Live clock ----------
  function tickClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-ZA', { hour12: false });
    document.getElementById('clock-date').textContent = now.toLocaleDateString('en-ZA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  tickClock();
  setInterval(tickClock, 1000);

  // ---------- Count-up animation for stat tiles ----------
  function countUp(el, target, duration = 600) {
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(progress * target);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ---------- Department heat map (placeholder until department tagging exists) ----------
  const departments = [
    { name: 'Drilling', status: 'red', label: 'High Risk' },
    { name: 'Engineering', status: 'amber', label: 'Medium Risk' },
    { name: 'Maintenance', status: 'amber', label: 'Medium Risk' },
    { name: 'Quality Control', status: 'green', label: 'Low Risk' },
    { name: 'HR', status: 'green', label: 'Low Risk' },
  ];

  const heatmapEl = document.getElementById('heatmap');
  departments.forEach(dept => {
    const cell = document.createElement('div');
    cell.className = 'heat-cell';
    cell.innerHTML = \`
      <div class="heat-dept">\${dept.name}</div>
      <div class="heat-status status-\${dept.status}">
        <span class="dot \${dept.status}"></span>
        \${dept.label}
      </div>
    \`;
    heatmapEl.appendChild(cell);
  });

  // ---------- Live gap log ----------
  fetch('/api/competency/gaps')
    .then(r => r.json())
    .then(data => {
      const gaps = data.gaps || [];
      const wrap = document.getElementById('gap-log-wrap');

      const notCompetentCount = gaps.filter(g => g.status === 'not_competent' || g.status === 'expired').length;
      const refresherCount = gaps.filter(g => g.status === 'needs_refresher').length;

      countUp(document.getElementById('stat-total'), gaps.length);
      countUp(document.getElementById('stat-refresher'), refresherCount);
      countUp(document.getElementById('stat-risk'), notCompetentCount);

      if (gaps.length === 0) {
        wrap.innerHTML = '<div class="empty-state">No open gaps recorded. Once employees are linked to competency evidence, anything short of \\'competent\\' will show here.</div>';
        return;
      }

      const rows = gaps.map(g => \`
        <tr>
          <td>\${g.employeeId}</td>
          <td>\${g.competencyId}</td>
          <td><span class="pill \${g.status}">\${g.status.replace('_', ' ')}</span></td>
        </tr>
      \`).join('');

      wrap.innerHTML = \`
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Competency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>\${rows}</tbody>
        </table>
      \`;
    })
    .catch(() => {
      document.getElementById('gap-log-wrap').innerHTML =
        '<div class="empty-state">Could not reach /api/competency/gaps. Confirm the Worker is deployed and KV is bound.</div>';
    });
</script>
</body>
</html>`;
