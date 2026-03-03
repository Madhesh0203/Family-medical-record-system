// ============================================================
// DASHBOARD.JS - Dashboard rendering
// ============================================================

function renderDashboard() {
  renderStats();
  renderTimeline('all');
  renderTimelineFilterTabs();
  renderUpcomingFollowups();
  renderSpecChart();
  renderExpenseSummaryDash();
}

function renderStats() {
  const visits = getVisits();
  const members = getMembers();
  const reports = getReports();
  const year = new Date().getFullYear();
  const thisYearVisits = visits.filter(v => new Date(v.date).getFullYear() === year);
  const totalExp = visits.reduce((s, v) => s + Number(v.fee || 0), 0);
  const upcoming = visits.filter(v => v.followUp && v.followUpDate && new Date(v.followUpDate) >= new Date()).length;

  const cards = [
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      bg: 'rgba(37,206,209,0.1)',
      value: members.length + '/4',
      label: 'Family Members',
      change: 'Active profiles'
    },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      bg: 'rgba(255,138,91,0.1)',
      value: thisYearVisits.length,
      label: 'Doctor Visits (' + year + ')',
      change: visits.length + ' visits total'
    },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
      bg: 'rgba(168,85,247,0.1)',
      value: reports.length,
      label: 'Lab Reports Stored',
      change: 'Uploaded documents'
    },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      bg: 'rgba(59,130,246,0.1)',
      value: formatCurrency(totalExp),
      label: 'Total Health Spend',
      change: upcoming + ' follow-up' + (upcoming !== 1 ? 's' : '') + ' pending'
    }
  ];

  document.getElementById('statsRow').innerHTML = cards.map(c =>
    `<div class="stat-card" onclick="showPage('visits')">
      <div class="stat-icon" style="background:${c.bg}">${c.icon}</div>
      <div class="stat-info">
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
        <div class="stat-change neutral">${c.change}</div>
      </div>
    </div>`).join('');

  // Fix SVG sizes inside stat icons
  document.querySelectorAll('.stat-icon svg').forEach(s => { s.style.width = '24px'; s.style.height = '24px'; s.style.color = 'inherit'; });
}

function renderTimelineFilterTabs() {
  const members = getMembers();
  const tabs = [{ id: 'all', name: 'All' }, ...members.map(m => ({ id: m.id, name: m.name.split(' ')[0] }))];
  document.getElementById('timelineFilterTabs').innerHTML = tabs.map(t =>
    `<button class="filter-tab${t.id === 'all' ? ' active' : ''}" onclick="filterTimeline('${t.id}', this)">${t.name}</button>`
  ).join('');
}

function filterTimeline(id, btn) {
  document.querySelectorAll('#timelineFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTimeline(id);
}

function renderTimeline(memberId) {
  const all = [
    ...getVisits().map(v => ({ ...v, kind: 'visit' })),
    ...getReports().map(r => ({ ...r, kind: 'report' }))
  ];
  const filtered = memberId === 'all' ? all : all.filter(i => i.memberId === memberId);
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const container = document.getElementById('dashTimeline');
  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px 0;color:#9ca3af;font-size:13px;">No records found for this member.</div>';
    return;
  }
  container.innerHTML = filtered.slice(0, 20).map(item => {
    if (item.kind === 'visit') {
      const diag = item.diagnosis ? (item.diagnosis.length > 90 ? item.diagnosis.substring(0, 90) + '…' : item.diagnosis) : '';
      return `<div class="timeline-item" onclick="showVisitDetail('${item.id}')">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-date">${formatDate(item.date)}</div>
          <div class="timeline-title">${item.doctorName} &mdash; ${item.specialization}</div>
          <div class="timeline-sub">${item.hospital}</div>
          ${diag ? `<div class="timeline-sub" style="margin-top:4px;">${diag}</div>` : ''}
          <span class="timeline-member-tag">${getMemberName(item.memberId)}</span>
        </div>
      </div>`;
    } else {
      return `<div class="timeline-item">
        <div class="timeline-dot accent"></div>
        <div class="timeline-content">
          <div class="timeline-date">${formatDate(item.date)}</div>
          <div class="timeline-title">${item.name}</div>
          <div class="timeline-sub">${item.type}${item.doctor ? ' &bull; ' + item.doctor : ''}</div>
          <span class="timeline-member-tag">${getMemberName(item.memberId)}</span>
        </div>
      </div>`;
    }
  }).join('');
}

function renderUpcomingFollowups() {
  const visits = getVisits().filter(v => v.followUp && v.followUpDate);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = visits
    .filter(v => new Date(v.followUpDate) >= today)
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  const el = document.getElementById('upcomingFollowups');
  if (!upcoming.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px 0;color:#9ca3af;font-size:13px;">No upcoming follow-ups</div>';
    return;
  }
  el.innerHTML = upcoming.slice(0, 4).map(v => {
    const d = new Date(v.followUpDate); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : 'In ' + diff + ' days';
    return `<div class="followup-item">
      <div class="followup-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div class="followup-info">
        <span>${v.doctorName}</span>
        <small>${getMemberName(v.memberId)} &bull; ${v.specialization}</small>
      </div>
      <div class="followup-date">
        <span>${label}</span>
        <small>${formatDate(v.followUpDate)}</small>
      </div>
    </div>`;
  }).join('');
}

function renderSpecChart() {
  const visits = getVisits();
  const counts = {};
  visits.forEach(v => { counts[v.specialization] = (counts[v.specialization] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] || 1;

  const el = document.getElementById('specChart');
  if (!sorted.length) {
    el.innerHTML = '<div style="color:#9ca3af;font-size:13px;text-align:center;padding:16px 0;">No visits recorded yet</div>';
    return;
  }
  el.innerHTML = sorted.map(([spec, count], i) =>
    `<div class="chart-bar-item">
      <div class="chart-bar-label">
        <span>${spec}</span>
        <span>${count} visit${count !== 1 ? 's' : ''}</span>
      </div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill${i > 0 ? ' accent' : ''}" style="width:${(count / max) * 100}%"></div>
      </div>
    </div>`
  ).join('');
}

function renderExpenseSummaryDash() {
  const visits = getVisits();
  const year = new Date().getFullYear();
  const thisYear = visits.filter(v => v.date && v.date.startsWith(String(year)));
  const total = thisYear.reduce((s, v) => s + Number(v.fee || 0), 0);
  const byMember = {};
  thisYear.forEach(v => { byMember[v.memberId] = (byMember[v.memberId] || 0) + Number(v.fee || 0); });

  const el = document.getElementById('expenseSummaryDash');
  el.innerHTML = `
    <div class="total-exp">${formatCurrency(total)}</div>
    <div class="exp-sub">${year} total healthcare spending</div>
    <div class="exp-member-list">
      ${Object.entries(byMember).length
      ? Object.entries(byMember).map(([mid, amt]) =>
        `<div class="exp-member-row">
              <span class="name">${getMemberName(mid)}</span>
              <span class="amount">${formatCurrency(amt)}</span>
            </div>`).join('')
      : '<div style="font-size:13px;color:#9ca3af;">No expenses this year</div>'}
    </div>`;
}
