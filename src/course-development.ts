import { renderLayout } from './layout';

const bodyHtml = `
  <a href="/course-delivery" style="display: inline-block; margin-bottom: 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">&larr; Back to Course Delivery</a>

  <div class="tabbar">
    <button class="tab-btn active" data-tab="information">Course Information</button>
    <button class="tab-btn" data-tab="design">Course Design</button>
  </div>

  <div class="tab-panel active" data-tab-panel="information">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title" id="course-panel-title">Course Information</div>
        <div class="panel-sub" id="course-status-sub">Loading&hellip;</div>
      </div>
      <div class="panel-body">

        <div class="form-row">
          <input type="text" id="course-number" placeholder="Course Number" />
          <input type="text" id="course-name" placeholder="Course Name" />
        </div>
        <div class="form-row">
          <input type="text" id="course-instructor" placeholder="Instructor" />
          <input type="text" id="course-duration" placeholder="Duration (e.g. 4 weeks, 12 hours)" />
          <select id="course-category"><option value="">Category</option></select>
        </div>
        <div class="form-row">
          <textarea id="course-description" placeholder="Description" rows="3" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px;"></textarea>
        </div>
        <div class="form-row">
          <textarea id="course-outcomes" placeholder="Outcomes" rows="3" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px;"></textarea>
        </div>
        <div class="form-row">
          <textarea id="course-linkedStandards" placeholder="Linked Standards" rows="2" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px;"></textarea>
        </div>

        <button class="btn" id="save-course-btn">Save Changes</button>
        <button class="btn" id="publish-course-btn" style="margin-left: 8px;">Publish</button>
        <div id="course-save-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>

      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="design">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Standard Content</div>
        <div class="panel-sub">Add a block, then build it out — each type will get its own editor later</div>
      </div>
      <div class="panel-body">
        <div class="tool-palette">
          <button class="tool-btn" data-block-type="heading">+ Heading Section</button>
          <button class="tool-btn" data-block-type="text">+ Text Field</button>
          <button class="tool-btn" data-block-type="webContent">+ Web Content</button>
          <button class="tool-btn" data-block-type="presentation">+ Presentation / Document</button>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Learning Activity</div>
        <div class="panel-sub">Interactive and assessed components</div>
      </div>
      <div class="panel-body">
        <div class="tool-palette">
          <button class="tool-btn" data-block-type="mobileUpload">+ Mobile Upload (SCORM/HTML/CMI5)</button>
          <button class="tool-btn" data-block-type="test">+ Test</button>
          <button class="tool-btn" data-block-type="assignmentUpload">+ Assignment Upload</button>
          <button class="tool-btn" data-block-type="assessmentUpload">+ Assessment Upload</button>
          <button class="tool-btn" data-block-type="externalCertificate">+ External Certificate Upload</button>
          <button class="tool-btn" data-block-type="experientialLog">+ Experiential Log</button>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Course Content</div>
        <div class="panel-sub">The order below is the order learners will see</div>
      </div>
      <div class="panel-body">
        <div id="content-blocks-wrap">
          <div class="empty-state">No content added yet. Use the tools above to start building this course.</div>
        </div>
      </div>
    </div>
  </div>
`;

