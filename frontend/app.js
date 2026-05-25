/* ============================================================
   Employee Dashboard — Frontend Logic (fetch-based)
   ============================================================ */

'use strict';

const API = '/api';

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function showToast(msg, type = 'success') {
  const container = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast--show'));
  setTimeout(() => {
    t.classList.remove('toast--show');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
  }, 2500);
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Something went wrong');
  }
  return res.status === 204 ? null : res.json();
}

const api = {
  list:   ()          => apiFetch('/employees'),
  get:    (id)        => apiFetch(`/employees/${encodeURIComponent(id)}`),
  create: (data)      => apiFetch('/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data)  => apiFetch(`/employees/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id)        => apiFetch(`/employees/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  stats:  ()          => apiFetch('/stats'),
};

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const $tbody      = document.getElementById('emp-tbody');
const $empty      = document.getElementById('empty-state');
const $formOver   = document.getElementById('form-overlay');
const $delOver    = document.getElementById('del-overlay');
const $form       = document.getElementById('emp-form');
const $fId        = document.getElementById('f-id');
const $modalTitle = document.getElementById('modal-title');
const $delName    = document.getElementById('del-name');

let pendingDeleteId = null;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

async function loadAll() {
  await Promise.all([loadStats(), loadTable()]);
}

async function loadStats() {
  try {
    const s = await api.stats();
    document.getElementById('val-total').textContent   = s.total;
    document.getElementById('val-active').textContent  = s.active;
    document.getElementById('val-inactive').textContent = s.inactive;
    document.getElementById('val-dept').textContent    = s.departments;
  } catch {
    // Stats are non-critical; silently ignore
  }
}

async function loadTable() {
  try {
    const employees = await api.list();
    $tbody.replaceChildren();

    if (employees.length === 0) {
      $empty.style.display = 'block';
      return;
    }
    $empty.style.display = 'none';

    employees.forEach((emp) => {
      const tr = document.createElement('tr');

      // Name
      const tdName = document.createElement('td');
      const nameWrap = document.createElement('div');
      nameWrap.className = 'name-cell';
      const av = document.createElement('div');
      av.className = 'avatar';
      av.textContent = initials(emp.name);
      const nameSpan = document.createElement('span');
      nameSpan.textContent = emp.name;
      nameWrap.appendChild(av);
      nameWrap.appendChild(nameSpan);
      tdName.appendChild(nameWrap);
      tr.appendChild(tdName);

      // Email
      appendTd(tr, emp.email);
      // Phone
      appendTd(tr, emp.phone || '—');
      // Department
      appendTd(tr, emp.department);
      // Designation
      appendTd(tr, emp.designation);
      // Joined
      appendTd(tr, fmtDate(emp.joined_date));

      // Status
      const tdSt = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge badge--${emp.status.toLowerCase()}`;
      badge.textContent = emp.status;
      tdSt.appendChild(badge);
      tr.appendChild(tdSt);

      // Actions
      const tdAct = document.createElement('td');
      const acts = document.createElement('div');
      acts.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn--ghost btn--sm';
      editBtn.textContent = '✏️';
      editBtn.setAttribute('aria-label', 'Edit');
      editBtn.setAttribute('title', 'Edit');
      editBtn.addEventListener('click', () => openForm(emp.id));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn--ghost btn--sm';
      delBtn.textContent = '🗑️';
      delBtn.setAttribute('aria-label', 'Delete');
      delBtn.setAttribute('title', 'Delete');
      delBtn.addEventListener('click', () => openDelete(emp));

      acts.appendChild(editBtn);
      acts.appendChild(delBtn);
      tdAct.appendChild(acts);
      tr.appendChild(tdAct);

      $tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load employees', 'error');
  }
}

function appendTd(tr, text) {
  const td = document.createElement('td');
  td.textContent = text;
  tr.appendChild(td);
}

// ---------------------------------------------------------------------------
// Form modal
// ---------------------------------------------------------------------------

function openForm(editId = null) {
  clearErrors();
  $form.reset();
  $fId.value = '';

  if (editId) {
    $modalTitle.textContent = 'Edit Employee';
    api.get(editId).then((emp) => {
      $fId.value = emp.id;
      document.getElementById('f-name').value   = emp.name;
      document.getElementById('f-email').value  = emp.email;
      document.getElementById('f-phone').value  = emp.phone || '';
      document.getElementById('f-dept').value   = emp.department;
      document.getElementById('f-desig').value  = emp.designation;
      document.getElementById('f-joined').value = emp.joined_date;
      document.getElementById('f-status').value = emp.status;
    }).catch(() => showToast('Could not load employee', 'error'));
  } else {
    $modalTitle.textContent = 'Add Employee';
  }

  $formOver.classList.add('overlay--open');
  document.getElementById('f-name').focus();
}

function closeForm() {
  $formOver.classList.remove('overlay--open');
}

async function handleSave() {
  if (!validate()) return;

  const data = {
    name:        document.getElementById('f-name').value.trim(),
    email:       document.getElementById('f-email').value.trim(),
    phone:       document.getElementById('f-phone').value.trim(),
    department:  document.getElementById('f-dept').value,
    designation: document.getElementById('f-desig').value.trim(),
    joined_date: document.getElementById('f-joined').value,
    status:      document.getElementById('f-status').value,
  };

  const editId = $fId.value;

  try {
    if (editId) {
      await api.update(editId, data);
      showToast('Employee updated');
    } else {
      await api.create(data);
      showToast('Employee added');
    }
    closeForm();
    await loadAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------------------------------------------------------------------------
// Delete modal
// ---------------------------------------------------------------------------

function openDelete(emp) {
  pendingDeleteId = emp.id;
  $delName.textContent = emp.name;
  $delOver.classList.add('overlay--open');
}

function closeDelete() {
  $delOver.classList.remove('overlay--open');
  pendingDeleteId = null;
}

async function handleDelete() {
  if (!pendingDeleteId) return;
  try {
    await api.remove(pendingDeleteId);
    showToast('Employee deleted', 'error');
    closeDelete();
    await loadAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate() {
  let ok = true;
  clearErrors();

  const name  = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const dept  = document.getElementById('f-dept').value;
  const desig = document.getElementById('f-desig').value.trim();
  const joined = document.getElementById('f-joined').value;

  if (!name)  { setErr('err-name', 'Required'); ok = false; }
  if (!email) { setErr('err-email', 'Required'); ok = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('err-email', 'Invalid email'); ok = false; }
  if (!dept)  { setErr('err-dept', 'Required'); ok = false; }
  if (!desig) { setErr('err-desig', 'Required'); ok = false; }
  if (!joined){ setErr('err-joined', 'Required'); ok = false; }

  return ok;
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  $form.querySelectorAll('.field__err').forEach((el) => (el.textContent = ''));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

document.getElementById('btn-add').addEventListener('click', () => openForm());

document.getElementById('modal-x').addEventListener('click', closeForm);
document.getElementById('modal-cancel').addEventListener('click', closeForm);
$formOver.addEventListener('click', (e) => { if (e.target === $formOver) closeForm(); });

document.getElementById('modal-save').addEventListener('click', handleSave);

document.getElementById('del-x').addEventListener('click', closeDelete);
document.getElementById('del-cancel').addEventListener('click', closeDelete);
$delOver.addEventListener('click', (e) => { if (e.target === $delOver) closeDelete(); });

document.getElementById('del-confirm').addEventListener('click', handleDelete);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if ($delOver.classList.contains('overlay--open')) closeDelete();
    else if ($formOver.classList.contains('overlay--open')) closeForm();
  }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

loadAll();
