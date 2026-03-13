// ============================================================
// UI.JS - Toast, Modal helpers, Navigation, Search, Settings
// ============================================================

let currentPage = 'dashboard';
let activeMemberId = null;
let editingMemberId = null;
let editingVisitId = null;
let followUpEnabled = false;

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const el = document.getElementById('page-' + page);
    if (el) el.style.display = 'block';

    const nav = document.getElementById('nav-' + page);
    if (nav) nav.classList.add('active');

    currentPage = page;
    const titles = {
        dashboard: ['Dashboard', 'Family health overview'],
        profiles: ['Family Profiles', 'Manage family member records'],
        visits: ['Doctor Visits', 'Track appointments and consultations'],
        reports: ['Lab Reports', 'Diagnostic reports and documents'],
        medicines: ['Medicine Tracker', 'Prescribed medication summary'],
        expenses: ['Health Expenses', 'Healthcare spending analytics'],
        settings: ['Settings', 'Configuration and data management']
    };

    const t = titles[page] || [page, ''];
    document.getElementById('pageTitle').textContent = t[0];
    document.getElementById('pageSubtitle').innerHTML = t[1];

    if (page === 'dashboard') renderDashboard();
    if (page === 'profiles') renderProfiles();
    if (page === 'visits') { populateMemberFilters(); renderVisits(); }
    if (page === 'reports') { populateMemberFilters(); renderReports(); }
    if (page === 'medicines') { populateMemberFilters(); renderMedicines(); }
    if (page === 'expenses') renderExpenses();
    if (page === 'settings') renderSettings();

    if (window.innerWidth <= 900) closeSidebarMobile();
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebarOverlay');
    if (window.innerWidth <= 900) {
        sb.classList.toggle('mobile-open');
        ov.classList.toggle('active');
    } else {
        sb.classList.toggle('collapsed');
        document.getElementById('mainContent').classList.toggle('sidebar-collapsed');
    }
}

function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function showToast(msg, type = 'info', dur = 3000) {
    const t = document.getElementById('toast');
    t.innerHTML = '';

    let icon = '';
    if (type === 'success') {
        icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:8px;"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
        icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:8px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    } else {
        icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right:8px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    t.innerHTML = icon + `<span>${msg}</span>`;
    t.className = 'toast ' + type;
    t.style.display = 'flex';

    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => {
            t.style.display = 'none';
            t.style.opacity = '1';
        }, 300);
    }, dur);
}

function handleLogout() {
    clearSession();
    window.location.href = 'index.html';
}

function populateMemberFilters() {
    const members = getMembers();
    const selIds = ['visitMemberFilter', 'reportMemberFilter', 'medMemberFilter', 'vMember', 'rMember'];
    selIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const cur = el.value;
        el.innerHTML = id.startsWith('v') || id.startsWith('r') ? '<option value="">Select Member</option>' : '<option value="">All Members</option>';
        members.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id; opt.textContent = m.name;
            el.appendChild(opt);
        });
        el.value = cur;
    });
}

// ---- Search ----
function handleSearch(q) {
    const container = document.getElementById('searchResults');
    if (!q.trim()) { container.style.display = 'none'; return; }
    const lq = q.toLowerCase();
    const results = [];

    getMembers().forEach(m => {
        if (m.name.toLowerCase().includes(lq)) {
            results.push({
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                title: m.name,
                sub: (m.role || 'Member') + ' • ' + (m.bloodGroup || 'N/A'),
                action: () => { viewProfile(m.id); container.style.display = 'none'; document.getElementById('globalSearch').value = ''; }
            });
        }
    });

    getVisits().forEach(v => {
        if ((v.doctorName + v.diagnosis + v.hospital).toLowerCase().includes(lq)) {
            results.push({
                icon: getSpecIcon(v.specialization),
                title: v.doctorName,
                sub: formatDate(v.date) + ' • ' + getMemberName(v.memberId),
                action: () => { showVisitDetail(v.id); container.style.display = 'none'; document.getElementById('globalSearch').value = ''; }
            });
        }
    });

    if (!results.length) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">No matching records found</div>';
        container.style.display = 'block';
        return;
    }

    container.innerHTML = results.slice(0, 8).map((r, i) =>
        `<div class="search-result-item" id="sr${i}">
      <div class="search-result-icon">${r.icon}</div>
      <div class="search-result-info"><span>${r.title}</span><small>${r.sub}</small></div>
     </div>`).join('');

    container.style.display = 'block';
    results.slice(0, 8).forEach((r, i) => {
        const el = document.getElementById('sr' + i);
        if (el) el.onclick = r.action;
    });
}

document.addEventListener('click', e => {
    if (!e.target.closest('.search-bar') && !e.target.closest('.search-results'))
        document.getElementById('searchResults').style.display = 'none';
    if (!e.target.closest('.notif-btn') && !e.target.closest('.notif-panel'))
        document.getElementById('notifPanel').style.display = 'none';
});

// ---- Notifications ----
function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    const isOpen = panel.style.display === 'block';
    panel.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) renderNotifications();
}