const scripts = `
  // ---------- Role gate: Instructor and Administrator only ----------
  fetch('/api/auth/me')
    .then(r => {
      if (!r.ok) throw new Error('not logged in');
      return r.json();
    })
    .then(data => {
      const role = data.user.role;
      if (role !== 'instructor' && role !== 'administrator') {
        window.location.href = '/';
      }
    })
    .catch(() => {
      window.location.href = '/login';
    });

  // ---------- Tab switching (only one tab today, ready for more later) ----------
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tabPanel === tab));
    });
  });

  // ---------- Load course ----------
  const COURSE_ID = window.location.pathname.split('/').pop();
  let currentStatus = 'draft';

  function loadCategoryOptions(selected) {
    fetch('/api/lookups/courseCategories')
      .then(r => r.json())
      .then(data => {
        const select = document.getElementById('course-category');
        const placeholder = select.options[0];
        select.innerHTML = '';
        select.appendChild(placeholder);
        const values = data.values || [];
        if (selected && !values.includes(selected)) values.unshift(selected);
        values.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v;
          opt.textContent = v;
          select.appendChild(opt);
        });
        if (selected) select.value = selected;
      });
  }

  function loadCourse() {
    fetch('/api/courses/' + COURSE_ID)
      .then(r => r.json())
      .then(data => {
        const course = data.course;
        if (!course) throw new Error('not found');

        currentStatus = course.status;
        document.getElementById('course-panel-title').textContent = course.title || 'Course Information';
        document.getElementById('course-status-sub').textContent =
          'Status: ' + (course.status === 'published' ? 'Published' : 'Draft');

        document.getElementById('course-number').value = course.courseNumber || '';
        document.getElementById('course-name').value = course.title || '';
        document.getElementById('course-instructor').value = course.instructor || '';
        document.getElementById('course-duration').value = course.duration || '';
        document.getElementById('course-description').value = course.description || '';
        document.getElementById('course-outcomes').value = course.outcomes || '';
        document.getElementById('course-linkedStandards').value = course.linkedStandards || '';
        loadCategoryOptions(course.category);

        document.getElementById('publish-course-btn').style.display = course.status === 'published' ? 'none' : 'inline-block';
      })
      .catch(() => {
        document.getElementById('course-status-sub').textContent = 'Could not load this course.';
      });
  }
  loadCourse();

  document.getElementById('save-course-btn').addEventListener('click', () => {
    const msgEl = document.getElementById('course-save-message');
    const payload = {
      courseNumber: document.getElementById('course-number').value.trim(),
      title: document.getElementById('course-name').value.trim(),
      instructor: document.getElementById('course-instructor').value.trim(),
      duration: document.getElementById('course-duration').value.trim(),
      category: document.getElementById('course-category').value,
      description: document.getElementById('course-description').value.trim(),
      outcomes: document.getElementById('course-outcomes').value.trim(),
      linkedStandards: document.getElementById('course-linkedStandards').value.trim(),
    };

    fetch('/api/courses/' + COURSE_ID, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to save');
        return data;
      })
      .then(() => {
        msgEl.textContent = 'Saved.';
        msgEl.style.color = 'var(--competent)';
        loadCourse();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });

  document.getElementById('publish-course-btn').addEventListener('click', () => {
    fetch('/api/courses/' + COURSE_ID + '/publish', { method: 'POST' })
      .then(r => r.json())
      .then(() => {
        loadCourse();
      });
  });

  // ---------- Course Design: content blocks ----------
  const BLOCK_TYPE_LABELS = {
    heading: 'Heading Section',
    text: 'Text Field',
    webContent: 'Web Content',
    presentation: 'Presentation / Document',
    mobileUpload: 'Mobile Upload (SCORM/HTML/CMI5)',
    test: 'Test',
    assignmentUpload: 'Assignment Upload',
    assessmentUpload: 'Assessment Upload',
    externalCertificate: 'External Certificate Upload',
    experientialLog: 'Experiential Log',
  };

  function renderBlocks(blocks) {
    const wrap = document.getElementById('content-blocks-wrap');

    if (blocks.length === 0) {
      wrap.innerHTML = '<div class="empty-state">No content added yet. Use the tools above to start building this course.</div>';
      return;
    }

    wrap.innerHTML = '<div class="content-blocks">' + blocks.map((block, i) => \`
      <div class="content-block" data-block-id="\${block.id}">
        <span class="content-block-type">\${BLOCK_TYPE_LABELS[block.type] || block.type}</span>
        <input type="text" value="\${block.title.replace(/"/g, '&quot;')}" placeholder="Untitled — click to name this block" data-block-id="\${block.id}" class="block-title-input" />
        <div class="content-block-actions">
          <button data-action="up" data-block-id="\${block.id}" \${i === 0 ? 'disabled' : ''}>&uarr;</button>
          <button data-action="down" data-block-id="\${block.id}" \${i === blocks.length - 1 ? 'disabled' : ''}>&darr;</button>
          <button data-action="delete" data-block-id="\${block.id}" class="delete">Delete</button>
        </div>
      </div>
    \`).join('') + '</div>';

    wrap.querySelectorAll('.block-title-input').forEach(input => {
      input.addEventListener('blur', () => {
        fetch('/api/courses/' + COURSE_ID + '/content/' + input.dataset.blockId, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: input.value.trim() })
        });
      });
    });

    wrap.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        fetch('/api/courses/' + COURSE_ID + '/content/' + btn.dataset.blockId, { method: 'DELETE' })
          .then(r => r.json())
          .then(data => renderBlocks(data.blocks || []));
      });
    });

    wrap.querySelectorAll('[data-action="up"], [data-action="down"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const currentIds = blocks.map(b => b.id);
        const idx = currentIds.indexOf(btn.dataset.blockId);
        const swapWith = btn.dataset.action === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= currentIds.length) return;

        [currentIds[idx], currentIds[swapWith]] = [currentIds[swapWith], currentIds[idx]];

        fetch('/api/courses/' + COURSE_ID + '/content-reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockIds: currentIds })
        })
          .then(r => r.json())
          .then(data => renderBlocks(data.blocks || []));
      });
    });
  }

  function loadContentBlocks() {
    fetch('/api/courses/' + COURSE_ID + '/content')
      .then(r => r.json())
      .then(data => renderBlocks(data.blocks || []))
      .catch(() => {
        document.getElementById('content-blocks-wrap').innerHTML = '<div class="empty-state">Could not load course content.</div>';
      });
  }

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.blockType;
      fetch('/api/courses/' + COURSE_ID + '/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: '' })
      })
        .then(r => r.json())
        .then(data => renderBlocks(data.blocks || []));
    });
  });

  loadContentBlocks();
`;

export const courseDevelopmentHtml = renderLayout({
  title: 'Course Development',
  activePath: '/course-delivery',
  eyebrowSuffix: 'Course Development',
  heading: 'Course Development',
  bodyHtml,
  scripts,
});
