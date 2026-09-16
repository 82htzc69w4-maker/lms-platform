import { renderLayout } from './layout';

const bodyHtml = `
  <div class="tabbar">
    <button class="tab-btn active" data-tab="catalogue">Course Catalogue</button>
    <button class="tab-btn" data-tab="development">Courses in Development</button>
    <button class="tab-btn" data-tab="applications">Applications for Enrollment</button>
    <button class="tab-btn" data-tab="coaching">Learner Coaching</button>
  </div>

  <div class="tab-panel active" data-tab-panel="catalogue">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Course Catalogue</div>
        <div class="panel-sub">Published courses learners can see and enroll in</div>
      </div>
      <div id="catalogue-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="development">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Add Course</div>
        <div class="panel-sub">New courses start as drafts — publish when ready for learners</div>
      </div>
      <div class="panel-body">
        <div class="form-row">
          <input type="text" id="new-course-id" placeholder="Course ID (e.g. course-002)" />
          <input type="text" id="new-course-title" placeholder="Title" />
          <select id="new-course-category"><option value="">Category</option></select>
        </div>
        <div class="form-row">
          <input type="text" id="new-course-description" placeholder="Description" />
        </div>
        <button class="btn" id="add-course-btn">Add as Draft</button>
        <div id="add-course-message" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Import Moodle Course</div>
        <div class="panel-sub">Upload a Moodle course backup (.mbz). Pages, file resources, and True/False or Multiple Choice quiz questions are imported; other activity types (forums, SCORM, etc.) are skipped and listed in the report below — nothing is silently dropped.</div>
      </div>
      <div class="panel-body">
        <input type="file" id="moodle-import-file" accept=".mbz" style="margin-bottom: 10px;" />
        <button class="btn" id="moodle-import-btn">Import</button>
        <div id="moodle-import-progress" style="margin-top: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--text-muted);"></div>
        <div id="moodle-import-report" style="margin-top: 12px;"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Courses in Development</div>
        <div class="panel-sub">Draft courses not yet visible to learners</div>
      </div>
      <div id="development-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="applications">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Applications for Enrollment</div>
        <div class="panel-sub">Learners who have applied to enroll — review their motivation and approve or reject</div>
      </div>
      <div id="applications-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>

  <div class="tab-panel" data-tab-panel="coaching">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Pending Coaching Notifications</div>
        <div class="panel-sub">Learners who have failed a test the maximum allowed number of times</div>
      </div>
      <div id="coaching-notifications-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Learner Roster</div>
        <div class="panel-sub">All registered learners</div>
      </div>
      <div id="coaching-wrap">
        <div class="empty-state">Loading&hellip;</div>
      </div>
    </div>
  </div>
`;

