/**
 * ACADEMIC HUB — Frontend Controller
 * SPA logic, API calls, UI rendering, bilingual support
 */

// ── STATE ──
const state = {
  token: localStorage.getItem('academic_token'),
  user: JSON.parse(localStorage.getItem('academic_user') || 'null'),
  lang: localStorage.getItem('academic_lang') || 'ar',
  currentView: 'dashboard',
  settings: {},
  subjects: [],
  currentSubject: null,
  currentTab: 'lectures'
};

// ── TRANSLATIONS ──
const T = {
  ar: {
    academicHub: 'الدراسة والكلية', navDashboard: 'لوحة التحكم', navSettings: 'الإعدادات',
    navAssistants: 'المساعدين', welcome: 'مرحباً', welcomeSub: 'إدارة موادك الدراسية ومتابعة إنجازك',
    collegeName: 'اسم الكلية', department: 'القسم / التخصص', academicYear: 'الفرقة / السنة الدراسية',
    sectionNumber: 'رقم السكشن', overallProgress: 'الإنجاز الكلي', subjects: 'المواد الدراسية',
    addSubject: '+ إضافة مادة', noSubjects: 'لا توجد مواد بعد. أضف مادتك الأولى!',
    tabLectures: 'المحاضرات والملفات', tabAssignments: 'الواجبات والتاسكات',
    tabResources: 'المصادر الخارجية', tabVideos: 'الفيديوهات',
    add: 'إضافة', back: 'رجوع', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', create: 'إنشاء',
    edit: 'تعديل', noItems: 'لا توجد عناصر بعد', title: 'العنوان', description: 'الوصف',
    uploadFile: 'رفع ملف', url: 'الرابط', dueDate: 'الموعد النهائي',
    materialDate: 'تاريخ المادة (Backdate)', dropFile: 'اسحب الملف هنا أو اضغط للاختيار',
    videoType: 'نوع الفيديو', subjectName: 'اسم المادة', subjectCode: 'كود المادة',
    color: 'اللون', icon: 'الأيقونة', confirmDelete: 'تأكيد الحذف',
    confirmDeleteMsg: 'هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.',
    settingsTitle: 'إعدادات الكلية والدراسة', assistantsTitle: 'إدارة حسابات المساعدين',
    createAssistant: '+ إنشاء حساب مساعد', noAssistants: 'لا يوجد حسابات مساعدين',
    username: 'اسم المستخدم', password: 'كلمة المرور', displayName: 'الاسم المعروض',
    active: 'نشط', inactive: 'معطل', logout: 'تسجيل الخروج',
    changePassword: 'تغيير كلمة المرور', currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة', pendingSync: 'محتوى في انتظار التزامن:',
    syncNow: 'تزامن المحتوى', owner: 'المالك', assistant: 'أدمن مساعد',
    synced: 'متزامن', pendingBadge: 'قيد الانتظار', overdue: 'متأخر',
    uploaded: 'تاريخ الرفع', matDate: 'تاريخ المادة', items: 'عنصر',
    savedOk: 'تم الحفظ بنجاح', deletedOk: 'تم الحذف بنجاح', syncedOk: 'تم التزامن بنجاح',
    errorOccurred: 'حدث خطأ', addLecture: 'إضافة محاضرة', addAssignment: 'إضافة واجب',
    addResource: 'إضافة مصدر', addVideo: 'إضافة فيديو',
    editLecture: 'تعديل محاضرة', editAssignment: 'تعديل واجب',
    editResource: 'تعديل مصدر', editVideo: 'تعديل فيديو',
    lectures: 'محاضرة', assignments: 'واجب', resources: 'مصدر', videos: 'فيديو'
  },
  en: {
    academicHub: 'Academic Hub', navDashboard: 'Dashboard', navSettings: 'Settings',
    navAssistants: 'Assistants', welcome: 'Welcome', welcomeSub: 'Manage your courses and track your progress',
    collegeName: 'College Name', department: 'Department', academicYear: 'Academic Year',
    sectionNumber: 'Section Number', overallProgress: 'Overall Progress', subjects: 'Subjects',
    addSubject: '+ Add Subject', noSubjects: 'No subjects yet. Add your first one!',
    tabLectures: 'Lectures & Files', tabAssignments: 'Assignments & Tasks',
    tabResources: 'External Resources', tabVideos: 'Videos',
    add: 'Add', back: 'Back', save: 'Save', cancel: 'Cancel', delete: 'Delete', create: 'Create',
    edit: 'Edit', noItems: 'No items yet', title: 'Title', description: 'Description',
    uploadFile: 'Upload File', url: 'URL', dueDate: 'Due Date',
    materialDate: 'Material Date (Backdate)', dropFile: 'Drop file here or click to select',
    videoType: 'Video Type', subjectName: 'Subject Name', subjectCode: 'Subject Code',
    color: 'Color', icon: 'Icon', confirmDelete: 'Confirm Delete',
    confirmDeleteMsg: 'Are you sure you want to delete this? This action cannot be undone.',
    settingsTitle: 'College & Academic Settings', assistantsTitle: 'Manage Assistant Accounts',
    createAssistant: '+ Create Assistant', noAssistants: 'No assistant accounts yet',
    username: 'Username', password: 'Password', displayName: 'Display Name',
    active: 'Active', inactive: 'Inactive', logout: 'Logout',
    changePassword: 'Change Password', currentPassword: 'Current Password',
    newPassword: 'New Password', pendingSync: 'Content pending sync:',
    syncNow: 'Sync Now', owner: 'Owner', assistant: 'Assistant',
    synced: 'Synced', pendingBadge: 'Pending', overdue: 'Overdue',
    uploaded: 'Uploaded', matDate: 'Material date', items: 'items',
    savedOk: 'Saved successfully', deletedOk: 'Deleted successfully', syncedOk: 'Synced successfully',
    errorOccurred: 'An error occurred', addLecture: 'Add Lecture', addAssignment: 'Add Assignment',
    addResource: 'Add Resource', addVideo: 'Add Video',
    editLecture: 'Edit Lecture', editAssignment: 'Edit Assignment',
    editResource: 'Edit Resource', editVideo: 'Edit Video',
    lectures: 'lectures', assignments: 'assignments', resources: 'resources', videos: 'videos'
  }
};

