import { renderLayout } from './layout';

const bodyHtml = `
  <a href="#" id="back-link" style="display: inline-block; margin-bottom: 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">&larr; Back to Course Development</a>

  <div class="panel">
    <div class="panel-header">
      <div class="panel-title" id="preview-course-title">Course Preview</div>
      <div class="panel-sub">This is a simulation of what a learner will see — not the real learner experience yet</div>
    </div>
    <div style="padding: 12px 20px 0; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;" id="page-indicator"></div>
    <div class="panel-body" id="preview-course-body">
      <div class="empty-state">Loading&hellip;</div>
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

  const COURSE_ID = window.location.pathname.split('/').pop();
  document.getElementById('back-link').href = '/course-development/' + COURSE_ID;

  const BLOCK_TYPE_LABELS = {
    module: 'Module',
    heading: 'Heading Section',
    subtitle: 'Subtitle',
    text: 'Text Field',
    textImage: 'Text + Image',
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
      return \`<div style="margin:24px 0 16px; padding:10px 14px; background:rgba(242,183,5,0.12); border-left:3px solid var(--hazard); border-radius:2px;">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--hazard);">Module</span>
        <div style="font-family:'Big Shoulders Display',sans-serif; font-size:20px; text-transform:uppercase; color:var(--text-primary); margin-top:4px;">\${safeTitle}</div>
      </div>\`;
    }

    if (block.type === 'forwardButton') {
      return \`<div style="text-align:right; margin:12px 0;">
        <button class="btn nav-forward-btn">\${escapeHtml(block.title) || 'Next'} &rarr;</button>
      </div>\`;
    }

    if (block.type === 'backButton') {
      return \`<div style="text-align:left; margin:12px 0;">
        <button class="btn nav-back-btn" style="background:var(--panel-alt); color:var(--text-primary); border:1px solid var(--grid-line);">&larr; \${escapeHtml(block.title) || 'Back'}</button>
      </div>\`;
    }

    if (block.type === 'endOfSection') {
      return \`<div style="display:flex; align-items:center; gap:10px; margin:24px 0; color:var(--competent);">
        <div style="flex:1; height:1px; background:var(--grid-line);"></div>
        <span style="font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">&check; \${escapeHtml(block.title) || 'End of Module'}</span>
        <div style="flex:1; height:1px; background:var(--grid-line);"></div>
      </div>\`;
    }

    if (block.type === 'heading') {
      if (layout === 'imageLeft') {
        return \`<div style="display:flex; gap:16px; align-items:center; margin-bottom:20px;">
          \${imageDataUrl ? \`<img src="\${imageDataUrl}" style="width:120px; height:80px; object-fit:cover; border-radius:2px; flex-shrink:0;" />\` : NO_IMAGE_PLACEHOLDER}
          <h2 style="margin:0; font-family:'Big Shoulders Display',sans-serif; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>
        </div>\`;
      } else if (layout === 'bannerTop') {
        return \`<div style="margin-bottom:20px;">
          \${imageDataUrl ? \`<img src="\${imageDataUrl}" style="width:100%; max-height:140px; object-fit:cover; border-radius:2px; margin-bottom:12px;" />\` : NO_BANNER_PLACEHOLDER}
          <h2 style="margin:0; font-family:'Big Shoulders Display',sans-serif; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>
        </div>\`;
      }
      return \`<h2 style="margin:0 0 20px; font-family:'Big Shoulders Display',sans-serif; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>\`;
    }

    if (block.type === 'subtitle') {
      return \`<div style="font-family:'Inter',sans-serif; font-size:15px; color:var(--text-muted); font-style:italic; margin-bottom:20px;">\${safeTitle}</div>\`;
    }

    if (block.type === 'textImage') {
      const position = settings.imagePosition || 'left';
      const imageEl = imageDataUrl
        ? \`<img src="\${imageDataUrl}" style="width:160px; height:120px; object-fit:cover; border-radius:2px; flex-shrink:0;" />\`
        : '<div style="width:160px;height:120px;background:var(--panel-alt);border:1px dashed var(--grid-line);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;flex-shrink:0;">No image</div>';
      const textEl = \`<div style="flex:1; font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); line-height:1.6; white-space:pre-wrap;">\${safeTitle}</div>\`;
      const rowContent = position === 'right' ? textEl + imageEl : imageEl + textEl;
      return \`<div style="display:flex; gap:16px; align-items:flex-start; margin-bottom:20px;">\${rowContent}</div>\`;
    }

    return \`<div style="margin-bottom:20px; padding:12px; border:1px dashed var(--grid-line); border-radius:2px;">
      <span class="content-block-type" style="display:inline-block; margin-bottom:6px;">\${BLOCK_TYPE_LABELS[block.type] || block.type}</span>
      <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${safeTitle}</div>
    </div>\`;
  }

  // ---------- Pagination: a new page starts at every Module block ----------
  function splitIntoPages(blocks) {
    const pages = [];
    let current = [];
    blocks.forEach(b => {
      if (b.type === 'module') {
        if (current.length > 0) pages.push(current);
        current = [b];
      } else {
        current.push(b);
      }
    });
    if (current.length > 0) pages.push(current);
    return pages;
  }

  let pages = [];
  let currentPageIndex = 0;

  function renderPage(index) {
    currentPageIndex = index;
    const bodyEl = document.getElementById('preview-course-body');
    const page = pages[index];

    // Fully replaces the previous page's content — nothing from the prior
    // page remains in the DOM or is scrollable to.
    bodyEl.innerHTML = page.map(renderBlockHtml).join('');
    window.scrollTo({ top: 0, behavior: 'instant' });

    const pageIndicator = document.getElementById('page-indicator');
    if (pageIndicator) {
      pageIndicator.textContent = pages.length > 1 ? 'Page ' + (index + 1) + ' of ' + pages.length : '';
    }

    bodyEl.querySelectorAll('.nav-forward-btn').forEach(btn => {
      if (index >= pages.length - 1) {
        btn.style.opacity = '0.4';
        btn.style.cursor = 'default';
      } else {
        btn.addEventListener('click', () => renderPage(index + 1));
      }
    });

    bodyEl.querySelectorAll('.nav-back-btn').forEach(btn => {
      if (index <= 0) {
        btn.style.opacity = '0.4';
        btn.style.cursor = 'default';
      } else {
        btn.addEventListener('click', () => renderPage(index - 1));
      }
    });
  }

  Promise.all([
    fetch('/api/courses/' + COURSE_ID).then(r => r.json()),
    fetch('/api/courses/' + COURSE_ID + '/content').then(r => r.json()),
  ]).then(([courseData, contentData]) => {
    const course = courseData.course;
    const blocks = contentData.blocks || [];

    document.getElementById('preview-course-title').textContent = course ? course.title : 'Course Preview';

    const bodyEl = document.getElementById('preview-course-body');
    if (blocks.length === 0) {
      bodyEl.innerHTML = '<div class="empty-state">This course has no content yet.</div>';
      return;
    }

    pages = splitIntoPages(blocks);
    renderPage(0);
  }).catch(() => {
    document.getElementById('preview-course-body').innerHTML = '<div class="empty-state">Could not load this course.</div>';
  });
`;

export const coursePreviewHtml = renderLayout({
  title: 'Course Preview',
  activePath: '/course-delivery',
  eyebrowSuffix: 'Learner Preview',
  heading: 'Course Preview',
  bodyHtml,
  scripts,
});
