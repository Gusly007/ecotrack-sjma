/* ==================== EcoTrack - Navigation & Interactivity ==================== */

// ==================== PROFILE SWITCHING ====================
function switchProfile(profile) {
    document.querySelectorAll('.profile-view').forEach(v => { v.classList.remove('active'); v.classList.remove('desktop-active'); });
    const el = document.getElementById(profile);
    if (el) el.classList.add('active');

    document.querySelectorAll('.profile-tabs .tab').forEach(t => t.classList.remove('active'));
    const tabs = document.querySelectorAll('.profile-tabs .tab');
    const map = { citoyen: 0, agent: 1, gestionnaire: 2, admin: 3 };
    if (tabs[map[profile]]) tabs[map[profile]].classList.add('active');

    const mobileProfiles = ['citoyen', 'agent'];
    toggleDevice(mobileProfiles.includes(profile) ? 'mobile' : 'desktop', true);
}

// ==================== DEVICE TOGGLE ====================
function toggleDevice(device, auto) {
    document.querySelectorAll('.device-toggle .toggle-btn').forEach(b => {
        b.classList.remove('active');
        if ((device === 'mobile' && b.textContent.trim().includes('Mobile')) ||
            (device === 'desktop' && b.textContent.trim().includes('Desktop'))) {
            b.classList.add('active');
        }
    });

    const activeProfile = document.querySelector('.profile-view.active');
    if (!activeProfile) return;
    const phone = activeProfile.querySelector('.phone-frame');
    const desktop = activeProfile.querySelector('.desktop-frame');
    if (device === 'mobile') {
        if (phone) phone.style.display = '';
        if (desktop) desktop.classList.remove('active');
        activeProfile.classList.remove('desktop-active');
    } else {
        if (phone) phone.style.display = 'none';
        if (desktop) desktop.classList.add('active');
        activeProfile.classList.add('desktop-active');
    }
}

// ==================== SCREEN NAVIGATION (Mobile) ====================
function showScreen(screenId) {
    const target = document.getElementById(screenId);
    if (!target) return;
    const frame = target.closest('.phone-frame') || target.closest('.desktop-frame');
    if (!frame) return;

    // For phone frames only animate
    const isPhone = frame.classList.contains('phone-frame');
    frame.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.animation = '';
    });
    target.classList.add('active');
    if (isPhone) {
        target.style.animation = 'slideInRight 0.25s ease forwards';
    }

    // Update bottom-nav active state
    frame.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
        btn.classList.remove('active');
        const onclick = btn.getAttribute('onclick');
        if (onclick && onclick.includes("'" + screenId + "'")) {
            btn.classList.add('active');
        }
    });
}

// ==================== DESKTOP SCREEN NAVIGATION ====================
function showDesktopScreen(screenId, el) {
    const target = document.getElementById(screenId);
    if (!target) return;
    // Reset wizard when navigating to create tournee screen
    if (screenId === 'gest-creer-tournee') {
        tourneeCurrentStep = 1;
        updateTourneeStepUI();
    }
    const boMain = target.closest('.bo-main');
    if (boMain) {
        boMain.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.style.animation = '';
        });
        target.classList.add('active');
        target.style.animation = 'fadeIn 0.25s ease forwards';
    }

    // Update sidebar
    if (el) {
        const sidebar = el.closest('.sidebar-menu');
        if (sidebar) {
            sidebar.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            el.classList.add('active');
        }
    }

    // Update topbar title
    const boContent = target.closest('.bo-content');
    if (boContent) {
        const topbarH1 = boContent.querySelector('.bo-topbar h1');
        const h2 = target.querySelector('h2');
        if (topbarH1 && h2) topbarH1.textContent = h2.textContent;
    }
}

// ==================== MODAL SYSTEM ====================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type) {
    type = type || 'success';
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    toast.innerHTML = '<i class="fas fa-' + (icons[type] || 'info-circle') + '"></i> ' + message;
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('show'); });
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

