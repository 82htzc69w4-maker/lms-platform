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

        <img id="course-banner-header" class="course-banner" style="display:none;" alt="" />

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

        <div style="margin-bottom: 20px; margin-top: 8px;">
          <div class="stat-label" style="margin-bottom: 8px;">Course Image</div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <img id="course-image-preview" src="" alt="Course image preview"
                 style="height: 90px; width: 140px; object-fit: cover; display: none; background: var(--panel-alt); border: 1px solid var(--grid-line); border-radius: 3px;" />
            <div id="course-image-empty" class="stat-label" style="text-transform: none; letter-spacing: 0;">No course image uploaded yet</div>
          </div>
          <div class="form-row" style="margin-top: 12px;">
            <input type="file" id="course-image-input" accept="image/*" />
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div class="stat-label" style="margin-bottom: 8px;">Course Banner</div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <img id="course-banner-preview" src="" alt="Course banner preview"
                 style="height: 70px; width: 220px; object-fit: cover; display: none; background: var(--panel-alt); border: 1px solid var(--grid-line); border-radius: 3px;" />
            <div id="course-banner-empty" class="stat-label" style="text-transform: none; letter-spacing: 0;">No banner uploaded yet</div>
          </div>
          <div class="form-row" style="margin-top: 12px;">
            <input type="file" id="course-banner-input" accept="image/*" />
          </div>
          <div class="form-row" style="margin-top: 8px;">
            <select id="course-banner-fit">
              <option value="cover">Fit: Cover (crop to fill)</option>
              <option value="contain">Fit: Contain (show whole image)</option>
            </select>
          </div>
          <div class="stat-label" style="margin-bottom: 4px; margin-top: 8px;">Banner Height: <span id="banner-height-label">220px</span></div>
          <input type="range" id="course-banner-height" min="100" max="400" value="220" style="width:100%;" />
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
              <button class="tool-btn" data-block-type="textImage">+ Text + Image</button>
              <button class="tool-btn" data-block-type="pictureOnly">+ Picture Only</button>
              <button class="tool-btn" data-block-type="webContent">+ Web Content</button>
              <button class="tool-btn" data-block-type="table">+ Table</button>
              <button class="tool-btn" data-block-type="presentation">+ Presentation</button>
              <button class="tool-btn" data-block-type="document">+ Document</button>
              <button class="tool-btn" data-block-type="videoUpload">+ Video Upload</button>
              <button class="tool-btn" data-block-type="youtubeLink">+ YouTube Link</button>
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

  let pendingCourseImageDataUrl = null;
  let pendingCourseBannerDataUrl = null;

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

        const bannerHeaderEl = document.getElementById('course-banner-header');
        if (course.bannerDataUrl) {
          bannerHeaderEl.src = course.bannerDataUrl;
          bannerHeaderEl.style.display = 'block';
        } else {
          bannerHeaderEl.style.display = 'none';
        }

        document.getElementById('course-number').value = course.courseNumber || '';
        document.getElementById('course-name').value = course.title || '';
        document.getElementById('course-instructor').value = course.instructor || '';
        document.getElementById('course-duration').value = course.duration || '';
        document.getElementById('course-description').value = course.description || '';
        document.getElementById('course-outcomes').value = course.outcomes || '';
        document.getElementById('course-linkedStandards').value = course.linkedStandards || '';
        loadCategoryOptions(course.category);

        pendingCourseImageDataUrl = course.imageDataUrl || null;
        if (course.imageDataUrl) {
          document.getElementById('course-image-preview').src = course.imageDataUrl;
          document.getElementById('course-image-preview').style.display = 'block';
          document.getElementById('course-image-empty').style.display = 'none';
        }

        pendingCourseBannerDataUrl = course.bannerDataUrl || null;
        if (course.bannerDataUrl) {
          document.getElementById('course-banner-preview').src = course.bannerDataUrl;
          document.getElementById('course-banner-preview').style.display = 'block';
          document.getElementById('course-banner-empty').style.display = 'none';
        }

        const bannerFit = course.bannerFit || 'cover';
        const bannerHeight = course.bannerHeight || 220;
        document.getElementById('course-banner-fit').value = bannerFit;
        document.getElementById('course-banner-height').value = bannerHeight;
        document.getElementById('banner-height-label').textContent = bannerHeight + 'px';
        applyBannerHeaderStyle(bannerFit, bannerHeight);

        document.getElementById('publish-course-btn').style.display = course.status === 'published' ? 'none' : 'inline-block';
      })
      .catch(() => {
        document.getElementById('course-status-sub').textContent = 'Could not load this course.';
      });
  }

  function applyBannerHeaderStyle(fit, height) {
    const el = document.getElementById('course-banner-header');
    el.style.objectFit = fit;
    el.style.height = height + 'px';
    el.style.maxHeight = height + 'px';
  }

  loadCourse();

  document.getElementById('course-banner-fit').addEventListener('change', (e) => {
    applyBannerHeaderStyle(e.target.value, document.getElementById('course-banner-height').value);
  });

  document.getElementById('course-banner-height').addEventListener('input', (e) => {
    const height = e.target.value;
    document.getElementById('banner-height-label').textContent = height + 'px';
    applyBannerHeaderStyle(document.getElementById('course-banner-fit').value, height);
  });

  document.getElementById('course-image-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      document.getElementById('course-save-message').textContent = 'Image is too large — please use one under 2MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingCourseImageDataUrl = reader.result;
      document.getElementById('course-image-preview').src = pendingCourseImageDataUrl;
      document.getElementById('course-image-preview').style.display = 'block';
      document.getElementById('course-image-empty').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('course-banner-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      document.getElementById('course-save-message').textContent = 'Image is too large — please use one under 2MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingCourseBannerDataUrl = reader.result;
      document.getElementById('course-banner-preview').src = pendingCourseBannerDataUrl;
      document.getElementById('course-banner-preview').style.display = 'block';
      document.getElementById('course-banner-empty').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

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
      imageDataUrl: pendingCourseImageDataUrl,
      bannerDataUrl: pendingCourseBannerDataUrl,
      bannerFit: document.getElementById('course-banner-fit').value,
      bannerHeight: parseInt(document.getElementById('course-banner-height').value, 10),
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
    textImage: 'Text + Image',
    pictureOnly: 'Picture Only',
    webContent: 'Web Content',
    table: 'Table',
    presentation: 'Presentation',
    document: 'Document',
    videoUpload: 'Video Upload',
    youtubeLink: 'YouTube Link',
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
    imageRight: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="18" y="3" width="12" height="18"/><rect x="2" y="4" width="13" height="2.5"/><rect x="2" y="10" width="13" height="2.5"/><rect x="2" y="16" width="9" height="2.5"/></svg>',
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

  function getYoutubeEmbedId(url) {
    if (!url) return null;
    const patterns = [
      /youtube\\.com\\/watch\\?v=([\\w-]{11})/,
      /youtu\\.be\\/([\\w-]{11})/,
      /youtube\\.com\\/embed\\/([\\w-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
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
      const headingFont = settings.fontFamily || "'Big Shoulders Display', sans-serif";
      if (layout === 'imageLeft') {
        return \`<div style="display:flex; gap:16px; align-items:center; margin-bottom:20px;" data-preview-block-id="\${block.id}">
          \${imageDataUrl ? \`<img src="\${imageDataUrl}" style="width:120px; height:80px; object-fit:cover; border-radius:2px; flex-shrink:0;" />\` : NO_IMAGE_PLACEHOLDER}
          <h2 style="margin:0; font-family:\${headingFont}; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>
        </div>\`;
      } else if (layout === 'bannerTop') {
        return \`<div style="margin-bottom:20px;" data-preview-block-id="\${block.id}">
          \${imageDataUrl ? \`<img src="\${imageDataUrl}" style="width:100%; max-height:140px; object-fit:cover; border-radius:2px; margin-bottom:12px;" />\` : NO_BANNER_PLACEHOLDER}
          <h2 style="margin:0; font-family:\${headingFont}; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>
        </div>\`;
      }
      return \`<h2 style="margin:0 0 20px; font-family:\${headingFont}; font-size:24px; text-transform:uppercase; color:var(--text-primary);" data-preview-block-id="\${block.id}">\${safeTitle}</h2>\`;
    }

    if (block.type === 'subtitle') {
      const subtitleFont = settings.fontFamily || "'Inter', sans-serif";
      return \`<div style="font-family:\${subtitleFont}; font-size:15px; color:var(--text-muted); font-style:italic; margin-bottom:20px;" data-preview-block-id="\${block.id}">\${safeTitle}</div>\`;
    }

    if (block.type === 'text') {
      const textFont = settings.fontFamily || "'Inter', sans-serif";
      const html = block.title && block.title.trim()
        ? block.title
        : '<span style="color:var(--text-muted);">Empty text field</span>';
      return \`<div style="margin-bottom:20px; font-family:\${textFont}; font-size:14px; color:var(--text-primary); line-height:1.6;" data-preview-block-id="\${block.id}">\${html}</div>\`;
    }

    if (block.type === 'textImage') {
      const textImageFont = settings.fontFamily || "'Inter', sans-serif";
      const position = settings.imagePosition || 'left';
      const imgWidth = settings.imageWidth || 160;
      const imageEl = imageDataUrl
        ? \`<img src="\${imageDataUrl}" style="width:\${imgWidth}px; height:auto; border-radius:2px; flex-shrink:0;" />\`
        : \`<div style="width:\${imgWidth}px;height:\${Math.round(imgWidth * 0.75)}px;background:var(--panel-alt);border:1px dashed var(--grid-line);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;flex-shrink:0;">No image</div>\`;
      const textHtml = block.title && block.title.trim()
        ? block.title
        : '<span style="color:var(--text-muted);">Empty text</span>';
      const textEl = \`<div style="flex:1; font-family:\${textImageFont}; font-size:14px; color:var(--text-primary); line-height:1.6;">\${textHtml}</div>\`;
      const rowContent = position === 'right' ? textEl + imageEl : imageEl + textEl;
      return \`<div style="display:flex; gap:16px; align-items:flex-start; margin-bottom:20px;" data-preview-block-id="\${block.id}">\${rowContent}</div>\`;
    }

    if (block.type === 'pictureOnly') {
      const pWidth = settings.imageWidth || 300;
      if (!imageDataUrl) {
        return \`<div style="margin-bottom:20px; width:\${pWidth}px; max-width:100%; height:\${Math.round(pWidth * 0.6)}px; background:var(--panel-alt); border:1px dashed var(--grid-line); border-radius:2px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:11px;" data-preview-block-id="\${block.id}">No image</div>\`;
      }
      const captionHtml = block.title && block.title.trim()
        ? \`<div style="font-family:'Inter',sans-serif; font-size:12px; color:var(--text-muted); margin-top:6px;">\${escapeHtml(block.title)}</div>\`
        : '';
      return \`<div style="margin-bottom:20px;" data-preview-block-id="\${block.id}">
        <img src="\${imageDataUrl}" style="width:\${pWidth}px; max-width:100%; height:auto; border-radius:2px;" />
        \${captionHtml}
      </div>\`;
    }

    if (block.type === 'table') {
      const tableFont = settings.fontFamily || "'Inter', sans-serif";
      const tableData = settings.tableData;
      if (!tableData) {
        return \`<div style="margin-bottom:20px; padding:20px; border:1px dashed var(--grid-line); border-radius:2px; text-align:center; color:var(--text-muted); font-family:'IBM Plex Mono',monospace; font-size:12px;" data-preview-block-id="\${block.id}">Table — not yet created</div>\`;
      }
      const rowsHtml = tableData.cells.map(row => \`
        <tr>\${row.map(cell => \`<td style="border:1px solid var(--grid-line); padding:8px; font-family:\${tableFont}; font-size:13px; color:var(--text-primary);">\${escapeHtml(cell)}</td>\`).join('')}</tr>
      \`).join('');
      return \`<div style="margin-bottom:20px; overflow-x:auto;" data-preview-block-id="\${block.id}">
        <table style="border-collapse:collapse; width:100%;">\${rowsHtml}</table>
      </div>\`;
    }

    if (block.type === 'presentation' || block.type === 'document') {
      const fileDataUrl = settings.fileDataUrl;
      const fileName = settings.fileName;
      const fileMimeType = settings.fileMimeType || '';
      const label = block.type === 'presentation' ? 'Presentation' : 'Document';

      if (!fileDataUrl) {
        return \`<div style="margin-bottom:20px; padding:20px; border:1px dashed var(--grid-line); border-radius:2px; text-align:center; color:var(--text-muted); font-family:'IBM Plex Mono',monospace; font-size:12px;" data-preview-block-id="\${block.id}">
          \${label}\${block.title ? ': ' + safeTitle : ''} — no file uploaded yet
        </div>\`;
      }

      if (fileMimeType === 'application/pdf') {
        return \`<div style="margin-bottom:20px;" data-preview-block-id="\${block.id}">
          \${block.title ? \`<div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:8px;">\${safeTitle}</div>\` : ''}
          <iframe src="\${fileDataUrl}" style="width:100%; height:500px; border:1px solid var(--grid-line); border-radius:2px;"></iframe>
        </div>\`;
      }

      return \`<div style="margin-bottom:20px; padding:16px; border:1px solid var(--grid-line); border-radius:2px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;" data-preview-block-id="\${block.id}">
        <div>
          <span class="content-block-type" style="display:inline-block; margin-bottom:6px;">\${label}</span>
          <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtml(fileName) || safeTitle}</div>
        </div>
        <a href="\${fileDataUrl}" download="\${escapeHtml(fileName) || 'file'}" class="btn" style="text-decoration:none; white-space:nowrap;">Open File</a>
      </div>\`;
    }

    if (block.type === 'videoUpload') {
      const fileDataUrl = settings.fileDataUrl;
      if (!fileDataUrl) {
        return \`<div style="margin-bottom:20px; padding:20px; border:1px dashed var(--grid-line); border-radius:2px; text-align:center; color:var(--text-muted); font-family:'IBM Plex Mono',monospace; font-size:12px;" data-preview-block-id="\${block.id}">Video Upload — no file uploaded yet</div>\`;
      }
      return \`<div style="margin-bottom:20px;" data-preview-block-id="\${block.id}">
        \${block.title ? \`<div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:8px;">\${safeTitle}</div>\` : ''}
        <video controls style="width:100%; max-height:400px; border-radius:2px; background:#000;">
          <source src="\${fileDataUrl}" type="\${settings.fileMimeType || 'video/mp4'}" />
        </video>
      </div>\`;
    }

    if (block.type === 'youtubeLink') {
      const videoId = getYoutubeEmbedId(block.title);
      if (!videoId) {
        return \`<div style="margin-bottom:20px; padding:20px; border:1px dashed var(--grid-line); border-radius:2px; text-align:center; color:var(--text-muted); font-family:'IBM Plex Mono',monospace; font-size:12px;" data-preview-block-id="\${block.id}">YouTube Link — paste a valid YouTube URL to embed the video</div>\`;
      }
      return \`<div style="margin-bottom:20px;" data-preview-block-id="\${block.id}">
        <iframe width="100%" height="360" src="https://www.youtube.com/embed/\${videoId}" style="border:1px solid var(--grid-line); border-radius:2px;" allowfullscreen></iframe>
      </div>\`;
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
          settings: {
            ...b.settings,
            layout: pendingPreviewOverride.layout,
            imagePosition: pendingPreviewOverride.imagePosition,
            imageDataUrl: pendingPreviewOverride.imageDataUrl,
            imageWidth: pendingPreviewOverride.imageWidth,
            fileDataUrl: pendingPreviewOverride.fileDataUrl,
            fileName: pendingPreviewOverride.fileName,
            fileMimeType: pendingPreviewOverride.fileMimeType,
            fontFamily: pendingPreviewOverride.fontFamily,
          },
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
    const isTextImage = block.type === 'textImage';
    const isPictureOnly = block.type === 'pictureOnly';
    const isFileBlock = block.type === 'presentation' || block.type === 'document' || block.type === 'videoUpload';
    const isYoutubeLink = block.type === 'youtubeLink';
    const isTest = block.type === 'test';
    const isTable = block.type === 'table';
    const isRichText = block.type === 'text' || block.type === 'textImage';
    const isFontSelectable = isHeading || block.type === 'subtitle' || isRichText || isTable;
    let pendingFontFamily = settings.fontFamily || '';

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

    if (isTextImage) {
      const position = settings.imagePosition || 'left';
      const imageWidth = settings.imageWidth || 160;
      layoutHtml = \`
        <div class="stat-label" style="margin-bottom: 4px; margin-top: 12px;">Image Placement</div>
        <div class="layout-options">
          <div class="layout-option\${position === 'left' ? ' selected' : ''}" data-position="left">
            \${LAYOUT_ICONS.imageLeft}
            <span>Image Left</span>
          </div>
          <div class="layout-option\${position === 'right' ? ' selected' : ''}" data-position="right">
            \${LAYOUT_ICONS.imageRight}
            <span>Image Right</span>
          </div>
        </div>
        <div class="image-upload-area" id="image-upload-area">
          <img id="block-image-preview" class="image-upload-preview" src="\${settings.imageDataUrl || ''}" style="display: \${settings.imageDataUrl ? 'block' : 'none'};" />
          <input type="file" id="block-image-input" accept="image/*" />
        </div>
        <div class="stat-label" style="margin-bottom: 4px; margin-top: 12px;">Image Size: <span id="image-size-label">\${imageWidth}px</span></div>
        <input type="range" id="image-size-slider" min="60" max="500" value="\${imageWidth}" style="width:100%;" />
      \`;
    }

    if (isPictureOnly) {
      const imageWidth = settings.imageWidth || 300;
      layoutHtml = \`
        <div class="stat-label" style="margin-bottom: 4px; margin-top: 12px;">Image</div>
        <div class="image-upload-area" id="image-upload-area">
          <img id="block-image-preview" class="image-upload-preview" src="\${settings.imageDataUrl || ''}" style="display: \${settings.imageDataUrl ? 'block' : 'none'};" />
          <input type="file" id="block-image-input" accept="image/*" />
        </div>
        <div class="stat-label" style="margin-bottom: 4px; margin-top: 12px;">Image Size: <span id="image-size-label">\${imageWidth}px</span></div>
        <input type="range" id="image-size-slider" min="60" max="800" value="\${imageWidth}" style="width:100%;" />
      \`;
    }

    if (isFileBlock) {
      const fileLabel = block.type === 'presentation' ? 'Presentation file' : block.type === 'document' ? 'Document file' : 'Video file';
      const acceptAttr = block.type === 'videoUpload' ? 'video/*' : '.pdf,.ppt,.pptx,.doc,.docx';
      const sizeHint = block.type === 'videoUpload' ? ' — short clips only, under 8MB (not full video hosting)' : '';
      layoutHtml = \`
        <div class="stat-label" style="margin-bottom: 4px; margin-top: 12px;">\${fileLabel}\${sizeHint}</div>
        <div class="image-upload-area" id="file-upload-area">
          <div id="file-upload-current" style="margin-bottom: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted);">
            \${settings.fileName ? 'Uploaded: ' + escapeHtml(settings.fileName) : 'No file uploaded yet'}
          </div>
          <input type="file" id="block-file-input" accept="\${acceptAttr}" />
        </div>
      \`;
    }

    if (isTable) {
      layoutHtml = '<div class="stat-label" style="margin-bottom: 4px; margin-top: 12px;">Table</div><div id="table-section-wrap"></div>';
    }

    const TITLE_PLACEHOLDERS = {
      module: 'Module Name (e.g. "Module 1: Introduction")',
      forwardButton: 'Button label (default: Next)',
      backButton: 'Button label (default: Back)',
      endOfSection: 'Section label (default: End of Module)',
      youtubeLink: 'YouTube URL (e.g. https://www.youtube.com/watch?v=...)',
      videoUpload: 'Caption (optional)',
      pictureOnly: 'Caption (optional)',
    };
    const titlePlaceholder = TITLE_PLACEHOLDERS[block.type] || (isTextImage ? 'Body text' : 'Title');

    const titleFieldHtml = isRichText
      ? \`
        <div style="display:flex; gap:6px; margin-bottom:6px;">
          <button type="button" class="richtext-btn" data-cmd="bold" style="background:var(--panel-alt);border:1px solid var(--grid-line);color:var(--text-primary);padding:6px 12px;border-radius:2px;cursor:pointer;font-weight:700;">B</button>
          <button type="button" class="richtext-btn" data-cmd="italic" style="background:var(--panel-alt);border:1px solid var(--grid-line);color:var(--text-primary);padding:6px 12px;border-radius:2px;cursor:pointer;font-style:italic;">I</button>
          <button type="button" class="richtext-btn" data-cmd="underline" style="background:var(--panel-alt);border:1px solid var(--grid-line);color:var(--text-primary);padding:6px 12px;border-radius:2px;cursor:pointer;text-decoration:underline;">U</button>
          <button type="button" class="richtext-btn" data-cmd="insertUnorderedList" style="background:var(--panel-alt);border:1px solid var(--grid-line);color:var(--text-primary);padding:6px 12px;border-radius:2px;cursor:pointer;">&bull; List</button>
          <button type="button" class="richtext-btn" data-cmd="insertOrderedList" style="background:var(--panel-alt);border:1px solid var(--grid-line);color:var(--text-primary);padding:6px 12px;border-radius:2px;cursor:pointer;">1. List</button>
        </div>
        <div id="block-title-input" contenteditable="true" style="width:100%; min-height:100px; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px;">\${block.title || ''}</div>
      \`
      : \`<input type="text" id="block-title-input" placeholder="\${titlePlaceholder}" value="\${(block.title || '').replace(/"/g, '&quot;')}" />\`;

    const questionsSectionHtml = isTest ? \`
      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--grid-line);">
        <div class="stat-label" style="margin-bottom: 8px;">Questions</div>
        <button class="btn" id="add-question-btn">+ Add Question</button>
        <div id="question-form-wrap" style="display: none; margin-top: 16px; padding: 16px; border: 1px solid var(--grid-line); border-radius: 2px; background: var(--panel-alt);"></div>
        <div id="questions-list-wrap" style="margin-top: 16px;">
          <div class="empty-state">Loading questions&hellip;</div>
        </div>
      </div>
    \` : '';

    const fontFieldHtml = isFontSelectable ? \`
      <div class="stat-label" style="margin-bottom: 4px; margin-top: 12px;">Font</div>
      <select id="block-font-select" style="margin-bottom: 4px;">
        <option value="">Default</option>
        <option value="'Big Shoulders Display', sans-serif">Big Shoulders Display</option>
        <option value="'Inter', sans-serif">Inter</option>
        <option value="'IBM Plex Mono', monospace">IBM Plex Mono</option>
        <option value="'Playfair Display', serif">Playfair Display</option>
        <option value="'Merriweather', serif">Merriweather</option>
      </select>
    \` : '';

    editorWrap.innerHTML = \`
      <div class="form-row">
        \${titleFieldHtml}
      </div>
      \${fontFieldHtml}
      \${layoutHtml}
      <button class="btn" id="save-block-btn" style="margin-top: 8px;">Save</button>
      <div id="block-save-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
      \${questionsSectionHtml}
    \`;

    if (isFontSelectable) {
      document.getElementById('block-font-select').value = pendingFontFamily;
      document.getElementById('block-font-select').addEventListener('change', (e) => {
        pendingFontFamily = e.target.value;
        pendingPreviewOverride.fontFamily = pendingFontFamily;
        renderFullPreview();
      });
    }

    let pendingLayout = settings.layout || 'textOnly';
    let pendingImagePosition = settings.imagePosition || 'left';
    let pendingImageDataUrl = settings.imageDataUrl || null;
    let pendingImageWidth = settings.imageWidth || (isPictureOnly ? 300 : 160);
    let pendingFileDataUrl = settings.fileDataUrl || null;
    let pendingFileName = settings.fileName || null;
    let pendingFileMimeType = settings.fileMimeType || null;
    let tableState = settings.tableData ? JSON.parse(JSON.stringify(settings.tableData)) : null;

    pendingPreviewOverride = {
      blockId: block.id,
      title: block.title,
      layout: pendingLayout,
      imagePosition: pendingImagePosition,
      imageDataUrl: pendingImageDataUrl,
      imageWidth: pendingImageWidth,
      fileDataUrl: pendingFileDataUrl,
      fileName: pendingFileName,
      fileMimeType: pendingFileMimeType,
      fontFamily: pendingFontFamily,
    };
    renderFullPreview();

    document.getElementById('block-title-input').addEventListener('input', (e) => {
      pendingPreviewOverride.title = isRichText ? e.target.innerHTML : e.target.value;
      renderFullPreview();
    });

    if (isRichText) {
      document.querySelectorAll('.richtext-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          document.execCommand(btn.dataset.cmd, false, null);
          const titleEl = document.getElementById('block-title-input');
          titleEl.focus();
          pendingPreviewOverride.title = titleEl.innerHTML;
          renderFullPreview();
        });
      });
    }

    if (isFileBlock) {
      document.getElementById('block-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const maxSize = block.type === 'videoUpload' ? 8 * 1024 * 1024 : 4 * 1024 * 1024;
        if (file.size > maxSize) {
          document.getElementById('block-save-message').textContent = 'File is too large — please use one under ' + (maxSize / (1024 * 1024)) + 'MB.';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          pendingFileDataUrl = reader.result;
          pendingFileName = file.name;
          pendingFileMimeType = file.type;
          pendingPreviewOverride.fileDataUrl = pendingFileDataUrl;
          pendingPreviewOverride.fileName = pendingFileName;
          pendingPreviewOverride.fileMimeType = pendingFileMimeType;
          document.getElementById('file-upload-current').textContent = 'Uploaded: ' + file.name;
          renderFullPreview();
        };
        reader.readAsDataURL(file);
      });
    }

    if (isTable) {
      function renderTableSection() {
        const wrap = document.getElementById('table-section-wrap');
        if (!tableState) {
          wrap.innerHTML = \`
            <div class="form-row">
              <input type="number" id="table-init-rows" placeholder="Rows" min="1" value="2" style="max-width:100px;" />
              <input type="number" id="table-init-cols" placeholder="Columns" min="1" value="2" style="max-width:100px;" />
              <button type="button" class="btn" id="create-table-btn">Create Table</button>
            </div>
          \`;
          document.getElementById('create-table-btn').addEventListener('click', () => {
            const rows = Math.max(1, parseInt(document.getElementById('table-init-rows').value, 10) || 2);
            const cols = Math.max(1, parseInt(document.getElementById('table-init-cols').value, 10) || 2);
            tableState = { rows, cols, cells: Array.from({ length: rows }, () => new Array(cols).fill('')) };
            renderTableSection();
          });
          return;
        }

        let html = '<div style="overflow-x:auto;"><table style="border-collapse:collapse; width:100%;">';
        html += '<tr><td></td>';
        for (let c = 0; c < tableState.cols; c++) {
          html += \`<td style="text-align:center; padding:4px;"><button type="button" class="table-col-remove-btn" data-col="\${c}" \${tableState.cols <= 1 ? 'disabled' : ''} style="background:none;border:1px solid var(--grid-line);color:var(--text-muted);padding:2px 6px;border-radius:2px;cursor:pointer;font-size:11px;">&times;</button></td>\`;
        }
        html += '</tr>';
        for (let r = 0; r < tableState.rows; r++) {
          html += '<tr>';
          html += \`<td style="padding:4px;"><button type="button" class="table-row-remove-btn" data-row="\${r}" \${tableState.rows <= 1 ? 'disabled' : ''} style="background:none;border:1px solid var(--grid-line);color:var(--text-muted);padding:2px 6px;border-radius:2px;cursor:pointer;font-size:11px;">&times;</button></td>\`;
          for (let c = 0; c < tableState.cols; c++) {
            const val = (tableState.cells[r] && tableState.cells[r][c]) || '';
            html += \`<td style="padding:2px; border:1px solid var(--grid-line);"><input type="text" class="table-cell-input" data-row="\${r}" data-col="\${c}" value="\${val.replace(/"/g, '&quot;')}" style="width:100%; min-width:80px; background:var(--panel); border:none; color:var(--text-primary); font-family:'Inter',sans-serif; font-size:13px; padding:6px;" /></td>\`;
          }
          html += '</tr>';
        }
        html += '</table></div>';
        html += '<div style="margin-top:8px;"><button type="button" class="btn" id="table-add-row-btn" style="margin-right:6px;">+ Add Row</button><button type="button" class="btn" id="table-add-col-btn">+ Add Column</button></div>';

        wrap.innerHTML = html;

        wrap.querySelectorAll('.table-cell-input').forEach(inp => {
          inp.addEventListener('input', () => {
            const r = parseInt(inp.dataset.row, 10);
            const c = parseInt(inp.dataset.col, 10);
            if (!tableState.cells[r]) tableState.cells[r] = [];
            tableState.cells[r][c] = inp.value;
          });
        });
        document.getElementById('table-add-row-btn').addEventListener('click', () => {
          tableState.rows += 1;
          tableState.cells.push(new Array(tableState.cols).fill(''));
          renderTableSection();
        });
        document.getElementById('table-add-col-btn').addEventListener('click', () => {
          tableState.cols += 1;
          tableState.cells.forEach(row => row.push(''));
          renderTableSection();
        });
        wrap.querySelectorAll('.table-row-remove-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (tableState.rows <= 1) return;
            const r = parseInt(btn.dataset.row, 10);
            tableState.cells.splice(r, 1);
            tableState.rows -= 1;
            renderTableSection();
          });
        });
        wrap.querySelectorAll('.table-col-remove-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (tableState.cols <= 1) return;
            const c = parseInt(btn.dataset.col, 10);
            tableState.cells.forEach(row => row.splice(c, 1));
            tableState.cols -= 1;
            renderTableSection();
          });
        });
      }

      renderTableSection();
    }

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

    if (isTextImage) {
      editorWrap.querySelectorAll('.layout-option').forEach(opt => {
        opt.addEventListener('click', () => {
          pendingImagePosition = opt.dataset.position;
          pendingPreviewOverride.imagePosition = pendingImagePosition;
          editorWrap.querySelectorAll('.layout-option').forEach(o => o.classList.toggle('selected', o === opt));
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

      document.getElementById('image-size-slider').addEventListener('input', (e) => {
        pendingImageWidth = parseInt(e.target.value, 10);
        pendingPreviewOverride.imageWidth = pendingImageWidth;
        document.getElementById('image-size-label').textContent = pendingImageWidth + 'px';
        renderFullPreview();
      });
    }

    if (isPictureOnly) {
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

      document.getElementById('image-size-slider').addEventListener('input', (e) => {
        pendingImageWidth = parseInt(e.target.value, 10);
        pendingPreviewOverride.imageWidth = pendingImageWidth;
        document.getElementById('image-size-label').textContent = pendingImageWidth + 'px';
        renderFullPreview();
      });
    }

    if (isTest) {
      const TYPE_LABELS = {
        multipleChoice: 'Multiple Choice',
        trueFalse: 'True / False',
        written: 'Written',
        matching: 'Matching',
        ordering: 'Ordering',
      };

      let questionsState = [];
      let editingQuestionId = null;
      let mcOptions = [];
      let tfCorrect = true;
      let writtenModelAnswer = '';
      let matchPairs = [];
      let orderItems = [];

      function genId() {
        return 'tmp-' + Math.random().toString(36).slice(2);
      }

      function renderMcOptionsHtml() {
        return mcOptions.map(opt => \`
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
            <input type="radio" name="mc-correct" \${opt.isCorrect ? 'checked' : ''} data-mc-id="\${opt.id}" class="mc-correct-radio" />
            <input type="text" value="\${(opt.text || '').replace(/"/g, '&quot;')}" placeholder="Option text" data-mc-id="\${opt.id}" class="mc-text-input" style="flex:1;" />
            <button type="button" data-mc-id="\${opt.id}" class="mc-remove-btn" style="background:none;border:1px solid var(--grid-line);color:var(--text-muted);padding:6px 10px;border-radius:2px;cursor:pointer;">Remove</button>
          </div>
        \`).join('') + '<button type="button" id="mc-add-option-btn" class="btn" style="margin-top:6px;">+ Add Option</button>';
      }

      function attachMcHandlers() {
        document.querySelectorAll('.mc-correct-radio').forEach(r => {
          r.addEventListener('change', () => {
            mcOptions.forEach(o => { o.isCorrect = (o.id === r.dataset.mcId); });
          });
        });
        document.querySelectorAll('.mc-text-input').forEach(inp => {
          inp.addEventListener('input', () => {
            const opt = mcOptions.find(o => o.id === inp.dataset.mcId);
            if (opt) opt.text = inp.value;
          });
        });
        document.querySelectorAll('.mc-remove-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            mcOptions = mcOptions.filter(o => o.id !== btn.dataset.mcId);
            document.getElementById('question-type-fields').innerHTML = renderMcOptionsHtml();
            attachMcHandlers();
          });
        });
        document.getElementById('mc-add-option-btn').addEventListener('click', () => {
          mcOptions.push({ id: genId(), text: '', isCorrect: false });
          document.getElementById('question-type-fields').innerHTML = renderMcOptionsHtml();
          attachMcHandlers();
        });
      }

      function renderMatchPairsHtml() {
        return matchPairs.map(pair => \`
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
            <input type="text" value="\${(pair.left || '').replace(/"/g, '&quot;')}" placeholder="Left item" data-pair-id="\${pair.id}" class="pair-left-input" style="flex:1;" />
            <span style="color:var(--text-muted);">&harr;</span>
            <input type="text" value="\${(pair.right || '').replace(/"/g, '&quot;')}" placeholder="Right item" data-pair-id="\${pair.id}" class="pair-right-input" style="flex:1;" />
            <button type="button" data-pair-id="\${pair.id}" class="pair-remove-btn" style="background:none;border:1px solid var(--grid-line);color:var(--text-muted);padding:6px 10px;border-radius:2px;cursor:pointer;">Remove</button>
          </div>
        \`).join('') + '<button type="button" id="pair-add-btn" class="btn" style="margin-top:6px;">+ Add Pair</button>';
      }

      function attachMatchHandlers() {
        document.querySelectorAll('.pair-left-input').forEach(inp => {
          inp.addEventListener('input', () => {
            const p = matchPairs.find(p => p.id === inp.dataset.pairId);
            if (p) p.left = inp.value;
          });
        });
        document.querySelectorAll('.pair-right-input').forEach(inp => {
          inp.addEventListener('input', () => {
            const p = matchPairs.find(p => p.id === inp.dataset.pairId);
            if (p) p.right = inp.value;
          });
        });
        document.querySelectorAll('.pair-remove-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            matchPairs = matchPairs.filter(p => p.id !== btn.dataset.pairId);
            document.getElementById('question-type-fields').innerHTML = renderMatchPairsHtml();
            attachMatchHandlers();
          });
        });
        document.getElementById('pair-add-btn').addEventListener('click', () => {
          matchPairs.push({ id: genId(), left: '', right: '' });
          document.getElementById('question-type-fields').innerHTML = renderMatchPairsHtml();
          attachMatchHandlers();
        });
      }

      function renderOrderItemsHtml() {
        return orderItems.map((item, i) => \`
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--text-muted); width:18px;">\${i + 1}.</span>
            <input type="text" value="\${(item.text || '').replace(/"/g, '&quot;')}" placeholder="Item text" data-item-id="\${item.id}" class="order-item-input" style="flex:1;" />
            <button type="button" data-item-id="\${item.id}" class="order-remove-btn" style="background:none;border:1px solid var(--grid-line);color:var(--text-muted);padding:6px 10px;border-radius:2px;cursor:pointer;">Remove</button>
          </div>
        \`).join('') + '<button type="button" id="order-add-btn" class="btn" style="margin-top:6px;">+ Add Item</button>';
      }

      function attachOrderHandlers() {
        document.querySelectorAll('.order-item-input').forEach(inp => {
          inp.addEventListener('input', () => {
            const item = orderItems.find(i => i.id === inp.dataset.itemId);
            if (item) item.text = inp.value;
          });
        });
        document.querySelectorAll('.order-remove-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            orderItems = orderItems.filter(i => i.id !== btn.dataset.itemId);
            document.getElementById('question-type-fields').innerHTML = renderOrderItemsHtml();
            attachOrderHandlers();
          });
        });
        document.getElementById('order-add-btn').addEventListener('click', () => {
          orderItems.push({ id: genId(), text: '' });
          document.getElementById('question-type-fields').innerHTML = renderOrderItemsHtml();
          attachOrderHandlers();
        });
      }

      function renderQuestionTypeFields(type) {
        const container = document.getElementById('question-type-fields');
        if (type === 'multipleChoice') {
          container.innerHTML = renderMcOptionsHtml();
          attachMcHandlers();
        } else if (type === 'trueFalse') {
          container.innerHTML = \`
            <div class="form-row">
              <label style="display:flex;align-items:center;gap:6px;font-family:'IBM Plex Mono',monospace;font-size:13px;">
                <input type="radio" name="tf-correct" value="true" \${tfCorrect ? 'checked' : ''} /> True
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-family:'IBM Plex Mono',monospace;font-size:13px;">
                <input type="radio" name="tf-correct" value="false" \${!tfCorrect ? 'checked' : ''} /> False
              </label>
            </div>
          \`;
          container.querySelectorAll('input[name="tf-correct"]').forEach(r => {
            r.addEventListener('change', () => { tfCorrect = r.value === 'true'; });
          });
        } else if (type === 'written') {
          container.innerHTML = \`<textarea id="written-model-answer" placeholder="Model answer (optional, for grading reference)" rows="3" style="width:100%;background:var(--panel);border:1px solid var(--grid-line);color:var(--text-primary);font-family:'Inter',sans-serif;font-size:13px;padding:10px 12px;border-radius:2px;">\${escapeHtml(writtenModelAnswer)}</textarea>\`;
          document.getElementById('written-model-answer').addEventListener('input', (e) => { writtenModelAnswer = e.target.value; });
        } else if (type === 'matching') {
          container.innerHTML = renderMatchPairsHtml();
          attachMatchHandlers();
        } else if (type === 'ordering') {
          container.innerHTML = renderOrderItemsHtml();
          attachOrderHandlers();
        }
      }

      function openQuestionForm(existingQuestion) {
        editingQuestionId = existingQuestion ? existingQuestion.id : null;
        const type = existingQuestion ? existingQuestion.type : 'multipleChoice';

        mcOptions = existingQuestion && existingQuestion.type === 'multipleChoice'
          ? existingQuestion.options.map(o => ({ ...o }))
          : [{ id: genId(), text: '', isCorrect: true }, { id: genId(), text: '', isCorrect: false }];
        tfCorrect = existingQuestion && existingQuestion.type === 'trueFalse' ? existingQuestion.correctBoolean : true;
        writtenModelAnswer = existingQuestion && existingQuestion.type === 'written' ? (existingQuestion.modelAnswer || '') : '';
        matchPairs = existingQuestion && existingQuestion.type === 'matching'
          ? existingQuestion.pairs.map(p => ({ ...p }))
          : [{ id: genId(), left: '', right: '' }, { id: genId(), left: '', right: '' }];
        orderItems = existingQuestion && existingQuestion.type === 'ordering'
          ? existingQuestion.orderedItems.map(text => ({ id: genId(), text }))
          : [{ id: genId(), text: '' }, { id: genId(), text: '' }];

        const formWrap = document.getElementById('question-form-wrap');
        formWrap.style.display = 'block';
        formWrap.innerHTML = \`
          <div class="form-row">
            <select id="new-question-type">
              <option value="multipleChoice" \${type === 'multipleChoice' ? 'selected' : ''}>Multiple Choice</option>
              <option value="trueFalse" \${type === 'trueFalse' ? 'selected' : ''}>True / False</option>
              <option value="written" \${type === 'written' ? 'selected' : ''}>Written</option>
              <option value="matching" \${type === 'matching' ? 'selected' : ''}>Matching</option>
              <option value="ordering" \${type === 'ordering' ? 'selected' : ''}>Ordering</option>
            </select>
          </div>
          <div class="form-row">
            <input type="text" id="new-question-text" placeholder="Question text" value="\${existingQuestion ? escapeHtml(existingQuestion.text).replace(/"/g, '&quot;') : ''}" />
          </div>
          <div id="question-type-fields"></div>
          <button class="btn" id="save-question-btn" style="margin-top: 8px;">\${existingQuestion ? 'Update Question' : 'Save Question'}</button>
          <button type="button" id="cancel-question-btn" style="margin-top: 8px; margin-left: 8px; background: var(--panel); color: var(--text-primary); border: 1px solid var(--grid-line); padding: 10px 18px; border-radius: 2px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; text-transform: uppercase;">Cancel</button>
          <div id="question-save-message" style="margin-top: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
        \`;

        renderQuestionTypeFields(type);

        document.getElementById('new-question-type').addEventListener('change', (e) => {
          renderQuestionTypeFields(e.target.value);
        });

        document.getElementById('cancel-question-btn').addEventListener('click', () => {
          formWrap.style.display = 'none';
          editingQuestionId = null;
        });

        document.getElementById('save-question-btn').addEventListener('click', saveQuestion);
      }

      function saveQuestion() {
        const type = document.getElementById('new-question-type').value;
        const text = document.getElementById('new-question-text').value.trim();
        const msgEl = document.getElementById('question-save-message');

        if (!text) {
          msgEl.textContent = 'Question text is required.';
          msgEl.style.color = 'var(--risk)';
          return;
        }

        const payload = { type, text };

        if (type === 'multipleChoice') {
          const validOptions = mcOptions.filter(o => o.text.trim());
          if (validOptions.length < 2) {
            msgEl.textContent = 'Add at least 2 options.';
            msgEl.style.color = 'var(--risk)';
            return;
          }
          if (!validOptions.some(o => o.isCorrect)) {
            msgEl.textContent = 'Mark one option as correct.';
            msgEl.style.color = 'var(--risk)';
            return;
          }
          payload.options = validOptions.map(o => ({ id: o.id, text: o.text.trim(), isCorrect: o.isCorrect }));
        } else if (type === 'trueFalse') {
          payload.correctBoolean = tfCorrect;
        } else if (type === 'written') {
          payload.modelAnswer = writtenModelAnswer.trim();
        } else if (type === 'matching') {
          const validPairs = matchPairs.filter(p => p.left.trim() && p.right.trim());
          if (validPairs.length < 2) {
            msgEl.textContent = 'Add at least 2 complete pairs.';
            msgEl.style.color = 'var(--risk)';
            return;
          }
          payload.pairs = validPairs.map(p => ({ id: p.id, left: p.left.trim(), right: p.right.trim() }));
        } else if (type === 'ordering') {
          const validItems = orderItems.filter(i => i.text.trim());
          if (validItems.length < 2) {
            msgEl.textContent = 'Add at least 2 items.';
            msgEl.style.color = 'var(--risk)';
            return;
          }
          payload.orderedItems = validItems.map(i => i.text.trim());
        }

        const url = editingQuestionId
          ? '/api/tests/' + block.id + '/questions/' + editingQuestionId
          : '/api/tests/' + block.id + '/questions';
        const method = editingQuestionId ? 'PUT' : 'POST';

        fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(r => r.json())
          .then(data => {
            document.getElementById('question-form-wrap').style.display = 'none';
            editingQuestionId = null;
            renderQuestionsList(data.questions || []);
          })
          .catch(() => {
            msgEl.textContent = 'Failed to save question.';
            msgEl.style.color = 'var(--risk)';
          });
      }

      function renderQuestionsList(questions) {
        questionsState = questions;
        const wrap = document.getElementById('questions-list-wrap');

        if (questions.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No questions added yet.</div>';
          return;
        }

        wrap.innerHTML = questions.map((q, i) => {
          let detail = '';
          if (q.type === 'multipleChoice') {
            detail = '<ul style="margin:6px 0 0; padding-left:18px; font-size:12px; color:var(--text-muted);">' +
              q.options.map(o => \`<li style="\${o.isCorrect ? 'color:var(--competent); font-weight:600;' : ''}">\${escapeHtml(o.text)}\${o.isCorrect ? ' \u2713' : ''}</li>\`).join('') +
              '</ul>';
          } else if (q.type === 'trueFalse') {
            detail = \`<div style="font-size:12px; color:var(--text-muted); margin-top:6px;">Correct: <strong style="color:var(--competent);">\${q.correctBoolean ? 'True' : 'False'}</strong></div>\`;
          } else if (q.type === 'written') {
            detail = q.modelAnswer ? \`<div style="font-size:12px; color:var(--text-muted); margin-top:6px;">Model answer: \${escapeHtml(q.modelAnswer)}</div>\` : '';
          } else if (q.type === 'matching') {
            detail = '<ul style="margin:6px 0 0; padding-left:18px; font-size:12px; color:var(--text-muted);">' +
              q.pairs.map(p => \`<li>\${escapeHtml(p.left)} &harr; \${escapeHtml(p.right)}</li>\`).join('') +
              '</ul>';
          } else if (q.type === 'ordering') {
            detail = '<ol style="margin:6px 0 0; padding-left:18px; font-size:12px; color:var(--text-muted);">' +
              q.orderedItems.map(item => \`<li>\${escapeHtml(item)}</li>\`).join('') +
              '</ol>';
          }

          return \`
            <div class="content-block-row" style="align-items:flex-start; cursor:default;">
              <div style="flex:1;">
                <span class="content-block-type">\${TYPE_LABELS[q.type]}</span>
                <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-top:6px;">\${i + 1}. \${escapeHtml(q.text)}</div>
                \${detail}
              </div>
              <div class="content-block-actions">
                <button data-action="edit-question" data-question-id="\${q.id}">Edit</button>
                <button data-action="delete-question" data-question-id="\${q.id}" class="delete">Delete</button>
              </div>
            </div>
          \`;
        }).join('');

        wrap.querySelectorAll('[data-action="edit-question"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const q = questionsState.find(q => q.id === btn.dataset.questionId);
            if (q) openQuestionForm(q);
          });
        });

        wrap.querySelectorAll('[data-action="delete-question"]').forEach(btn => {
          btn.addEventListener('click', () => {
            fetch('/api/tests/' + block.id + '/questions/' + btn.dataset.questionId, { method: 'DELETE' })
              .then(r => r.json())
              .then(data => renderQuestionsList(data.questions || []));
          });
        });
      }

      function loadQuestions() {
        fetch('/api/tests/' + block.id)
          .then(r => r.json())
          .then(data => renderQuestionsList(data.questions || []))
          .catch(() => {
            document.getElementById('questions-list-wrap').innerHTML = '<div class="empty-state">Could not load questions.</div>';
          });
      }

      document.getElementById('add-question-btn').addEventListener('click', () => {
        openQuestionForm(null);
      });

      loadQuestions();
    }

    document.getElementById('save-block-btn').addEventListener('click', () => {
      const msgEl = document.getElementById('block-save-message');
      const titleEl = document.getElementById('block-title-input');
      const payload = { title: isRichText ? titleEl.innerHTML : titleEl.value.trim() };
      if (isHeading) {
        payload.settings = { layout: pendingLayout, imageDataUrl: pendingImageDataUrl, fontFamily: pendingFontFamily };
      } else if (isTextImage) {
        payload.settings = { imagePosition: pendingImagePosition, imageDataUrl: pendingImageDataUrl, imageWidth: pendingImageWidth, fontFamily: pendingFontFamily };
      } else if (isPictureOnly) {
        payload.settings = { imageDataUrl: pendingImageDataUrl, imageWidth: pendingImageWidth };
      } else if (isFileBlock) {
        payload.settings = { fileDataUrl: pendingFileDataUrl, fileName: pendingFileName, fileMimeType: pendingFileMimeType };
      } else if (isTable) {
        payload.settings = { tableData: tableState, fontFamily: pendingFontFamily };
      } else if (isFontSelectable) {
        payload.settings = { fontFamily: pendingFontFamily };
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