function renderNotifications() {
    const panel = document.getElementById('notifPanel');
    const visits = getVisits().filter(v => v.followUp && v.followUpDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const upcoming = visits.filter(v => {
        const d = new Date(v.followUpDate); d.setHours(0, 0, 0, 0);
        const diff = (d - today) / 86400000;
        return diff >= 0 && diff <= 30;
    });

    document.getElementById('notifDot').className = 'notif-dot' + (upcoming.length ? ' active' : '');

    if (!upcoming.length) {
        panel.innerHTML = '<h4>Notifications</h4><p style="font-size:13px;color:#9ca3af;text-align:center;padding:24px 0;">No new alerts.</p>';
        return;
    }

    panel.innerHTML = '<h4>Health Alerts</h4>' + upcoming.map(v => {
        const d = new Date(v.followUpDate); d.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 86400000);
        const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `in ${diff} days`;
        return `<div class="notif-item">
            <div class="notif-item-title">Follow-up: ${v.doctorName}</div>
            <div class="notif-item-sub">${getMemberName(v.memberId)} • Scheduled ${label}</div>
        </div>`;
    }).join('');
}

// ---- Settings Tabs ----
function showSettings(tab) {
    document.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));

    const section = document.getElementById('settings-' + tab);
    if (section) section.style.display = 'block';

    document.querySelectorAll('.settings-nav-btn').forEach(b => {
        const btnText = b.textContent.toLowerCase().replace(/[^a-z]/g, '');
        const targetText = tab.replace('-', '');
        if (btnText.includes(targetText)) b.classList.add('active');
    });
}

// ---- Follow-up toggle ----
function setFollowUp(val) {
    followUpEnabled = val;
    document.getElementById('followNo').className = 'toggle-opt' + (!val ? ' active' : '');
    document.getElementById('followYes').className = 'toggle-opt' + (val ? ' active' : '');
    document.getElementById('followUpDateGroup').style.display = val ? 'block' : 'none';
}

// ---- Medicine inputs ----
function addMedicineInput() {
    const list = document.getElementById('medicineInputList');
    const row = document.createElement('div');
    row.className = 'med-input-row';
    row.innerHTML = `<input type="text" placeholder="Medicine name, dose, frequency" /><button class="med-remove-btn" onclick="this.parentElement.remove()" type="button">✕</button>`;

    const rows = list.querySelectorAll('.med-input-row');
    const lastRow = rows[rows.length - 1];

    if (lastRow) {
        const addBtn = lastRow.querySelector('.med-add-btn');
        if (addBtn) addBtn.remove();
    }

    list.appendChild(row);

    const newAddBtn = document.createElement('button');
    newAddBtn.className = 'med-add-btn';
    newAddBtn.textContent = '+';
    newAddBtn.type = 'button';
    newAddBtn.onclick = addMedicineInput;
    row.appendChild(newAddBtn);
}

function getMedicineInputs() {
    return Array.from(document.querySelectorAll('#medicineInputList input')).map(i => i.value.trim()).filter(Boolean);
}

function clearMedicineInputs() {
    document.getElementById('medicineInputList').innerHTML = `<div class="med-input-row"><input type="text" placeholder="Medicine name, dose, frequency (e.g. Metformin 500mg 1-0-1)" /><button class="med-add-btn" onclick="addMedicineInput()" type="button">+</button></div>`;
}

// ---- Photo preview ----
function previewMemberPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('memberPhotoPreview').innerHTML = `<img src="${e.target.result}" style="width:116px;height:140px;object-fit:cover;border-radius:10px;" />`;
        window._memberPhotoData = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ---- Prescription upload / Add Visit auto-fill ----
function handlePrescriptionUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const status = document.getElementById('prescUploadStatus');
    if (status) status.textContent = `File ready: ${file.name}`;

    // --- Auto-populate Visit form fields (only if empty) ---
    const members = typeof getMembers === 'function' ? getMembers() : [];
    const vMember = document.getElementById('vMember');
    if (vMember && !vMember.value && members.length > 0) {
        vMember.value = (typeof activeMemberId !== 'undefined' && activeMemberId) || members[0].id;
    }

    const vDate = document.getElementById('vDate');
    if (vDate && !vDate.value) {
        vDate.value = new Date().toISOString().split('T')[0];
    }

    // --- Show File Preview ---
    const previewArea = document.getElementById('imgPreviewArea');
    const imgEl = document.getElementById('imgPreviewPic');
    const placeholderEl = document.getElementById('filePreviewPlaceholder');

    if (previewArea) previewArea.style.display = 'block';

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (imgEl) {
                imgEl.src = e.target.result;
                imgEl.style.display = 'block';
            }
            if (placeholderEl) placeholderEl.style.display = 'none';
        }
        reader.readAsDataURL(file);
    } else {
        if (imgEl) imgEl.style.display = 'none';
        if (placeholderEl) {
            placeholderEl.textContent = `Document ready: ${file.name}`;
            placeholderEl.style.display = 'block';
        }
    }
}