// ==================== TAB SWITCHING ====================
document.addEventListener('click', function(e) {
    const tabBtn = e.target.closest('.tab-inline');
    if (!tabBtn) return;
    const container = tabBtn.closest('.tabs-inline');
    if (!container) return;
    container.querySelectorAll('.tab-inline').forEach(t => t.classList.remove('active'));
    tabBtn.classList.add('active');

    // Switch tab-content panels
    const parent = container.closest('.screen-body') || container.closest('.screen');
    if (!parent) return;
    const contents = parent.querySelectorAll('.tab-content');
    if (contents.length > 0) {
        var idx = Array.from(container.querySelectorAll('.tab-inline')).indexOf(tabBtn);
        contents.forEach(function(tc, i) { tc.style.display = (i === idx) ? 'block' : 'none'; });
        return;
    }

    // Filter table rows by status text (for tabs like tournees, signalements)
    var filterText = tabBtn.textContent.trim().toLowerCase();
    var table = parent.querySelector('.bo-table');
    if (!table) return;
    var rows = table.querySelectorAll('tbody tr');
    rows.forEach(function(row) {
        if (filterText === 'toutes' || filterText === 'tous') {
            row.style.display = '';
        } else {
            var rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(filterText) ? '' : 'none';
        }
    });
});

// ==================== INTERACTIVE ELEMENTS ====================
document.addEventListener('click', function(e) {
    // Radio card toggle
    const card = e.target.closest('.radio-card');
    if (card) {
        const group = card.closest('.radio-options');
        if (group) {
            group.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        }
        return;
    }
    // Urgency button toggle
    const urgBtn = e.target.closest('.urgency-btn');
    if (urgBtn) {
        const group = urgBtn.closest('.urgency-selector');
        if (group) {
            group.querySelectorAll('.urgency-btn').forEach(b => b.classList.remove('active'));
            urgBtn.classList.add('active');
        }
        return;
    }
    // Toggle switch
    const toggle = e.target.closest('.toggle-switch');
    if (toggle) {
        toggle.classList.toggle('active');
        return;
    }
    // Filter chip remove
    const chipX = e.target.closest('.chip-remove');
    if (chipX) {
        chipX.closest('.filter-chip').remove();
        return;
    }
});

