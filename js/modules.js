// ============================================================
// REPORTS.JS - Lab reports management
// ============================================================
let editingReportId = null;

// Compress an image dataURL to max 1000x1000 JPEG before storing
function compressAttachment(dataUrl, fileName, fileType, callback) {
    if (!dataUrl.startsWith('data:image')) {
        callback({ data: dataUrl, name: fileName, type: fileType });
        return;
    }
    const img = new Image();
    img.onload = function() {
        const MAX = 1000;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        callback({ data: compressed, name: fileName.replace(/\.[^.]+$/, '.jpg'), type: 'image/jpeg' });
    };
    img.onerror = function() { callback({ data: dataUrl, name: fileName, type: fileType }); };
    img.src = dataUrl;
}

function renderReports() {
    const memberFilter = document.getElementById('reportMemberFilter')?.value || '';
    const typeFilter   = document.getElementById('reportTypeFilter')?.value  || '';
    const yearFilter   = document.getElementById('reportYearFilter')?.value  || '';
    let reports = getReports();
    if (memberFilter) reports = reports.filter(r => r.memberId === memberFilter);
    if (typeFilter)   reports = reports.filter(r => r.type === typeFilter);
    if (yearFilter)   reports = reports.filter(r => r.date && r.date.startsWith(yearFilter));
    reports.sort((a, b) => new Date(b.date) - new Date(a.date));

    const grid  = document.getElementById('reportsGrid');
    const empty = document.getElementById('reportsEmpty');
    if (!reports.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';

    const typeColors = {
        'Blood Test': 'rgba(239,68,68,0.1)', 'X-Ray': 'rgba(59,130,246,0.1)',
        'MRI': 'rgba(168,85,247,0.1)',       'CT Scan': 'rgba(16,185,129,0.1)',
        'Ultrasound': 'rgba(245,158,11,0.1)','ECG': 'rgba(37,206,209,0.1)',
        'Urine Test': 'rgba(255,138,91,0.1)','Other': 'rgba(107,114,128,0.1)'
    };

    grid.innerHTML = reports.map(r => `
      <div class="report-card">
        <div class="report-actions" style="position:absolute; top:12px; right:12px; display:flex; gap:8px;">
          <button class="delete-btn" onclick="editReport('${r.id}')" title="Edit" style="position:static; width:32px; height:32px; background:rgba(37,206,209,0.1); color:#25CED1; border:none; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="delete-btn" onclick="deleteReport('${r.id}')" title="Delete" style="position:static; width:32px; height:32px; background:rgba(239,68,68,0.1); color:#ef4444;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/></svg>
          </button>
        </div>
        <div class="report-icon" style="background:${typeColors[r.type] || typeColors['Other']}">${getReportIcon(r.type)}</div>
        <div class="report-type-badge">${r.type}</div>
        <div class="report-name">${r.name}</div>
        <div class="report-meta">
          Date: ${formatDate(r.date)}<br>
          ${r.doctor ? `Dr. ${r.doctor}` : 'Self-uploaded'}
          ${r.notes ? `<br><span style="color:#9ca3af;font-size:11px;">Note: ${r.notes.substring(0, 60)}...</span>` : ''}
        </div>
        <span class="report-member-tag">Member: ${getMemberName(r.memberId)}</span>

        <!-- Thumbnails / Upload Area -->
        <div class="report-attachments-grid" style="margin-top:16px; border-top:1px solid #e5e7eb; padding-top:16px; display:flex; gap:8px; flex-wrap:wrap;">
          ${(r.attachments && r.attachments.length > 0) ? r.attachments.map((att, i) => `
            <div style="position:relative; width:64px; height:64px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; background:#f8fafc; cursor:pointer;"
                 onclick="event.stopPropagation(); openReportFileViewer('${r.id}', ${i})">
               ${(att.data && (att.data.startsWith('data:image') || (att.type && att.type.startsWith('image/'))))
                 ? `<img src="${att.data}" style="width:100%; height:100%; object-fit:cover;" title="${att.name}" />`
                 : att.data
                   ? `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#25CED1; padding:4px;" title="${att.name}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span style="font-size:9px; margin-top:2px; max-width:56px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#64748b;">${att.name || 'Doc'}</span>
                      </div>`
                   : `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#d1d5db; font-size:9px;">No data</div>`
               }
               <button style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:50%; width:16px; height:16px; font-size:10px; display:flex; align-items:center; justify-content:center; cursor:pointer;"
                       onclick="event.stopPropagation(); deleteReportAttachment('${r.id}', ${i})" title="Remove file">✕</button>
            </div>
          `).join('') : ''}

          ${(!r.attachments || r.attachments.length < 5) ? `
            <div style="width:64px; height:64px; border:2px dashed #e2e8f0; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#f8fafc; transition:all 0.2s; flex-direction:column; padding:4px;"
                 onmouseover="this.style.borderColor='#25CED1'; this.style.background='rgba(37,206,209,0.05)';"
                 onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';"
                 ondragover="event.preventDefault(); this.style.borderColor='#25CED1'; this.style.background='rgba(37,206,209,0.1)';"
                 ondragleave="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';"
                 ondrop="event.preventDefault(); this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc'; handleDirectReportDrop(event, '${r.id}')"
                 onclick="event.stopPropagation(); triggerDirectReportUpload('${r.id}')" title="Upload up to 5 files">
               <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" width="16" height="16" style="margin-bottom:2px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
               <span style="font-size:9px; color:#94a3b8; text-align:center;">Add</span>
            </div>
          ` : ''}
        </div>
      </div>`).join('');
}

function openAddReportModal() {
    if (!getMembers().length) { showToast('Add a family member first', 'error'); showPage('profiles'); return; }
    editingReportId = null;
    document.querySelector('#reportModal h3').textContent = 'Upload Lab Report';
    ['rDate', 'rDoctor', 'rName', 'rNotes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('rMember').value = activeMemberId || '';
    document.getElementById('rDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('rType').value = '';
    const status = document.getElementById('rUploadStatus');
    if (status) status.textContent = '';
    window._tempReportAttachments = [];
    const previewArea = document.getElementById('reportImgPreviewArea');
    if (previewArea) previewArea.style.display = 'none';
    document.getElementById('reportModal').style.display = 'flex';
}

function editReport(id) {
    const r = getReports().find(x => x.id === id);
    if (!r) return;
    editingReportId = id;
    document.querySelector('#reportModal h3').textContent = 'Edit Lab Report';
    document.getElementById('rMember').value = r.memberId || '';
    document.getElementById('rDate').value   = r.date   || '';
    document.getElementById('rType').value   = r.type   || '';
    document.getElementById('rDoctor').value = r.doctor || '';
    document.getElementById('rName').value   = r.name   || '';
    document.getElementById('rNotes').value  = r.notes  || '';
    const status = document.getElementById('rUploadStatus');
    if (status) status.textContent = r.attachments?.length ? `✓ ${r.attachments.length} file(s) attached` : '';
    window._tempReportAttachments = r.attachments ? [...r.attachments] : [];
    updateReportModalPreview();
    document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() { document.getElementById('reportModal').style.display = 'none'; }

function saveReport() {
    const memberId = document.getElementById('rMember').value;
    const date     = document.getElementById('rDate').value;
    const type     = document.getElementById('rType').value;
    const name     = document.getElementById('rName').value.trim();
    if (!memberId || !date || !type || !name) { showToast('Please fill all required fields', 'error'); return; }
    const reports = getReports();
    const reportData = {
        memberId, date, type, name,
        doctor: document.getElementById('rDoctor').value.trim(),
        notes:  document.getElementById('rNotes').value.trim(),
        attachments: window._tempReportAttachments ? [...window._tempReportAttachments] : []
    };
    if (editingReportId) {
        const idx = reports.findIndex(r => r.id === editingReportId);
        if (idx !== -1) reports[idx] = { ...reports[idx], ...reportData };
    } else {
        reports.push({ id: uid(), ...reportData });
    }
    saveReports(reports);
    closeReportModal();
    renderReports();
    showToast(editingReportId ? 'Report updated' : 'Report uploaded', 'success');
}

window.handleReportUpload = function(input) {
    if (!input.files || input.files.length === 0) return;
    if (!window._tempReportAttachments) window._tempReportAttachments = [];
    if (window._tempReportAttachments.length + input.files.length > 5) {
        showToast('Maximum 5 files allowed for this report.', 'error');
        if (input.value !== undefined) input.value = '';
        return;
    }
    const members = typeof getMembers === 'function' ? getMembers() : [];
    const rMember = document.getElementById('rMember');
    if (rMember && (!rMember.value || rMember.value === '') && members.length > 0) {
        rMember.value = (typeof activeMemberId !== 'undefined' && activeMemberId) || members[0].id;
    }
    const rDate = document.getElementById('rDate');
    if (rDate && !rDate.value) rDate.value = new Date().toISOString().split('T')[0];
    const firstFile = input.files[0];
    const rName = document.getElementById('rName');
    if (rName && !rName.value && firstFile) {
        const nameParts = firstFile.name.split('.');
        rName.value = (nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : firstFile.name).replace(/[-_]+/g, ' ').trim();
    }
    const filesToProcess = Array.from(input.files);
    const status = document.getElementById('rUploadStatus');
    
    function processNextFile(index) {
        if (index >= filesToProcess.length) {
            if (status) status.textContent = `✓ ${window._tempReportAttachments.length} file(s) attached`;
            if (input.value !== undefined) input.value = '';
            updateReportModalPreview();
            return;
        }
        
        const file = filesToProcess[index];
        if (!file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i)) {
            showToast(`Skipped ${file.name}: Invalid format.`, 'error');
            processNextFile(index + 1);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileType = file.type || (file.name.match(/\.pdf$/i) ? 'application/pdf' : '');
            compressAttachment(e.target.result, file.name, fileType, function(att) {
                window._tempReportAttachments.push(att);
                processNextFile(index + 1);
            });
        };
        reader.readAsDataURL(file);
    }
    
    processNextFile(0);
};

function updateReportModalPreview() {
    const previewArea        = document.getElementById('reportImgPreviewArea');
    const previewPic         = document.getElementById('reportImgPreviewPic');
    const previewPlaceholder = document.getElementById('reportFilePreviewPlaceholder');
    if (!previewArea) return;
    if (!window._tempReportAttachments || window._tempReportAttachments.length === 0) {
        previewArea.style.display = 'none'; return;
    }
    previewArea.style.display = 'block';
    previewPlaceholder.style.display = 'block';
    previewPlaceholder.innerHTML = `
        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; padding:10px;">
            ${window._tempReportAttachments.map((att, i) => `
                <div style="position:relative; width:50px; height:50px; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; background:white;">
                    ${(att.data && (att.data.startsWith('data:image') || (att.type && att.type.startsWith('image/'))))
                        ? `<img src="${att.data}" style="width:100%; height:100%; object-fit:cover;" />`
                        : `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#25CED1;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                           </div>`
                    }
                    <button onclick="window._tempReportAttachments.splice(${i}, 1); updateReportModalPreview(); event.stopPropagation();"
                            style="position:absolute; top:1px; right:1px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:50%; width:14px; height:14px; font-size:8px; display:flex; align-items:center; justify-content:center; cursor:pointer;">✕</button>
                </div>
            `).join('')}
        </div>
        <div style="font-size:12px; margin-top:4px; color:#64748b;">${window._tempReportAttachments.length} file(s) ready</div>
    `;
    if (previewPic) previewPic.style.display = 'none';
}

function deleteReport(id) {
    if (!confirm('Are you sure you want to delete this report?')) return;
    saveReports(getReports().filter(r => r.id !== id));
    renderReports();
    showToast('Report deleted', 'info');
}

// --- Direct Report Upload ---
let currentDirectReportUploadId = null;

function triggerDirectReportUpload(reportId) {
    currentDirectReportUploadId = reportId;
    document.getElementById('directReportUpload').click();
}

function handleDirectReportDrop(e, reportId) {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        currentDirectReportUploadId = reportId;
        handleDirectReportUpload({ files: e.dataTransfer.files });
    }
}

function handleDirectReportUpload(input) {
    if (!input.files || input.files.length === 0 || !currentDirectReportUploadId) return;
    let reports = getReports();
    const idx = reports.findIndex(r => r.id === currentDirectReportUploadId);
    if (idx === -1) return;
    if (!reports[idx].attachments) reports[idx].attachments = [];
    if (reports[idx].attachments.length + input.files.length > 5) {
        showToast('Maximum 5 files allowed for this report.', 'error');
        if (input.value !== undefined) input.value = '';
        return;
    }
    const filesToProcess = Array.from(input.files);
    
    function processNextDirectFile(index) {
        if (index >= filesToProcess.length) {
            saveReports(reports);
            renderReports();
            showToast('Files attached successfully', 'success');
            if (input.value !== undefined) input.value = '';
            currentDirectReportUploadId = null;
            return;
        }

        const file = filesToProcess[index];
        if (!file.name.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i)) {
            showToast(`Skipped ${file.name}: Invalid format.`, 'error');
            processNextDirectFile(index + 1);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const fileType = file.type || (file.name.match(/\.pdf$/i) ? 'application/pdf' : '');
            compressAttachment(e.target.result, file.name, fileType, function(att) {
                reports[idx].attachments.push(att);
                processNextDirectFile(index + 1);
            });
        };
        reader.readAsDataURL(file);
    }

    processNextDirectFile(0);
}

function deleteReportAttachment(reportId, attachmentIndex) {
    if (!confirm('Are you sure you want to remove this file?')) return;
    let reports = getReports();
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx !== -1 && reports[idx].attachments) {
        reports[idx].attachments.splice(attachmentIndex, 1);
        saveReports(reports);
        renderReports();
        showToast('File removed', 'info');
    }
}