const scripts = `
  // ---------- Role gate: Instructor, Admin, and Administrator only ----------
  let currentSession = null;
  fetch('/api/auth/me')
    .then(r => {
      if (!r.ok) throw new Error('not logged in');
      return r.json();
    })
    .then(data => {
      const role = data.user.role;
      if (role !== 'instructor' && role !== 'admin' && role !== 'administrator') {
        window.location.href = '/';
        return;
      }
      currentSession = data.user;
      loadLearnerList().then(() => loadCatalogue());
      loadDevelopment();
      loadCoaching();
      loadCoachingNotifications();
      loadCourseApplications();
    })
    .catch(() => {
      window.location.href = '/login';
    });

  function canEditCourse(course) {
    if (!currentSession) return false;
    if (currentSession.role !== 'instructor') return true;
    return !course.instructorUsername || course.instructorUsername === currentSession.username;
  }

  // ---------- Populate Category dropdown from lookup list ----------
  function loadCategoryOptions() {
    fetch('/api/lookups/courseCategories')
      .then(r => r.json())
      .then(data => {
        const select = document.getElementById('new-course-category');
        const placeholder = select.options[0];
        select.innerHTML = '';
        select.appendChild(placeholder);
        (data.values || []).forEach(v => {
          const opt = document.createElement('option');
          opt.value = v;
          opt.textContent = v;
          select.appendChild(opt);
        });
      })
      .catch(() => { /* dropdown just stays empty if this fails */ });
  }
  loadCategoryOptions();

  // ---------- Tab switching ----------
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tabPanel === tab));
    });
  });

  // Allow deep-linking to a specific tab via URL hash, e.g. /course-delivery#development
  const hashTab = window.location.hash.replace('#', '');
  if (hashTab) {
    const targetBtn = document.querySelector('.tab-btn[data-tab="' + hashTab + '"]');
    if (targetBtn) targetBtn.click();
  }

  // ---------- Course Catalogue (published only) ----------
  let learnerList = [];

  function loadLearnerList() {
    return fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        learnerList = (data.users || []).filter(u => u.role === 'learner');
      })
      .catch(() => { learnerList = []; });
  }

  let catalogueCourseList = [];

  function renderCatalogueCards() {
    const wrap = document.getElementById('catalogue-wrap');

    if (catalogueCourseList.length === 0) {
      wrap.innerHTML = '<div class="empty-state">No published courses yet. Publish one from the Courses in Development tab.</div>';
      return;
    }

    const canEnrollStudents = currentSession &&
      (currentSession.role === 'instructor' || currentSession.role === 'admin' || currentSession.role === 'administrator');

    const cards = catalogueCourseList.map(course => {
      const enrolledUsernames = new Set(course.enrolledUsernames || []);
      const availableLearners = learnerList.filter(u => !enrolledUsernames.has(u.username));
      const learnerOptionsHtml = availableLearners.map(u =>
        '<option value="' + u.username + '">' + (u.name || u.username) + '</option>'
      ).join('');

      return \`
      <div class="course-card">
        \${course.imageDataUrl
          ? \`<img class="course-card-image" src="\${course.imageDataUrl}" alt="" />\`
          : course.bannerDataUrl
          ? \`<img class="course-card-image" src="\${course.bannerDataUrl}" style="object-fit: contain; background: var(--panel-alt);" alt="" />\`
          : '<div class="course-card-image-placeholder">No Image</div>'}
        <div class="course-card-body">
          <div class="course-card-title">\${course.title}</div>
          <div class="course-card-category">\${course.category || 'Uncategorized'}</div>
          <div class="course-card-description">\${course.description}</div>
          <div class="stat-label" style="text-transform:none; letter-spacing:0; margin-bottom:8px;">\${course.enrolledCount || 0} learner\${course.enrolledCount === 1 ? '' : 's'} enrolled</div>
          \${canEditCourse(course)
            ? \`<a class="btn" href="/course-development/\${course.id}" style="display:inline-block; text-decoration:none; text-align:center; margin-bottom:6px;">Edit</a>\`
            : '<div class="stat-label" style="text-transform:none; letter-spacing:0; margin-bottom:6px;">Owned by another instructor</div>'}
          <a class="btn" href="/enrolled-learners/\${course.id}" style="display:inline-block; text-decoration:none; text-align:center; margin-bottom:6px; background:var(--panel-alt); color:var(--text-primary); border:1px solid var(--grid-line);">Enrolled Learners</a>
          <button class="btn enroll-btn" data-course-id="\${course.id}" style="width:100%;">Enroll Myself</button>
          \${canEnrollStudents ? \`
            <div style="margin-top:8px; padding-top:8px; border-top:1px solid var(--grid-line);">
              <div class="stat-label" style="margin-bottom:6px;">Enroll a Student</div>
              <select class="enroll-student-select" data-course-id="\${course.id}" style="width:100%; margin-bottom:6px;">
                <option value="">Select a learner&hellip;</option>
                \${learnerOptionsHtml}
              </select>
              <button class="btn enroll-student-btn" data-course-id="\${course.id}" style="width:100%; background:var(--panel-alt); color:var(--text-primary); border:1px solid var(--grid-line);">Enroll Student</button>
              <div class="enroll-student-message-\${course.id}" style="margin-top:6px; font-family:'IBM Plex Mono',monospace; font-size:12px;"></div>
            </div>
          \` : ''}
        </div>
      </div>
    \`;
    }).join('');

    wrap.innerHTML = \`<div class="course-card-grid">\${cards}</div>\`;

    document.querySelectorAll('.enroll-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const courseId = btn.dataset.courseId;
        btn.textContent = 'Enrolling…';
        btn.disabled = true;
        fetch('/api/courses/' + courseId + '/enroll', { method: 'POST' })
          .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Failed to enroll');
            return data;
          })
          .then(() => { btn.textContent = 'Enrolled'; })
          .catch((err) => {
            btn.textContent = 'Enroll Myself';
            btn.disabled = false;
            btn.title = err.message;
            alert(err.message);
          });
      });
    });

    document.querySelectorAll('.enroll-student-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const courseId = btn.dataset.courseId;
        const select = document.querySelector('.enroll-student-select[data-course-id="' + courseId + '"]');
        const msgEl = document.querySelector('.enroll-student-message-' + courseId);
        const username = select.value;

        if (!username) {
          msgEl.textContent = 'Please select a learner first.';
          msgEl.style.color = 'var(--risk)';
          return;
        }

        btn.textContent = 'Enrolling…';
        btn.disabled = true;

        fetch('/api/courses/' + courseId + '/enroll-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        })
          .then(async (r) => {
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Failed to enroll student');
            return data;
          })
          .then(() => {
            // Update the in-memory course data immediately rather than
            // re-fetching from the server — KV writes can take a moment to
            // propagate, so an immediate re-fetch can briefly show stale
            // data even though the enrollment genuinely succeeded.
            const course = catalogueCourseList.find(c => c.id === courseId);
            if (course) {
              course.enrolledCount = (course.enrolledCount || 0) + 1;
              course.enrolledUsernames = [...(course.enrolledUsernames || []), username];
            }
            renderCatalogueCards();
          })
          .catch((err) => {
            msgEl.textContent = err.message;
            msgEl.style.color = 'var(--risk)';
            btn.textContent = 'Enroll Student';
            btn.disabled = false;
          });
      });
    });
  }

  function loadCatalogue() {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        catalogueCourseList = (data.courses || []).filter(c => c.status === 'published');
        renderCatalogueCards();
      })
      .catch(() => {
        document.getElementById('catalogue-wrap').innerHTML = '<div class="empty-state">Could not reach /api/courses.</div>';
      });
  }

  // ---------- Courses in Development (drafts) ----------
  function loadDevelopment() {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        const list = (data.courses || []).filter(c => c.status !== 'published');
        const wrap = document.getElementById('development-wrap');

        if (list.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No draft courses right now. Add one above.</div>';
          return;
        }

        const rows = list.map(course => \`
          <tr>
            <td>\${course.title}</td>
            <td>\${course.category || '—'}</td>
            <td>\${course.instructor || '—'}</td>
            <td>\${course.developmentStartDate ? new Date(course.developmentStartDate).toLocaleDateString() : '—'}</td>
            <td>\${course.description}</td>
            <td>
              \${canEditCourse(course)
                ? \`<a class="btn" href="/course-development/\${course.id}" style="display:inline-block; text-decoration:none; margin-right: 6px;">Edit</a>
                   <button class="btn publish-btn" data-course-id="\${course.id}">Publish</button>\`
                : '<span class="stat-label" style="text-transform:none; letter-spacing:0;">Owned by another instructor</span>'}
            </td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead><tr><th>Course</th><th>Category</th><th>Instructor</th><th>Start Date</th><th>Description</th><th></th></tr></thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;

        document.querySelectorAll('.publish-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const courseId = btn.dataset.courseId;
            btn.textContent = 'Publishing…';
            btn.disabled = true;
            fetch('/api/courses/' + courseId + '/publish', { method: 'POST' })
              .then(r => r.json())
              .then(() => {
                loadDevelopment();
                loadCatalogue();
              })
              .catch(() => {
                btn.textContent = 'Publish';
                btn.disabled = false;
              });
          });
        });
      })
      .catch(() => {
        document.getElementById('development-wrap').innerHTML = '<div class="empty-state">Could not reach /api/courses.</div>';
      });
  }

  document.getElementById('add-course-btn').addEventListener('click', () => {
    const id = document.getElementById('new-course-id').value.trim();
    const title = document.getElementById('new-course-title').value.trim();
    const category = document.getElementById('new-course-category').value.trim();
    const description = document.getElementById('new-course-description').value.trim();
    const msgEl = document.getElementById('add-course-message');

    if (!id || !title || !description) {
      msgEl.textContent = 'Course ID, title, and description are required.';
      msgEl.style.color = 'var(--risk)';
      return;
    }

    fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, category, description, status: 'draft' })
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to add course');
        return data;
      })
      .then(() => {
        msgEl.textContent = 'Course added as draft.';
        msgEl.style.color = 'var(--competent)';
        document.getElementById('new-course-id').value = '';
        document.getElementById('new-course-title').value = '';
        document.getElementById('new-course-category').value = '';
        document.getElementById('new-course-description').value = '';
        loadDevelopment();
      })
      .catch((err) => {
        msgEl.textContent = err.message;
        msgEl.style.color = 'var(--risk)';
      });
  });

  // ============================================================
  // Moodle Course Backup (.mbz) Importer
  //
  // Runs entirely in the browser: gzip decompression via the native
  // DecompressionStream API, a hand-written TAR reader (the format is
  // simple and stable, no library needed), and XML parsing via the
  // native DOMParser. This keeps every server-side call an ordinary,
  // small content-block write — the same calls Course Development
  // already makes one at a time — so nothing here depends on the
  // Worker's CPU-time budget, which is far too small (10ms on the free
  // plan) to parse an archive like this.
  //
  // Supported Moodle activity types: page, resource, quiz (truefalse
  // and multichoice questions only). Everything else is reported as
  // skipped, never silently dropped or faked.
  // ============================================================

  function moodleSlugify(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  function moodleNullSafe(value) {
    if (value === null || value === undefined) return '';
    if (value === '$@NULL@$') return '';
    return value;
  }

  // ---------- TAR parsing ----------
  function parseTar(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const files = new Map();
    let offset = 0;

    function readString(start, length) {
      let end = start;
      while (end < start + length && bytes[end] !== 0) end++;
      return new TextDecoder().decode(bytes.slice(start, end));
    }

    function readOctal(start, length) {
      const str = readString(start, length).trim();
      return str ? parseInt(str, 8) : 0;
    }

    while (offset + 512 <= bytes.length) {
      const header = bytes.slice(offset, offset + 512);
      let isEmpty = true;
      for (let i = 0; i < 512; i++) {
        if (header[i] !== 0) { isEmpty = false; break; }
      }
      if (isEmpty) break;

      const name = readString(offset, 100);
      const size = readOctal(offset + 124, 12);
      const typeflag = readString(offset + 156, 1);
      const prefix = readString(offset + 345, 155);
      const fullPath = prefix ? (prefix + '/' + name) : name;

      offset += 512;

      if (typeflag === '0' || typeflag === '') {
        const content = bytes.slice(offset, offset + size);
        files.set(fullPath, content);
      }

      const paddedSize = Math.ceil(size / 512) * 512;
      offset += paddedSize;
    }

    return files;
  }

  // ---------- XML helpers ----------
  function parseXmlBytes(files, path) {
    const bytes = files.get(path);
    if (!bytes) return null;
    const text = new TextDecoder('utf-8').decode(bytes);
    return new DOMParser().parseFromString(text, 'text/xml');
  }

  function childText(el, tagName) {
    if (!el) return '';
    const found = el.getElementsByTagName(tagName);
    if (found.length === 0) return '';
    return moodleNullSafe(found[0].textContent);
  }

  // ---------- files.xml index: (contextid|component|filename) -> contenthash ----------
  function buildFileIndex(filesDoc) {
    const index = new Map();
    if (!filesDoc) return index;
    const fileEls = filesDoc.getElementsByTagName('file');
    for (let i = 0; i < fileEls.length; i++) {
      const el = fileEls[i];
      const contextid = childText(el, 'contextid');
      const component = childText(el, 'component');
      const filename = childText(el, 'filename');
      const contenthash = childText(el, 'contenthash');
      const mimetype = childText(el, 'mimetype');
      if (!contextid || !filename || filename === '.') continue;
      const key = contextid + '|' + component + '|' + filename;
      index.set(key, { contenthash, mimetype });
    }
    return index;
  }

  function resolveFileDataUrl(files, fileIndex, contextid, component, filename) {
    const key = contextid + '|' + component + '|' + filename;
    const entry = fileIndex.get(key);
    if (!entry || !entry.contenthash) return null;
    const hash = entry.contenthash;
    const path = 'files/' + hash.slice(0, 2) + '/' + hash;
    const bytes = files.get(path);
    if (!bytes) return null;

    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const mime = entry.mimetype || 'application/octet-stream';
    return { dataUrl: 'data:' + mime + ';base64,' + base64, mimeType: mime };
  }

  // Rewrites @@PLUGINFILE@@/filename references in HTML content to
  // inline data URLs, resolved against this activity's own contextid.
  function resolvePluginFileReferences(html, files, fileIndex, contextid, component) {
    return html.replace(/@@PLUGINFILE@@\\/([^"'\\s)]+)/g, function (match, filename) {
      const decoded = decodeURIComponent(filename);
      const resolved = resolveFileDataUrl(files, fileIndex, contextid, component, decoded);
      return resolved ? resolved.dataUrl : match;
    });
  }

  // ---------- questions.xml: build a map of questionbankentryid -> parsed question ----------
  function parseQuestionBank(questionsDoc) {
    const bank = new Map();
    if (!questionsDoc) return bank;

    const entryEls = questionsDoc.getElementsByTagName('question_bank_entry');
    for (let i = 0; i < entryEls.length; i++) {
      const entryEl = entryEls[i];
      const entryId = entryEl.getAttribute('id');
      const questionEls = entryEl.getElementsByTagName('question');
      if (questionEls.length === 0) continue;
      // Use the last (most recent) <question> found under this entry
      const qEl = questionEls[questionEls.length - 1];

      const qtype = childText(qEl, 'qtype');
      const text = childText(qEl, 'questiontext');
      const defaultmark = parseFloat(childText(qEl, 'defaultmark')) || 1;

      if (qtype === 'truefalse') {
        const answerEls = qEl.getElementsByTagName('answer');
        let correctBoolean = true;
        for (let a = 0; a < answerEls.length; a++) {
          const fraction = parseFloat(childText(answerEls[a], 'fraction'));
          const answertext = childText(answerEls[a], 'answertext');
          if (fraction === 1) {
            correctBoolean = answertext.toLowerCase() === 'true';
          }
        }
        bank.set(entryId, { type: 'trueFalse', text: text, marks: defaultmark, correctBoolean: correctBoolean });
      } else if (qtype === 'multichoice') {
        const answerEls = qEl.getElementsByTagName('answer');
        const options = [];
        for (let a = 0; a < answerEls.length; a++) {
          const fraction = parseFloat(childText(answerEls[a], 'fraction'));
          const answertext = childText(answerEls[a], 'answertext');
          options.push({ id: crypto.randomUUID(), text: answertext, isCorrect: fraction > 0 });
        }
        bank.set(entryId, { type: 'multipleChoice', text: text, marks: defaultmark, options: options });
      } else {
        bank.set(entryId, { type: 'unsupported', qtype: qtype, text: text });
      }
    }

    return bank;
  }

  // ---------- Section/activity ordering from moodle_backup.xml ----------
  function parseActivityList(backupDoc) {
    const activities = [];
    const activityEls = backupDoc.getElementsByTagName('activity');
    for (let i = 0; i < activityEls.length; i++) {
      const el = activityEls[i];
      // Only top-level <activity> elements under <contents><activities>,
      // not nested elements that happen to share the tag name.
      if (el.parentNode && el.parentNode.tagName !== 'activities') continue;
      activities.push({
        moduleid: childText(el, 'moduleid'),
        sectionid: childText(el, 'sectionid'),
        modulename: childText(el, 'modulename'),
        title: childText(el, 'title'),
        directory: childText(el, 'directory'),
      });
    }
    return activities;
  }

  function parseSectionOrder(backupDoc) {
    const sections = [];
    const sectionEls = backupDoc.getElementsByTagName('section');
    for (let i = 0; i < sectionEls.length; i++) {
      const el = sectionEls[i];
      if (el.parentNode && el.parentNode.tagName !== 'sections') continue;
      sections.push({
        sectionid: childText(el, 'sectionid'),
        title: childText(el, 'title'),
      });
    }
    return sections;
  }

  // Returns activities in true course order: by section order, then by
  // each section's own <sequence> of module IDs.
  function orderActivities(backupDoc, files) {
    const activities = parseActivityList(backupDoc);
    const sections = parseSectionOrder(backupDoc);
    const activityByModuleId = new Map(activities.map(function (a) { return [a.moduleid, a]; }));

    const ordered = [];
    for (const section of sections) {
      const sectionXmlPath = 'sections/section_' + section.sectionid + '/section.xml';
      const sectionDoc = parseXmlBytes(files, sectionXmlPath);
      const sequence = sectionDoc ? childText(sectionDoc.documentElement, 'sequence') : '';
      if (!sequence) continue;
      const moduleIds = sequence.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      for (const moduleId of moduleIds) {
        const activity = activityByModuleId.get(moduleId);
        if (activity) ordered.push(activity);
      }
    }
    return ordered;
  }

  // ---------- Main import entry point ----------
  async function importMoodleBackup(file, onProgress) {
    onProgress('Decompressing archive…');
    const decompressedStream = file.stream().pipeThrough(new DecompressionStream('gzip'));
    const tarBuffer = await new Response(decompressedStream).arrayBuffer();

    onProgress('Reading archive contents…');
    const files = parseTar(tarBuffer);

    const backupDoc = parseXmlBytes(files, 'moodle_backup.xml');
    if (!backupDoc) throw new Error('This does not look like a valid Moodle backup — moodle_backup.xml was not found.');

    const infoEls = backupDoc.getElementsByTagName('information');
    const courseFullName = infoEls.length > 0 ? childText(infoEls[0], 'original_course_fullname') : 'Imported Moodle Course';

    const filesDoc = parseXmlBytes(files, 'files.xml');
    const fileIndex = buildFileIndex(filesDoc);

    const questionsDoc = parseXmlBytes(files, 'questions.xml');
    const questionBank = parseQuestionBank(questionsDoc);

    onProgress('Determining course structure…');
    const orderedActivities = orderActivities(backupDoc, files);

    const courseId = 'moodle-' + moodleSlugify(courseFullName) + '-' + Date.now().toString(36);

    onProgress('Creating course "' + courseFullName + '"…');
    const createResp = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: courseId,
        title: courseFullName,
        description: 'Imported from a Moodle course backup.',
        status: 'draft'
      })
    });
    const createData = await createResp.json();
    if (!createResp.ok) throw new Error(createData.error || 'Failed to create course');

    const report = { imported: [], skipped: [] };

    for (const activity of orderedActivities) {
      onProgress('Importing "' + activity.title + '"…');

      if (activity.modulename === 'page') {
        const pageDoc = parseXmlBytes(files, activity.directory + '/page.xml');
        if (!pageDoc) { report.skipped.push({ title: activity.title, reason: 'page.xml missing' }); continue; }
        const activityEl = pageDoc.documentElement;
        const contextid = activityEl.getAttribute('contextid');
        const pageEls = pageDoc.getElementsByTagName('page');
        const rawContent = pageEls.length > 0 ? childText(pageEls[0], 'content') : '';
        const resolvedContent = resolvePluginFileReferences(rawContent, files, fileIndex, contextid, 'mod_page');

        const blockResp = await fetch('/api/courses/' + courseId + '/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'text', title: resolvedContent })
        });
        const blockData = await blockResp.json();
        if (blockResp.ok) {
          report.imported.push({ title: activity.title, type: 'Text' });
        } else {
          report.skipped.push({ title: activity.title, reason: blockData.error || 'failed to create block' });
        }
      } else if (activity.modulename === 'resource') {
        const resourceDoc = parseXmlBytes(files, activity.directory + '/resource.xml');
        if (!resourceDoc) { report.skipped.push({ title: activity.title, reason: 'resource.xml missing' }); continue; }
        const activityEl = resourceDoc.documentElement;
        const contextid = activityEl.getAttribute('contextid');

        // Find the first file indexed under this activity's context for mod_resource.
        let resolvedFile = null;
        let resolvedFilename = '';
        for (const [key, entry] of fileIndex) {
          const parts = key.split('|');
          if (parts[0] === contextid && parts[1] === 'mod_resource') {
            resolvedFilename = parts[2];
            resolvedFile = resolveFileDataUrl(files, fileIndex, contextid, 'mod_resource', resolvedFilename);
            if (resolvedFile) break;
          }
        }

        if (!resolvedFile) {
          report.skipped.push({ title: activity.title, reason: 'attached file could not be located' });
          continue;
        }

        const createBlockResp = await fetch('/api/courses/' + courseId + '/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'document', title: activity.title })
        });
        const createBlockData = await createBlockResp.json();
        if (!createBlockResp.ok) {
          report.skipped.push({ title: activity.title, reason: createBlockData.error || 'failed to create block' });
          continue;
        }
        const newBlockId = createBlockData.blocks[createBlockData.blocks.length - 1].id;

        const updateResp = await fetch('/api/courses/' + courseId + '/content/' + newBlockId, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              fileDataUrl: resolvedFile.dataUrl,
              fileName: resolvedFilename,
              fileMimeType: resolvedFile.mimeType
            }
          })
        });
        if (updateResp.ok) {
          report.imported.push({ title: activity.title, type: 'Document' });
        } else {
          report.skipped.push({ title: activity.title, reason: 'file attached but settings update failed' });
        }
      } else if (activity.modulename === 'quiz') {
        const quizDoc = parseXmlBytes(files, activity.directory + '/quiz.xml');
        if (!quizDoc) { report.skipped.push({ title: activity.title, reason: 'quiz.xml missing' }); continue; }

        const instanceEls = quizDoc.getElementsByTagName('question_instance');
        const questionsToAdd = [];
        const unsupportedTypes = [];

        for (let i = 0; i < instanceEls.length; i++) {
          const refEls = instanceEls[i].getElementsByTagName('question_reference');
          if (refEls.length === 0) continue;
          const entryId = childText(refEls[0], 'questionbankentryid');
          const parsedQuestion = questionBank.get(entryId);
          if (!parsedQuestion) continue;
          if (parsedQuestion.type === 'unsupported') {
            unsupportedTypes.push(parsedQuestion.qtype || 'unknown');
            continue;
          }
          questionsToAdd.push(parsedQuestion);
        }

        if (questionsToAdd.length === 0) {
          report.skipped.push({
            title: activity.title,
            reason: unsupportedTypes.length > 0
              ? 'no supported question types (found: ' + unsupportedTypes.join(', ') + ')'
              : 'no questions found'
          });
          continue;
        }

        const createBlockResp = await fetch('/api/courses/' + courseId + '/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'test', title: activity.title })
        });
        const createBlockData = await createBlockResp.json();
        if (!createBlockResp.ok) {
          report.skipped.push({ title: activity.title, reason: createBlockData.error || 'failed to create block' });
          continue;
        }
        const newBlockId = createBlockData.blocks[createBlockData.blocks.length - 1].id;

        let addedCount = 0;
        for (const q of questionsToAdd) {
          const questionResp = await fetch('/api/tests/' + newBlockId + '/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(q)
          });
          if (questionResp.ok) addedCount++;
        }

        let importNote = 'Test (' + addedCount + ' question' + (addedCount === 1 ? '' : 's') + ')';
        if (unsupportedTypes.length > 0) {
          importNote += ' — ' + unsupportedTypes.length + ' question(s) skipped (' + unsupportedTypes.join(', ') + ')';
        }
        report.imported.push({ title: activity.title, type: importNote });
      } else {
        report.skipped.push({ title: activity.title, reason: 'activity type "' + activity.modulename + '" is not supported' });
      }
    }

    return { courseId: courseId, courseTitle: courseFullName, report: report };
  }

  function moodleEscapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  document.getElementById('moodle-import-btn').addEventListener('click', function () {
    const fileInput = document.getElementById('moodle-import-file');
    const progressEl = document.getElementById('moodle-import-progress');
    const reportEl = document.getElementById('moodle-import-report');
    const file = fileInput.files[0];

    if (!file) {
      progressEl.textContent = 'Please choose a .mbz file first.';
      progressEl.style.color = 'var(--risk)';
      return;
    }

    reportEl.innerHTML = '';
    progressEl.style.color = 'var(--text-muted)';

    importMoodleBackup(file, function (message) {
      progressEl.textContent = message;
    }).then(function (result) {
      progressEl.textContent = 'Done — "' + result.courseTitle + '" created as a draft.';
      progressEl.style.color = 'var(--competent)';

      const importedRows = result.report.imported.map(function (item) {
        return '<div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px;">'
          + '<div style="flex:1; font-family:\\'Inter\\',sans-serif; font-size:14px; color:var(--text-primary);">' + moodleEscapeHtml(item.title) + '</div>'
          + '<div style="font-family:\\'IBM Plex Mono\\',monospace; font-size:12px; color:var(--competent);">' + moodleEscapeHtml(item.type) + '</div>'
          + '</div>';
      }).join('');

      const skippedRows = result.report.skipped.map(function (item) {
        return '<div class="content-block-row" style="align-items:center; cursor:default; margin-bottom:6px; border-color: var(--risk); background: rgba(193,68,58,0.06);">'
          + '<div style="flex:1; font-family:\\'Inter\\',sans-serif; font-size:14px; color:var(--text-primary);">' + moodleEscapeHtml(item.title) + '</div>'
          + '<div style="font-family:\\'IBM Plex Mono\\',monospace; font-size:12px; color:var(--risk);">' + moodleEscapeHtml(item.reason) + '</div>'
          + '</div>';
      }).join('');

      reportEl.innerHTML =
        '<div class="stat-label" style="margin-bottom: 8px; margin-top: 8px;">Imported (' + result.report.imported.length + ')</div>'
        + (importedRows || '<div class="empty-state">Nothing was imported.</div>')
        + '<div class="stat-label" style="margin-bottom: 8px; margin-top: 16px;">Skipped (' + result.report.skipped.length + ')</div>'
        + (skippedRows || '<div class="empty-state">Nothing was skipped.</div>');

      fileInput.value = '';
      loadDevelopment();
    }).catch(function (err) {
      progressEl.textContent = 'Import failed: ' + err.message;
      progressEl.style.color = 'var(--risk)';
    });
  });


  // ---------- Pending Coaching Notifications ----------
  // ---------- Applications for Enrollment ----------
  function loadCourseApplications() {
    fetch('/api/course-applications')
      .then(r => r.json())
      .then(data => {
        const applications = (data.applications || []).filter(a => a.status === 'pending');
        const wrap = document.getElementById('applications-wrap');

        if (applications.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No pending applications.</div>';
          return;
        }

        function escapeHtmlApp(str) {
          const div = document.createElement('div');
          div.textContent = str || '';
          return div.innerHTML;
        }

        wrap.innerHTML = applications.map(a => \`
          <div class="content-block-row" style="align-items:flex-start; cursor:default; margin-bottom:10px;">
            <div style="flex:1;">
              <div style="font-family:'Inter',sans-serif; font-size:14px; color:var(--text-primary); margin-bottom:4px;">\${escapeHtmlApp(a.learnerName)} — \${escapeHtmlApp(a.courseTitle)}</div>
              <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:8px;">Applied: \${new Date(a.submittedAt).toLocaleDateString()} at \${new Date(a.submittedAt).toLocaleTimeString()}</div>
              <div style="font-family:'Inter',sans-serif; font-size:13px; color:var(--text-primary);">\${escapeHtmlApp(a.motivation)}</div>
            </div>
            <div class="content-block-actions">
              <button data-action="approve-application" data-application-id="\${a.id}">Approve</button>
              <button data-action="reject-application" data-application-id="\${a.id}" class="delete">Reject</button>
            </div>
          </div>
        \`).join('');

        wrap.querySelectorAll('[data-action="approve-application"]').forEach(btn => {
          btn.addEventListener('click', () => {
            fetch('/api/course-applications/' + btn.dataset.applicationId + '/approve', { method: 'POST' })
              .then(r => r.json())
              .then(() => loadCourseApplications());
          });
        });

        wrap.querySelectorAll('[data-action="reject-application"]').forEach(btn => {
          btn.addEventListener('click', () => {
            fetch('/api/course-applications/' + btn.dataset.applicationId + '/reject', { method: 'POST' })
              .then(r => r.json())
              .then(() => loadCourseApplications());
          });
        });
      })
      .catch(() => {
        document.getElementById('applications-wrap').innerHTML = '<div class="empty-state">Could not reach /api/course-applications.</div>';
      });
  }

  function loadCoachingNotifications() {
    fetch('/api/coaching/notifications')
      .then(r => r.json())
      .then(data => {
        const notifications = (data.notifications || []).filter(n => !n.resolved && n.escalationTier !== 'hr');
        const wrap = document.getElementById('coaching-notifications-wrap');

        if (notifications.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No learners currently need coaching.</div>';
          return;
        }

        wrap.innerHTML = notifications.map(n => {
          const attemptRows = n.attempts.map(a => \`
            <tr>
              <td>\${a.attemptNumber}</td>
              <td>\${a.score} / \${a.maxScore}\${a.percentage != null ? ' (' + a.percentage + '%)' : ''}</td>
              <td>\${a.failedQuestionTexts.length > 0 ? a.failedQuestionTexts.map(t => escapeHtml(t)).join('; ') : '—'}</td>
              <td>\${new Date(a.submittedAt).toLocaleString()}</td>
            </tr>
          \`).join('');

          return \`
            <div class="panel" style="border-color: var(--risk);">
              <div class="panel-header">
                <div class="panel-title">\${escapeHtml(n.learnerName)}</div>
                <div class="panel-sub">\${escapeHtml(n.courseTitle)} — failed \${n.attempts.length} time\${n.attempts.length === 1 ? '' : 's'} — flagged \${new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div class="panel-body">
                <table style="margin-bottom: 16px;">
                  <thead><tr><th>Attempt</th><th>Score</th><th>Sections Failed</th><th>Date</th></tr></thead>
                  <tbody>\${attemptRows}</tbody>
                </table>

                <div style="padding: 12px; background: var(--panel-alt); border-radius: 2px; margin-bottom: 16px;">
                  <div class="stat-label" style="margin-bottom: 6px;">Book a Coaching Session</div>
                  \${n.scheduledDate ? \`<div style="font-family:'Inter',sans-serif; font-size:13px; color:\${n.scheduleStatus === 'accepted' ? 'var(--competent)' : 'var(--refresher)'}; margin-bottom:8px;">
                    \${n.scheduleStatus === 'accepted' ? 'Confirmed' : (n.proposedBy === 'learner' ? 'Learner proposed' : 'Awaiting learner response')}: \${new Date(n.scheduledDate + 'T' + n.scheduledTime).toLocaleString()}
                    \${n.proposedBy === 'facilitator' && n.scheduledByName ? ' — booked by ' + escapeHtml(n.scheduledByName) : ''}
                  </div>\` : ''}
                  \${n.scheduledDate && n.proposedBy === 'learner' && n.scheduleStatus !== 'accepted' ? \`<button class="btn accept-learner-time-btn" data-notification-id="\${n.id}" style="margin-bottom:8px;">Accept Proposed Time</button>\` : ''}
                  <div class="form-row" style="margin-bottom: 8px;">
                    <input type="date" id="book-date-\${n.id}" style="flex:1;" />
                    <input type="time" id="book-time-\${n.id}" style="flex:1;" />
                  </div>
                  <button class="btn book-coaching-btn" data-notification-id="\${n.id}" style="background:var(--panel); color:var(--text-primary); border:1px solid var(--grid-line);">\${n.scheduledDate ? 'Propose Different Time' : 'Book Session'}</button>
                  <div class="book-coaching-message-\${n.id}" style="margin-top: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px;"></div>
                </div>

                <div class="stat-label" style="margin-bottom: 6px;">Scheduling History</div>
                <div class="schedule-history-\${n.id}" style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom: 16px;">Loading&hellip;</div>

                <div class="stat-label" style="margin-bottom: 6px;">Coaching Session Date &amp; Time</div>
                <div class="form-row" style="margin-bottom: 10px;">
                  <input type="date" id="coaching-date-\${n.id}" style="flex:1;" />
                  <input type="time" id="coaching-time-\${n.id}" style="flex:1;" />
                </div>
                <div class="stat-label" style="margin-bottom: 6px;">Coaching Notes</div>
                <textarea id="coaching-notes-\${n.id}" rows="3" placeholder="What did you do to help this learner?" style="width:100%; background: var(--panel-alt); border: 1px solid var(--grid-line); color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px 12px; border-radius: 2px; margin-bottom: 10px;"></textarea>
                <button class="btn resolve-coaching-btn" data-notification-id="\${n.id}" disabled style="opacity:0.5; cursor:not-allowed;">Complete Coaching &amp; Reactivate Course</button>
                <div class="coaching-resolve-message-\${n.id}" style="margin-top: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 13px;"></div>
              </div>
            </div>
          \`;
        }).join('');

        notifications.forEach(n => {
          fetch('/api/coaching/notifications/' + n.id + '/schedule-history')
            .then(r => r.json())
            .then(data => {
              const events = data.events || [];
              const histEl = document.querySelector('.schedule-history-' + n.id);
              if (!histEl) return;
              if (events.length === 0) {
                histEl.textContent = 'No scheduling activity yet.';
                return;
              }
              histEl.innerHTML = events.map(e => {
                const who = e.actorRole === 'learner' ? escapeHtml(e.actorName) + ' (learner)' : escapeHtml(e.actorName) + ' (facilitator)';
                const verb = e.action === 'accepted' ? 'accepted' : 'proposed';
                return '<div style="margin-bottom:4px;">' + who + ' ' + verb + ' ' + new Date(e.scheduledDate + 'T' + e.scheduledTime).toLocaleString() + ' — <span style="opacity:0.7;">' + new Date(e.createdAt).toLocaleString() + '</span></div>';
              }).join('');
            })
            .catch(() => {
              const histEl = document.querySelector('.schedule-history-' + n.id);
              if (histEl) histEl.textContent = 'Could not load history.';
            });
        });

        function escapeHtml(str) {
          const div = document.createElement('div');
          div.textContent = str || '';
          return div.innerHTML;
        }

        function refreshResolveButtonState(notificationId) {
          const dateEl = document.getElementById('coaching-date-' + notificationId);
          const timeEl = document.getElementById('coaching-time-' + notificationId);
          const notesEl = document.getElementById('coaching-notes-' + notificationId);
          const btn = document.querySelector('.resolve-coaching-btn[data-notification-id="' + notificationId + '"]');
          const ready = dateEl.value && timeEl.value && notesEl.value.trim();
          btn.disabled = !ready;
          btn.style.opacity = ready ? '1' : '0.5';
          btn.style.cursor = ready ? 'pointer' : 'not-allowed';
        }

        notifications.forEach(n => {
          ['coaching-date-' + n.id, 'coaching-time-' + n.id, 'coaching-notes-' + n.id].forEach(id => {
            document.getElementById(id).addEventListener('input', () => refreshResolveButtonState(n.id));
          });
        });

        wrap.querySelectorAll('.accept-learner-time-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            btn.textContent = 'Accepting…';
            btn.disabled = true;
            fetch('/api/coaching/notifications/' + btn.dataset.notificationId + '/accept-schedule', { method: 'POST' })
              .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed to accept');
                return data;
              })
              .then(() => loadCoachingNotifications())
              .catch((err) => {
                alert(err.message);
                btn.textContent = 'Accept Proposed Time';
                btn.disabled = false;
              });
          });
        });

        wrap.querySelectorAll('.book-coaching-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const notificationId = btn.dataset.notificationId;
            const dateEl = document.getElementById('book-date-' + notificationId);
            const timeEl = document.getElementById('book-time-' + notificationId);
            const msgEl = document.querySelector('.book-coaching-message-' + notificationId);

            if (!dateEl.value || !timeEl.value) {
              msgEl.textContent = 'Please choose a date and time.';
              msgEl.style.color = 'var(--risk)';
              return;
            }

            btn.textContent = 'Booking…';
            btn.disabled = true;

            fetch('/api/coaching/notifications/' + notificationId + '/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scheduledDate: dateEl.value, scheduledTime: timeEl.value })
            })
              .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed to book session');
                return data;
              })
              .then(() => loadCoachingNotifications())
              .catch((err) => {
                msgEl.textContent = err.message;
                msgEl.style.color = 'var(--risk)';
                btn.textContent = 'Book Session';
                btn.disabled = false;
              });
          });
        });

        wrap.querySelectorAll('.resolve-coaching-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const notificationId = btn.dataset.notificationId;
            const dateEl = document.getElementById('coaching-date-' + notificationId);
            const timeEl = document.getElementById('coaching-time-' + notificationId);
            const notesEl = document.getElementById('coaching-notes-' + notificationId);
            const msgEl = document.querySelector('.coaching-resolve-message-' + notificationId);

            fetch('/api/coaching/notifications/' + notificationId + '/resolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                notes: notesEl.value.trim(),
                sessionDate: dateEl.value,
                sessionTime: timeEl.value
              })
            })
              .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.error || 'Failed to resolve');
                return data;
              })
              .then(() => {
                loadCoachingNotifications();
              })
              .catch((err) => {
                msgEl.textContent = err.message;
                msgEl.style.color = 'var(--risk)';
              });
          });
        });
      })
      .catch(() => {
        document.getElementById('coaching-notifications-wrap').innerHTML = '<div class="empty-state">Could not reach /api/coaching/notifications.</div>';
      });
  }

  // ---------- Learner Coaching (roster) ----------
  function loadCoaching() {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        const learners = (data.users || []).filter(u => u.role === 'learner');
        const wrap = document.getElementById('coaching-wrap');

        if (learners.length === 0) {
          wrap.innerHTML = '<div class="empty-state">No learners registered yet.</div>';
          return;
        }

        const rows = learners.map(l => \`
          <tr>
            <td>\${l.name}</td>
            <td>\${l.username}</td>
            <td>\${l.department || '—'}</td>
          </tr>
        \`).join('');

        wrap.innerHTML = \`
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>Department</th></tr></thead>
            <tbody>\${rows}</tbody>
          </table>
        \`;
      })
      .catch(() => {
        document.getElementById('coaching-wrap').innerHTML = '<div class="empty-state">Could not reach /api/users.</div>';
      });
  }
`;

export const courseDeliveryHtml = renderLayout({
  title: 'Course Delivery',
  activePath: '/course-delivery',
  eyebrowSuffix: 'Course Delivery Section',
  heading: 'Course Delivery',
  bodyHtml,
  scripts,
});