// ==================== DARK MODE ====================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('ecotrack-dark-mode', isDark ? 'true' : 'false');
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Load dark mode on page load
(function() {
    if (localStorage.getItem('ecotrack-dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
    }
})();

// ==================== ACTION HANDLERS ====================
function submitSignalement() {
    showScreen('cit-signalement-success');
    showToast('Signalement envoy\u00e9 avec succ\u00e8s ! +10 pts', 'success');
}

function validateCollecte() {
    showScreen('agent-scan-result');
    showToast('Collecte valid\u00e9e ! +10 pts', 'success');
}

function confirmLogout() { showModal('modal-logout'); }
function confirmDelete(name) {
    const modal = document.getElementById('modal-delete');
    if (modal) {
        const el = modal.querySelector('.modal-item-name');
        if (el) el.textContent = name || 'cet \u00e9l\u00e9ment';
    }
    showModal('modal-delete');
}
function confirmStatusChange(sigId) {
    const modal = document.getElementById('modal-status-change');
    if (modal) {
        const el = modal.querySelector('.modal-sig-id');
        if (el) el.textContent = sigId || '';
    }
    showModal('modal-status-change');
}
function confirmRestore() { showModal('modal-restore'); }

// ==================== LOGOUT PER PROFILE ====================
function performLogout() {
    hideModal('modal-logout');
    // Detect active profile and navigate to its login screen
    var activeProfile = document.querySelector('.profile-view.active');
    if (!activeProfile) return;
    var id = activeProfile.id;
    if (id === 'citoyen') { showScreen('cit-login'); }
    else if (id === 'agent') { showScreen('agent-login'); }
    else if (id === 'gestionnaire') { showDesktopScreen('gest-login'); }
    else if (id === 'admin') { showDesktopScreen('admin-login'); }
    showToast('D\u00e9connexion r\u00e9ussie', 'info');
}

// ==================== CITOYEN HANDLERS ====================
function submitRegistration() {
    showScreen('cit-register-success');
    showToast('Compte cr\u00e9\u00e9 avec succ\u00e8s !', 'success');
}

function exchangeReward(name) {
    showModal('modal-exchange');
    var el = document.querySelector('#modal-exchange .modal-item-name');
    if (el) el.textContent = name || 'cette r\u00e9compense';
}

function confirmExchange() {
    hideModal('modal-exchange');
    showToast('\u00c9change effectu\u00e9 ! Points d\u00e9bit\u00e9s.', 'success');
}

function saveProfile() {
    showToast('Profil mis \u00e0 jour avec succ\u00e8s', 'success');
}

function deleteAccountConfirm() {
    showModal('modal-delete-account');
}

function performDeleteAccount() {
    hideModal('modal-delete-account');
    showScreen('cit-login');
    showToast('Compte supprim\u00e9. Au revoir !', 'info');
}

function changePhoto() {
    showToast('S\u00e9lectionnez une photo (simulation)', 'info');
}

function saveNotificationSettings() {
    showToast('Pr\u00e9f\u00e9rences sauvegard\u00e9es', 'success');
}

function relancerSignalement() {
    showToast('Signalement relanc\u00e9 aupr\u00e8s du gestionnaire', 'success');
}

function showPasswordReset(profile) {
    if (profile === 'citoyen') showScreen('cit-password-reset');
    else if (profile === 'agent') showScreen('agent-password-reset');
    else if (profile === 'gestionnaire') showDesktopScreen('gest-password-reset');
    else if (profile === 'admin') showDesktopScreen('admin-password-reset');
}

function submitPasswordReset() {
    showToast('Email de r\u00e9initialisation envoy\u00e9 !', 'success');
}

function showAbout() {
    showModal('modal-about');
}

function filterMap() {
    showToast('Filtres appliqu\u00e9s (simulation)', 'info');
}

// ==================== AGENT HANDLERS ====================
function submitAgentAnomalie() {
    showScreen('agent-dashboard');
    showToast('Anomalie signal\u00e9e avec succ\u00e8s', 'success');
}

function gpsNavigate() {
    showToast('Navigation GPS lanc\u00e9e (simulation)', 'info');
}

function terminerTournee() {
    showScreen('agent-terminer-tournee');
}

function confirmerTerminerTournee() {
    showScreen('agent-dashboard');
    showToast('Tourn\u00e9e soumise avec succ\u00e8s ! +430 pts', 'success');
}

// ==================== GESTIONNAIRE HANDLERS ====================
function gestNotifications() {
    showToast('5 notifications non lues', 'info');
}

function creerZone() {
    document.getElementById('gest-zone-form').style.display = 'none';
    showToast('Zone cr\u00e9\u00e9e avec succ\u00e8s !', 'success');
}

function planifierIntervention() {
    showToast('Intervention planifi\u00e9e (simulation)', 'success');
}

function genererRapport() {
    showToast('Rapport g\u00e9n\u00e9r\u00e9 et t\u00e9l\u00e9charg\u00e9 !', 'success');
}

function creerTourneeFinale() {
    tourneeCurrentStep = 1;
    showDesktopScreen('gest-tournees', document.querySelector('#gestionnaire .sidebar-menu li:nth-child(2)'));
    showToast('Tourn\u00e9e cr\u00e9\u00e9e et agent notifi\u00e9 !', 'success');
}

function exportData() {
    showToast('Export en cours de t\u00e9l\u00e9chargement...', 'info');
}

function contacterAgent() {
    showToast('Message envoy\u00e9 \u00e0 l\'agent', 'info');
}

// ==================== ADMIN HANDLERS ====================
function adminNotifications() {
    showToast('3 notifications non lues', 'info');
}

function saveConfig() {
    showToast('Configuration sauvegard\u00e9e', 'success');
}

function importData(type) {
    showToast('Import ' + type + ' lanc\u00e9 (simulation)', 'info');
}

function creerBackup() {
    showToast('Sauvegarde en cours...', 'info');
}

function restaurerBackup() {
    confirmRestore();
}

function creerUtilisateurFinal() {
    showDesktopScreen('admin-utilisateurs', document.querySelector('#admin .sidebar-menu li:nth-child(2)'));
    showToast('Utilisateur cr\u00e9\u00e9 et invitation envoy\u00e9e !', 'success');
}

function genererMotDePasse() {
    showToast('Mot de passe g\u00e9n\u00e9r\u00e9 automatiquement', 'success');
}

function definirMotDePasse() {
    showToast('Saisie manuelle du mot de passe', 'info');
}

function modifierUtilisateur() {
    showToast('Mode \u00e9dition (simulation)', 'info');
}

function desactiverUtilisateur() {
    showToast('Utilisateur d\u00e9sactiv\u00e9', 'warning');
}

function sauvegarderBackupConfig() {
    showToast('Configuration de sauvegarde mise \u00e0 jour', 'success');
}

// ==================== RESTORE CONFIRMATION INPUT ====================
document.addEventListener('input', function(e) {
    if (e.target.id === 'restore-confirm-input') {
        const btn = document.getElementById('restore-confirm-btn');
        if (btn) btn.disabled = (e.target.value !== 'CONFIRMER');
    }
});

// ==================== SEARCH FILTERING ====================
document.addEventListener('input', function(e) {
    const searchInput = e.target.closest('.search-bar input, .map-search input, .bo-search input');
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase();
    const container = searchInput.closest('.screen-body, .chart-container, .screen');
    if (!container) return;
    container.querySelectorAll('.bo-table tbody tr').forEach(function(row) {
        row.style.display = (query === '' || row.textContent.toLowerCase().includes(query)) ? '' : 'none';
    });
    container.querySelectorAll('.signalement-detail-card, .container-list-item, .notif-item, .route-card, .user-row').forEach(function(item) {
        item.style.display = (query === '' || item.textContent.toLowerCase().includes(query)) ? '' : 'none';
    });
});

// ==================== CLICKABLE ITEMS ====================
document.addEventListener('click', function(e) {
    // Signalement items on dashboard -> detail
    const sigItem = e.target.closest('.signalement-item');
    if (sigItem && !e.target.closest('button') && sigItem.closest('#cit-dashboard')) {
        showScreen('cit-signalement-detail');
        return;
    }
    // Signalement detail cards in list -> detail
    const sigCard = e.target.closest('.signalement-detail-card');
    if (sigCard && !e.target.closest('button') && sigCard.closest('#cit-mes-signalements')) {
        showScreen('cit-signalement-detail');
        return;
    }
    // Defi cards -> defi detail
    const defiCard = e.target.closest('.defi-card');
    if (defiCard && !e.target.closest('button') && defiCard.closest('#cit-defis')) {
        showScreen('cit-defi-detail');
        return;
    }
    // Map markers -> container detail
    const marker = e.target.closest('.marker');
    if (marker && marker.closest('#cit-carte')) {
        showScreen('cit-conteneur-detail');
        return;
    }
    // Container list items in agent tournee -> etape detail
    const contItem = e.target.closest('.container-list-item');
    if (contItem && !e.target.closest('button') && contItem.closest('#agent-tournee')) {
        showScreen('agent-etape-detail');
        return;
    }
});

// ==================== PREVENT DEFAULT DEMO LINKS ====================
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.getAttribute('href') === '#') e.preventDefault();
});

