// ============================================================
// APP.JS - Main Entry Point
// ============================================================
(function () {
    try {
        console.log('app.js initializing...');
        // Auth guard
        const session = getSession();
        if (!session || !session.loggedIn) {
            console.log('No active session, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        // Set user info in UI
        const greeting = document.getElementById('userGreeting');
        if (greeting && session.name) greeting.textContent = session.name.split(' ')[0];
        
        const sidebarName = document.getElementById('userNameSidebar');
        if (sidebarName) sidebarName.textContent = session.name;
        
        const initials = getMemberInitials(session.name);
        const avatarSm = document.getElementById('userAvatarSm');
        if (avatarSm) avatarSm.textContent = initials;
        
        const topAvatar = document.getElementById('topbarAvatar');
        if (topAvatar) topAvatar.textContent = initials;

        // Initialize
        console.log('Initializing dashboard components...');
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
                const results = document.getElementById('searchResults');
                if (results) results.style.display = 'none';
                const panel = document.getElementById('notifPanel');
                if (panel) panel.style.display = 'none';
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
                
                const dt = new DataTransfer(); 
                Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
                
                if (id === 'prescriptionUploadZone') {
                    const fileInput = document.getElementById('prescriptionFile');
                    if (fileInput) {
                        fileInput.files = dt.files;
                        handlePrescriptionUpload({ files: dt.files });
                    }
                } else {
                    const fileInput = document.getElementById('reportFile');
                    if (fileInput) {
                        fileInput.files = dt.files;
                        if (window.handleReportUpload) window.handleReportUpload({ files: dt.files });
                    }
                }
            });
        });
        console.log('app.js initialized successfully');
    } catch (e) {
        console.error('CRITICAL ERROR in app.js:', e);
        alert('A critical error occurred while loading the dashboard. Please refresh or check the console.');
    }
})();
