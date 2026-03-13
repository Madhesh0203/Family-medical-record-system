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
        <!-- Thumbnails / Upload Area -->
        <div class="visit-attachments-grid" style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
          ${(v.attachments && v.attachments.length > 0) ? v.attachments.map((att, i) => `
            <div style="position:relative; width:64px; height:64px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; background:#f8fafc; cursor:pointer;"
                 onclick="event.stopPropagation(); openFileViewer('${v.id}', ${i})">
               ${(att.data.startsWith('data:image') || (att.type && att.type.startsWith('image/'))) 
                 ? `<img src="${att.data}" style="width:100%; height:100%; object-fit:cover;" title="${att.name}" />`
                 : `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#25CED1; padding:4px;" title="${att.name}">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span style="font-size:9px; margin-top:2px; max-width:56px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#64748b;">${att.name || 'Doc'}</span>
                    </div>`
               }
               <button style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:50%; width:16px; height:16px; font-size:10px; display:flex; align-items:center; justify-content:center; cursor:pointer;"
                       onclick="event.stopPropagation(); deleteAttachment('${v.id}', ${i})" title="Remove file">✕</button>
            </div>
          `).join('') : ''}
          
          ${(!v.attachments || v.attachments.length < 5) ? `
            <div style="width:64px; height:64px; border:2px dashed #e2e8f0; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#f8fafc; transition:all 0.2s; flex-direction:column; padding:4px;"
                 onmouseover="this.style.borderColor='#25CED1'; this.style.background='rgba(37,206,209,0.05)';"
                 onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';"
                 ondragover="event.preventDefault(); this.style.borderColor='#25CED1'; this.style.background='rgba(37,206,209,0.1)';"
                 ondragleave="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';"
                 ondrop="event.preventDefault(); this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc'; handleDirectVisitDrop(event, '${v.id}')"
                 onclick="event.stopPropagation(); triggerDirectUpload('${v.id}')" title="Upload up to 5 files">
                 <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" width="16" height="16" style="margin-bottom:2px;">
                   <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                 </svg>
                 <span style="font-size:9px; color:#94a3b8; text-align:center;">Add</span>
            </div>
          ` : ''}
        </div>
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

  const previewArea = document.getElementById('imgPreviewArea');
  if (previewArea) previewArea.style.display = 'none';
  
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
    if (idx !== -1) {
        // preserve old attachments if we didn't add a new single one, else handle appropriately.
        // wait, the modal upload functionality was replaced, so we just persist existing attachments array.
        const existingAtts = visits[idx].attachments || [];
        visits[idx] = { ...visits[idx], ...visit, attachments: existingAtts };
    }
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
    </div>
    
    ${(v.attachments && v.attachments.length > 0) ? `
      <div style="margin-top:20px; border-top:1px solid #e5e7eb; padding-top:20px;">
        <h4 style="font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; margin-bottom:12px;">Uploaded Files</h4>
        <div style="display:flex; flex-direction:column; gap:12px; max-height: 250px; overflow-y:auto; padding-right:8px;">
        ${v.attachments.map((att, i) => `
            <div style="border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; background:white; display:flex; align-items:center; cursor:pointer; width:100%; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:all 0.2s;" 
                 onclick="openFileViewer('${v.id}', ${i})"
                 onmouseover="this.style.borderColor='#25CED1'; this.style.boxShadow='0 4px 6px rgba(37,206,209,0.1)';"
                 onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)';">
              <div style="width:60px; height:60px; background:#f8fafc; display:flex; align-items:center; justify-content:center; border-right:1px solid #e5e7eb; flex-shrink:0;">
                ${(att.data.startsWith('data:image') || (att.type && att.type.startsWith('image/'))) 
                  ? `<img src="${att.data}" style="width:100%; height:100%; object-fit:cover;" />`
                  : `<svg viewBox="0 0 24 24" fill="none" stroke="#25CED1" stroke-width="2" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
                }
              </div>
              <div style="padding:0 12px; flex:1; overflow:hidden;">
                  <div style="font-size:13px; font-weight:600; color:#1a1a2e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${att.name || 'Attached Document'}</div>
                  <div style="font-size:11px; color:#64748b; margin-top:2px;">Click to view / download</div>
              </div>
            </div>
        `).join('')}
        </div>
      </div>
    ` : ''}
    `;

  document.getElementById('visitDetailModal').style.display = 'flex';
}

// --- Direct Upload Functions ---

let currentDirectUploadVisitId = null;

function triggerDirectUpload(visitId) {
    currentDirectUploadVisitId = visitId;
    document.getElementById('directVisitUpload').click();
}

function handleDirectVisitDrop(e, visitId) {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        currentDirectUploadVisitId = visitId;
        const input = { files: e.dataTransfer.files };
        handleDirectVisitUpload(input);
    }
}

function handleDirectVisitUpload(input) {
    if (!input.files || input.files.length === 0 || !currentDirectUploadVisitId) return;
    
    let visits = getVisits();
    const idx = visits.findIndex(v => v.id === currentDirectUploadVisitId);
    if (idx === -1) return;
    
    // Ensure array exists
    if (!visits[idx].attachments) visits[idx].attachments = [];
    
    // Check limit before adding anything
    if (visits[idx].attachments.length + input.files.length > 5) {
        showToast('Maximum 5 files allowed for this visit.', 'error');
        if (input.value !== undefined) input.value = '';
        return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    let processedFiles = 0;
    const filesToProcess = Array.from(input.files);
    
    filesToProcess.forEach(file => {
        if (!file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i)) {
            showToast(`Skipped ${file.name}: Invalid format.`, 'error');
            processedFiles++;
            checkDone();
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            visits[idx].attachments.push({
                data: e.target.result,
                name: file.name,
                type: file.type || (file.name.match(/\.pdf$/i) ? 'application/pdf' : '')
            });
            processedFiles++;
            checkDone();
        };
        reader.readAsDataURL(file);
    });
    
    function checkDone() {
        if (processedFiles === filesToProcess.length) {
            saveVisits(visits);
            renderVisits();
            showToast('Files attached successfully', 'success');
            if (input.value !== undefined) input.value = '';
            currentDirectUploadVisitId = null;
        }
    }
}

function deleteAttachment(visitId, attachmentIndex) {
    if (!confirm('Are you sure you want to remove this file?')) return;
    
    let visits = getVisits();
    const idx = visits.findIndex(v => v.id === visitId);
    if (idx !== -1 && visits[idx].attachments) {
        visits[idx].attachments.splice(attachmentIndex, 1);
        saveVisits(visits);
        renderVisits();
        showToast('File removed', 'info');
    }
}

function openFileViewer(visitId, attachmentIndex) {
    let visits = getVisits();
    const v = visits.find(x => x.id === visitId);
    if (!v || !v.attachments || v.attachments.length <= attachmentIndex) return;
    
    const att = v.attachments[attachmentIndex];
    if (!att) return;
    
    const isImage = att.data.startsWith('data:image') || (att.type && att.type.startsWith('image/'));
    
    if (isImage) {
        document.getElementById('fileViewerModal').style.display = 'flex';
        const imgEl = document.getElementById('fileViewerImg');
        const docEl = document.getElementById('fileViewerDoc');
        if (imgEl) {
            imgEl.src = att.data;
            imgEl.style.display = 'block';
        }
        if (docEl) docEl.style.display = 'none';
        
    } else {
        // For non-images (PDF, DOC), trigger direct download
        const a = document.createElement('a');
        a.href = att.data;
        a.download = att.name || 'document';
        a.click();
    }
}
