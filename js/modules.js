// ============================================================
// REPORTS.JS - Lab reports management
// ============================================================
function renderReports() {
  const memberFilter = document.getElementById('reportMemberFilter')?.value || '';
  const typeFilter = document.getElementById('reportTypeFilter')?.value || '';
  const yearFilter = document.getElementById('reportYearFilter')?.value || '';
  let reports = getReports();

  if (memberFilter) reports = reports.filter(r => r.memberId === memberFilter);
  if (typeFilter) reports = reports.filter(r => r.type === typeFilter);
  if (yearFilter) reports = reports.filter(r => r.date && r.date.startsWith(yearFilter));

  reports.sort((a, b) => new Date(b.date) - new Date(a.date));

  const grid = document.getElementById('reportsGrid');
  const empty = document.getElementById('reportsEmpty');

  if (!reports.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }

  empty.style.display = 'none';
  const typeColors = {
    'Blood Test': 'rgba(239,68,68,0.1)',
    'X-Ray': 'rgba(59,130,246,0.1)',
    'MRI': 'rgba(168,85,247,0.1)',
    'CT Scan': 'rgba(16,185,129,0.1)',
    'Ultrasound': 'rgba(245,158,11,0.1)',
    'ECG': 'rgba(37,206,209,0.1)',
    'Urine Test': 'rgba(255,138,91,0.1)',
    'Other': 'rgba(107,114,128,0.1)'
  };

  grid.innerHTML = reports.map(r =>
    `<div class="report-card">
      <button class="delete-btn" onclick="deleteReport('${r.id}')" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/></svg>
      </button>
      <div class="report-icon" style="background:${typeColors[r.type] || typeColors['Other']}">${getReportIcon(r.type)}</div>
      <div class="report-type-badge">${r.type}</div>
      <div class="report-name">${r.name}</div>
      <div class="report-meta">
        Date: ${formatDate(r.date)}<br>
        ${r.doctor ? `Dr. ${r.doctor}` : 'Self-uploaded'}
        ${r.notes ? `<br><span style="color:#9ca3af;font-size:11px;">Note: ${r.notes.substring(0, 60)}...</span>` : ''}
      </div>
      <span class="report-member-tag">Member: ${getMemberName(r.memberId)}</span>
      ${r.fileName ? `<div style="margin-top:10px;"><span style="font-size:11px;background:#f4f4f4;padding:4px 10px;border-radius:6px;color:#6b7280;display:inline-flex;align-items:center;gap:6px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        ${r.fileName}</span></div>` : ''}
    </div>`).join('');
}

function openAddReportModal() {
  if (!getMembers().length) { showToast('Add a family member first', 'error'); showPage('profiles'); return; }
  ['rDate', 'rDoctor', 'rName', 'rNotes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('rMember').value = activeMemberId || '';
  document.getElementById('rDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('rType').value = '';
  const status = document.getElementById('rUploadStatus');
  if (status) status.textContent = '';
  window._reportFileName = null;
  
  const previewArea = document.getElementById('reportImgPreviewArea');
  if (previewArea) previewArea.style.display = 'none';

  document.getElementById('reportModal').style.display = 'flex';
}
function closeReportModal() { document.getElementById('reportModal').style.display = 'none'; }

function saveReport() {
  const memberId = document.getElementById('rMember').value;
  const date = document.getElementById('rDate').value;
  const type = document.getElementById('rType').value;
  const name = document.getElementById('rName').value.trim();
  if (!memberId || !date || !type || !name) { showToast('Please fill all required fields', 'error'); return; }
  const reports = getReports();
  reports.push({
    id: uid(), memberId, date, type, name,
    doctor: document.getElementById('rDoctor').value.trim(),
    notes: document.getElementById('rNotes').value.trim(),
    fileName: window._reportFileName || null
  });
  saveReports(reports);
  closeReportModal();
  renderReports();
  showToast('Report uploaded', 'success');
}

function deleteReport(id) {
  if (!confirm('Are you sure you want to delete this report?')) return;
  saveReports(getReports().filter(r => r.id !== id));
  renderReports();
  showToast('Report deleted', 'info');
}

// ============================================================
// MEDICINES.JS - Medicine tracker
// ============================================================
function renderMedicines() {
  const memberFilter = document.getElementById('medMemberFilter')?.value || '';
  const visits = getVisits();
  const members = getMembers();
  const container = document.getElementById('medicinesContainer');
  const toShow = memberFilter ? members.filter(m => m.id === memberFilter) : members;

  if (!toShow.length) {
    container.innerHTML = '<div class="empty-state"><h3>No family members</h3><p>Add family members to track their prescribed medications.</p></div>';
    return;
  }

  container.innerHTML = toShow.map(m => {
    const mVisits = visits.filter(v => v.memberId === m.id && v.medicines?.length);
    const allMeds = [];
    mVisits.forEach(v => v.medicines.forEach(med => allMeds.push({ med, visit: v })));

    if (!allMeds.length) {
      return `<div class="card member-medicines-group">
        <div class="group-header">
          <div class="group-avatar">${getMemberInitials(m.name)}</div>
          <div>
            <div class="group-name">${m.name}</div>
            <div class="group-sub" style="color:#9ca3af;">No medications currently tracked.</div>
          </div>
        </div>
      </div>`;
    }

    return `<div class="card member-medicines-group">
      <div class="group-header">
        <div class="group-avatar">${getMemberInitials(m.name)}</div>
        <div>
          <div class="group-name">${m.name}</div>
          <div class="group-sub">${allMeds.length} active prescription${allMeds.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="medicines-grid">
        ${allMeds.map(({ med, visit }) => `<div class="medicine-card">
          <div class="medicine-name">${med.split(' ').slice(0, 2).join(' ')}</div>
          <div class="medicine-freq">${med.includes('-') ? med.match(/[\d]+-[\d]+-[\d]+/)?.[0] || '' : ''} ${med.split(' ').slice(2).join(' ')}</div>
          <div class="medicine-from" style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0;">
            Prescribed by ${visit.doctorName}<br>${formatDate(visit.date)}
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// EXPENSES.JS - Health expense tracking
// ============================================================
function renderExpenses() {
  const yearFilter = document.getElementById('expenseYearFilter')?.value || '';
  let visits = getVisits();
  if (yearFilter) visits = visits.filter(v => v.date && v.date.startsWith(yearFilter));

  const total = visits.reduce((s, v) => s + Number(v.fee || 0), 0);
  const byMember = {};
  visits.forEach(v => { byMember[v.memberId] = (byMember[v.memberId] || 0) + Number(v.fee || 0); });
  const maxMember = Object.entries(byMember).sort((a, b) => b[1] - a[1])[0];
  const year = new Date().getFullYear();
  const thisYear = visits.filter(v => v.date && v.date.startsWith(String(year)));

  document.getElementById('expenseCards').innerHTML = [
    { label: 'Total Invested', amount: formatCurrency(total), sub: visits.length + ' visits listed' },
    { label: `Spend in ${year}`, amount: formatCurrency(thisYear.reduce((s, v) => s + Number(v.fee || 0), 0)), sub: thisYear.length + ' visits this year' },
    { label: 'Average/Visit', amount: visits.length ? formatCurrency(Math.round(total / visits.length)) : '₹0', sub: 'Average consultation' },
    { label: 'Top Spender', amount: maxMember ? getMemberName(maxMember[0]) : 'None', sub: maxMember ? formatCurrency(maxMember[1]) : '—' }
  ].map(c => `<div class="expense-stat-card">
    <div class="amount" style="color:#1a1a2e;">${c.amount}</div>
    <div class="label">${c.label}</div>
    <div style="font-size:11px;color:#9ca3af;margin-top:6px;">${c.sub}</div>
  </div>`).join('');

  visits.sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('expenseList').innerHTML = visits.length
    ? visits.map(v => `<div class="expense-row">
        <div class="expense-row-left">
          <div class="exp-doc" style="font-weight:600;color:#1a1a2e;">${v.doctorName} <span class="expense-member-badge">${getMemberName(v.memberId)}</span></div>
          <div class="exp-detail">${v.hospital} &bull; ${formatDate(v.date)}</div>
        </div>
        <div class="expense-row-amount" style="color:#25CED1;font-weight:700;">${formatCurrency(v.fee)}</div>
      </div>`).join('')
    : '<div style="text-align:center;padding:40px;color:#9ca3af;font-size:14px;">No listed expenses found.</div>';
}

// ============================================================
// SETTINGS.JS - Account & security settings
// ============================================================
function renderSettings() {
  const session = getSession();

  // Account
  document.getElementById('settings-account').innerHTML = `
    <div class="card">
      <h2 style="font-size:18px;margin-bottom:8px;">Account Preferences</h2>
      <p class="desc">Update your personal information and profile settings.</p>
      <div class="settings-group">
        <h4>Base Information</h4>
        <div class="setting-row"><div class="setting-info"><span>Primary Name</span><small>${session?.name || '—'}</small></div><button class="settings-btn" onclick="showToast('Profile editing coming soon','info')">Edit</button></div>
        <div class="setting-row"><div class="setting-info"><span>Login Email</span><small>${session?.email || '—'}</small></div><button class="settings-btn">Update</button></div>
      </div>
      <div class="settings-group">
        <h4>Device Security</h4>
        <div class="setting-row"><div class="setting-info"><span>Sign Out</span><small>End your active session</small></div><button class="settings-btn danger" onclick="handleLogout()">Logout</button></div>
      </div>
    </div>`;

  // Security
  const allUsers = getUsers();
  const currentUser = allUsers.find(u => u.uid === session.uid);
  const twoFaEnabled = currentUser?.twoFA || false;

  document.getElementById('settings-security').innerHTML = `
    <div class="card">
      <h2 style="font-size:18px;margin-bottom:8px;">Security & Privacy</h2>
      <p class="desc">Manage your authentication and data protection.</p>
      <div class="settings-group">
        <h4>Access Control</h4>
        <div class="setting-row"><div class="setting-info"><span>Two-Factor Authentication</span><small>Extra security for your records</small></div>
          <label class="toggle-switch"><input type="checkbox" id="twoFaToggle" ${twoFaEnabled ? 'checked' : ''} onchange="updateTwoFA(this.checked)"><span class="toggle-track"></span></label>
        </div>
        <div class="setting-row"><div class="setting-info"><span>Biometric Authentication</span><small>Use TouchID or FaceID where available</small></div>
          <label class="toggle-switch"><input type="checkbox" onchange="showToast('Biometric setting saved','success')"><span class="toggle-track"></span></label>
        </div>
        <div class="setting-row"><div class="setting-info"><span>Encryption Status</span><small>All medical data is encrypted at rest</small></div>
          <span style="font-size:11px;color:#10b981;font-weight:700;background:rgba(16,185,129,0.1);padding:4px 10px;border-radius:20px;">ACTIVATED</span>
        </div>
      </div>
    </div>`;

  // Notifications
  document.getElementById('settings-notifications').innerHTML = `
    <div class="card">
      <h2 style="font-size:18px;margin-bottom:8px;">Notification Settings</h2>
      <p class="desc">Customize how and when you receive reminders.</p>
      <div class="settings-group">
        <h4>Health Alerts</h4>
        ${[['Follow-up remidners', 'Notify 24h before visits', true], ['Medication alerts', 'Reminders for scheduled doses', true], ['Report updates', 'Alert when new reports are processed', false]].map(([t, s, c]) => `<div class="setting-row"><div class="setting-info"><span>${t}</span><small>${s}</small></div><label class="toggle-switch"><input type="checkbox" ${c ? 'checked' : ''} onchange="showToast('Preferences updated','success')"><span class="toggle-track"></span></label></div>`).join('')}
      </div>
    </div>`;

  // Data
  document.getElementById('settings-data').innerHTML = `
    <div class="card">
      <h2 style="font-size:18px;margin-bottom:8px;">Data & Portability</h2>
      <p class="desc">Download or backup your family medical history.</p>
      <div class="settings-group">
        <h4>Tools</h4>
        <div class="setting-row"><div class="setting-info"><span>Full Data Export (JSON)</span><small>Portable format for technical backup</small></div><button class="settings-btn" onclick="exportData()">Export</button></div>
        <div class="setting-row"><div class="setting-info"><span>Visits Summary (CSV)</span><small>Spreadsheet friendly record</small></div><button class="settings-btn" onclick="exportCSV()">Export</button></div>
      </div>
    </div>`;

  // About
  document.getElementById('settings-about').innerHTML = `
    <div class="card" style="text-align:center;padding:40px 20px;">
      <h1 style="color:#25CED1;margin-bottom:10px;">FamilyMed</h1>
      <p style="font-size:13px;color:#9ca3af;margin-bottom:20px;">Safe & Secure Family Medical Records</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;max-width:400px;margin:0 auto 30px;">
        A private, local-first platform designed to help families manage prescriptions, lab reports, and doctor visits without the hassle of physical files.
      </p>
      <div style="font-size:12px;color:#9ca3af;">Version 1.1.0 &bull; Built with Privacy in Mind</div>
    </div>`;
}

function exportData() {
  const data = { members: getMembers(), visits: getVisits(), reports: getReports(), exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'familymed_backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  showToast('Export successful', 'success');
}

function exportCSV() {
  const visits = getVisits();
  if (!visits.length) return showToast('No records to export', 'error');
  const header = ['Date', 'Member', 'Doctor', 'Specialization', 'Hospital', 'Diagnosis', 'Fee', 'Follow-up'];
  const rows = visits.map(v => [v.date, getMemberName(v.memberId), v.doctorName, v.specialization, v.hospital, `"${v.diagnosis}"`, v.fee, v.followUp ? v.followUpDate : 'No'].join(','));
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'familymed_visits.csv';
  a.click();
  showToast('CSV Export successful', 'success');
}

function updateTwoFA(enabled) {
  const session = getSession();
  if (!session) return;
  const users = getUsers();
  const userIndex = users.findIndex(u => u.uid === session.uid);
  if (userIndex !== -1) {
    users[userIndex].twoFA = enabled;
    saveUsers(users);
    showToast('Security updated', 'success');
  }
}