// --- File Viewer with navigation arrows ---
let _viewerReportId  = null;
let _viewerIndex     = 0;

function openReportFileViewer(reportId, attachmentIndex) {
    const r = getReports().find(x => x.id === reportId);
    if (!r || !r.attachments || !r.attachments[attachmentIndex]) return;
    _viewerReportId = reportId;
    _viewerIndex    = attachmentIndex;
    _showViewerAt(_viewerIndex);
}

function _showViewerAt(index) {
    const r = getReports().find(x => x.id === _viewerReportId);
    if (!r || !r.attachments) return;
    const total = r.attachments.length;
    if (index < 0 || index >= total) return;
    _viewerIndex = index;

    const att = r.attachments[index];
    if (!att || !att.data) { showToast('File data not available', 'error'); return; }

    const modal   = document.getElementById('fileViewerModal');
    const imgEl   = document.getElementById('fileViewerImg');
    const docEl   = document.getElementById('fileViewerDoc');
    const prevBtn = document.getElementById('fileViewerPrev');
    const nextBtn = document.getElementById('fileViewerNext');
    const counter = document.getElementById('fileViewerCounter');

    const isImage = att.data.startsWith('data:image') || (att.type && att.type.startsWith('image/'));
    if (isImage) {
        if (imgEl) { imgEl.src = att.data; imgEl.style.display = 'block'; }
        if (docEl) docEl.style.display = 'none';
    } else {
        if (imgEl) imgEl.style.display = 'none';
        if (docEl) docEl.style.display = 'block';
        const docName = document.getElementById('fileViewerDocName');
        const dlBtn   = document.getElementById('fileViewerDownloadBtn');
        if (docName) docName.textContent = att.name || 'Document';
        if (dlBtn) dlBtn.onclick = function() {
            const a = document.createElement('a');
            a.href = att.data; a.download = att.name || 'document'; a.click();
        };
    }

    // Arrows — only show when more than one attachment
    if (total > 1) {
        if (prevBtn) { prevBtn.style.display = 'flex'; }
        if (nextBtn) { nextBtn.style.display = 'flex'; }
        if (counter) { counter.style.display = 'block'; counter.textContent = `${index + 1} / ${total}`; }
    } else {
        hideViewerArrows();
    }

    if (modal) modal.style.display = 'flex';
}

function navigateViewer(direction) {
    const r = getReports().find(x => x.id === _viewerReportId);
    if (!r || !r.attachments) return;
    const total = r.attachments.length;
    let next = (_viewerIndex + direction + total) % total; // wrap around
    _showViewerAt(next);
}

function hideViewerArrows() {
    const prevBtn = document.getElementById('fileViewerPrev');
    const nextBtn = document.getElementById('fileViewerNext');
    const counter = document.getElementById('fileViewerCounter');
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (counter) counter.style.display = 'none';
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