function t(key) { return (T[state.lang] && T[state.lang][key]) || key; }

// ── API HELPER ──
async function api(endpoint, options = {}) {
  const headers = { 'Authorization': 'Bearer ' + state.token };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    if (typeof options.body === 'object') options.body = JSON.stringify(options.body);
  }
  try {
    const res = await fetch('/api' + endpoint, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    if (res.status === 401) { logout(); return null; }
    return await res.json();
  } catch (err) {
    showToast(t('errorOccurred'), 'error');
    return null;
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  if (!state.token) { window.location.href = 'academic-login.html'; return; }
  setLanguage(state.lang);
  initUser();
  setupEventListeners();
});

async function initUser() {
  const data = await api('/auth/me');
  if (!data || !data.success) { logout(); return; }
  state.user = data.user;
  localStorage.setItem('academic_user', JSON.stringify(state.user));

  // Set role class on body
  document.body.classList.toggle('role-owner', state.user.role === 'owner');

  // Update UI
  const avatar = state.user.display_name ? state.user.display_name[0].toUpperCase() : 'U';
  document.getElementById('userAvatar').textContent = avatar;
  document.getElementById('userName').textContent = state.user.display_name || state.user.username;
  document.getElementById('welcomeName').textContent = state.user.display_name || state.user.username;
  document.getElementById('dropdownRole').textContent = state.user.role === 'owner' ? t('owner') : t('assistant');

  navigate('dashboard');
}

