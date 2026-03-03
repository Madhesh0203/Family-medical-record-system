// ============================================================
// APP.JS - Main Entry Point
// ============================================================
(function () {
    // Auth guard
    const session = getSession();
    if (!session || !session.loggedIn) {
        window.location.href = 'index.html';
        return;
    }
    // Set user info in UI
    document.getElementById('userGreeting').textContent = session.name.split(' ')[0];
    document.getElementById('userNameSidebar').textContent = session.name;
    document.getElementById('userAvatarSm').textContent = getMemberInitials(session.name);
    document.getElementById('topbarAvatar').textContent = getMemberInitials(session.name);

    // Initialize
    populateMemberFilters();
    renderNotifications();
    showPage('dashboard');

    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    ['vDate', 'rDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) this.style.display = 'none';
        });
    });

    // ESC to close modals
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
            document.getElementById('searchResults').style.display = 'none';
            document.getElementById('notifPanel').style.display = 'none';
        }
    });

    // Drag & drop for upload zones
    ['prescriptionUploadZone', 'reportUploadZone'].forEach(id => {
        const zone = document.getElementById(id);
        if (!zone) return;
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = '#25CED1'; zone.style.background = 'rgba(37,206,209,0.08)'; });
        zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; zone.style.background = ''; });
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.style.borderColor = ''; zone.style.background = '';
            const file = e.dataTransfer.files[0];
            if (!file) return;
            if (id === 'prescriptionUploadZone') {
                const dt = new DataTransfer(); dt.items.add(file);
                document.getElementById('prescriptionFile').files = dt.files;
                handlePrescriptionUpload({ files: dt.files });
            } else {
                window._reportFileName = file.name;
                document.getElementById('rUploadStatus').textContent = `✓ ${file.name} ready to upload`;
            }
        });
    });
})();
