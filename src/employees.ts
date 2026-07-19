import { renderLayout } from './layout';

const bodyHtml = `
  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Add Employee</div>
      <div class="panel-sub">Assigning a department is what powers the readiness heat map</div>
    </div>
    <div class="panel-body">
      <div class="form-row">
        <input type="text" id="emp-id" placeholder="Employee ID (e.g. emp-002)" />
        <input type="text" id="emp-name" placeholder="Full name" />
        <input type="text" id="emp-department" placeholder="Department (e.g. Drilling)" />
        <button class="btn" id="add-emp-btn">Add Employee</button>
      </div>
      <div id="add-emp-message"></div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Employee Directory</div>
      <div class="panel-sub">Pulled from /api/competency/employees</div>
    </div>
    <div id="employee-list-wrap">
      <div class="empty-state">Loading employees&hellip;</div>
    </div>
  </div>
`;

const scripts = `
  function loadEmployees() {
    fetch('/api/competency/employees')
      .then(r => r.json())
      .then(data => {
        const employees = data.employees || [];
        const wrap = document.getElementById('employee-list-wrap');

        if (employees.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No employees added yet. Use the form above to add the first one.</div>';
          return;
        }

        const rows = employees.map(e => \`
          <tr>
            <td>\${e.id}</td>
            <td>\${e.name}</td>
            <td>\${e.department}</td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;
      })
      .catch(() => {
        document.getElementById('employee-list-wrap').innerHTML =
          '<div class="empty-state">Could not reach /api/competency/employees.</div>';
      });
  }

  document.getElementById('add-emp-btn').addEventListener('click', () => {
    const id = document.getElementById('emp-id').value.trim();
    const name = document.getElementById('emp-name').value.trim();
    const department = document.getElementById('emp-department').value.trim();
    const msgEl = document.getElementById('add-emp-message');

    if (!id || !name || !department) {
      msgEl.textContent = 'All three fields are required.';
      return;
    }

    fetch('/api/competency/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, department })
    })
      .then(r => r.json())
      .then(() => {
        msgEl.textContent = '';
        document.getElementById('emp-id').value = '';
        document.getElementById('emp-name').value = '';
        document.getElementById('emp-department').value = '';
        loadEmployees();
      })
      .catch(() => { msgEl.textContent = 'Failed to add employee.'; });
  });

  loadEmployees();
`;

export const employeesHtml = renderLayout({
  title: 'Employees',
  activePath: '/employees',
  eyebrow: 'Bohs LMS — Workforce Directory',
  heading: 'Employees',
  bodyHtml,
  scripts,
});