// ── LANGUAGE ──
function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem('academic_lang', lang);
  const isRtl = lang === 'ar';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (T[lang] && T[lang][key]) el.textContent = T[lang][key];
  });
}

// ── NAVIGATION ──
function navigate(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewEl = document.getElementById('view-' + view);
  if (viewEl) viewEl.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === view);
  });

  // Close mobile nav
  document.getElementById('acadNav')?.classList.remove('mobile-active');

  // Load data for view
  if (view === 'dashboard') loadDashboard();
  else if (view === 'settings') loadSettings();
  else if (view === 'assistants') loadAssistants();
}

// ── DASHBOARD ──
async function loadDashboard() {
  const [settData, subData, progData, syncData] = await Promise.all([
    api('/academic/settings'),
    api('/academic/subjects'),
    api('/academic/progress/overall'),
    api('/sync/pending')
  ]);

  if (settData?.success) {
    state.settings = settData.settings;
    document.getElementById('infoCollege').textContent = settData.settings.college_name || '—';
    document.getElementById('infoDept').textContent = settData.settings.department || '—';
    document.getElementById('infoYear').textContent = settData.settings.academic_year || '—';
    document.getElementById('infoSection').textContent = settData.settings.section_number || '—';
  }

  if (subData?.success) {
    state.subjects = subData.subjects;
    renderSubjectCards(subData.subjects);
  }

  if (progData?.success) {
    const pct = progData.progress.percentage;
    document.getElementById('overallProgressFill').style.width = pct + '%';
    document.getElementById('overallProgressText').textContent = pct + '%';
  }

  // Sync banner
  if (syncData?.success) {
    const banner = document.getElementById('syncBanner');
    if (syncData.pending.total > 0) {
      banner.style.display = 'flex';
      document.getElementById('syncCount').textContent = syncData.pending.total;
    } else {
      banner.style.display = 'none';
    }
  }
}

function renderSubjectCards(subjects) {
  const grid = document.getElementById('subjectsGrid');
  const empty = document.getElementById('emptySubjects');

  if (!subjects.length) {
    grid.innerHTML = '';
    grid.appendChild(empty);
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = subjects.map(sub => `
    <div class="subject-card" onclick="openSubject(${sub.id})">
      <div class="card-accent" style="background:${sub.color}"></div>
      <div class="card-icon">${sub.icon || '📘'}</div>
      <div class="card-name">${sub.name}</div>
      <div class="card-code">${sub.code || ''}</div>
      <div class="card-stats">
        <span>📄 ${sub.stats.lectures} ${t('lectures')}</span>
        <span>📝 ${sub.stats.assignments} ${t('assignments')}</span>
        <span>🎬 ${sub.stats.videos} ${t('videos')}</span>
      </div>
      <div class="progress-bar-mini"><div class="progress-fill" style="width:${sub.stats.percentage}%"></div></div>
      <span class="progress-text" style="font-size:0.75rem">${sub.stats.percentage}%</span>
    </div>
  `).join('');
}

// ── SUBJECT DETAIL ──
async function openSubject(id) {
  const data = await api('/academic/subjects/' + id);
  if (!data?.success) return;

  state.currentSubject = data.subject;
  state.currentTab = 'lectures';

  document.getElementById('subjectIcon').textContent = data.subject.icon || '📘';
  document.getElementById('subjectName').textContent = data.subject.name;
  document.getElementById('subjectCode').textContent = data.subject.code || '';

  const pct = data.subject.stats.percentage;
  document.getElementById('subjectProgressFill').style.width = pct + '%';
  document.getElementById('subjectProgressText').textContent = pct + '%';

  // Reset tabs
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab[data-tab="lectures"]')?.classList.add('active');

  renderMaterials('lectures');

  // Switch view
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-subject').classList.add('active');
}

function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tab}"]`)?.classList.add('active');
  renderMaterials(tab);
}

