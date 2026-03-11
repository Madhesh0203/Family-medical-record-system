// ============================================================
// DATA.JS - Storage, Session & Seed Data
// ============================================================
const SESSION_KEY = 'familymed_session';
const FAMILIES_KEY = 'familymed_families';
const USERS_KEY = 'familymed_users';

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch (e) {
        console.error('Error parsing users:', e);
        return [];
    }
}
function saveUsers(users) {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error('Error saving users:', e);
    }
}

function getSession() {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || 'null');
}
function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
}
function getCurrentUid() {
    const s = getSession();
    return s ? s.uid : null;
}
function getFamilyData() {
    try {
        const uid = getCurrentUid();
        const all = JSON.parse(localStorage.getItem(FAMILIES_KEY) || '{}');
        if (!uid) return { members: [], visits: [], reports: [] };
        if (!all[uid]) all[uid] = { members: [], visits: [], reports: [] };
        return all[uid];
    } catch (e) {
        console.error('Error getting family data:', e);
        return { members: [], visits: [], reports: [] };
    }
}
function saveFamilyData(data) {
    const uid = getCurrentUid();
    if (!uid) return;
    const all = JSON.parse(localStorage.getItem(FAMILIES_KEY) || '{}');
    all[uid] = data;
    localStorage.setItem(FAMILIES_KEY, JSON.stringify(all));
}
function getMembers() { return getFamilyData().members || []; }
function getVisits() { return getFamilyData().visits || []; }
function getReports() { return getFamilyData().reports || []; }

function saveMembers(arr) { const d = getFamilyData(); d.members = arr; saveFamilyData(d); }
function saveVisits(arr) { const d = getFamilyData(); d.visits = arr; saveFamilyData(d); }
function saveReports(arr) { const d = getFamilyData(); d.reports = arr; saveFamilyData(d); }

function uid() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
function calcAge(dob) {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatCurrency(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
}
function getMemberById(id) {
    return getMembers().find(m => m.id === id) || null;
}
function getMemberName(id) {
    const m = getMemberById(id);
    return m ? m.name : '—';
}
function getMemberInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(p => p[0]).join('').toUpperCase().substr(0, 2);
}
function getSpecIcon(spec) {
    // Return a generic SVG medical icon instead of emojis
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom;margin-right:4px;">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
}
function getReportIcon(type) {
    // Return a generic SVG file icon
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom;margin-right:4px;">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
}
function getBannerClass(m) {
    if (!m) return '';
    const age = calcAge(m.dob);
    if (age < 18) return 'child';
    if (m.gender === 'Female') return 'female';
    return '';
}
