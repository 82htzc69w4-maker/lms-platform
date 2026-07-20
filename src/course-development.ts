import { renderLayout } from './layout';

const bodyHtml = `
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
    <a href="/course-delivery" style="font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">&larr; Back to Course Delivery</a>
    <a href="#" id="preview-as-learner-link" target="_blank" class="btn" style="text-decoration: none;">Preview as Learner</a>
  </div>

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
    <div class="design-layout">
      <div class="design-left">

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">Modules</div>
            <div class="panel-sub">A module groups the blocks that follow it — every tool below can be used inside one</div>
          </div>
          <div class="panel-body">
            <div class="tool-palette">
              <button class="tool-btn" data-block-type="module">+ Module</button>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">Standard Content</div>
            <div class="panel-sub">Click a tool to add it, click a block below to edit it</div>
          </div>
          <div class="panel-body">
            <div class="tool-palette">
              <button class="tool-btn" data-block-type="heading">+ Heading Section</button>
              <button class="tool-btn" data-block-type="subtitle">+ Subtitle</button>
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
            <div class="panel-title">Section Controls</div>
            <div class="panel-sub">Navigation buttons, and the marker that ends a module</div>
          </div>
          <div class="panel-body">
            <div class="tool-palette">
              <button class="tool-btn" data-block-type="forwardButton">+ Forward Button</button>
              <button class="tool-btn" data-block-type="backButton">+ Back Button</button>
              <button class="tool-btn" data-block-type="endOfSection">+ End of Section</button>
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

      <div class="design-right">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title" id="editor-panel-title">Block Editor</div>
            <div class="panel-sub" id="editor-panel-sub">Select a block on the left to edit it</div>
          </div>
          <div class="panel-body" id="block-editor-wrap">
            <div class="empty-state">Nothing selected yet.</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">Preview</div>
            <div class="panel-sub">The whole course so far, in order — updates live as you edit</div>
          </div>
          <div class="panel-body" id="block-preview-wrap">
            <div class="empty-state">No content added yet. The whole course will build up here as you add blocks.</div>
          </div>
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
  document.getElementById('preview-as-learner-link').href = '/course-preview/' + COURSE_ID;

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
    module: 'Module',
    heading: 'Heading Section',
    subtitle: 'Subtitle',
    text: 'Text Field',
    webContent: 'Web Content',
    presentation: 'Presentation / Document',
    mobileUpload: 'Mobile Upload (SCORM/HTML/CMI5)',
    test: 'Test',
    assignmentUpload: 'Assignment Upload',
    assessmentUpload: 'Assessment Upload',
    externalCertificate: 'External Certificate Upload',
    experientialLog: 'Experiential Log',
    forwardButton: 'Forward Button',
    backButton: 'Back Button',
    endOfSection: 'End of Section',
  };

  const LAYOUT_ICONS = {
    textOnly: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="28" height="2.5"/><rect x="2" y="10" width="28" height="2.5"/><rect x="2" y="16" width="18" height="2.5"/></svg>',
    imageLeft: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="18"/><rect x="17" y="4" width="13" height="2.5"/><rect x="17" y="10" width="13" height="2.5"/><rect x="17" y="16" width="9" height="2.5"/></svg>',
    bannerTop: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="28" height="9"/><rect x="2" y="15" width="28" height="2.5"/><rect x="2" y="20" width="18" height="2.5"/></svg>',
  };

  let currentBlocks = [];
  let selectedBlockId = null;
  let blockOpInFlight = false;

  function setToolsDisabled(disabled) {
    document.querySelectorAll('.tool-btn').forEach(b => { b.disabled = disabled; });
  }

  // Ensures only one add/delete/reorder/save request against course content
  // is ever in flight at a time. Without this, two quick clicks can race:
  // both read the content before either has written, and the second write
  // silently overwrites the first, dropping whatever block it added.
  function runBlockOp(fetchPromiseFactory, onSuccess) {
    if (blockOpInFlight) return;
    blockOpInFlight = true;
    setToolsDisabled(true);

    fetchPromiseFactory()
      .then(onSuccess)
      .catch(() => { /* leave state as-is; user can retry */ })
      .finally(() => {
        blockOpInFlight = false;
        setToolsDisabled(false);
      });
  }

  function renderBlocks(blocks) {
    currentBlocks = blocks;
    const wrap = document.getElementById('content-blocks-wrap');

    if (blocks.length === 0) {
      wrap.innerHTML = '<div class="empty-state">No content added yet. Use the tools above to start building this course.</div>';
      renderFullPreview();
      return;
    }

    wrap.innerHTML = blocks.map((block, i) => \`
      <div class="content-block-row\${block.id === selectedBlockId ? ' selected' : ''}" data-block-id="\${block.id}">
        <span class="content-block-type">\${BLOCK_TYPE_LABELS[block.type] || block.type}</span>
        <span class="content-block-name\${block.title ? '' : ' untitled'}">\${block.title || 'Untitled — click to edit'}</span>
        <div class="content-block-actions">
          <button data-action="up" data-block-id="\${block.id}" \${i === 0 ? 'disabled' : ''}>&uarr;</button>
          <button data-action="down" data-block-id="\${block.id}" \${i === blocks.length - 1 ? 'disabled' : ''}>&darr;</button>
          <button data-action="delete" data-block-id="\${block.id}" class="delete">Delete</button>
        </div>
      </div>
    \`).join('');

    wrap.querySelectorAll('.content-block-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.content-block-actions')) return;
        const block = currentBlocks.find(b => b.id === row.dataset.blockId);
        if (block) openBlockEditor(block);
      });
    });

    wrap.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        runBlockOp(
          () => fetch('/api/courses/' + COURSE_ID + '/content/' + btn.dataset.blockId, { method: 'DELETE' }).then(r => r.json()),
          (data) => {
            if (btn.dataset.blockId === selectedBlockId) closeBlockEditor();
            renderBlocks(data.blocks || []);
          }
        );
      });
    });

    wrap.querySelectorAll('[data-action="up"], [data-action="down"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentIds = blocks.map(b => b.id);
        const idx = currentIds.indexOf(btn.dataset.blockId);
        const swapWith = btn.dataset.action === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= currentIds.length) return;

        [currentIds[idx], currentIds[swapWith]] = [currentIds[swapWith], currentIds[idx]];

        runBlockOp(
          () => fetch('/api/courses/' + COURSE_ID + '/content-reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blockIds: currentIds })
          }).then(r => r.json()),
          (data) => renderBlocks(data.blocks || [])
        );
      });
    });

    renderFullPreview();
  }

  function closeBlockEditor() {
    selectedBlockId = null;
    pendingPreviewOverride = null;
    document.getElementById('editor-panel-title').textContent = 'Block Editor';
    document.getElementById('editor-panel-sub').textContent = 'Select a block on the left to edit it';
    document.getElementById('block-editor-wrap').innerHTML = '<div class="empty-state">Nothing selected yet.</div>';
    renderFullPreview();
  }

  const NO_IMAGE_PLACEHOLDER = '<div style="width:120px;height:80px;background:var(--panel-alt);border:1px dashed var(--grid-line);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;flex-shrink:0;">No image</div>';
  const NO_BANNER_PLACEHOLDER = '<div style="width:100%;height:100px;background:var(--panel-alt);border:1px dashed var(--grid-line);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;margin-bottom:12px;">No banner image</div>';

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function renderBlockHtml(block) {
    const safeTitle = escapeHtml(block.title) || 'Untitled';
    const settings = block.settings || {};
    const layout = settings.layout || 'textOnly';
    const imageDataUrl = settings.imageDataUrl;

    if (block.type === 'module') {
      return \`<div style="margin:24px 0 16px; padding:10px 14px; background:rgba(242,183,5,0.12); border-left:3px solid var(--hazard); border-radius:2px;" data-preview-block-id="\${block.id}">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--hazard);">Module</span>
        <div style="font-family:'Big Shoulders Display',sans-serif; font-size:20px; text-transform:uppercase; color:var(--text-primary); margin-top:4px;">\${safeTitle}</div>
      </div>\`;
    }

    if (block.type === 'forwardButton') {
      return \`<div style="text-align:right; margin:12px 0;" data-preview-block-id="\${block.id}">
        <button class="btn" style="pointer-events:none;">\${escapeHtml(block.title) || 'Next'} &rarr;</button>
      </div>\`;
    }

    if (block.type === 'backButton') {
      return \`<div style="text-align:left; margin:12px 0;" data-preview-block-id="\${block.id}">
        <button class="btn" style="pointer-events:none; background:var(--panel-alt); color:var(--text-primary); border:1px solid var(--grid-line);">&larr; \${escapeHtml(block.title) || 'Back'}</button>
      </div>\`;
    }

    if (block.type === 'endOfSection') {
      return \`<div style="display:flex; align-items:center; gap:10px; margin:24px 0; color:var(--competent);" data-preview-block-id="\${block.id}">
        <div style="flex:1; height:1px; background:var(--grid-line);"></div>
        <span style="font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">&check; \${escapeHtml(block.title) || 'End of Module'}</span>
        <div style="flex:1; height:1px; background:var(--grid-line);"></div>
      </div>\`;
    }

    if (block.type === 'heading') {
      if (layout === 'imageLeft') {
        return \`<div style="display:flex; gap:16px; align-items:center; margin-bottom:20px;" data-preview-block-id="\${block.id}">
          \${imageDataUrl ? \`<img src="\${imageDataUrl}" style="width:120px; height:80px; object-fit:cover; border-radius:2px; flex-shrink:0;" />\` : NO_IMAGE_PLACEHOLDER}
          <h2 style="margin:0; font-family:'Big Shoulders Display',sans-serif; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>
        </div>\`;
      } else if (layout === 'bannerTop') {
        return \`<div style="margin-bottom:20px;" data-preview-block-id="\${block.id}">
          \${imageDataUrl ? \`<img src="\${imageDataUrl}" style="width:100%; max-height:140px; object-fit:cover; border-radius:2px; margin-bottom:12px;" />\` : NO_BANNER_PLACEHOLDER}
          <h2 style="margin:0; font-family:'Big Shoulders Display',sans-serif; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>
        </div>\`;
      }
      return \`<h2 style="margin:0 0 20px; font-family:'Big Shoulders Display',sans-serif; font-size:24px; text-transform:uppercase; color:var(--text-primary);" data-preview-block-id="\${block.id}">\${safeTitle}</h2>\`;
    }

    if (block.type === 'subtitle') {
      return \`<div style="font-family:'Inter',sans-serif; font-size:15px; color:var(--text-muted); font-style:italic; margin-bottom:20px;" data-preview-block-id="\${block.id}">\${safeTitle}</div>\`;
    }

    return \`<div style="margin-bottom:20px; padding:12px; border:1px dashed var(--grid-line); border-radius:2px;" data-preview-block-id="\${block.id}">
      <span class="content-block-type" style="display:inline-block; margin-bottom:6px;">\${BLOCK_TYPE_LABELS[block.type] || block.type}</span>
      <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${safeTitle}</div>
    </div>\`;
  }

  let pendingPreviewOverride = null;

  function renderFullPreview() {
    const wrap = document.getElementById('block-preview-wrap');

    if (currentBlocks.length === 0) {
      wrap.innerHTML = '<div class="empty-state">No content added yet. The whole course will build up here as you add blocks.</div>';
      return;
    }

    wrap.innerHTML = currentBlocks.map(b => {
      let blockToRender = b;
      if (pendingPreviewOverride && b.id === pendingPreviewOverride.blockId) {
        blockToRender = {
          ...b,
          title: pendingPreviewOverride.title,
          settings: { layout: pendingPreviewOverride.layout, imageDataUrl: pendingPreviewOverride.imageDataUrl },
        };
      }
      return renderBlockHtml(blockToRender);
    }).join('');
  }

  function openBlockEditor(block) {
    selectedBlockId = block.id;
    renderBlocks(currentBlocks); // refresh to show selection highlight

    const typeLabel = BLOCK_TYPE_LABELS[block.type] || block.type;
    document.getElementById('editor-panel-title').textContent = typeLabel;
    document.getElementById('editor-panel-sub').textContent = 'Editing this block — changes save when you click Save';

    const editorWrap = document.getElementById('block-editor-wrap');
    const settings = block.settings || {};
    const isHeading = block.type === 'heading';

    let layoutHtml = '';
    if (isHeading) {
      const layout = settings.layout || 'textOnly';
      layoutHtml = \`
        <div class="stat-label" style="margin-bottom: 4px;">Layout</div>
        <div class="layout-options">
          <div class="layout-option\${layout === 'textOnly' ? ' selected' : ''}" data-layout="textOnly">
            \${LAYOUT_ICONS.textOnly}
            <span>Text Only</span>
          </div>
          <div class="layout-option\${layout === 'imageLeft' ? ' selected' : ''}" data-layout="imageLeft">
            \${LAYOUT_ICONS.imageLeft}
            <span>Image Left</span>
          </div>
          <div class="layout-option\${layout === 'bannerTop' ? ' selected' : ''}" data-layout="bannerTop">
            \${LAYOUT_ICONS.bannerTop}
            <span>Banner on Top</span>
          </div>
        </div>
        <div class="image-upload-area" id="image-upload-area" style="display: \${layout === 'textOnly' ? 'none' : 'block'};">
          <img id="block-image-preview" class="image-upload-preview" src="\${settings.imageDataUrl || ''}" style="display: \${settings.imageDataUrl ? 'block' : 'none'};" />
          <input type="file" id="block-image-input" accept="image/*" />
        </div>
      \`;
    }

    const TITLE_PLACEHOLDERS = {
      module: 'Module Name (e.g. "Module 1: Introduction")',
      forwardButton: 'Button label (default: Next)',
      backButton: 'Button label (default: Back)',
      endOfSection: 'Section label (default: End of Module)',
    };
    const titlePlaceholder = TITLE_PLACEHOLDERS[block.type] || 'Title';

    editorWrap.innerHTML = \`
      <div class="form-row">
        <input type="text" id="block-title-input" placeholder="\${titlePlaceholder}" value="\${(block.title || '').replace(/"/g, '&quot;')}" />
      </div>
      \${layoutHtml}
      <button class="btn" id="save-block-btn" style="margin-top: 8px;">Save</button>
      <div id="block-save-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
    \`;

    let pendingLayout = settings.layout || 'textOnly';
    let pendingImageDataUrl = settings.imageDataUrl || null;

    pendingPreviewOverride = {
      blockId: block.id,
      title: block.title,
      layout: pendingLayout,
      imageDataUrl: pendingImageDataUrl,
    };
    renderFullPreview();

    document.getElementById('block-title-input').addEventListener('input', (e) => {
      pendingPreviewOverride.title = e.target.value;
      renderFullPreview();
    });

    if (isHeading) {
      editorWrap.querySelectorAll('.layout-option').forEach(opt => {
        opt.addEventListener('click', () => {
          pendingLayout = opt.dataset.layout;
          pendingPreviewOverride.layout = pendingLayout;
          editorWrap.querySelectorAll('.layout-option').forEach(o => o.classList.toggle('selected', o === opt));
          document.getElementById('image-upload-area').style.display = pendingLayout === 'textOnly' ? 'none' : 'block';
          renderFullPreview();
        });
      });

      document.getElementById('block-image-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          document.getElementById('block-save-message').textContent = 'Image is too large — please use one under 2MB.';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          pendingImageDataUrl = reader.result;
          pendingPreviewOverride.imageDataUrl = pendingImageDataUrl;
          const preview = document.getElementById('block-image-preview');
          preview.src = pendingImageDataUrl;
          preview.style.display = 'block';
          renderFullPreview();
        };
        reader.readAsDataURL(file);
      });
    }

    document.getElementById('save-block-btn').addEventListener('click', () => {
      const msgEl = document.getElementById('block-save-message');
      const payload = { title: document.getElementById('block-title-input').value.trim() };
      if (isHeading) {
        payload.settings = { layout: pendingLayout, imageDataUrl: pendingImageDataUrl };
      }

      runBlockOp(
        () => fetch('/api/courses/' + COURSE_ID + '/content/' + block.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.json()),
        (data) => {
          msgEl.textContent = 'Saved.';
          msgEl.style.color = 'var(--competent)';
          renderBlocks(data.blocks || []);
        }
      );
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
      runBlockOp(
        () => fetch('/api/courses/' + COURSE_ID + '/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, title: '' })
        }).then(r => r.json()),
        (data) => {
          renderBlocks(data.blocks || []);
          const newBlock = data.blocks[data.blocks.length - 1];
          if (newBlock) openBlockEditor(newBlock);
        }
      );
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