function renderMaterials(type) {
  const sub = state.currentSubject;
  if (!sub) return;

  const items = sub[type] || [];
  const list = document.getElementById('materialsList');
  const empty = document.getElementById('emptyMaterials');
  const count = document.getElementById('tabCount');

  count.textContent = items.length + ' ' + t('items');

  // Show/hide appropriate modal fields
  const isVideo = type === 'videos';
  const isAssignment = type === 'assignments';
  const isResource = type === 'resources';

  if (!items.length) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = items.map(item => {
    const isCompleted = item.completed ? 'completed' : '';
    const checkId = `check-${type}-${item.id}`;

    let metaHtml = '';
    metaHtml += `<span class="meta-badge badge-date">📅 ${t('matDate')}: ${item.material_date || '—'}</span>`;
    metaHtml += `<span class="meta-badge badge-upload">⬆ ${t('uploaded')}: ${formatDate(item.upload_timestamp)}</span>`;
    metaHtml += `<span class="meta-badge ${item.created_by === 'owner' ? 'badge-owner' : 'badge-assistant'}">${item.created_by === 'owner' ? t('owner') : t('assistant')}</span>`;
    metaHtml += `<span class="meta-badge ${item.synced ? 'badge-synced' : 'badge-pending'}">${item.synced ? t('synced') : t('pendingBadge')}</span>`;

    if (isAssignment && item.due_date) {
      const dueClass = getDueDateClass(item.due_date);
      metaHtml += `<span class="meta-badge ${dueClass}">📌 ${t('dueDate')}: ${item.due_date}</span>`;
    }

    let actionsHtml = '';
    if (type === 'lectures' && item.file_path) {
      const fname = item.file_path.split('/').pop();
      actionsHtml += `<a href="/uploads/lectures/${fname}" target="_blank" class="btn-icon" title="Download"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></a>`;
    }
    if (isAssignment && item.file_path) {
      const fname = item.file_path.split('/').pop();
      actionsHtml += `<a href="/uploads/assignments/${fname}" target="_blank" class="btn-icon" title="Download"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></a>`;
    }
    if (isResource && item.url) {
      actionsHtml += `<a href="${item.url}" target="_blank" class="btn-icon" title="Open Link"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`;
    }
    if (isVideo) {
      actionsHtml += `<button class="btn-icon" onclick="event.stopPropagation();playVideo(${item.id})" title="Play"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>`;
    }

    actionsHtml += `<button class="btn-icon" onclick="event.stopPropagation();editItem('${type}',${item.id})" title="${t('edit')}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>`;
    actionsHtml += `<button class="btn-icon btn-danger-icon" onclick="event.stopPropagation();deleteItem('${type}',${item.id})" title="${t('delete')}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`;

    return `
      <div class="material-item ${isCompleted}">
        <div class="item-check">
          <input type="checkbox" id="${checkId}" ${item.completed ? 'checked' : ''} onchange="toggleComplete('${type}',${item.id})">
          <label for="${checkId}"></label>
        </div>
        <div class="item-content">
          <div class="item-title">${item.title}</div>
          ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
          <div class="item-meta">${metaHtml}</div>
        </div>
        <div class="item-actions">${actionsHtml}</div>
      </div>
    `;
  }).join('');
}

