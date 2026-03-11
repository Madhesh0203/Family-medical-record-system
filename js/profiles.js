// ============================================================
// PROFILES.JS - Family member management
// ============================================================

function renderProfiles() {
  const members = getMembers();
  const activeId = activeMemberId || (members[0] ? members[0].id : null);

  document.getElementById('memberCountBadge').textContent = members.length;
  const grid = document.getElementById('profilesGrid');
  const empty = document.getElementById('profilesEmpty');
  const addBtn = document.getElementById('addMemberBtn');

  if (addBtn) addBtn.style.display = members.length >= 20 ? 'none' : 'flex';
  if (!members.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = members.map(m => {
    const age = calcAge(m.dob);
    const bannerClass = getBannerClass(m);
    const initials = getMemberInitials(m.name);
    const isActive = m.id === activeId;

    return `<div class="profile-card ${isActive ? 'active-profile' : ''}" onclick="viewProfile('${m.id}')">
      <div class="profile-card-banner ${bannerClass}"></div>
      <div class="profile-card-body">
        <div class="profile-avatar-wrap">
          <div class="profile-avatar">
            ${m.photo ? `<img src="${m.photo}" alt="${m.name}" />` : initials}
          </div>
          ${m.role ? `<span class="profile-role-badge">${m.role}</span>` : ''}
        </div>
        <div class="profile-name">${m.name}</div>
        <div class="profile-meta">${age} yrs • ${m.gender || 'Unknown'}</div>
        <div class="profile-tags">
          <span class="profile-tag blood">Blood: ${m.bloodGroup || 'N/A'}</span>
          ${m.conditions ? `<span class="profile-tag">Cond: ${m.conditions.split(',')[0].trim()}</span>` : ''}
          ${m.allergies && m.allergies !== 'None' ? `<span class="profile-tag warning">Allergy: ${m.allergies.split(',')[0].trim()}</span>` : ''}
        </div>
        <div class="profile-card-actions">
          <button class="profile-action-btn" onclick="event.stopPropagation(); editMember('${m.id}')">Edit</button>
          <button class="profile-action-btn" onclick="event.stopPropagation(); setActiveMember('${m.id}')">Select</button>
          <button class="profile-action-btn danger" onclick="event.stopPropagation(); deleteMember('${m.id}')">Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
  updateSwitcherDisplay();
}

function updateSwitcherDisplay() {
  const members = getMembers();
  const active = activeMemberId ? getMemberById(activeMemberId) : (members[0] || null);
  if (active) {
    document.getElementById('switcherAvatarImg').innerHTML = active.photo ? `<img src="${active.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />` : getMemberInitials(active.name);
    document.getElementById('switcherName').textContent = active.name;
    document.getElementById('switcherRole').textContent = active.role || (calcAge(active.dob) + ' yrs');
  } else {
    document.getElementById('switcherAvatarImg').innerHTML = '?';
    document.getElementById('switcherName').textContent = 'Select Member';
    document.getElementById('switcherRole').textContent = '—';
  }
}

function setActiveMember(id) {
  activeMemberId = id;
  sessionStorage.setItem('activeMemberId', id);
  updateSwitcherDisplay();
  renderProfiles(); // Re-render to show active state
  showToast('Active member: ' + getMemberName(id), 'info');
}

function openAddMemberModal() {
  const members = getMembers();
  if (members.length >= 20) { showToast('Maximum 20 family members allowed', 'error'); return; }
  editingMemberId = null;
  window._memberPhotoData = null;
  document.getElementById('memberModalTitle').textContent = 'Add Family Member';
  ['mName', 'mRole', 'mDob', 'mPhone', 'mEmergency', 'mAllergies', 'mConditions', 'mInsurance'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('mGender').value = '';
  document.getElementById('mBlood').value = '';
  document.getElementById('memberPhotoPreview').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><p>Upload Photo</p>`;
  document.getElementById('memberModal').style.display = 'flex';
}

function editMember(id) {
  const m = getMemberById(id);
  if (!m) return;
  editingMemberId = id;
  window._memberPhotoData = m.photo || null;
  document.getElementById('memberModalTitle').textContent = 'Edit Family Member';
  document.getElementById('mName').value = m.name || '';
  document.getElementById('mRole').value = m.role || '';
  document.getElementById('mDob').value = m.dob || '';
  document.getElementById('mGender').value = m.gender || '';
  document.getElementById('mBlood').value = m.bloodGroup || '';
  document.getElementById('mPhone').value = m.phone || '';
  document.getElementById('mEmergency').value = m.emergency || '';
  document.getElementById('mAllergies').value = m.allergies || '';
  document.getElementById('mConditions').value = m.conditions || '';
  document.getElementById('mInsurance').value = m.insurance || '';
  if (m.photo) {
    document.getElementById('memberPhotoPreview').innerHTML = `<img src="${m.photo}" style="width:116px;height:140px;object-fit:cover;border-radius:10px;" />`;
  } else {
    document.getElementById('memberPhotoPreview').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><p>Upload Photo</p>`;
  }
  document.getElementById('memberModal').style.display = 'flex';
}

function saveMember() {
  const name = document.getElementById('mName').value.trim();
  const dob = document.getElementById('mDob').value;
  const gender = document.getElementById('mGender').value;
  const blood = document.getElementById('mBlood').value;

  if (!name || !dob || !gender || !blood) {
    showToast('Required: Name, DOB, Gender, Blood Group', 'error');
    return;
  }

  const members = getMembers();
  const data = {
    name, dob, gender, bloodGroup: blood,
    role: document.getElementById('mRole').value.trim(),
    phone: document.getElementById('mPhone').value.trim(),
    emergency: document.getElementById('mEmergency').value.trim(),
    allergies: document.getElementById('mAllergies').value.trim(),
    conditions: document.getElementById('mConditions').value.trim(),
    insurance: document.getElementById('mInsurance').value.trim(),
    photo: window._memberPhotoData || null
  };

  if (editingMemberId) {
    const idx = members.findIndex(m => m.id === editingMemberId);
    if (idx !== -1) members[idx] = { ...members[idx], ...data };
  } else {
    members.push({ id: uid(), ...data });
  }

  saveMembers(members);
  closeMemberModal();
  renderProfiles();
  showToast(editingMemberId ? 'Member updated' : 'Member added', 'success');
}

function closeMemberModal() { document.getElementById('memberModal').style.display = 'none'; }

function deleteMember(id) {
  if (!confirm('Are you sure you want to delete this member and all their records?')) return;

  let members = getMembers().filter(m => m.id !== id);
  saveMembers(members);
  saveVisits(getVisits().filter(v => v.memberId !== id));
  saveReports(getReports().filter(r => r.memberId !== id));

  if (activeMemberId === id) {
    activeMemberId = null;
    sessionStorage.removeItem('activeMemberId');
  }

  renderProfiles();
  showToast('Member removed', 'info');
}

function viewProfile(id) {
  const m = getMemberById(id);
  if (!m) return;
  const visits = getVisits().filter(v => v.memberId === id);
  const reports = getReports().filter(r => r.memberId === id);
  const age = calcAge(m.dob);
  const initials = getMemberInitials(m.name);
  const bannerClass = getBannerClass(m);

  const details = [
    ['Date of Birth', formatDate(m.dob)],
    ['Age', age + ' years'],
    ['Gender', m.gender || '—'],
    ['Blood Group', m.bloodGroup || '—'],
    ['Phone', m.phone || '—'],
    ['Emergency Contact', m.emergency || '—'],
    ['Allergies', m.allergies || 'None'],
    ['Medical Conditions', m.conditions || 'None'],
    ['Insurance', m.insurance || '—'],
    ['Total Visits', visits.length],
    ['Total Reports', reports.length],
    ['Total Spent', formatCurrency(visits.reduce((s, v) => s + Number(v.fee || 0), 0))]
  ];

  document.getElementById('profileViewContent').innerHTML = `
    <div class="profile-view-header" style="background:linear-gradient(135deg,${bannerClass === 'female' ? 'rgba(255,138,91,0.15)' : bannerClass === 'child' ? 'rgba(168,85,247,0.12)' : 'rgba(37,206,209,0.12)'},white)">
      <div class="profile-view-avatar">
        ${m.photo ? `<img src="${m.photo}" alt="${m.name}" />` : initials}
      </div>
      <div class="profile-view-info">
        <div class="profile-view-name">${m.name}</div>
        <div class="profile-view-meta">${m.role ? m.role + ' • ' : ''}${age} yrs • ${m.gender || ''} • Blood: ${m.bloodGroup || ''}</div>
        <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-add" style="padding:8px 16px;font-size:13px;" onclick="editMember('${id}');closeProfileView()">Edit Details</button>
          <button class="profile-action-btn" style="padding:8px 16px;" onclick="showPage('visits');closeProfileView()">View History</button>
        </div>
      </div>
    </div>
    <div class="profile-detail-grid">
      ${details.map(([l, v]) => `<div class="detail-group"><div class="detail-label">${l}</div><div class="detail-value">${v}</div></div>`).join('')}
    </div>
    <div class="qr-section">
      <div class="qr-info">
        <h4>Medical Profile ID</h4>
        <p>This QR code can be scanned by medical professionals to view ${m.name}'s emergency information.</p>
        <p style="font-size:11px;color:#9ca3af;margin-top:6px;">Internal ID: ${id}</p>
      </div>
      <div class="qr-code-container"><div id="qrCode_${id}"></div></div>
    </div>`;

  document.getElementById('profileViewModal').style.display = 'flex';

  setTimeout(() => {
    const qrContainer = document.getElementById('qrCode_' + id);
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: `FamilyMed|${id}|${m.name}|${m.bloodGroup}|${m.allergies}`,
        width: 110,
        height: 110,
        colorDark: '#1a1a2e',
        colorLight: '#ffffff'
      });
    }
  }, 120);
}

function closeProfileView() { document.getElementById('profileViewModal').style.display = 'none'; }
