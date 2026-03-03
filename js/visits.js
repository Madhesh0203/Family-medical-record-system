// ============================================================
// VISITS.JS - Doctor visits, prescriptions
// ============================================================

function renderVisits() {
  const memberFilter = document.getElementById('visitMemberFilter')?.value || '';
  const specFilter = document.getElementById('visitSpecFilter')?.value || '';
  const monthFilter = document.getElementById('visitMonthFilter')?.value || '';
  let visits = getVisits();

  if (memberFilter) visits = visits.filter(v => v.memberId === memberFilter);
  if (specFilter) visits = visits.filter(v => v.specialization === specFilter);
  if (monthFilter) {
    // filter by YYYY-MM
    visits = visits.filter(v => v.date && v.date.startsWith(monthFilter));
  }

  visits.sort((a, b) => new Date(b.date) - new Date(a.date));

  const list = document.getElementById('visitsList');
  const empty = document.getElementById('visitsEmpty');

  if (!visits.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = visits.map(v => {
    const d = new Date(v.date);
    const day = d.toLocaleDateString('en-IN', { day: '2-digit' });
    const mon = d.toLocaleDateString('en-IN', { month: 'short' });
    const yr = d.getFullYear();

    return `<div class="visit-card" onclick="showVisitDetail('${v.id}')">
      <div class="visit-date-col">
        <div class="day">${day}</div>
        <div class="month">${mon}</div>
        <div class="year">${yr}</div>
      </div>
      <div class="visit-divider"></div>
      <div class="visit-info">
        <div class="visit-header">
          <div class="visit-doctor">${getSpecIcon(v.specialization)} ${v.doctorName}</div>
          <span class="visit-spec-badge">${v.specialization}</span>
        </div>
        <div class="visit-hospital">Hospital: ${v.hospital}</div>
        <div class="visit-diagnosis">${v.diagnosis ? v.diagnosis.substring(0, 120) + (v.diagnosis.length > 120 ? '...' : '') : 'No diagnosis recorded'}</div>
        <div class="visit-footer">
          <span class="visit-member-tag">Member: ${getMemberName(v.memberId)}</span>
          ${v.followUp ? `<span class="visit-followup-tag">Follow-up: ${formatDate(v.followUpDate)}</span>` : ''}
          ${v.medicines?.length ? `<span class="visit-spec-badge" style="background:rgba(168,85,247,0.1);color:#7c3aed">Meds: ${v.medicines.length}</span>` : ''}
          ${v.fee ? `<span class="visit-fee">${formatCurrency(v.fee)}</span>` : ''}
        </div>
      </div>
      <div class="visit-card-actions">
        <button class="profile-action-btn" onclick="event.stopPropagation();editVisit('${v.id}')">Edit</button>
        <button class="profile-action-btn danger" onclick="event.stopPropagation();deleteVisit('${v.id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function openAddVisitModal() {
  if (!getMembers().length) { showToast('Add a family member first', 'error'); showPage('profiles'); return; }
  editingVisitId = null;
  document.getElementById('visitModalTitle').textContent = 'Record Doctor Visit';
  ['vDoctor', 'vHospital', 'vDiagnosis', 'vFollowDate', 'vFee'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('vMember').value = activeMemberId || '';
  document.getElementById('vDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('vSpec').value = '';

  setFollowUp(false);
  clearMedicineInputs();

  const uploadStatus = document.getElementById('prescUploadStatus');
  if (uploadStatus) uploadStatus.textContent = '';

  document.getElementById('ocrPreviewArea').style.display = 'none';
  document.getElementById('visitModal').style.display = 'flex';
}

function editVisit(id) {
  const v = getVisits().find(x => x.id === id);
  if (!v) return;
  editingVisitId = id;
  document.getElementById('visitModalTitle').textContent = 'Edit Visit';

  document.getElementById('vMember').value = v.memberId || '';
  document.getElementById('vDate').value = v.date || '';
  document.getElementById('vDoctor').value = v.doctorName || '';
  document.getElementById('vSpec').value = v.specialization || '';
  document.getElementById('vHospital').value = v.hospital || '';
  document.getElementById('vFee').value = v.fee || '';
  document.getElementById('vDiagnosis').value = v.diagnosis || '';

  setFollowUp(v.followUp || false);
  if (v.followUpDate) document.getElementById('vFollowDate').value = v.followUpDate;

  clearMedicineInputs();
  if (v.medicines?.length) {
    document.querySelector('#medicineInputList input').value = v.medicines[0];
    for (let i = 1; i < v.medicines.length; i++) {
      addMedicineInput();
      document.querySelectorAll('#medicineInputList input')[i].value = v.medicines[i];
    }
  }

  document.getElementById('visitModal').style.display = 'flex';
}

function saveVisit() {
  const memberId = document.getElementById('vMember').value;
  const date = document.getElementById('vDate').value;
  const doctor = document.getElementById('vDoctor').value.trim();
  const spec = document.getElementById('vSpec').value;
  const hospital = document.getElementById('vHospital').value.trim();
  const diagnosis = document.getElementById('vDiagnosis').value.trim();

  if (!memberId || !date || !doctor || !spec || !hospital || !diagnosis) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  const visit = {
    memberId, date, doctorName: doctor, specialization: spec,
    hospital, fee: Number(document.getElementById('vFee').value) || 0,
    diagnosis, followUp: followUpEnabled,
    followUpDate: followUpEnabled ? document.getElementById('vFollowDate').value : null,
    medicines: getMedicineInputs()
  };

  let visits = getVisits();
  if (editingVisitId) {
    const idx = visits.findIndex(v => v.id === editingVisitId);
    if (idx !== -1) visits[idx] = { ...visits[idx], ...visit };
  } else {
    visits.push({ id: uid(), ...visit });
  }

  saveVisits(visits);
  closeVisitModal();
  renderVisits();
  showToast(editingVisitId ? 'Visit updated' : 'Visit recorded', 'success');
}

function closeVisitModal() { document.getElementById('visitModal').style.display = 'none'; }

function deleteVisit(id) {
  if (!confirm('Are you sure you want to delete this visit record?')) return;
  saveVisits(getVisits().filter(v => v.id !== id));
  renderVisits();
  showToast('Visit record deleted', 'info');
}

function showVisitDetail(id) {
  const v = getVisits().find(x => x.id === id);
  if (!v) return;

  document.getElementById('visitDetailContent').innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(37,206,209,0.08),white);padding:24px;border-radius:0;margin:-24px -28px 20px;border-bottom:1px solid #e5e7eb;">
      <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div style="padding-top:4px;">${getSpecIcon(v.specialization)}</div>
        <div style="flex:1;">
          <div style="font-size:20px;font-weight:700;color:#1a1a2e;">${v.doctorName}</div>
          <div style="font-size:14px;color:#6b7280;margin-top:2px;">${v.specialization} &bull; ${v.hospital}</div>
          <div style="font-size:13px;color:#9ca3af;margin-top:6px;">${formatDate(v.date)} &bull; Member: ${getMemberName(v.memberId)}</div>
        </div>
        ${v.fee ? `<div style="text-align:right;"><div style="font-size:18px;font-weight:700;color:#25CED1">${formatCurrency(v.fee)}</div><small style="color:#9ca3af;font-size:11px;">Consultation Fee</small></div>` : ''}
      </div>
    </div>
    <div class="visit-detail-grid">
      <div class="visit-detail-section">
        <h4 style="font-size:13px;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Diagnosis & Medical Notes</h4>
        <p style="font-size:14px;line-height:1.7;color:#374151;background:#f9fafb;padding:16px;border-radius:12px;border:1px solid #f0f0f0;">${v.diagnosis || 'No notes recorded'}</p>
        
        ${v.followUp ? `<div style="margin-top:16px;background:rgba(255,138,91,0.08);border:1px solid rgba(255,138,91,0.2);border-radius:12px;padding:14px;">
          <div style="font-size:11px;font-weight:700;color:#FF8A5B;margin-bottom:4px;text-transform:uppercase;">Follow-up Scheduled</div>
          <div style="font-size:15px;font-weight:600;color:#1a1a2e;">${formatDate(v.followUpDate)}</div>
        </div>` : ''}
      </div>
      
      <div class="visit-detail-section">
        <h4 style="font-size:13px;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Prescribed Medications</h4>
        ${v.medicines?.length ? `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${v.medicines.map(m => `<div class="med-detail-item">
              <span style="font-weight:600;color:#1a1a2e;">${m}</span>
            </div>`).join('')}
          </div>` : '<p style="font-size:14px;color:#9ca3af;">No medications prescribed.</p>'}
      </div>
    </div>`;

  document.getElementById('visitDetailModal').style.display = 'flex';
}
