import { renderLayout } from './layout';

const bodyHtml = `
  <a href="#" id="back-link" style="display: inline-block; margin-bottom: 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">&larr; Back to Course Development</a>

  <div class="panel">
    <div class="panel-header">
      <div class="panel-title" id="preview-course-title">Course Preview</div>
      <div class="panel-sub">This is a simulation of what a learner will see — not the real learner experience yet</div>
    </div>
    <div style="padding: 16px 20px 0;">
      <img id="preview-course-banner" class="course-banner" style="display:none; margin-bottom: 0;" alt="" />
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

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function buildTestQuestionHtml(q, index) {
    const num = index + 1;

    if (q.type === 'multipleChoice') {
      const optionsHtml = (q.options || []).map(o => \`
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-family:'Inter',sans-serif; font-size:14px; cursor:pointer;">
          <input type="radio" name="q-\${q.id}" value="\${o.id}" />
          \${escapeHtml(o.text)}
        </label>
      \`).join('');
      return \`<div class="test-question" data-question-id="\${q.id}" style="margin-bottom:20px;">
        <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:8px;">\${num}. \${escapeHtml(q.text)}</div>
        \${optionsHtml}
      </div>\`;
    }

    if (q.type === 'trueFalse') {
      return \`<div class="test-question" data-question-id="\${q.id}" style="margin-bottom:20px;">
        <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:8px;">\${num}. \${escapeHtml(q.text)}</div>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-family:'Inter',sans-serif; font-size:14px; cursor:pointer;">
          <input type="radio" name="q-\${q.id}" value="true" /> True
        </label>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-family:'Inter',sans-serif; font-size:14px; cursor:pointer;">
          <input type="radio" name="q-\${q.id}" value="false" /> False
        </label>
      </div>\`;
    }

    if (q.type === 'written') {
      return \`<div class="test-question" data-question-id="\${q.id}" style="margin-bottom:20px;">
        <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:8px;">\${num}. \${escapeHtml(q.text)}</div>
        <textarea rows="3" style="width:100%; background:var(--panel-alt); border:1px solid var(--grid-line); color:var(--text-primary); font-family:'Inter',sans-serif; font-size:13px; padding:10px 12px; border-radius:2px;"></textarea>
      </div>\`;
    }

    if (q.type === 'matching') {
      const rightTexts = shuffleArray((q.pairs || []).map(p => p.right));
      const pairsHtml = (q.pairs || []).map(p => \`
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="flex:1; font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtml(p.left)}</span>
          <select class="matching-select" data-pair-id="\${p.id}" style="flex:1; background:var(--panel-alt); border:1px solid var(--grid-line); color:var(--text-primary); font-family:'IBM Plex Mono',monospace; font-size:13px; padding:8px; border-radius:2px;">
            <option value="">-- Select --</option>
            \${rightTexts.map(r => \`<option value="\${escapeHtml(r)}">\${escapeHtml(r)}</option>\`).join('')}
          </select>
        </div>
      \`).join('');
      return \`<div class="test-question" data-question-id="\${q.id}" style="margin-bottom:20px;">
        <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:8px;">\${num}. \${escapeHtml(q.text)}</div>
        \${pairsHtml}
      </div>\`;
    }

    if (q.type === 'ordering') {
      const shuffled = shuffleArray(q.orderedItems || []);
      const itemsHtml = shuffled.map(item => \`
        <div class="ordering-item" data-text="\${escapeHtml(item)}" style="display:flex; align-items:center; gap:8px; margin-bottom:6px; padding:8px 10px; border:1px solid var(--grid-line); border-radius:2px; background:var(--panel-alt);">
          <span style="flex:1; font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary);">\${escapeHtml(item)}</span>
          <button type="button" class="order-up-btn" style="background:none;border:1px solid var(--grid-line);color:#000;padding:4px 8px;border-radius:2px;cursor:pointer;">&uarr;</button>
          <button type="button" class="order-down-btn" style="background:none;border:1px solid var(--grid-line);color:#000;padding:4px 8px;border-radius:2px;cursor:pointer;">&darr;</button>
        </div>
      \`).join('');
      return \`<div class="test-question" data-question-id="\${q.id}" style="margin-bottom:20px;">
        <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:8px;">\${num}. \${escapeHtml(q.text)}</div>
        <div class="ordering-list">\${itemsHtml}</div>
      </div>\`;
    }

    return '';
  }

  function attachOrderingHandlers(container) {
    container.querySelectorAll('.order-up-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.ordering-item');
        const prev = item.previousElementSibling;
        if (prev) item.parentNode.insertBefore(item, prev);
      });
    });
    container.querySelectorAll('.order-down-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.ordering-item');
        const next = item.nextElementSibling;
        if (next) item.parentNode.insertBefore(next, item);
      });
    });
  }

  function gatherTestAnswers(container, questions) {
    return questions.map(q => {
      const qDiv = container.querySelector('.test-question[data-question-id="' + q.id + '"]');
      if (q.type === 'multipleChoice') {
        const checked = qDiv.querySelector('input[type="radio"]:checked');
        return { questionId: q.id, selectedOptionId: checked ? checked.value : null };
      }
      if (q.type === 'trueFalse') {
        const checked = qDiv.querySelector('input[type="radio"]:checked');
        return { questionId: q.id, selectedBoolean: checked ? checked.value === 'true' : null };
      }
      if (q.type === 'written') {
        const textarea = qDiv.querySelector('textarea');
        return { questionId: q.id, text: textarea ? textarea.value : '' };
      }
      if (q.type === 'matching') {
        const selects = qDiv.querySelectorAll('.matching-select');
        const matches = Array.prototype.map.call(selects, sel => ({ pairId: sel.dataset.pairId, selectedRight: sel.value }));
        return { questionId: q.id, matches: matches };
      }
      if (q.type === 'ordering') {
        const items = Array.prototype.map.call(qDiv.querySelectorAll('.ordering-item'), el => el.dataset.text);
        return { questionId: q.id, orderedTexts: items };
      }
      return { questionId: q.id };
    });
  }

  function renderTestResults(container, attempt) {
    const resultsEl = container.querySelector('.test-results');
    const formEl = container.querySelector('.test-form');

    const summaryPct = attempt.maxScore > 0 ? Math.round((100 * attempt.score) / attempt.maxScore) : null;
    const summaryText = 'Score: ' + attempt.score + ' / ' + attempt.maxScore + (summaryPct !== null ? ' (' + summaryPct + '%)' : '');

    const rows = attempt.results.map((r, i) => {
      if (r.correct === null) {
        return \`<div style="margin-bottom:10px; padding:10px; border:1px solid var(--grid-line); border-radius:2px; font-family:'IBM Plex Mono',monospace; font-size:13px;">\${i + 1}. Submitted for review</div>\`;
      }
      const icon = r.correct
        ? '<span style="color:var(--competent);">&check; Correct</span>'
        : '<span style="color:var(--risk);">&times; Incorrect</span>';
      const detail = r.pointsPossible > 1 ? ' (' + r.pointsEarned + '/' + r.pointsPossible + ')' : '';
      const summaryLine = (!r.correct && r.correctAnswerSummary)
        ? \`<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">\${escapeHtml(r.correctAnswerSummary)}</div>\`
        : '';
      return \`<div style="margin-bottom:10px; padding:10px; border:1px solid var(--grid-line); border-radius:2px; font-family:'IBM Plex Mono',monospace; font-size:13px;">\${i + 1}. \${icon}\${detail}\${summaryLine}</div>\`;
    }).join('');

    resultsEl.innerHTML = \`
      <div style="font-family:'Big Shoulders Display',sans-serif; font-size:20px; text-transform:uppercase; color:var(--text-primary); margin-bottom:12px;">\${summaryText}</div>
      \${rows}
      <button type="button" class="btn retake-test-btn" style="margin-top:8px;">Retake Test</button>
    \`;
    resultsEl.style.display = 'block';
    formEl.style.display = 'none';

    resultsEl.querySelector('.retake-test-btn').addEventListener('click', () => {
      resultsEl.style.display = 'none';
      formEl.style.display = 'block';
    });
  }

  function initTest(blockId, container) {
    Promise.all([
      fetch('/api/tests/' + blockId).then(r => r.json()),
      fetch('/api/tests/' + blockId + '/my-attempt').then(r => r.json()).catch(() => ({ attempt: null })),
    ]).then(([testData, attemptData]) => {
      const questions = testData.questions || [];
      const previousAttempt = attemptData.attempt;

      if (questions.length === 0) {
        container.innerHTML = '<div class="empty-state">This test has no questions yet.</div>';
        return;
      }

      const questionsHtml = questions.map((q, i) => buildTestQuestionHtml(q, i)).join('');
      const bannerHtml = previousAttempt
        ? \`<div style="margin-bottom:16px; padding:12px; background:rgba(62,155,84,0.12); border-left:3px solid var(--competent); border-radius:2px; font-family:'IBM Plex Mono',monospace; font-size:13px;">Previous score: \${previousAttempt.score} / \${previousAttempt.maxScore}</div>\`
        : '';

      container.innerHTML = \`
        \${bannerHtml}
        <div class="test-form">
          \${questionsHtml}
          <button type="button" class="btn submit-test-btn">Submit Test</button>
        </div>
        <div class="test-results" style="display:none;"></div>
      \`;

      attachOrderingHandlers(container);

      container.querySelector('.submit-test-btn').addEventListener('click', () => {
        const answers = gatherTestAnswers(container, questions);
        fetch('/api/tests/' + blockId + '/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answers })
        })
          .then(r => r.json())
          .then(data => renderTestResults(container, data.attempt));
      });
    }).catch(() => {
      container.innerHTML = '<div class="empty-state">Could not load this test.</div>';
    });
  }

  function mountTests() {
    document.querySelectorAll('[data-test-block-id]').forEach(el => {
      initTest(el.dataset.testBlockId, el);
    });
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
        <button class="btn nav-back-btn" style="background:var(--panel-alt); color:#000; border:1px solid var(--grid-line);">&larr; \${escapeHtml(block.title) || 'Back'}</button>
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
      const headingFont = settings.fontFamily || "'Big Shoulders Display', sans-serif";
      if (layout === 'imageLeft') {
        return \`<div style="display:flex; gap:16px; align-items:center; margin-bottom:20px;">
          \${imageDataUrl ? \`<img src="\${imageDataUrl}" style="width:120px; height:80px; object-fit:cover; border-radius:2px; flex-shrink:0;" />\` : NO_IMAGE_PLACEHOLDER}
          <h2 style="margin:0; font-family:\${headingFont}; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>
        </div>\`;
      } else if (layout === 'bannerTop') {
        return \`<div style="margin-bottom:20px;">
          \${imageDataUrl ? \`<img src="\${imageDataUrl}" style="width:100%; max-height:140px; object-fit:cover; border-radius:2px; margin-bottom:12px;" />\` : NO_BANNER_PLACEHOLDER}
          <h2 style="margin:0; font-family:\${headingFont}; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>
        </div>\`;
      }
      return \`<h2 style="margin:0 0 20px; font-family:\${headingFont}; font-size:24px; text-transform:uppercase; color:var(--text-primary);">\${safeTitle}</h2>\`;
    }

    if (block.type === 'subtitle') {
      const subtitleFont = settings.fontFamily || "'Inter', sans-serif";
      return \`<div style="font-family:\${subtitleFont}; font-size:15px; color:var(--text-muted); font-style:italic; margin-bottom:20px;">\${safeTitle}</div>\`;
    }

    if (block.type === 'text') {
      const textFont = settings.fontFamily || "'Inter', sans-serif";
      const html = block.title && block.title.trim()
        ? block.title
        : '<span style="color:var(--text-muted);">Empty text field</span>';
      return \`<div style="margin-bottom:20px; font-family:\${textFont}; font-size:14px; color:var(--text-primary); line-height:1.6;">\${html}</div>\`;
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
      return \`<div style="display:flex; gap:16px; align-items:flex-start; margin-bottom:20px;">\${rowContent}</div>\`;
    }

    if (block.type === 'pictureOnly') {
      const pWidth = settings.imageWidth || 300;
      if (!imageDataUrl) {
        return \`<div style="margin-bottom:20px; width:\${pWidth}px; max-width:100%; height:\${Math.round(pWidth * 0.6)}px; background:var(--panel-alt); border:1px dashed var(--grid-line); border-radius:2px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:11px;">No image</div>\`;
      }
      const captionHtml = block.title && block.title.trim()
        ? \`<div style="font-family:'Inter',sans-serif; font-size:12px; color:var(--text-muted); margin-top:6px;">\${escapeHtml(block.title)}</div>\`
        : '';
      return \`<div style="margin-bottom:20px;">
        <img src="\${imageDataUrl}" style="width:\${pWidth}px; max-width:100%; height:auto; border-radius:2px;" />
        \${captionHtml}
      </div>\`;
    }

    if (block.type === 'table') {
      const tableFont = settings.fontFamily || "'Inter', sans-serif";
      const tableData = settings.tableData;
      if (!tableData) {
        return '<div style="margin-bottom:20px; padding:20px; border:1px dashed var(--grid-line); border-radius:2px; text-align:center; color:var(--text-muted); font-family:\\'IBM Plex Mono\\',monospace; font-size:12px;">Table — not yet created</div>';
      }
      const rowsHtml = tableData.cells.map(row => \`
        <tr>\${row.map(cell => \`<td style="border:1px solid var(--grid-line); padding:8px; font-family:\${tableFont}; font-size:13px; color:var(--text-primary);">\${escapeHtml(cell)}</td>\`).join('')}</tr>
      \`).join('');
      return \`<div style="margin-bottom:20px; overflow-x:auto;">
        <table style="border-collapse:collapse; width:100%;">\${rowsHtml}</table>
      </div>\`;
    }

    if (block.type === 'presentation' || block.type === 'document') {
      const fileDataUrl = settings.fileDataUrl;
      const fileName = settings.fileName;
      const fileMimeType = settings.fileMimeType || '';
      const label = block.type === 'presentation' ? 'Presentation' : 'Document';

      if (!fileDataUrl) {
        return \`<div style="margin-bottom:20px; padding:20px; border:1px dashed var(--grid-line); border-radius:2px; text-align:center; color:var(--text-muted); font-family:'IBM Plex Mono',monospace; font-size:12px;">
          \${label}\${block.title ? ': ' + safeTitle : ''} — no file uploaded yet
        </div>\`;
      }

      if (fileMimeType === 'application/pdf') {
        return \`<div style="margin-bottom:20px;">
          \${block.title ? \`<div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:8px;">\${safeTitle}</div>\` : ''}
          <iframe src="\${fileDataUrl}" style="width:100%; height:500px; border:1px solid var(--grid-line); border-radius:2px;"></iframe>
        </div>\`;
      }

      return \`<div style="margin-bottom:20px; padding:16px; border:1px solid var(--grid-line); border-radius:2px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
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
        return '<div style="margin-bottom:20px; padding:20px; border:1px dashed var(--grid-line); border-radius:2px; text-align:center; color:var(--text-muted); font-family:\\'IBM Plex Mono\\',monospace; font-size:12px;">Video Upload — no file uploaded yet</div>';
      }
      return \`<div style="margin-bottom:20px;">
        \${block.title ? \`<div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:8px;">\${safeTitle}</div>\` : ''}
        <video controls style="width:100%; max-height:400px; border-radius:2px; background:#000;">
          <source src="\${fileDataUrl}" type="\${settings.fileMimeType || 'video/mp4'}" />
        </video>
      </div>\`;
    }

    if (block.type === 'youtubeLink') {
      const videoId = getYoutubeEmbedId(block.title);
      if (!videoId) {
        return '<div style="margin-bottom:20px; padding:20px; border:1px dashed var(--grid-line); border-radius:2px; text-align:center; color:var(--text-muted); font-family:\\'IBM Plex Mono\\',monospace; font-size:12px;">YouTube Link — paste a valid YouTube URL to embed the video</div>';
      }
      return \`<div style="margin-bottom:20px;">
        <iframe width="100%" height="360" src="https://www.youtube.com/embed/\${videoId}" style="border:1px solid var(--grid-line); border-radius:2px;" allowfullscreen></iframe>
      </div>\`;
    }

    if (block.type === 'test') {
      return \`<div class="panel" style="margin-bottom:20px;">
        <div class="panel-header">
          <div class="panel-title">\${block.title ? safeTitle : 'Test'}</div>
          <div class="panel-sub">Answer the questions below, then submit</div>
        </div>
        <div class="panel-body" data-test-block-id="\${block.id}">
          <div class="empty-state">Loading test&hellip;</div>
        </div>
      </div>\`;
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
    let pendingBreak = false;

    blocks.forEach(b => {
      if (b.type === 'module') {
        if (current.length > 0) pages.push(current);
        current = [b];
        pendingBreak = false;
        return;
      }

      const isNavButton = b.type === 'forwardButton' || b.type === 'backButton';

      // Once a Forward button has been seen, keep grouping any immediately
      // adjacent Back/Forward buttons onto the same page — the break only
      // happens once real content resumes (or the list ends).
      if (pendingBreak && !isNavButton) {
        pages.push(current);
        current = [];
        pendingBreak = false;
      }

      current.push(b);

      if (b.type === 'forwardButton') {
        pendingBreak = true;
      }
    });

    if (current.length > 0) pages.push(current);
    return pages;
  }

  function renderPageBlocks(blocks) {
    let html = '';
    let i = 0;
    while (i < blocks.length) {
      const b = blocks[i];
      if (b.type === 'forwardButton' || b.type === 'backButton') {
        const cluster = [];
        while (i < blocks.length && (blocks[i].type === 'forwardButton' || blocks[i].type === 'backButton')) {
          cluster.push(blocks[i]);
          i++;
        }
        const backHtml = cluster
          .filter(c => c.type === 'backButton')
          .map(c => \`<button type="button" class="btn nav-back-btn" style="background:var(--panel-alt); color:#000; border:1px solid var(--grid-line);">&larr; \${escapeHtml(c.title) || 'Back'}</button>\`)
          .join(' ');
        const forwardHtml = cluster
          .filter(c => c.type === 'forwardButton')
          .map(c => \`<button type="button" class="btn nav-forward-btn">\${escapeHtml(c.title) || 'Next'} &rarr;</button>\`)
          .join(' ');
        html += \`<div style="display:flex; justify-content:space-between; align-items:center; margin:16px 0;">
          <div>\${backHtml}</div>
          <div>\${forwardHtml}</div>
        </div>\`;
      } else {
        html += renderBlockHtml(b);
        i++;
      }
    }
    return html;
  }

  let pages = [];
  let currentPageIndex = 0;

  function renderPage(index) {
    currentPageIndex = index;
    const bodyEl = document.getElementById('preview-course-body');
    const page = pages[index];

    // Fully replaces the previous page's content — nothing from the prior
    // page remains in the DOM or is scrollable to.
    bodyEl.innerHTML = renderPageBlocks(page);
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

    mountTests();
  }

  Promise.all([
    fetch('/api/courses/' + COURSE_ID).then(r => r.json()),
    fetch('/api/courses/' + COURSE_ID + '/content').then(r => r.json()),
  ]).then(([courseData, contentData]) => {
    const course = courseData.course;
    const blocks = contentData.blocks || [];

    document.getElementById('preview-course-title').textContent = course ? course.title : 'Course Preview';

    const bannerEl = document.getElementById('preview-course-banner');
    if (course && course.bannerDataUrl) {
      bannerEl.src = course.bannerDataUrl;
      bannerEl.style.display = 'block';
      const bannerHeight = course.bannerHeight || 220;
      bannerEl.style.objectFit = course.bannerFit || 'cover';
      bannerEl.style.height = bannerHeight + 'px';
      bannerEl.style.maxHeight = bannerHeight + 'px';
    }

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