// ==================== TOURNÉE WIZARD ====================
var tourneeCurrentStep = 1;

function updateTourneeStepUI() {
    for (var i = 1; i <= 4; i++) {
        var stepEl = document.getElementById('tournee-step-' + i);
        var dotEl = document.getElementById('step-dot-' + i);
        if (stepEl) stepEl.style.display = (i === tourneeCurrentStep) ? '' : 'none';
        if (dotEl) {
            dotEl.classList.toggle('active', i <= tourneeCurrentStep);
        }
        var lineEl = document.getElementById('step-line-' + i);
        if (lineEl) {
            lineEl.style.background = (i < tourneeCurrentStep) ? '#4CAF50' : '';
        }
    }
}

function nextTourneeStep() {
    if (tourneeCurrentStep < 4) {
        tourneeCurrentStep++;
        updateTourneeStepUI();
    }
}

function prevTourneeStep() {
    if (tourneeCurrentStep > 1) {
        tourneeCurrentStep--;
        updateTourneeStepUI();
    }
}

function creerTourneeSansNotif() {
    tourneeCurrentStep = 1;
    showDesktopScreen('gest-tournees', document.querySelector('#gestionnaire .sidebar-menu li:nth-child(2)'));
    showToast('Tournée planifiée (agent non notifié)', 'info');
}

function creerTourneeNotifier() {
    tourneeCurrentStep = 1;
    showModal('modal-contacter-agent');
    showToast('Notification envoyée à lagent', 'success');
}

// ==================== MAINTENANCE DETAIL ====================
function showMaintenanceDetail(conteneur, probleme, priorite, date, statut, agent) {
    document.getElementById('mdet-conteneur').textContent = conteneur || '—';
    document.getElementById('mdet-probleme').textContent = probleme || '—';
    document.getElementById('mdet-priorite').textContent = priorite || '—';
    document.getElementById('mdet-date').textContent = date || '—';
    document.getElementById('mdet-statut').textContent = statut || '—';
    document.getElementById('mdet-agent').textContent = agent || '—';
    // Pre-select current status in the dropdown
    var sel = document.getElementById('mdet-nouveau-statut');
    if (sel) {
        for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].text === statut) { sel.selectedIndex = i; break; }
        }
    }
    showModal('modal-maintenance-detail');
}

// ==================== TYPE INTERVENTION AUTRE ====================
function toggleAutreIntervention(sel) {
    var grp = document.getElementById('group-autre-intervention');
    if (grp) grp.style.display = (sel.value === 'Autre') ? '' : 'none';
}

// Reset wizard when navigating to create screen
var _origShowDesktopScreen = showDesktopScreen;