// ── TOGGLE COMPLETE ──
async function toggleComplete(type, id) {
  const data = await api(`/materials/${type}/${id}/toggle`, { method: 'PATCH' });
  if (data?.success) {
    // Update local state
    const items = state.currentSubject[type];
    const item = items.find(i => i.id === id);
    if (item) item.completed = data.completed;

    // Recalculate progress
    const allItems = [...(state.currentSubject.lectures || []), ...(state.currentSubject.assignments || []),
                      ...(state.currentSubject.resources || []), ...(state.currentSubject.videos || [])];
    const total = allItems.length;
    const done = allItems.filter(i => i.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    document.getElementById('subjectProgressFill').style.width = pct + '%';
    document.getElementById('subjectProgressText').textContent = pct + '%';

    renderMaterials(state.currentTab);
  }
}

// ── SUBJECT CRUD ──
function editCurrentSubject() {
  const sub = state.currentSubject;
  if (!sub) return;
  document.getElementById('editSubjectId').value = sub.id;
  document.getElementById('subjectNameInput').value = sub.name;
  document.getElementById('subjectCodeInput').value = sub.code || '';
  document.getElementById('subjectColorInput').value = sub.color || '#FF6B00';
  selectEmoji(sub.icon || '📘');
  document.getElementById('subjectModalTitle').textContent = t('edit');
  openModal('subject-modal');
}

async function saveSubject() {
  const id = document.getElementById('editSubjectId').value;
  const name = document.getElementById('subjectNameInput').value.trim();
  if (!name) return;

  const selectedEmoji = document.querySelector('.emoji-option.selected');
  const body = {
    name,
    code: document.getElementById('subjectCodeInput').value.trim(),
    color: document.getElementById('subjectColorInput').value,
    icon: selectedEmoji ? selectedEmoji.dataset.emoji : '📘'
  };

  let data;
  if (id) {
    data = await api('/academic/subjects/' + id, { method: 'PUT', body });
  } else {
    data = await api('/academic/subjects', { method: 'POST', body });
  }

  if (data?.success) {
    showToast(t('savedOk'), 'success');
    closeModal('subject-modal');
    document.getElementById('editSubjectId').value = '';
    if (state.currentView === 'dashboard') loadDashboard();
    else if (id) openSubject(id);
  }
}

function deleteSubject() {
  if (!state.currentSubject) return;
  const id = state.currentSubject.id;
  confirmAction(async () => {
    const data = await api('/academic/subjects/' + id, { method: 'DELETE' });
    if (data?.success) {
      showToast(t('deletedOk'), 'success');
      navigate('dashboard');
    }
  });
}

// ── MATERIAL CRUD ──
function openAddItemModal() {
  const type = state.currentTab;
  document.getElementById('editItemId').value = '';
  document.getElementById('itemTitle').value = '';
  document.getElementById('itemDesc').value = '';
  document.getElementById('itemMaterialDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('fileName').textContent = '';

  const fileGroup = document.getElementById('fileUploadGroup');
  const urlGroup = document.getElementById('urlGroup');
  const videoTypeGroup = document.getElementById('videoTypeGroup');
  const dueDateGroup = document.getElementById('dueDateGroup');

  fileGroup.style.display = (type === 'lectures' || type === 'assignments') ? 'block' : 'none';
  urlGroup.style.display = (type === 'resources' || type === 'videos') ? 'block' : 'none';
  videoTypeGroup.style.display = type === 'videos' ? 'block' : 'none';
  dueDateGroup.style.display = type === 'assignments' ? 'block' : 'none';

  if (type === 'videos') {
    document.getElementById('videoTypeSelect').value = 'youtube';
    toggleVideoType();
  }

  const titleKey = 'add' + type.charAt(0).toUpperCase() + type.slice(1, -1);
  document.getElementById('materialModalTitle').textContent = t(titleKey) || t('add');

  openModal('material-modal');
}

function editItem(type, id) {
  const items = state.currentSubject[type];
  const item = items.find(i => i.id === id);
  if (!item) return;

  document.getElementById('editItemId').value = id;
  document.getElementById('itemTitle').value = item.title;
  document.getElementById('itemDesc').value = item.description || '';
  document.getElementById('itemMaterialDate').value = item.material_date || '';
  document.getElementById('fileName').textContent = item.file_name || '';

  const fileGroup = document.getElementById('fileUploadGroup');
  const urlGroup = document.getElementById('urlGroup');
  const videoTypeGroup = document.getElementById('videoTypeGroup');
  const dueDateGroup = document.getElementById('dueDateGroup');

  fileGroup.style.display = (type === 'lectures' || type === 'assignments') ? 'block' : 'none';
  urlGroup.style.display = (type === 'resources' || type === 'videos') ? 'block' : 'none';
  videoTypeGroup.style.display = type === 'videos' ? 'block' : 'none';
  dueDateGroup.style.display = type === 'assignments' ? 'block' : 'none';

  if (type === 'resources') document.getElementById('itemUrl').value = item.url || '';
  if (type === 'videos') {
    document.getElementById('videoTypeSelect').value = item.video_type || 'youtube';
    document.getElementById('itemUrl').value = item.video_url || '';
    toggleVideoType();
  }
  if (type === 'assignments') document.getElementById('itemDueDate').value = item.due_date || '';

  const titleKey = 'edit' + type.charAt(0).toUpperCase() + type.slice(1, -1);
  document.getElementById('materialModalTitle').textContent = t(titleKey) || t('edit');

  // Temporarily switch tab so saveMaterial knows the type
  state.currentTab = type;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${type}"]`)?.classList.add('active');

  openModal('material-modal');
}

async function saveMaterial() {
  const type = state.currentTab;
  const id = document.getElementById('editItemId').value;
  const title = document.getElementById('itemTitle').value.trim();
  if (!title) return;

  const subjectId = state.currentSubject.id;
  const isEdit = !!id;

  if (type === 'resources') {
    const body = {
      title,
      description: document.getElementById('itemDesc').value,
      url: document.getElementById('itemUrl').value,
      resource_type: 'link',
      material_date: document.getElementById('itemMaterialDate').value
    };
    const data = isEdit
      ? await api('/materials/resources/' + id, { method: 'PUT', body })
      : await api('/materials/subjects/' + subjectId + '/resources', { method: 'POST', body });

    if (data?.success) afterSaveMaterial();
    return;
  }

  if (type === 'videos') {
    const videoType = document.getElementById('videoTypeSelect').value;
    const fileInput = document.getElementById('itemFile');

    if (videoType === 'upload' && fileInput.files[0] && !isEdit) {
      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      fd.append('title', title);
      fd.append('description', document.getElementById('itemDesc').value);
      fd.append('video_type', 'upload');
      fd.append('material_date', document.getElementById('itemMaterialDate').value);
      const data = await api('/materials/subjects/' + subjectId + '/videos', { method: 'POST', body: fd });
      if (data?.success) afterSaveMaterial();
    } else {
      const body = {
        title,
        description: document.getElementById('itemDesc').value,
        video_url: document.getElementById('itemUrl').value,
        video_type: videoType,
        material_date: document.getElementById('itemMaterialDate').value
      };
      const data = isEdit
        ? await api('/materials/videos/' + id, { method: 'PUT', body })
        : await api('/materials/subjects/' + subjectId + '/videos', { method: 'POST', body });
      if (data?.success) afterSaveMaterial();
    }
    return;
  }

  // Lectures & Assignments (file upload)
  if (isEdit) {
    const body = {
      title,
      description: document.getElementById('itemDesc').value,
      material_date: document.getElementById('itemMaterialDate').value
    };
    if (type === 'assignments') body.due_date = document.getElementById('itemDueDate').value;
    const data = await api(`/materials/${type}/${id}`, { method: 'PUT', body });
    if (data?.success) afterSaveMaterial();
  } else {
    const fd = new FormData();
    const fileInput = document.getElementById('itemFile');
    if (fileInput.files[0]) fd.append('file', fileInput.files[0]);
    fd.append('title', title);
    fd.append('description', document.getElementById('itemDesc').value);
    fd.append('material_date', document.getElementById('itemMaterialDate').value);
    if (type === 'assignments') fd.append('due_date', document.getElementById('itemDueDate').value);
    const data = await api(`/materials/subjects/${subjectId}/${type}`, { method: 'POST', body: fd });
    if (data?.success) afterSaveMaterial();
  }
}

async function afterSaveMaterial() {
  showToast(t('savedOk'), 'success');
  closeModal('material-modal');
  // Refresh subject data
  await openSubject(state.currentSubject.id);
  switchTab(state.currentTab);
}

function deleteItem(type, id) {
  confirmAction(async () => {
    const data = await api(`/materials/${type}/${id}`, { method: 'DELETE' });
    if (data?.success) {
      showToast(t('deletedOk'), 'success');
      await openSubject(state.currentSubject.id);
      switchTab(state.currentTab);
    }
  });
}

// ── VIDEO PLAYER ──
function playVideo(id) {
  const video = (state.currentSubject.videos || []).find(v => v.id === id);
  if (!video) return;

  const container = document.getElementById('videoContainer');
  document.getElementById('videoPlayerTitle').textContent = video.title;

  if (video.video_type === 'youtube') {
    const ytId = extractYouTubeId(video.video_url);
    container.innerHTML = ytId
      ? `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
      : `<p style="color:var(--text-muted);text-align:center;padding:40px">Invalid YouTube URL</p>`;
  } else if (video.video_type === 'upload' && video.file_path) {
    const fname = video.file_path.split('/').pop();
    container.innerHTML = `<video controls autoplay src="/uploads/videos/${fname}"></video>`;
  } else if (video.video_url) {
    container.innerHTML = `<iframe src="${video.video_url}" allowfullscreen></iframe>`;
  }

  openModal('video-modal');
}

function closeVideoModal() {
  document.getElementById('videoContainer').innerHTML = '';
  closeModal('video-modal');
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function toggleVideoType() {
  const vt = document.getElementById('videoTypeSelect').value;
  const fileGroup = document.getElementById('fileUploadGroup');
  const urlGroup = document.getElementById('urlGroup');
  fileGroup.style.display = vt === 'upload' ? 'block' : 'none';
  urlGroup.style.display = vt !== 'upload' ? 'block' : 'none';
}

// ── SYNC ──
async function syncContent() {
  const data = await api('/sync/sync', { method: 'POST' });
  if (data?.success) {
    showToast(t('syncedOk') + ` (${data.items_synced} ${t('items')})`, 'success');
    loadDashboard();
  }
}

// ── SETTINGS ──
async function loadSettings() {
  const data = await api('/academic/settings');
  if (data?.success) {
    document.getElementById('settCollege').value = data.settings.college_name || '';
    document.getElementById('settDept').value = data.settings.department || '';
    document.getElementById('settYear').value = data.settings.academic_year || '';
    document.getElementById('settSection').value = data.settings.section_number || '';
  }
}

async function saveSettings() {
  const body = {
    college_name: document.getElementById('settCollege').value,
    department: document.getElementById('settDept').value,
    academic_year: document.getElementById('settYear').value,
    section_number: document.getElementById('settSection').value
  };
  const data = await api('/academic/settings', { method: 'PUT', body });
  if (data?.success) showToast(t('savedOk'), 'success');
}

// ── ASSISTANTS ──
async function loadAssistants() {
  const data = await api('/auth/assistants');
  if (!data?.success) return;

  const list = document.getElementById('assistantsList');
  const empty = document.getElementById('emptyAssistants');

  if (!data.assistants.length) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = data.assistants.map(a => `
    <div class="assistant-card">
      <div class="assistant-info">
        <div class="assistant-avatar">${(a.display_name || a.username)[0].toUpperCase()}</div>
        <div>
          <div class="assistant-name">${a.display_name || a.username}</div>
          <div class="assistant-username">@${a.username}</div>
        </div>
      </div>
      <div class="assistant-actions">
        <span class="status-badge ${a.active ? 'status-active' : 'status-inactive'}">${a.active ? t('active') : t('inactive')}</span>
        <div class="toggle-switch">
          <input type="checkbox" id="toggle-${a.id}" ${a.active ? 'checked' : ''} onchange="toggleAssistant(${a.id}, this.checked)">
          <label for="toggle-${a.id}"></label>
        </div>
        <button class="btn-icon btn-danger-icon" onclick="deleteAssistant(${a.id})" title="${t('delete')}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

async function createAssistant() {
  const username = document.getElementById('asstUsername').value.trim();
  const password = document.getElementById('asstPassword').value;
  const display_name = document.getElementById('asstDisplayName').value.trim();
  if (!username || !password) return;

  const data = await api('/auth/assistant', { method: 'POST', body: { username, password, display_name } });
  if (data?.success) {
    showToast(t('savedOk'), 'success');
    closeModal('assistant-modal');
    document.getElementById('asstUsername').value = '';
    document.getElementById('asstPassword').value = '';
    document.getElementById('asstDisplayName').value = '';
    loadAssistants();
  } else if (data?.error) {
    showToast(data.error, 'error');
  }
}

async function toggleAssistant(id, active) {
  await api('/auth/assistant/' + id, { method: 'PUT', body: { active } });
  loadAssistants();
}

function deleteAssistant(id) {
  confirmAction(async () => {
    const data = await api('/auth/assistant/' + id, { method: 'DELETE' });
    if (data?.success) {
      showToast(t('deletedOk'), 'success');
      loadAssistants();
    }
  });
}

// ── CHANGE PASSWORD ──
async function changePassword() {
  const current = document.getElementById('pwCurrent').value;
  const newPw = document.getElementById('pwNew').value;
  if (!current || !newPw) return;

  const data = await api('/auth/change-password', { method: 'PUT', body: { current_password: current, new_password: newPw } });
  if (data?.success) {
    showToast(t('savedOk'), 'success');
    document.getElementById('pwCurrent').value = '';
    document.getElementById('pwNew').value = '';
  } else if (data?.error) {
    showToast(data.error, 'error');
  }
}

// ── MODALS ──
function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

function confirmAction(callback) {
  openModal('confirm-modal');
  const btn = document.getElementById('confirmDeleteBtn');
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => { closeModal('confirm-modal'); callback(); });
}

// ── EMOJI PICKER ──
function selectEmoji(emoji) {
  document.querySelectorAll('.emoji-option').forEach(e => e.classList.toggle('selected', e.dataset.emoji === emoji));
}

// ── UTILITIES ──
function formatDate(d) {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString(state.lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return d; }
}

function getDueDateClass(dueDate) {
  const now = new Date(); now.setHours(0,0,0,0);
  const due = new Date(dueDate); due.setHours(0,0,0,0);
  const diff = (due - now) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'badge-overdue';
  if (diff <= 3) return 'badge-due-soon';
  return 'badge-date';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function logout() {
  localStorage.removeItem('academic_token');
  localStorage.removeItem('academic_user');
  window.location.href = 'academic-login.html';
}

// ── EVENT LISTENERS ──
function setupEventListeners() {
  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => { e.preventDefault(); navigate(item.dataset.view); });
  });

  // Language toggle
  document.getElementById('langToggle')?.addEventListener('click', () => {
    setLanguage(state.lang === 'ar' ? 'en' : 'ar');
    // Refresh current view text
    if (state.currentView === 'dashboard') loadDashboard();
  });

  // User menu dropdown
  document.getElementById('userBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('userDropdown')?.classList.toggle('active');
  });
  document.addEventListener('click', () => {
    document.getElementById('userDropdown')?.classList.remove('active');
  });

  // Mobile menu
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('acadNav')?.classList.toggle('mobile-active');
  });

  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
      document.getElementById('videoContainer').innerHTML = '';
    }
  });

  // Emoji picker
  document.querySelectorAll('.emoji-option').forEach(opt => {
    opt.addEventListener('click', () => selectEmoji(opt.dataset.emoji));
  });

  // File input display
  document.getElementById('itemFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    document.getElementById('fileName').textContent = file ? file.name : '';
  });

  // Video type toggle
  document.getElementById('videoTypeSelect')?.addEventListener('change', toggleVideoType);

  // Scroll header effect
  window.addEventListener('scroll', () => {
    document.getElementById('acadNavbar')?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}
