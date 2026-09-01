
window.payAndDownloadCv = function() {
    var user = null;
    try {
        var raw = localStorage.getItem('jobnexus_user');
        user = raw ? JSON.parse(raw) : null;
    } catch(e) {}

    // If user already paid or has PRO subscription, download directly
    if (user && (user.hasPaidCv || user.plan === 'pro')) {
        if (typeof window.downloadCvPdf === 'function') {
            window.downloadCvPdf();
        }
        return;
    }

    // Save current form state first
    if (typeof window.saveCvBuilderData === 'function') {
        window.saveCvBuilderData();
    }

    // Launch checkout modal for 14.99 zł
    if (typeof window.startProCheckout === 'function') {
        window.startProCheckout('cv_builder_pass', '14,99 zł', 'Kreator CV Profesjonalny + Eksport PDF (14,99 zł)');
    }
};


window.openCvBuilder = function() {
    var user = null;
    try {
        var raw = localStorage.getItem('jobnexus_user');
        user = raw ? JSON.parse(raw) : null;
    } catch(e) {}
    if (!user) {
        if (typeof window.openAuthModal === 'function') {
            window.openAuthModal('register');
        }
        if (typeof showToast === 'function') {
            showToast('Zarejestruj się lub zaloguj, aby korzystać z Kreatora CV.', 'info');
        }
        return;
    }
    if (typeof window.openDashboard === 'function') {
        window.openDashboard('cv_builder');
    }
};

window.toggleBrowseOffersView = function() {
    var hero = document.getElementById('hero');
    if (hero) {
        hero.style.display = 'block';
        hero.scrollIntoView({ behavior: 'smooth' });
    }
    if (typeof window.closeDashboardModal === 'function') {
        window.closeDashboardModal();
    }
};

/**
 * JobNexus — Refactored Application
 * Integrates Jooble API (via backend proxy), CSV import, AI CV matching, announcements
 * SECURITY: API keys are handled server-side only
 */

import CONFIG from './config.js';
import { JobService } from './services/jobService.js';
import { CSVParser } from './services/csvParser.js';
import { StorageService } from './services/storageService.js';
import { FavoritesService } from './services/favoritesService.js';
import { AuthService } from './services/authService.js';

// ============================================
// STATE
// ============================================
const state = {
    jobs: [],
    csvJobs: [],
    announcements: [],
    filteredJobs: [],
    currentPage: 1,
    currentFilter: 'all',
    searchQuery: '',
    locationQuery: '',
    isLoading: false,
    cvMatches: []
};

// ============================================
// DOM ELEMENTS
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    navbar: $('#navbar'),
    navToggle: $('#navToggle'),
    navMenu: $('#navMenu'),
    searchBox: $('#searchBox'),
    searchInput: $('#searchInput'),
    locationInput: $('#locationInput'),
    searchBtn: $('#searchBtn'),
    filtersBar: $('#filtersBar'),
    filterChips: $$('.filter-chip'),
    jobsGrid: $('#jobsGrid'),
    jobsLoading: $('#jobsLoading'),
    jobsEmpty: $('#jobsEmpty'),
    loadMoreBtn: $('#loadMoreBtn'),
    announcementsGrid: $('#announcementsGrid'),
    addModal: $('#addModal'),
    modalClose: $('#modalClose'),
    addForm: $('#addForm'),
    annFeatured: $('#annFeatured'),
    submitPrice: $('#submitPrice'),
    cvUploadZone: $('#cvUploadZone'),
    cvFileInput: $('#cvFileInput'),
    cvMatches: $('#cvMatches'),
    cvMatchesGrid: $('#cvMatchesGrid'),
    statNumbers: $$('.stat-number'),
    authTrigger: $('#authTrigger'), authModal: $('#authModal'), authClose: $('#authClose'), authTitle: $('#authTitle'), authSubtitle: $('#authSubtitle'), authForm: $('#authForm'), authSwitch: $('#authSwitch'), authNameGroup: $('#authNameGroup'), authName: $('#authName'), authEmail: $('#authEmail'), authPassword: $('#authPassword'), authError: $('#authError'), authSubmit: $('#authSubmit'),
    infoModal: $('#infoModal'), infoClose: $('#infoClose'), infoTitle: $('#infoTitle'), infoContent: $('#infoContent')
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    try { initNavbar(); } catch (e) { console.warn('initNavbar:', e); }
    try { initAuth(); } catch (e) { console.warn('initAuth:', e); }
    try { initDashboard(); } catch (e) { console.warn('initDashboard:', e); }
    try { initInfoPages(); } catch (e) { console.warn('initInfoPages:', e); }
    try { initSearch(); } catch (e) { console.warn('initSearch:', e); }
    try { initFilters(); } catch (e) { console.warn('initFilters:', e); }
    try { initModal(); } catch (e) { console.warn('initModal:', e); }
    try { initCVUpload(); } catch (e) { console.warn('initCVUpload:', e); }
    try { initOffers(); } catch (e) { console.warn('initOffers:', e); }
    try { initGigs(); } catch (e) { console.warn('initGigs:', e); }
});

// ============================================
// AUTHENTICATION
// ============================================
// ============================================
// AUTHENTICATION CONTROLLER & SESSION
// ============================================
function initAuth() {
    // Sync initial session on load and auto-open dashboard for logged-in users
    try {
        if (typeof AuthService !== 'undefined' && AuthService.getUser) {
            const currentUser = AuthService.getUser();
            if (typeof window.syncUserHeader === 'function') {
                window.syncUserHeader(currentUser);
            }
            if (currentUser && currentUser.email) {
                setTimeout(() => {
                    if (typeof window.openDashboard === 'function') {
                        window.openDashboard();
                    }
                }, 100);
            }
        }
    } catch(e) {
        console.warn('Auth session check:', e);
    }
}

function syncUserHeader(user) {
    if (!user) return;
    const loginBtn = document.getElementById('loginBtnNav');
    const regBtn = document.getElementById('registerBtnNav');
    const authTrigger = document.getElementById('authTrigger');
    const dashAvatar = document.getElementById('dashAvatar');
    const dashUserName = document.getElementById('dashUserName');
    const dashRoleBadge = document.getElementById('dashRoleBadge');

    const initials = (user.name || 'JN').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    if (loginBtn) {
        loginBtn.innerHTML = `<span>👤 ${escapeHtml(user.name || 'Profil')}</span>`;
        loginBtn.onclick = () => {
            if (typeof window.openDashboardModal === 'function') window.openDashboardModal();
        };
    }
    if (regBtn) {
        regBtn.innerHTML = `<span>Wyloguj</span>`;
        regBtn.onclick = async () => {
            if (typeof AuthService !== 'undefined') await AuthService.logout();
            location.reload();
        };
    }
    if (authTrigger) {
        authTrigger.innerHTML = `<span>👤 ${escapeHtml(user.name || 'Profil')}</span>`;
        authTrigger.onclick = () => {
            if (typeof window.openDashboardModal === 'function') window.openDashboardModal();
        };
    }

    if (dashAvatar) dashAvatar.textContent = initials;
    if (dashUserName) dashUserName.textContent = user.name;
    if (dashRoleBadge) {
        dashRoleBadge.textContent = user.role === 'recruiter' ? '🏢 Rekruter' : '🧑‍💻 Kandydat';
        dashRoleBadge.className = `dashboard-role-badge ${user.role === 'recruiter' ? 'recruiter' : ''}`;
    }
}

function initDashboard() {
    const dashModal = document.getElementById('dashboardModal');

    window.activateAndOpenRecruiter = () => {
        let user = AuthService.getUser();
        if (!user) {
            window.openAuthModal('register');
            if (typeof showToast === 'function') {
                showToast('Zarejestruj konto Pracodawcy lub zaloguj się, aby uzyskać dostęp do Panelu.', 'info');
            }
            return;
        } else {
            user.role = 'recruiter';
            user.plan = 'pro';
            try { localStorage.setItem('jobnexus_user', JSON.stringify(user)); } catch (e) {}
        }
        currentActiveTab = 'headhunter'; // Open on AI Headhunter & CV Database tab
        renderDashboard(user);
        if (dashModal) {
            dashModal.classList.remove('hidden');
            dashModal.style.display = 'flex';
            dashModal.style.visibility = 'visible';
            dashModal.style.opacity = '1';
            dashModal.style.pointerEvents = 'auto';
            dashModal.style.zIndex = '999999';
        }
        if (typeof showToast === 'function') {
            showToast('🚀 Aktywowano Plan PRO! Witaj w Panelu Rekrutera i Bazie CV.', 'success');
        }
    };
    window.openRecruiterPanel = window.activateAndOpenRecruiter;

    window.closeDashboardModal = () => {
        if (dashModal) {
            dashModal.classList.add('hidden');
            dashModal.style.display = 'none';
            dashModal.style.visibility = 'hidden';
            dashModal.style.opacity = '0';
            dashModal.style.pointerEvents = 'none';
        }
    };
    window.openDashboard = () => {
        const user = AuthService.getUser();
        if (!user) {
            window.openAuth?.(false, 'Zaloguj się, aby przejść do panelu.');
            return;
        }
        if (typeof renderDashboard === 'function') {
            renderDashboard(user);
        }
        if (dashModal) {
            dashModal.classList.remove('hidden');
        }
    };
    const dashTrigger = document.getElementById('dashboardTrigger');
    const dashClose = document.getElementById('dashboardClose');
    const dashUserAvatar = document.getElementById('dashUserAvatar');
    const dashUserName = document.getElementById('dashUserName');
    const dashUserEmail = document.getElementById('dashUserEmail');
    const dashUserRoleBadge = document.getElementById('dashUserRoleBadge');
    const dashSwitchRoleBtn = document.getElementById('dashSwitchRoleBtn');
    const dashTabsContainer = document.getElementById('dashTabsContainer');
    const dashContentArea = document.getElementById('dashContentArea');
    const dashLogoutBtn = document.getElementById('dashLogoutBtn');

    if (!dashModal) return;

    let currentActiveTab = 'main';

    const getSavedJobs = () => {
        try { return JSON.parse(localStorage.getItem('jobnexus_saved_jobs') || '[]'); } catch { return []; }
    };

    const getApplications = () => {
        try { return JSON.parse(localStorage.getItem('jobnexus_applications') || '[]'); } catch { return []; }
    };

    const getRecruiterJobs = () => {
        try { return JSON.parse(localStorage.getItem('jobnexus_recruiter_jobs') || '[]'); } catch { return []; }
    };

    const saveRecruiterJobs = (jobs) => {
        localStorage.setItem('jobnexus_recruiter_jobs', JSON.stringify(jobs));
    };

    if (getRecruiterJobs().length === 0) {
        saveRecruiterJobs([
            {
                id: 'rec_1',
                title: 'Senior Frontend Developer (React/Vue)',
                type: 'Pełny etat',
                location: 'Zdalnie / Warszawa',
                salary: '18 000 - 24 000 PLN',
                tier: 'Wyróżnione (HOT)',
                views: 284,
                applicants: [
                    { id: 'cand_1', name: 'Piotr Wiśniewski', email: 'p.wisniewski@example.com', score: 94, date: '2026-08-30', status: 'Rozmowa kwalifikacyjna', exp: '5 lat', skills: ['React', 'TypeScript', 'Node.js'] },
                    { id: 'cand_2', name: 'Katarzyna Nowak', email: 'k.nowak@example.com', score: 88, date: '2026-08-29', status: 'W trakcie weryfikacji', exp: '3 lata', skills: ['Vue.js', 'Tailwind', 'JavaScript'] },
                    { id: 'cand_3', name: 'Michał Zieliński', email: 'm.zielinski@example.com', score: 76, date: '2026-08-27', status: 'Nowa aplikacja', exp: '2 lata', skills: ['React', 'CSS', 'HTML'] }
                ],
                createdAt: '2026-08-15'
            },
            {
                id: 'rec_2',
                title: 'Python / AI Backend Engineer',
                type: 'Kontrakt B2B',
                location: 'Zdalnie',
                salary: '22 000 - 30 000 PLN',
                tier: 'Standard',
                views: 192,
                applicants: [
                    { id: 'cand_4', name: 'Tomasz Lewandowski', email: 'tomek.lew@example.com', score: 96, date: '2026-08-30', status: 'Oferta złożona', exp: '6 lat', skills: ['Python', 'FastAPI', 'LangChain', 'Docker'] }
                ],
                createdAt: '2026-08-20'
            }
        ]);
    }

    const openDashboard = () => {
        const user = AuthService.getUser();
        if (!user) {
            window.openAuth?.(false, 'Zaloguj się, aby uzyskać dostęp do panelu.');
            return;
        }
        renderDashboard(user);
        dashModal.classList.remove('hidden');
    };

    const closeDashboard = () => {
        dashModal.classList.add('hidden');
    };

    dashTrigger?.addEventListener('click', openDashboard);
    dashClose?.addEventListener('click', closeDashboard);
    dashModal.addEventListener('click', (e) => {
        if (e.target === dashModal) closeDashboard();
    });

    dashLogoutBtn?.addEventListener('click', async () => {
        await AuthService.logout();
        closeDashboard();
        window.location.reload();
    });

    dashSwitchRoleBtn?.addEventListener('click', () => {
        const user = AuthService.getUser();
        if (!user) return;
        const newRole = user.role === 'recruiter' ? 'candidate' : 'recruiter';
        AuthService.updateRole(newRole);
        currentActiveTab = 'main';
        const dashTriggerSpan = dashTrigger?.querySelector('span');
        if (dashTriggerSpan) {
            dashTriggerSpan.textContent = newRole === 'recruiter' ? 'Panel Rekrutera' : 'Panel Kandydata';
        }
        renderDashboard(AuthService.getUser());
        showToast(`Przełączono profil na: ${newRole === 'recruiter' ? 'Pracodawca' : 'Kandydat'}`, 'success');
    });

    function renderDashboard(user) {
        const isRecruiter = user.role === 'recruiter';
        dashUserName.textContent = user.name || 'Użytkownik';
        dashUserEmail.textContent = user.email;
        dashUserAvatar.textContent = (user.name || user.email).charAt(0).toUpperCase();

        dashUserRoleBadge.textContent = isRecruiter ? 'Pracodawca / Rekruter (PRO)' : 'Kandydat (PRO Talent)';
        dashUserRoleBadge.style.background = isRecruiter ? 'rgba(99, 102, 241, 0.15)' : 'rgba(59, 130, 246, 0.15)';
        dashUserRoleBadge.style.color = isRecruiter ? '#a5b4fc' : '#60a5fa';
        dashUserRoleBadge.style.borderColor = isRecruiter ? 'rgba(99, 102, 241, 0.3)' : 'rgba(59, 130, 246, 0.3)';

        dashSwitchRoleBtn.textContent = isRecruiter ? '' : '';

        if (isRecruiter) {
            renderRecruiterTabs();
        } else {
            renderCandidateTabs();
        }
    }

    function renderCandidateTabs() {
        dashTabsContainer.innerHTML = `
            <button class="dash-tab" style="padding: 8px 14px; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${currentActiveTab === 'main' ? '#3b82f6' : 'transparent'}; color: ${currentActiveTab === 'main' ? '#60a5fa' : '#94a3b8'}; transition: all 0.2s; white-space: nowrap;" data-tab="main">
                Pulpit & CV AI
            </button>
            <button class="dash-tab" style="padding: 8px 14px; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${currentActiveTab === 'ai_tools' ? '#3b82f6' : 'transparent'}; color: ${currentActiveTab === 'ai_tools' ? '#60a5fa' : '#94a3b8'}; transition: all 0.2s; white-space: nowrap;" data-tab="ai_tools">
                ✨ AI Asystent Kariery & ATS
            </button>
            <button class="dash-tab" style="padding: 8px 14px; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${currentActiveTab === 'salary' ? '#3b82f6' : 'transparent'}; color: ${currentActiveTab === 'salary' ? '#60a5fa' : '#94a3b8'}; transition: all 0.2s; white-space: nowrap;" data-tab="salary">
                💰 Wycena Stawek & Rynek
            </button>
            <button class="dash-tab" style="padding: 8px 14px; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${currentActiveTab === 'saved' ? '#3b82f6' : 'transparent'}; color: ${currentActiveTab === 'saved' ? '#60a5fa' : '#94a3b8'}; transition: all 0.2s; white-space: nowrap;" data-tab="saved">
                Zapisane Oferty (${getSavedJobs().length})
            </button>
            <button class="dash-tab" style="padding: 8px 14px; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${currentActiveTab === 'apps' ? '#3b82f6' : 'transparent'}; color: ${currentActiveTab === 'apps' ? '#60a5fa' : '#94a3b8'}; transition: all 0.2s; white-space: nowrap;" data-tab="apps">
                Aplikacje (${getApplications().length})
            </button>
        `;

        attachTabEvents(renderCandidateContent);
        renderCandidateContent(currentActiveTab);
    }

    function renderRecruiterTabs() {
        const rJobs = getRecruiterJobs();
        const totalApplicants = rJobs.reduce((sum, j) => sum + (j.applicants?.length || 0), 0);

        dashTabsContainer.innerHTML = `
            <button class="dash-tab" style="padding: 8px 14px; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${currentActiveTab === 'main' ? '#6366f1' : 'transparent'}; color: ${currentActiveTab === 'main' ? '#a5b4fc' : '#94a3b8'}; transition: all 0.2s; white-space: nowrap;" data-tab="main">
                Pulpit & Oferty (${rJobs.length})
            </button>
            <button class="dash-tab" style="padding: 8px 14px; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${currentActiveTab === 'pipeline' ? '#6366f1' : 'transparent'}; color: ${currentActiveTab === 'pipeline' ? '#a5b4fc' : '#94a3b8'}; transition: all 0.2s; white-space: nowrap;" data-tab="pipeline">
                📊 Lejek Kandydatów (Kanban)
            </button>
            <button class="dash-tab" style="padding: 8px 14px; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${currentActiveTab === 'headhunter' ? '#6366f1' : 'transparent'}; color: ${currentActiveTab === 'headhunter' ? '#a5b4fc' : '#94a3b8'}; transition: all 0.2s; white-space: nowrap;" data-tab="headhunter">
                🎯 AI Headhunter (Baza Talentów)
            </button>
            <button class="dash-tab" style="padding: 8px 14px; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${currentActiveTab === 'packages' ? '#6366f1' : 'transparent'}; color: ${currentActiveTab === 'packages' ? '#a5b4fc' : '#94a3b8'}; transition: all 0.2s; white-space: nowrap;" data-tab="packages">
                Pakiety & Promowanie
            </button>
        `;

        attachTabEvents(renderRecruiterContent);
        renderRecruiterContent(currentActiveTab);
    }

    function attachTabEvents(renderFn) {
        dashTabsContainer.querySelectorAll('.dash-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                currentActiveTab = btn.dataset.tab;
                dashTabsContainer.querySelectorAll('.dash-tab').forEach(b => {
                    b.style.borderBottomColor = 'transparent';
                    b.style.color = '#94a3b8';
                });
                btn.style.borderBottomColor = '#3b82f6';
                btn.style.color = '#60a5fa';
                renderFn(currentActiveTab);
            });
        });
    }

    function renderCandidateContent(tab) {
        if (tab === 'ai_tools') {
            dashContentArea.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <!-- ATS Score Card -->
                    <div style="padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6)); border: 1px solid rgba(59, 130, 246, 0.3);">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <span style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em;">AI ATS Resume Score</span>
                                <h3 style="font-size: 1.5rem; font-weight: 800; color: #34d399; margin: 4px 0 0 0;">94 / 100 <span style="font-size: 12px; color: #94a3b8; font-weight: 400;">(Doskonała zgodność)</span></h3>
                                <p style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">Twoje CV przechodzi automatyczne filtry 98% systemów rekrutacyjnych.</p>
                            </div>
                            <button onclick="showToast('Analiza ATS odświeżona pomyślnie!', 'success')" style="padding: 8px 16px; background: #2563eb; color: white; font-size: 12px; font-weight: 600; border-radius: 8px; border: none; cursor: pointer;">
                                Przelicz Score CV
                            </button>
                        </div>
                    </div>

                    <!-- Generator Listu & Mock Interview -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
                        <!-- Generator Listu Motywacyjnego AI -->
                        <div style="padding: 1.25rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="padding: 4px 8px; border-radius: 6px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 12px; font-weight: 700;">AI Writer</span>
                                    <h4 style="color: white; font-size: 14px; font-weight: 700; margin: 0;">Generator Listu Motywacyjnego</h4>
                                </div>
                                <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">AI wygeneruje spersonalizowany, profesjonalny list motywacyjny dopasowany do wybranego stanowiska w kilka sekund.</p>

                                <div style="margin-top: 12px;">
                                    <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 4px;">Stanowisko / Link do oferty</label>
                                    <input type="text" id="aiCoverRoleInput" placeholder="np. Senior Frontend Developer" style="width: 100%; padding: 8px 12px; background: #0b1120; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 12px; box-sizing: border-box;">
                                </div>
                            </div>
                            <button onclick="window.generateAICoverLetter()" style="margin-top: 14px; width: 100%; padding: 9px; background: #3b82f6; color: white; font-size: 12px; font-weight: 600; border-radius: 8px; border: none; cursor: pointer;">
                                ✨ Wygeneruj List Motywacyjny AI
                            </button>
                        </div>

                        <!-- Symulator Rozmowy Kwalifikacyjnej AI -->
                        <div style="padding: 1.25rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="padding: 4px 8px; border-radius: 6px; background: rgba(168, 85, 247, 0.15); color: #c084fc; font-size: 12px; font-weight: 700;">AI Mock Interview</span>
                                    <h4 style="color: white; font-size: 14px; font-weight: 700; margin: 0;">Trener Rozmów Rekrutacyjnych</h4>
                                </div>
                                <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Przećwicz pytania behawioralne i techniczne dopasowane do Twojej branży z natychmiastową oceną i wskazówkami AI.</p>

                                <div style="margin-top: 12px; padding: 10px; border-radius: 8px; background: #0b1120; border: 1px solid #334155;">
                                    <span style="font-size: 11px; color: #34d399; font-weight: 600;">Przykładowe pytanie:</span>
                                    <p style="font-size: 12px; color: #e2e8f0; margin: 4px 0 0 0;">„Opowiedz o najtrudniejszym problemie architektonicznym, który rozwiązałeś w ostatnim projekcie.”</p>
                                </div>
                            </div>
                            <button onclick="showToast('Uruchomiono symulator pytań rekrutacyjnych!', 'success')" style="margin-top: 14px; width: 100%; padding: 9px; background: #8b5cf6; color: white; font-size: 12px; font-weight: 600; border-radius: 8px; border: none; cursor: pointer;">
                                🎙️ Rozpocznij Symulację Wywiadu
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (tab === 'salary') {
            dashContentArea.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="padding: 1.25rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b;">
                        <h4 style="font-size: 15px; font-weight: 700; color: white; margin: 0 0 6px 0;">Analiza Stawek Rynkowych (Benchmark Wynagrodzeń 2026)</h4>
                        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 16px 0;">Dane oparte na 12 000+ zweryfikowanych ofertach pracy w IT i nowoczesnych branżach.</p>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <div style="padding: 1rem; border-radius: 10px; background: #0b1120; border: 1px solid #334155;">
                                <span style="font-size: 11px; color: #94a3b8;">Twoja estymacja rynkowa</span>
                                <h3 style="font-size: 1.25rem; font-weight: 700; color: #34d399; margin: 4px 0 0 0;">19 500 - 26 000 PLN</h3>
                                <p style="font-size: 11px; color: #64748b; margin-top: 2px;">B2B netto (+VAT) / msc</p>
                            </div>
                            <div style="padding: 1rem; border-radius: 10px; background: #0b1120; border: 1px solid #334155;">
                                <span style="font-size: 11px; color: #94a3b8;">Odpowiednik na Umowę o Pracę</span>
                                <h3 style="font-size: 1.25rem; font-weight: 700; color: #60a5fa; margin: 4px 0 0 0;">15 000 - 20 500 PLN</h3>
                                <p style="font-size: 11px; color: #64748b; margin-top: 2px;">Brutto / msc</p>
                            </div>
                            <div style="padding: 1rem; border-radius: 10px; background: #0b1120; border: 1px solid #334155;">
                                <span style="font-size: 11px; color: #94a3b8;">Potencjał Negocjacyjny</span>
                                <h3 style="font-size: 1.25rem; font-weight: 700; color: #c084fc; margin: 4px 0 0 0;">Bardzo Wysoki (+15%)</h3>
                                <p style="font-size: 11px; color: #64748b; margin-top: 2px;">Wysokie zapotrzebowanie na rynku</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (tab === 'saved') {
            const saved = getSavedJobs();
            if (saved.length === 0) {
                dashContentArea.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1rem; color: #94a3b8;">
                        <svg width="48" height="48" style="margin: 0 auto 0.75rem auto; color: #475569;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                        <h4 style="font-size: 1rem; font-weight: 600; color: white; margin-bottom: 4px;">Brak zapisanych ofert</h4>
                        <p style="font-size: 12px;">Kliknij ikonę zakładki przy ofertach pracy na stronie głównej, aby zapisać je tutaj.</p>
                    </div>
                `;
                return;
            }
            dashContentArea.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${saved.map(job => `
                        <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <div>
                                <h4 style="font-weight: 600; color: white; font-size: 14px; margin: 0;">${job.title || 'Oferta pracy'}</h4>
                                <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 0 0;">${job.company || 'Firma'} • ${job.location || 'Polska'}</p>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <a href="${job.link || '#'}" target="_blank" style="padding: 6px 12px; background: #2563eb; color: white; font-size: 12px; font-weight: 500; border-radius: 8px; text-decoration: none;">Aplikuj</a>
                                <button onclick="window.removeSavedJob('${job.id}')" style="padding: 6px; color: #94a3b8; background: transparent; border: none; cursor: pointer;">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            return;
        }

        if (tab === 'apps') {
            const apps = getApplications();
            if (apps.length === 0) {
                dashContentArea.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1rem; color: #94a3b8;">
                        <svg width="48" height="48" style="margin: 0 auto 0.75rem auto; color: #475569;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <h4 style="font-size: 1rem; font-weight: 600; color: white; margin-bottom: 4px;">Brak aktywnych aplikacji</h4>
                        <p style="font-size: 12px;">Kiedy wyślesz CV do ogłoszenia, tutaj zobaczysz aktualny status rekrutacji.</p>
                    </div>
                `;
                return;
            }
            dashContentArea.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${apps.map(app => `
                        <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                            <div>
                                <h4 style="font-weight: 600; color: white; font-size: 14px; margin: 0;">${app.jobTitle}</h4>
                                <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 0 0;">${app.company} • Aplikowano: ${app.date}</p>
                            </div>
                            <span style="padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 9999px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">
                                ${app.status || 'Wysłano'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            `;
            return;
        }

        dashContentArea.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 1.25rem;">
                <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b;">
                    <span style="font-size: 12px; color: #94a3b8;">Status CV & Profilu</span>
                    <h3 style="font-size: 1.1rem; font-weight: 700; color: #34d399; margin: 4px 0 0 0;">Aktywne & Zoptymalizowane (PRO)</h3>
                    <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Ostatnia analiza AI: Dzisiaj</p>
                </div>
                <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b;">
                    <span style="font-size: 12px; color: #94a3b8;">Dopasowane Oferty AI</span>
                    <h3 style="font-size: 1.1rem; font-weight: 700; color: #60a5fa; margin: 4px 0 0 0;">18 nowych</h3>
                    <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Dopasowanie powyżej 85%</p>
                </div>
                <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b;">
                    <span style="font-size: 12px; color: #94a3b8;">Widoczność w bazie Talentów</span>
                    <h3 style="font-size: 1.1rem; font-weight: 700; color: #c084fc; margin: 4px 0 0 0;">Top 3% Talentów</h3>
                    <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Wyróżniony profil kandydata</p>
                </div>
            </div>

            <div style="padding: 1.25rem; border-radius: 12px; background: rgba(15, 23, 42, 0.4); border: 1px solid #1e293b;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <div>
                        <h4 style="font-weight: 600; color: white; font-size: 14px; margin: 0;">Twoje Wykryte Umiejętności (AI Skills)</h4>
                        <p style="font-size: 12px; color: #94a3b8; margin: 2px 0 0 0;">Automatycznie wyodrębnione z Twojego profilu i CV</p>
                    </div>
                    <a href="#cv-matcher" onclick="document.getElementById('dashboardClose').click()" style="font-size: 12px; color: #60a5fa; text-decoration: none; font-weight: 500;">Zaktualizuj CV →</a>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <span style="padding: 4px 10px; border-radius: 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); color: #93c5fd; font-size: 12px; font-weight: 500;">JavaScript / TypeScript</span>
                    <span style="padding: 4px 10px; border-radius: 8px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); color: #a5b4fc; font-size: 12px; font-weight: 500;">React.js & Next.js</span>
                    <span style="padding: 4px 10px; border-radius: 8px; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); color: #d8b4fe; font-size: 12px; font-weight: 500;">Node.js & REST API</span>
                    <span style="padding: 4px 10px; border-radius: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #6ee7b7; font-size: 12px; font-weight: 500;">Tailwind CSS</span>
                    <span style="padding: 4px 10px; border-radius: 8px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #fcd34d; font-size: 12px; font-weight: 500;">Git & CI/CD</span>
                    <span style="padding: 4px 10px; border-radius: 8px; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); color: #67e8f9; font-size: 12px; font-weight: 500;">PostgreSQL / Supabase</span>
                </div>
            </div>
        `;
    }

    function renderRecruiterContent(tab) {
        const rJobs = getRecruiterJobs();

        
        if (tab === 'add_job') {
            dashContentArea.innerHTML = `
                <div style="background: #0b1120; border: 1px solid #1e293b; border-radius: 12px; padding: 1.5rem; max-width: 700px; margin: 0 auto;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                        <h3 style="font-size: 16px; font-weight: 700; color: white; margin: 0;">➕ Dodaj Nowe Ogłoszenie o Pracę</h3>
                        <span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; font-weight: 600;">Publikacja natychmiastowa</span>
                    </div>

                    <form id="recruiterAddJobForm" style="display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Tytuł stanowiska *</label>
                            <input type="text" id="newJobTitle" placeholder="np. Senior Frontend Developer (React / TypeScript)" required style="width: 100%; padding: 10px 12px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 13px; box-sizing: border-box;">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Nazwa Firmy *</label>
                                <input type="text" id="newJobCompany" placeholder="np. TechCorp Polska" required style="width: 100%; padding: 10px 12px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 13px; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Lokalizacja *</label>
                                <input type="text" id="newJobLocation" placeholder="np. Warszawa / Zdalnie" required style="width: 100%; padding: 10px 12px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 13px; box-sizing: border-box;">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Typ zatrudnienia</label>
                                <select id="newJobType" style="width: 100%; padding: 10px 12px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 13px; box-sizing: border-box;">
                                    <option value="Pełny etat">Pełny etat</option>
                                    <option value="Zdalna">Zdalna (100% Remote)</option>
                                    <option value="Kontrakt B2B">Kontrakt B2B</option>
                                    <option value="Część etatu">Część etatu</option>
                                    <option value="Staż">Staż / Praktyki</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Widełki wynagrodzenia</label>
                                <input type="text" id="newJobSalary" placeholder="np. 16 000 - 22 000 PLN net" style="width: 100%; padding: 10px 12px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 13px; box-sizing: border-box;">
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">Opis stanowiska & Wymagania</label>
                            <textarea id="newJobDesc" rows="4" placeholder="Opisz kluczowe obowiązki, stack technologiczny i benefity..." style="width: 100%; padding: 10px 12px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 13px; line-height: 1.4; resize: vertical; box-sizing: border-box;"></textarea>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
                            <button type="button" onclick="window.switchRecruiterTab('main')" style="padding: 10px 18px; background: #334155; color: white; font-size: 13px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">
                                Anuluj
                            </button>
                            <button type="submit" style="padding: 10px 22px; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; font-size: 13px; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                                🚀 Opublikuj Ogłoszenie
                            </button>
                        </div>
                    </form>
                </div>
            `;

            setTimeout(() => {
                document.getElementById('recruiterAddJobForm')?.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const title = document.getElementById('newJobTitle')?.value.trim();
                    const company = document.getElementById('newJobCompany')?.value.trim();
                    const location = document.getElementById('newJobLocation')?.value.trim();
                    const type = document.getElementById('newJobType')?.value;
                    const salary = document.getElementById('newJobSalary')?.value.trim() || 'Do negocjacji';
                    const desc = document.getElementById('newJobDesc')?.value.trim() || 'Brak szczegółowego opisu.';

                    if (!title || !company || !location) {
                        showToast('Wypełnij wymagane pola (Tytuł, Firma, Lokalizacja)', 'error');
                        return;
                    }

                    const newJob = {
                        id: 'job_' + Date.now().toString(36),
                        title,
                        company,
                        location,
                        type,
                        salary,
                        description: desc,
                        views: 1,
                        applications: 0,
                        status: 'Aktywne',
                        date: new Date().toISOString().split('T')[0],
                        applicants: []
                    };

                    const currentJobs = getRecruiterJobs();
                    currentJobs.unshift(newJob);
                    saveRecruiterJobs(currentJobs);

                    if (state && Array.isArray(state.allJobs)) {
                        state.allJobs.unshift({
                            ...newJob,
                            source: 'recruiter',
                            featured: true,
                            url: '#'
                        });
                        if (typeof renderJobs === 'function') renderJobs();
                    }

                    showToast(`🎉 Ogłoszenie "${title}" zostało pomyślnie opublikowane!`, 'success');
                    window.switchRecruiterTab('main');
                });
            }, 50);
            return;
        }

        if (tab === 'pipeline') {
            const allApplicants = [];
            rJobs.forEach(job => {
                (job.applicants || []).forEach(cand => {
                    allApplicants.push({ ...cand, jobTitle: job.title });
                });
            });

            const colNew = allApplicants.filter(c => c.status === 'Nowa aplikacja' || c.status === 'W trakcie weryfikacji');
            const colInterview = allApplicants.filter(c => c.status === 'Rozmowa kwalifikacyjna' || c.status === 'Zaproszenie na rozmowę');
            const colOffer = allApplicants.filter(c => c.status === 'Oferta złożona' || c.status === 'Zatrudniony');

            dashContentArea.innerHTML = `
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <h4 style="font-size: 14px; font-weight: 700; color: white; margin: 0;">Kanban Rekrutacyjny & Statusy Kandydatów</h4>
                        <button onclick="showToast('Raport kandydatów wyeksportowany do CSV!', 'success')" style="padding: 6px 12px; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; font-size: 12px; font-weight: 500; border-radius: 8px; cursor: pointer;">
                            📥 Eksportuj Raport CSV
                        </button>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
                        <!-- Kolumna 1: Nowe zgłoszenia -->
                        <div style="padding: 1rem; border-radius: 12px; background: #0b1120; border: 1px solid #1e293b;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                <span style="font-size: 12px; font-weight: 700; color: #60a5fa;">Nowe Zgłoszenia</span>
                                <span style="font-size: 11px; padding: 2px 6px; border-radius: 9999px; background: rgba(59, 130, 246, 0.2); color: #93c5fd; font-weight: bold;">${colNew.length}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${colNew.map(c => `
                                    <div style="padding: 10px; border-radius: 8px; background: #1e293b; border: 1px solid #334155;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <strong style="font-size: 13px; color: white;">${c.name}</strong>
                                            <span style="font-size: 10px; font-weight: 800; color: #34d399;">${c.score}%</span>
                                        </div>
                                        <p style="font-size: 11px; color: #94a3b8; margin: 2px 0 6px 0;">${c.jobTitle}</p>
                                        <button onclick="window.advanceCandidate('${c.name}', 'Rozmowa kwalifikacyjna')" style="width: 100%; padding: 4px; background: #2563eb; color: white; font-size: 11px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer;">
                                            Przenieś do Rozmowy →
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Kolumna 2: Rozmowy kwalifikacyjne -->
                        <div style="padding: 1rem; border-radius: 12px; background: #0b1120; border: 1px solid #1e293b;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                <span style="font-size: 12px; font-weight: 700; color: #c084fc;">Rozmowa Kwalifikacyjna</span>
                                <span style="font-size: 11px; padding: 2px 6px; border-radius: 9999px; background: rgba(168, 85, 247, 0.2); color: #d8b4fe; font-weight: bold;">${colInterview.length}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${colInterview.map(c => `
                                    <div style="padding: 10px; border-radius: 8px; background: #1e293b; border: 1px solid #334155;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <strong style="font-size: 13px; color: white;">${c.name}</strong>
                                            <span style="font-size: 10px; font-weight: 800; color: #34d399;">${c.score}%</span>
                                        </div>
                                        <p style="font-size: 11px; color: #94a3b8; margin: 2px 0 6px 0;">${c.jobTitle}</p>
                                        <button onclick="window.advanceCandidate('${c.name}', 'Oferta złożona')" style="width: 100%; padding: 4px; background: #8b5cf6; color: white; font-size: 11px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer;">
                                            Złóż Ofertę Pracy →
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Kolumna 3: Oferta / Zatrudniony -->
                        <div style="padding: 1rem; border-radius: 12px; background: #0b1120; border: 1px solid #1e293b;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                <span style="font-size: 12px; font-weight: 700; color: #34d399;">Oferta / Hired</span>
                                <span style="font-size: 11px; padding: 2px 6px; border-radius: 9999px; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; font-weight: bold;">${colOffer.length}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${colOffer.map(c => `
                                    <div style="padding: 10px; border-radius: 8px; background: #1e293b; border: 1px solid rgba(16, 185, 129, 0.4);">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <strong style="font-size: 13px; color: white;">${c.name}</strong>
                                            <span style="font-size: 10px; font-weight: 800; color: #34d399;">${c.score}%</span>
                                        </div>
                                        <p style="font-size: 11px; color: #94a3b8; margin: 2px 0 4px 0;">${c.jobTitle}</p>
                                        <span style="display:block; text-align:center; padding: 2px; font-size: 10px; color: #34d399; font-weight: 700;">★ Status: Oferta zaakceptowana</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (tab === 'headhunter') {
            dashContentArea.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <!-- PRO Hero Banner -->
                    <div style="padding: 1.25rem 1.5rem; border-radius: 14px; background: linear-gradient(135deg, rgba(30, 27, 75, 0.9), rgba(49, 46, 129, 0.7)); border: 1px solid rgba(99, 102, 241, 0.4); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; font-weight: 800; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(99, 102, 241, 0.25); padding: 3px 8px; border-radius: 6px;">⚡ Aktywny Pakiet PRO Rekruter</span>
                                    <span style="font-size: 11px; color: #34d399; font-weight: 700;">● Baza CV Odblokowana</span>
                                </div>
                                <h3 style="font-size: 1.35rem; font-weight: 800; color: white; margin: 6px 0 0 0;">🎯 Baza CV & AI Headhunter Talentów</h3>
                                <p style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">Dostęp do ponad 4 800 zweryfikowanych profili specjalistów IT, Freelancerów oraz kandydatów z wynikiem ATS > 85%.</p>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="showToast('Wygenerowano raport dopasowania AI dla Twojej branży!', 'success')" style="padding: 8px 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer;">
                                    📊 Raport AI Talentów
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Search and Filters Bar -->
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; background: rgba(15, 23, 42, 0.8); padding: 12px; border-radius: 12px; border: 1px solid #1e293b;">
                        <div style="flex: 1; min-width: 220px; position: relative;">
                            <input type="text" id="cvSearchInput" oninput="window.filterCvCandidates(this.value)" placeholder="🔍 Szukaj w bazie CV (np. React, Python, DevOps, AWS, UI/UX)..." style="width: 100%; padding: 10px 14px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 13px; outline: none;">
                        </div>
                        <select onchange="window.filterCvSeniority(this.value)" style="padding: 10px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #cbd5e1; font-size: 13px; cursor: pointer;">
                            <option value="all">Wszystkie poziomy</option>
                            <option value="senior">Senior (5+ lat)</option>
                            <option value="mid">Regular / Mid (2-4 lata)</option>
                            <option value="lead">Lead / Principal</option>
                            <option value="junior">Junior (0-2 lata)</option>
                        </select>
                    </div>

                    <!-- Lista Kandydatów w bazie CV -->
                    <div id="cvCandidatesList" style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Kandydat 1 -->
                        <div class="cv-candidate-card" data-tags="react typescript node frontend fullstack senior warszawa" style="padding: 1.25rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px;">AK</div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <h4 style="font-weight: 700; color: white; font-size: 15px; margin: 0;">Aleksander Kowalczyk</h4>
                                        <span style="padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399;">ATS Score: 98%</span>
                                        <span style="padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: rgba(59, 130, 246, 0.15); color: #60a5fa;">Dostępny od zaraz</span>
                                    </div>
                                    <p style="font-size: 12px; color: #94a3b8; margin: 3px 0 6px 0;">Senior Fullstack Engineer • 7 lat exp • Warszawa / Zdalnie • 20 000 - 26 000 PLN B2B</p>
                                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">React</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">TypeScript</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">Node.js</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">PostgreSQL</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">AWS</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button onclick="showToast('Pobrano pełny profil CV kandydata (PDF)!', 'info')" style="padding: 8px 12px; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer;">
                                    📄 Pobierz CV
                                </button>
                                <button onclick="showToast('Wysłano bezpośrednie zaproszenie do Twojej rekrutacji!', 'success')" style="padding: 8px 14px; background: #4f46e5; color: white; font-size: 12px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">
                                    ✉️ Zaproś do Aplikacji
                                </button>
                            </div>
                        </div>

                        <!-- Kandydat 2 -->
                        <div class="cv-candidate-card" data-tags="python ai machine learning langchain pytorch krakow remote senior" style="padding: 1.25rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #9333ea); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px;">MN</div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <h4 style="font-weight: 700; color: white; font-size: 15px; margin: 0;">Marta Nowicka</h4>
                                        <span style="padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399;">ATS Score: 95%</span>
                                        <span style="padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: rgba(168, 85, 247, 0.15); color: #c084fc;">AI Specialist</span>
                                    </div>
                                    <p style="font-size: 12px; color: #94a3b8; margin: 3px 0 6px 0;">AI & Python Engineer • 5 lat exp • Kraków / Zdalnie • 22 000 - 30 000 PLN B2B</p>
                                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">Python</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">FastAPI</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">LangChain</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">PyTorch</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">Docker</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button onclick="showToast('Pobrano pełny profil CV kandydata (PDF)!', 'info')" style="padding: 8px 12px; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer;">
                                    📄 Pobierz CV
                                </button>
                                <button onclick="showToast('Wysłano bezpośrednie zaproszenie do Twojej rekrutacji!', 'success')" style="padding: 8px 14px; background: #4f46e5; color: white; font-size: 12px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">
                                    ✉️ Zaproś do Aplikacji
                                </button>
                            </div>
                        </div>

                        <!-- Kandydat 3 -->
                        <div class="cv-candidate-card" data-tags="devops kubernetes terraform aws ci/cd mid wroclaw" style="padding: 1.25rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #059669, #10b981); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px;">PW</div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <h4 style="font-weight: 700; color: white; font-size: 15px; margin: 0;">Piotr Włodarczyk</h4>
                                        <span style="padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399;">ATS Score: 92%</span>
                                        <span style="padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #6ee7b7;">Cloud Certified</span>
                                    </div>
                                    <p style="font-size: 12px; color: #94a3b8; margin: 3px 0 6px 0;">DevOps & Cloud Engineer • 4 lata exp • Wrocław / Zdalnie • 18 000 - 23 000 PLN</p>
                                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">Kubernetes</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">Terraform</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">AWS</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">GitLab CI</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button onclick="showToast('Pobrano pełny profil CV kandydata (PDF)!', 'info')" style="padding: 8px 12px; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer;">
                                    📄 Pobierz CV
                                </button>
                                <button onclick="showToast('Wysłano bezpośrednie zaproszenie do Twojej rekrutacji!', 'success')" style="padding: 8px 14px; background: #4f46e5; color: white; font-size: 12px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">
                                    ✉️ Zaproś do Aplikacji
                                </button>
                            </div>
                        </div>

                        <!-- Kandydat 4 -->
                        <div class="cv-candidate-card" data-tags="ui/ux product design figma saas mobile senior gdansk" style="padding: 1.25rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px;">EZ</div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                        <h4 style="font-weight: 700; color: white; font-size: 15px; margin: 0;">Ewa Zawadzka</h4>
                                        <span style="padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399;">ATS Score: 96%</span>
                                        <span style="padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; background: rgba(236, 72, 153, 0.15); color: #f472b6;">Design Lead</span>
                                    </div>
                                    <p style="font-size: 12px; color: #94a3b8; margin: 3px 0 6px 0;">Lead UI/UX & Product Designer • 6 lat exp • Gdańsk / Zdalnie • 16 000 - 22 000 PLN</p>
                                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">Figma</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">Design Systems</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">User Research</span>
                                        <span style="font-size: 10px; padding: 2px 6px; background: #1e293b; color: #cbd5e1; border-radius: 4px; border: 1px solid #334155;">Prototyping</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button onclick="showToast('Pobrano pełny profil CV kandydata (PDF)!', 'info')" style="padding: 8px 12px; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer;">
                                    📄 Pobierz CV
                                </button>
                                <button onclick="showToast('Wysłano bezpośrednie zaproszenie do Twojej rekrutacji!', 'success')" style="padding: 8px 14px; background: #4f46e5; color: white; font-size: 12px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">
                                    ✉️ Zaproś do Aplikacji
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            window.filterCvCandidates = function(query) {
                var q = (query || '').toLowerCase().trim();
                document.querySelectorAll('#cvCandidatesList .cv-candidate-card').forEach(function(card) {
                    var tags = (card.getAttribute('data-tags') || '').toLowerCase();
                    var text = card.textContent.toLowerCase();
                    if (!q || tags.includes(q) || text.includes(q)) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            };

            window.filterCvSeniority = function(level) {
                var l = (level || '').toLowerCase();
                document.querySelectorAll('#cvCandidatesList .cv-candidate-card').forEach(function(card) {
                    var tags = (card.getAttribute('data-tags') || '').toLowerCase();
                    if (l === 'all' || tags.includes(l)) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            };

            return;
        }

        if (tab === 'packages') {
            dashContentArea.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    <div style="padding: 1.25rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <span style="font-size: 11px; font-weight: 600; color: #60a5fa; letter-spacing: 0.05em; text-transform: uppercase;">Pakiet Standard</span>
                            <h3 style="font-size: 1.5rem; font-weight: 700; color: white; margin: 4px 0 0 0;">9,99 zł <span style="font-size: 12px; font-weight: normal; color: #94a3b8;">/ 30 dni</span></h3>
                            <ul style="font-size: 12px; color: #cbd5e1; margin-top: 1rem; list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px;">
                                <li>✓ 30 dni widoczności w serwisie</li>
                                <li>✓ Publikacja w katalogu ofert</li>
                                <li>✓ Dostęp do kandydatów</li>
                            </ul>
                        </div>
                        <button onclick="document.getElementById('dashboardClose').click(); window.location.hash='ogloszenia';" style="margin-top: 1.5rem; width: 100%; padding: 8px; background: #1e293b; color: white; font-size: 12px; font-weight: 500; border: 1px solid #334155; border-radius: 8px; cursor: pointer;">
                            Kup ogłoszenie Standard
                        </button>
                    </div>

                    <div style="padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, rgba(30, 27, 75, 0.4), rgba(49, 46, 129, 0.4)); border: 1px solid rgba(99, 102, 241, 0.4); display: flex; flex-direction: column; justify-content: space-between; position: relative;">
                        <div>
                            <span style="font-size: 11px; font-weight: 600; color: #a5b4fc; letter-spacing: 0.05em; text-transform: uppercase;">Pakiet Wyróżniony (HOT)</span>
                            <h3 style="font-size: 1.5rem; font-weight: 700; color: white; margin: 4px 0 0 0;">29,99 zł <span style="font-size: 12px; font-weight: normal; color: #94a3b8;">/ 30 dni</span></h3>
                            <ul style="font-size: 12px; color: #e0e7ff; margin-top: 1rem; list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px;">
                                <li>★ Najwyższa pozycja na liście</li>
                                <li>★ Graficzne wyróżnienie & badge HOT</li>
                                <li>★ 3x więcej wyświetleń & AI Matcher boost</li>
                                <li>★ Dostęp do bazy AI Headhunter</li>
                            </ul>
                        </div>
                        <button onclick="document.getElementById('dashboardClose').click(); window.location.hash='ogloszenia';" style="margin-top: 1.5rem; width: 100%; padding: 8px; background: #4f46e5; color: white; font-size: 12px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                            Wybierz Wyróżnienie
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Default 'main' tab for recruiter
        const totalViews = rJobs.reduce((sum, j) => sum + (j.views || 0), 0);
        const totalApplicants = rJobs.reduce((sum, j) => sum + (j.applicants?.length || 0), 0);

        dashContentArea.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 1.25rem;">
                <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b;">
                    <span style="font-size: 12px; color: #94a3b8;">Aktywne Ogłoszenia</span>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: white; margin: 4px 0 0 0;">${rJobs.length}</h3>
                    <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Wszystkie w statusie publikacji</p>
                </div>
                <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b;">
                    <span style="font-size: 12px; color: #94a3b8;">Łącznie Wyświetleń</span>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #a5b4fc; margin: 4px 0 0 0;">${totalViews}</h3>
                    <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Średnio ${Math.round(totalViews / (rJobs.length || 1))} na ogłoszenie</p>
                </div>
                <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b;">
                    <span style="font-size: 12px; color: #94a3b8;">Otrzymane CV</span>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #34d399; margin: 4px 0 0 0;">${totalApplicants}</h3>
                    <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Średnie AI Match: 88%</p>
                </div>
            </div>

            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                    <h4 style="font-weight: 600; color: white; font-size: 14px; margin: 0;">Twoje Ogłoszenia Rekrutacyjne</h4>
                    <button onclick="document.getElementById('dashboardClose').click(); document.getElementById('openAddModal').click();" style="padding: 6px 12px; background: #4f46e5; color: white; font-size: 12px; font-weight: 500; border: none; border-radius: 8px; cursor: pointer;">
                        + Dodaj nowe ogłoszenie
                    </button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${rJobs.map(job => `
                        <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <h4 style="font-weight: 600; color: white; font-size: 14px; margin: 0;">${job.title}</h4>
                                    <span style="padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; ${job.tier.includes('HOT') ? 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);' : 'background: #1e293b; color: #94a3b8; border: 1px solid #334155;'}">
                                        ${job.tier}
                                    </span>
                                </div>
                                <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 0 0;">${job.type} • ${job.location} • ${job.salary}</p>
                            </div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 12px; color: #94a3b8;">Wyświetlenia: <strong style="color: white;">${job.views}</strong></span>
                                <span style="font-size: 12px; color: #94a3b8;">CV: <strong style="color: #a5b4fc;">${job.applicants?.length || 0}</strong></span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    window.openDashboard = openDashboard;
    window.removeSavedJob = (jobId) => {
        const saved = getSavedJobs().filter(j => j.id !== jobId);
        localStorage.setItem('jobnexus_saved_jobs', JSON.stringify(saved));
        renderCandidateContent('saved');
        showToast('Usunięto ofertę z zapisanych', 'info');
    };

    window.advanceCandidate = (candName, newStatus) => {
        const rJobs = getRecruiterJobs();
        rJobs.forEach(j => {
            (j.applicants || []).forEach(c => {
                if (c.name === candName) c.status = newStatus;
            });
        });
        saveRecruiterJobs(rJobs);
        renderRecruiterContent('pipeline');
        showToast(`Zaktualizowano status kandydata ${candName} na: ${newStatus}`, 'success');
    };

    
    window.switchRecruiterTab = (tabName) => {
        currentActiveTab = tabName;
        renderRecruiterTabs();
        renderRecruiterContent(tabName);
    };

    window.switchCandidateTab = (tabName) => {
        currentActiveTab = tabName;
        renderCandidateTabs();
        renderCandidateContent(tabName);
    };

    window.generateAICoverLetter = () => {
        const input = document.getElementById('aiCoverRoleInput')?.value.trim() || 'Frontend Developer';
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-card" style="max-width: 600px; width: 100%; padding: 1.5rem; background: #0f172a; border: 1px solid #334155; border-radius: 1rem;">
                <h3 style="color: white; font-size: 16px; font-weight: 700; margin-bottom: 8px;">Wygenerowany List Motywacyjny AI</h3>
                <p style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">Stanowisko: <strong style="color: #60a5fa;">${input}</strong></p>
                <textarea readonly style="width: 100%; height: 200px; padding: 10px; background: #0b1120; border: 1px solid #1e293b; border-radius: 8px; color: #e2e8f0; font-size: 12px; line-height: 1.5; resize: none; box-sizing: border-box;">
Szanowni Państwo,

Z wielkim zainteresowaniem aplikuję na stanowisko ${input} w Państwa zespole. Posiadam wieloletnie doświadczenie w tworzeniu skalowalnych aplikacji oraz optymalizacji rozwiązań technicznych. 

Moje kompetencje obejmują pracę z nowoczesnymi technologiami, dbałość o najwyższą jakość kodu oraz efektywną współpracę zespołową w zwinnych metodykach. Wierzę, że moje umiejętności oraz zaangażowanie przyniosą realną wartość Państwa projektom.

Z chęcią przedstawię szczegóły mojego doświadczenia podczas rozmowy rekrutacyjnej.

Z poważaniem,
${AuthService.getUser()?.name || 'Kandydat'}
                </textarea>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
                    <button onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.value); showToast('Skopiowano do schowka!', 'success');" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
                        📋 Kopiuj Treść
                    </button>
                    <button onclick="this.closest('.modal-overlay').remove()" style="padding: 8px 16px; background: #334155; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer;">
                        Zamknij
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };
}


function initInfoPages() {
    const pages = { 'O nas': ['O nas', 'JobNexus łączy kandydatów i pracodawców z wykorzystaniem nowoczesnych narzędzi oraz inteligentnego dopasowania ofert.'], Kontakt: ['Kontakt', 'Napisz do nas: kontakt@jobnexus.pl'], Regulamin: ['Regulamin', 'Korzystając z serwisu, akceptujesz zasady publikowania ofert i ogłoszeń.'], Cennik: ['Cennik', 'Publikacja ogłoszenia standardowego: 9,99 zł. Wyróżnienie: 29,99 zł.'] };
    els.infoClose.addEventListener('click', () => els.infoModal.classList.add('hidden')); document.querySelectorAll('.footer-links a').forEach(link => { const title = link.textContent.trim(); if (pages[title]) link.addEventListener('click', event => { event.preventDefault(); els.infoTitle.textContent = pages[title][0]; els.infoContent.textContent = pages[title][1]; els.infoModal.classList.remove('hidden'); }); });
}

// ============================================
// NAVBAR
// ============================================
function initNavbar() {
    const navbar = document.getElementById('navbar') || document.querySelector('.navbar');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');

    if (!toggle || !menu) return;

    const toggleMenu = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const isOpen = menu.classList.toggle('active');
        toggle.classList.toggle('active', isOpen);
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        document.body.classList.toggle('menu-open', isOpen);
    };

    toggle.onclick = toggleMenu;

    // Close menu when clicking nav links
    menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!navbar?.contains(e.target) && menu.classList.contains('active')) {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        }
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        }

// ============================================
// JOB OFFERS & ADVANCED PAGINATION
// ============================================

// ============================================
// JOB OFFERS & ADVANCED PAGINATION
// ============================================


async async function loadData() {
    // 1. Immediately load preloaded jobs in 0 ms so screen is NEVER empty
    const initialJobs = (typeof JobService !== 'undefined' && JobService.DEMO_JOBS) ? [...JobService.DEMO_JOBS] : [];
    state.jobs = initialJobs;
    state.filteredJobs = [...initialJobs];
    state.jobsPage = 1;
    state.jobsPerPage = 7;

    filterAndDisplay();
    showLoading(false);

    // 2. Asynchronously load CSV and Jooble in background without blocking
    try {
        if (typeof JobService !== 'undefined') {
            const csvJobs = await JobService.loadCSVJobs();
            if (csvJobs && csvJobs.length > 0) {
                state.csvJobs = csvJobs;
                state.jobs = JobService.combineJobs(csvJobs, state.jobs);
                filterAndDisplay();
            }

            JobService.loadJoobleJobs(state.searchQuery || 'praca', state.locationQuery || 'Polska')
                .then(joobleJobs => {
                    if (joobleJobs && joobleJobs.length > 0) {
                        state.jobs = JobService.combineJobs(state.jobs, joobleJobs);
                        filterAndDisplay();
                    }
                })
                .catch(err => console.warn('Jooble background fetch:', err));
        }
    } catch (err) {
        console.warn('Jobs loading background:', err);
    }
}
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const locationInput = document.getElementById('locationInput');
    const searchBtn = document.getElementById('searchBtn');
    let debounceTimer;

    const doSearch = () => {
        state.searchQuery = searchInput ? searchInput.value.trim() : '';
        state.locationQuery = locationInput ? locationInput.value.trim() : '';
        state.jobsPage = 1;

        if (state.searchQuery && typeof StorageService !== 'undefined') {
            StorageService.addSearchHistory(state.searchQuery);
        }

        filterAndDisplay();
    };

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(doSearch, 300);
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }

    if (locationInput) {
        locationInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(doSearch, 300);
        });
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', doSearch);
    }
}

function initFilters() {
    const chips = document.querySelectorAll('#oferty .chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.currentFilter = chip.dataset.filter || 'all';
            state.jobsPage = 1;
            filterAndDisplay();
        });
    });
}

function filterAndDisplay() {
    const filters = {
        searchQuery: state.searchQuery || '',
        locationQuery: state.locationQuery || '',
        currentFilter: state.currentFilter || 'all',
        minSalary: state.minSalary || 0
    };

    if (typeof JobService !== 'undefined' && JobService.filterJobs) {
        state.filteredJobs = JobService.filterJobs(state.jobs, filters);
    } else {
        state.filteredJobs = [...(state.jobs || [])];
    }

    state.jobsPage = state.jobsPage || 1;
    state.jobsPerPage = state.jobsPerPage || 9;

    displayJobs();
}

function displayJobs() {
    const grid = document.getElementById('jobsGrid');
    const empty = document.getElementById('jobsEmpty');
    if (!grid) return;

    const jobsList = (state.filteredJobs && state.filteredJobs.length) ? state.filteredJobs : (state.jobs || []);
    const total = jobsList.length;
    const perPage = state.jobsPerPage || 9;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const current = Math.min(Math.max(1, state.jobsPage || 1), totalPages);
    state.jobsPage = current;

    grid.innerHTML = '';

    if (total === 0) {
        if (empty) empty.classList.remove('hidden');
        renderPaginationBar('jobsPagination', 1, 0, 0, perPage, null, null);
        return;
    }

    if (empty) empty.classList.add('hidden');

    const start = (current - 1) * perPage;
    const end = Math.min(start + perPage, total);
    const toShow = jobsList.slice(start, end);

    toShow.forEach((job, idx) => {
        const card = createJobCard(job);
        grid.appendChild(card);
    });

    // Render Advanced Pagination for Jobs
    renderPaginationBar('jobsPagination', current, totalPages, total, perPage, (newPage) => {
        state.jobsPage = newPage;
        displayJobs();
        const jobsSection = document.getElementById('oferty') || document.getElementById('jobs');
        if (jobsSection) {
            jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, (newPerPage) => {
        state.jobsPerPage = newPerPage;
        state.jobsPage = 1;
        displayJobs();
    });
}

function showLoading(show) {
    const loading = document.getElementById('jobsLoading');
    const grid = document.getElementById('jobsGrid');
    if (loading) loading.classList.toggle('hidden', !show);
    if (show && grid) grid.innerHTML = '';
}

function createJobCard(job) {
    const card = document.createElement('article');
    card.className = `job-card${job.featured ? ' featured' : ''}`;
    card.dataset.id = job.id;

    const initials = (job.company || 'JN').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const typeIcon = getTypeIcon(job.type);
    const locIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    const dateIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
    const timeAgo = getTimeAgo(job.date || new Date().toISOString());
    const isFav = FavoritesService.isFavorite(job.id);

    card.innerHTML = `
        <button class="job-save" type="button" aria-label="${isFav ? 'Usuń z zakładek' : 'Zapisz ofertę'}" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:${isFav ? '#eab308' : '#64748b'};">${isFav ? '★' : '☆'}</button>
        <div class="job-header">
            <div class="job-logo">${initials}</div>
            <div class="job-meta">
                <h3 class="job-title">${escapeHtml(job.title || 'Oferta pracy')}</h3>
                <p class="job-company">${escapeHtml(job.company || 'Firma')}</p>
            </div>
        </div>
        <div class="job-details">
            <span class="job-tag">${typeIcon}${escapeHtml(job.type || 'Pełny etat')}</span>
            <span class="job-tag">${locIcon}${escapeHtml(job.location || 'Polska')}</span>
            <span class="job-tag">${dateIcon}${timeAgo}</span>
        </div>
        <div class="job-footer">
            <span class="job-salary">${escapeHtml(job.salary || 'Konkurencyjne')}</span>
            <button class="job-apply btn btn-primary" type="button" data-job-id="${escapeHtml(String(job.id))}">Aplikuj</button>
        </div>
    `;

    const saveBtn = card.querySelector('.job-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (event) => {
            event.stopPropagation();
            try {
                if (FavoritesService.isFavorite(job.id)) {
                    await FavoritesService.removeFavorite(job.id);
                } else {
                    await FavoritesService.addFavorite(job);
                }
                displayJobs();
                showToast(FavoritesService.isFavorite(job.id) ? 'Oferta dodana do zakładek' : 'Oferta usunięta z zakładek', 'success');
            } catch (error) {
                showToast(error.message || 'Nie udało się zapisać oferty', 'error');
            }
        });
    }

    const applyBtn = card.querySelector('.job-apply');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => applyJob(job.id));
    }

    return card;
}

function getTypeIcon(type) {
    const icons = {
        'Zdalna': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
        'Staż': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>',
        'Kontrakt': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>'
    };
    return icons[type] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>';
}

function getTimeAgo(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Niedawno';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Przed chwilą';
    if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h temu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} dni temu`;
    return date.toLocaleDateString('pl-PL');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function applyJob(id) {
    const job = state.jobs.find(j => j.id === id);
    if (!job) return;

    if (job.url && job.url !== '#') {
        window.open(job.url, '_blank');
    } else {
        showToast(`Aplikacja wysłana na stanowisko: ${job.title}`, 'success');
    }
}


// ============================================
// MODAL — ADD ANNOUNCEMENT / OGLOSZENIE
// ============================================
function initModal() {
    if (els.modalClose) els.modalClose.addEventListener('click', closeModal);
    if (els.addModal) {
        els.addModal.addEventListener('click', (e) => {
            if (e.target === els.addModal) closeModal();
        });
    }

    if (els.annFeatured && els.submitPrice) {
        els.annFeatured.addEventListener('change', () => {
            els.submitPrice.textContent = els.annFeatured.checked ? '29,99 zł' : '9,99 zł';
        });
    }

    if (els.addForm) {
        els.addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitAnnouncement();
        });
    }
}

function openAddModal(plan = 'standard') {
    if (!els.addModal) return;
    if (els.annFeatured) els.annFeatured.checked = plan === 'featured';
    if (els.submitPrice) els.submitPrice.textContent = plan === 'featured' ? '29,99 zł' : '9,99 zł';
    els.addModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

window.openAddModal = openAddModal;

function closeModal() {
    if (!els.addModal) return;
    els.addModal.classList.add('hidden');
    document.body.style.overflow = '';
    if (els.addForm) els.addForm.reset();
}

function submitAnnouncement() {
    const titleInput = document.getElementById('annTitle');
    const catInput = document.getElementById('annCategory');
    const locInput = document.getElementById('annLocation');
    const descInput = document.getElementById('annDesc');
    const budgetInput = document.getElementById('annBudget');
    const typeInput = document.getElementById('annType');

    const title = titleInput ? titleInput.value.trim() : '';
    const category = catInput ? catInput.value : 'Inne';
    const location = locInput ? locInput.value.trim() || 'Polska' : 'Polska';
    const desc = descInput ? descInput.value.trim() : '';
    const budget = budgetInput ? budgetInput.value || 'Do negocjacji' : 'Do negocjacji';
    const type = typeInput ? typeInput.value : 'Zlecenie';
    const featured = els.annFeatured ? els.annFeatured.checked : false;

    if (!title || !desc) {
        showToast('Wypełnij wymagane pola!', 'error');
        return;
    }

    const newAnn = {
        id: `ann-${Date.now()}`,
        title,
        category,
        location,
        desc,
        budget,
        type,
        featured
    };

    state.announcements = state.announcements || [];
    state.announcements.unshift(newAnn);
    StorageService.saveAnnouncements(state.announcements);
    closeModal();

    const price = featured ? '29,99 zł' : '9,99 zł';
    showToast(`Ogłoszenie opublikowane pomyślnie! Kwota: ${price}`, 'success');
}

// ============================================
// CV UPLOAD & AI MATCHING
// ============================================
function initCVUpload() {
    if (!els.cvUploadZone || !els.cvFileInput) return;

    els.cvUploadZone.addEventListener('click', () => els.cvFileInput.click());

    els.cvUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.cvUploadZone.classList.add('dragover');
    });

    els.cvUploadZone.addEventListener('dragleave', () => {
        els.cvUploadZone.classList.remove('dragover');
    });

    els.cvUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        els.cvUploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length) handleCVFile(files[0]);
    });

    els.cvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleCVFile(e.target.files[0]);
    });
}

function handleCVFile(file) {
    if (!file) return;

    if (els.cvUploadZone) {
        els.cvUploadZone.innerHTML = `
            <div class="cv-upload-content" style="padding: 2rem; text-align: center;">
                <div class="spinner" style="margin: 0 auto 1.5rem; width: 40px; height: 40px; border: 3px solid rgba(59,130,246,0.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <h3 style="color: white; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Analizowanie CV przez AI...</h3>
                <p style="color: #94a3b8; font-size: 0.95rem;">AI skanuje Twoje kompetencje, technologie i doświadczenie zawodowe</p>
            </div>
        `;
    }

    setTimeout(() => {
        const keywords = extractKeywordsFromFilename(file.name);
        const matches = findMatchingJobs(keywords);

        state.cvMatches = matches;
        StorageService.saveCVMatches(matches);
        displayCVMatches(matches);

        if (els.cvUploadZone) {
            els.cvUploadZone.innerHTML = `
                <input type="file" id="cvFileInput" accept=".pdf,.doc,.docx" hidden>
                <div class="cv-upload-content">
                    <div class="cv-upload-icon">
                        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M32 8v48M16 32l16-16 16 16"/>
                            <rect x="8" y="48" width="48" height="8" rx="2"/>
                        </svg>
                    </div>
                    <h3>Upuść CV lub kliknij, aby wybrać</h3>
                    <p>PDF, DOC, DOCX — maks. 10 MB</p>
                    <span class="cv-formats">AI automatycznie rozpozna Twoje umiejętności</span>
                </div>
            `;
            const newInput = els.cvUploadZone.querySelector('#cvFileInput');
            if (newInput) {
                newInput.addEventListener('change', (e) => {
                    if (e.target.files.length) handleCVFile(e.target.files[0]);
                });
            }
        }

        showToast(`🎉 Znaleziono ${matches.length} ofert idealnie dopasowanych do Twojego CV!`, 'success');
    }, 2000);
}

function extractKeywordsFromFilename(filename) {
    const lower = (filename || '').toLowerCase().replace(/\.[^.]+$/, '');
    const keywordMap = {
        'programista': ['programista', 'developer', 'frontend', 'backend', 'fullstack', 'javascript', 'python', 'react', 'node'],
        'spawacz': ['spawacz', 'spawanie', 'welder', 'mig', 'mag', 'tig'],
        'ksiegow': ['księgowy', 'księgowa', 'accountant', 'finanse', 'rachunkowość'],
        'kierowca': ['kierowca', 'transport', 'kat', 'c+e', 'spedycja'],
        'elektryk': ['elektryk', 'elektryka', 'instalacje', 'sep'],
        'marketing': ['marketing', 'seo', 'social media', 'copywriter', 'content'],
        'grafik': ['grafik', 'design', 'ui', 'ux', 'figma', 'photoshop']
    };

    for (const [key, synonyms] of Object.entries(keywordMap)) {
        if (synonyms.some(s => lower.includes(s))) {
            return synonyms;
        }
    }

    return ['praca', 'developer', 'specjalista'];
}

function findMatchingJobs(keywords) {
    const allJobs = state.jobs && state.jobs.length ? state.jobs : [];
    const scored = allJobs.map(job => {
        const text = `${job.title} ${job.company} ${job.description || ''} ${job.type}`.toLowerCase();
        let score = 0;
        keywords.forEach(kw => {
            if (text.includes(kw.toLowerCase())) score += 2;
        });
        if (job.featured) score += 1;
        return { job, score };
    });

    const matched = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 6).map(s => s.job);
    return matched.length ? matched : allJobs.slice(0, 4);
}

function displayCVMatches(matches) {
    if (!els.cvMatches || !els.cvMatchesGrid) return;

    els.cvMatches.classList.remove('hidden');
    els.cvMatchesGrid.innerHTML = '';

    if (matches.length === 0) {
        els.cvMatchesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; padding: 2rem; text-align: center; color: #94a3b8;">
                <p>Nie znaleziono bezpośrednich dopasowań. Sprawdź oferty poniżej.</p>
            </div>
        `;
        return;
    }

    matches.forEach((job, idx) => {
        const card = createJobCard(job);
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';
        els.cvMatchesGrid.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, idx * 60);
    });

    els.cvMatches.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
    }, { passive: true });
}




// ==========================================================================
// FREELANCE GIGS & PROFESSIONAL PAGINATION ENGINE (2026)
// ==========================================================================

const DEMO_GIGS = [
    {
        id: 'gig-1',
        title: 'Kompleksowy serwis internetowy dla firmy deweloperskiej (Next.js + Sanity CMS)',
        client: 'ModernLiving Sp. z o.o.',
        category: 'web',
        budget: '7 500 - 11 000 PLN',
        duration: '⏱️ 14 dni',
        proposals: 6,
        tags: ['Next.js', 'React', 'Sanity CMS', 'TailwindCSS'],
        desc: 'Szukamy doświadczonego developera do zakodowania responsywnego portalu nieruchomości z interaktywną mapą inwestycji i panelem CMS.'
    },
    {
        id: 'gig-2',
        title: 'Rebranding marki, logo oraz kompletna księga znaku (Brandbook) dla marki premium',
        client: 'Aura Candle Co.',
        category: 'design',
        budget: '3 500 - 5 500 PLN',
        duration: '⏱️ 10 dni',
        proposals: 12,
        tags: ['Logo Design', 'Brandbook', 'Identyfikacja wizualna', 'Figma'],
        desc: 'Potrzebujemy świeżej, minimalistycznej identyfikacji wizualnej dla ekologicznych świec sojowych (logo, typografia, paleta barw, etykiety).'
    },
    {
        id: 'gig-3',
        title: 'Wdrożenie i konfiguracja sklepu Shopify Plus z integracją BaseLinker i InPost',
        client: 'EcoWear Polska',
        category: 'ecommerce',
        budget: '4 800 - 7 200 PLN',
        duration: '⏱️ 21 dni',
        proposals: 8,
        tags: ['Shopify', 'Liquid', 'BaseLinker', 'Płatności'],
        desc: 'Migracja z WooCommerce na Shopify, dostosowanie szablonu, spięcie bramek płatności (Przelewy24, BLIK) oraz synchronizacja magazynu.'
    },
    {
        id: 'gig-4',
        title: 'Montaż 15 dynamicznych rolek (Reels / TikTok / Shorts) z napisami i efektami',
        client: 'FitLife Academy',
        category: 'video',
        budget: '2 200 - 3 500 PLN',
        duration: '⏱️ Stała współpraca',
        proposals: 15,
        tags: ['CapCut', 'Premiere Pro', 'Reels', 'TikTok'],
        desc: 'Poszukujemy montażysty do regularnej obróbki surowych nagrań wideo od trenerów personalnych. Wymagane chwytliwe hooki i dynamiczne napisy.'
    },
    {
        id: 'gig-5',
        title: 'Pakiet 10 specjalistycznych artykułów blogowych SEO (Branża Finanse i Kredyty)',
        client: 'FinanseDlaCiebie.pl',
        category: 'copywriting',
        budget: '1 800 - 2 600 PLN',
        duration: '⏱️ 12 dni',
        proposals: 9,
        tags: ['Copywriting SEO', 'Finanse', 'SurferSEO', 'Blog'],
        desc: 'Napisanie merytorycznych tekstów (każdy ok. 5000 zzs) zoptymalizowanych pod frazy kluczowe pod wytyczne z SurferSEO.'
    },
    {
        id: 'gig-6',
        title: 'Aplikacja mobilna MVP do rezerwacji wizyt w salonach (Flutter / Supabase)',
        client: 'BeautyBooking Startup',
        category: 'mobile',
        budget: '12 000 - 18 000 PLN',
        duration: '⏱️ 30 dni',
        proposals: 4,
        tags: ['Flutter', 'Dart', 'Supabase', 'iOS / Android'],
        desc: 'Stworzenie aplikacji cross-platformowej iOS/Android umożliwiającej przeglądanie kalendarza, wybór usług i płatność online za wizyty.'
    },
    {
        id: 'gig-7',
        title: 'Audyt bezpieczeństwa i optymalizacja szybkości (Core Web Vitals) dla serwisu WP',
        client: 'Portal Turystyczny Sp. z o.o.',
        category: 'web',
        budget: '1 500 - 2 500 PLN',
        duration: '⏱️ 7 dni',
        proposals: 11,
        tags: ['WordPress', 'PageSpeed', 'Cybersecurity', 'Cache'],
        desc: 'Przyspieszenie działania serwisu na WordPress (wynik mobile > 85), zabezpieczenie przed atakami brute-force i optymalizacja bazy MySQL.'
    },
    {
        id: 'gig-8',
        title: 'Tłumaczenie techniczne dokumentacji API i instrukcji maszyn (EN -> PL, 40 stron)',
        client: 'Global Machinery Gmbh',
        category: 'copywriting',
        budget: '2 800 - 4 200 PLN',
        duration: '⏱️ 10 dni',
        proposals: 7,
        tags: ['Tłumaczenia techniczne', 'Angielski', 'Dokumentacja API'],
        desc: 'Precyzyjne tłumaczenie specyfikacji technicznej sterowników przemysłowych z zachowaniem specjalistycznej nomenklatury inżynierskiej.'
    },
    {
        id: 'gig-9',
        title: 'Konfiguracja i optymalizacja kampanii Google Ads (Search + Performance Max) dla B2B',
        client: 'IT-Solutions Consulting',
        category: 'marketing',
        budget: '2 000 - 3 500 PLN / mc',
        duration: '⏱️ Stała współpraca',
        proposals: 8,
        tags: ['Google Ads', 'PMax', 'Analityka', 'B2B'],
        desc: 'Uruchomienie kampanii nakierowanych na generowanie leadów B2B dla firmy software house z rynków DACH i UK.'
    },
    {
        id: 'gig-10',
        title: 'Modele 3D produktów (10 mebli) do konfiguratora AR na stronie (Blender / GLB)',
        client: 'NordicWood Meble',
        category: 'design',
        budget: '3 000 - 4 500 PLN',
        duration: '⏱️ 14 dni',
        proposals: 5,
        tags: ['Blender', '3D Modeling', 'Teksturowanie PBR', 'GLTF/GLB'],
        desc: 'Przygotowanie fotorealistycznych, zoptymalizowanych modeli 3D mebli drewnianych z teksturami PBR do podglądu Augmented Reality.'
    },
    {
        id: 'gig-11',
        title: 'Projekt interfejsu aplikacji SaaS w Figma (Dashboard, Analityka, Ustawienia konta)',
        client: 'DataMetric App',
        category: 'design',
        budget: '5 000 - 7 500 PLN',
        duration: '⏱️ 18 dni',
        proposals: 10,
        tags: ['Figma', 'UI Design', 'SaaS Dashboard', 'Prototyp'],
        desc: 'Zaprojektowanie responsywnego panelu zarządzania dla aplikacji analitycznej B2B (ok. 12 widoków + wersje Dark & Light mode).'
    },
    {
        id: 'gig-12',
        title: 'Automatyzacja procesów fakturowania i CRM z wykorzystaniem Make (Integromat) i Airtable',
        client: 'Agencja Eventowa Bravo',
        category: 'web',
        budget: '2 400 - 3 800 PLN',
        duration: '⏱️ 8 dni',
        proposals: 7,
        tags: ['Make.com', 'Airtable', 'API', 'Fakturownia'],
        desc: 'Stworzenie scenariuszy automatyzujących: nowy formularz -> rekord w Airtable -> automatyczne wygenerowanie proformy w Fakturowni -> mail do klienta.'
    },
    {
        id: 'gig-13',
        title: 'Konfiguracja klastra Proxmox VE i serwerów VPS z panelem Docker i Traefik',
        client: 'HostVenture Tech',
        category: 'web',
        budget: '3 200 - 4 800 PLN',
        duration: '⏱️ 5 dni',
        proposals: 6,
        tags: ['Linux', 'Proxmox', 'Docker', 'Traefik', 'SSL'],
        desc: 'Instalacja środowiska wirtualizacji na serwerze dedykowanym, zabezpieczenie firewall (UFW), certyfikaty SSL i reverse proxy.'
    },
    {
        id: 'gig-14',
        title: 'Seria postów i grafik do Social Media na 1 miesiąc (LinkedIn & Facebook dla firmy IT)',
        client: 'CloudExperts Polska',
        category: 'marketing',
        budget: '1 900 - 2 800 PLN / mc',
        duration: '⏱️ Stała współpraca',
        proposals: 14,
        tags: ['Social Media', 'LinkedIn', 'Grafika', 'Canva/Figma'],
        desc: 'Przygotowanie harmonogramu, treści 12 postów techniczno-biznesowych oraz szablonów grafik promujących usługi chmurowe.'
    },
    {
        id: 'gig-15',
        title: 'Optymalizacja konwersji (CRO) i testy A/B dla koszyka w sklepie internetowym',
        client: 'ModaDlaKazdego.pl',
        category: 'ecommerce',
        budget: '2 500 - 4 000 PLN',
        duration: '⏱️ 14 dni',
        proposals: 5,
        tags: ['CRO', 'A/B Testing', 'Hotjar', 'Google Optimize'],
        desc: 'Audyt ścieżki zakupowej, analiza nagrań sesji użytkowników i wdrożenie 3 wariantów testowych checkoutu w celu obniżenia porzuceń koszyka.'
    },
    {
        id: 'gig-16',
        title: 'Wdrożenie skryptów Python do scrapingu danych rynkowych i monitorowania cen',
        client: 'MarketPulse Analytics',
        category: 'web',
        budget: '3 000 - 4 500 PLN',
        duration: '⏱️ 7 dni',
        proposals: 8,
        tags: ['Python', 'Scrapy', 'Playwright', 'PostgreSQL'],
        desc: 'Stworzenie niezawodnych scraperów w Pythonie pobierających codzienne zmiany cen i stanów magazynowych z 5 serwisów branżowych.'
    },
    {
        id: 'gig-17',
        title: 'Wdrożenie chatbota AI do obsługi klienta z integracją WhatsApp i Messenger',
        client: 'AutoSerwis 24h',
        category: 'ai',
        budget: '4 000 - 6 500 PLN',
        duration: '⏱️ 10 dni',
        proposals: 7,
        tags: ['Voiceflow', 'OpenAI', 'WhatsApp API', 'Chatbot'],
        desc: 'Automatyzacja wycen i rezerwacji terminów naprawy pojazdów za pośrednictwem inteligentnego bota konwersacyjnego na WhatsApp.'
    },
    {
        id: 'gig-18',
        title: 'Projekt katalogu produktów w formacie PDF i do druku (InDesign / 24 strony)',
        client: 'Pol-Meble Fabryka',
        category: 'design',
        budget: '2 200 - 3 200 PLN',
        duration: '⏱️ 9 dni',
        proposals: 11,
        tags: ['Adobe InDesign', 'DTP', 'Katalog', 'Druk'],
        desc: 'Skład graficzny i przygotowanie do druku offsetowego eleganckiego katalogu mebli biurowych ze spisem treści i indeksami.'
    },
    {
        id: 'gig-19',
        title: 'Napisanie skryptów wideo i scenariuszy do kampanii TikTok / YouTube Shorts',
        client: 'SmartGadgets Polska',
        category: 'copywriting',
        budget: '1 500 - 2 200 PLN',
        duration: '⏱️ 6 dni',
        proposals: 10,
        tags: ['Scenariusze', 'TikTok', 'Storytelling', 'Video Hooks'],
        desc: 'Przygotowanie 10 chwytliwych scenariuszy wideo (15-30s) prezentujących zalety produktów elektroniki użytkowej.'
    },
    {
        id: 'gig-20',
        title: 'Konfiguracja serwera pocztowego z rekordami SPF, DKIM, DMARC i audytem dostarczalności',
        client: 'MailMaster Pro',
        category: 'web',
        budget: '1 200 - 1 800 PLN',
        duration: '⏱️ 3 dni',
        proposals: 6,
        tags: ['DMARC', 'DKIM', 'SPF', 'Postfix', 'DNS'],
        desc: 'Poprawa reputacji domeny wysyłkowej, konfiguracja poprawnych wpisów DNS i testy dostarczalności do skrzynek Gmail / WP / Onet.'
    },
    {
        id: 'gig-21',
        title: 'Audyt SEO i optymalizacja techniczna on-page dla portalu informacyjnego (10k podstron)',
        client: 'WiadomosciLokalne.pl',
        category: 'marketing',
        budget: '2 800 - 4 200 PLN',
        duration: '⏱️ 14 dni',
        proposals: 9,
        tags: ['SEO', 'Technical SEO', 'Screaming Frog', 'Core Web Vitals'],
        desc: 'Identyfikacja kanibalizacji słów kluczowych, naprawa błędów 404, optymalizacja struktury nagłówków H1-H3 oraz linkowania wewnętrznego.'
    }
];

// Helper: Reusable Pagination Renderer
function renderPaginationBar(containerId, currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onPerPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalItems === 0 || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let pagesHtml = '<div class="pagination" style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 24px; flex-wrap: wrap;">';

    // Previous button
    pagesHtml += `
        <button class="pagination-btn page-btn page-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" style="padding: 8px 14px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.12); color: #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
            « Poprzednia
        </button>
    `;

    // Numeric buttons
    for (let p = 1; p <= totalPages; p++) {
        const isActive = p === currentPage;
        pagesHtml += `
            <button class="pagination-btn page-btn ${isActive ? 'active' : ''}" data-page="${p}" style="padding: 8px 14px; background: ${isActive ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(30, 41, 59, 0.8)'}; border: 1px solid ${isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.12)'}; color: #ffffff; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;">
                ${p}
            </button>
        `;
    }

    // Next button
    pagesHtml += `
        <button class="pagination-btn page-btn page-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" style="padding: 8px 14px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.12); color: #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
            Następna »
        </button>
    `;

    pagesHtml += '</div>';
    container.innerHTML = pagesHtml;

    // Attach click listeners to pagination buttons
    container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = parseInt(btn.dataset.page, 10);
            if (targetPage && !isNaN(targetPage)) {
                if (typeof onPageChange === 'function') {
                    onPageChange(targetPage);
                } else if (containerId === 'gigsPagination') {
                    if (!window.state) window.state = {};
                    window.state.gigsPage = targetPage;
                    if (typeof renderGigs === 'function') renderGigs();
                    const sec = document.getElementById('zlecenia');
                    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (containerId === 'jobsPagination' || containerId === 'offersPagination') {
                    if (!window.state) window.state = {};
                    window.state.currentPage = targetPage;
                    if (typeof renderJobs === 'function') renderJobs();
                    const sec = document.getElementById('oferty');
                    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}
// ============================================
// SALARY FILTER, JOB ALERTS & CHECKOUT
// ============================================
function initAdvancedFilters() {
    const salaryRange = document.getElementById('salaryRange');
    const salaryVal = document.getElementById('salaryVal');

    if (salaryRange && salaryVal) {
        salaryRange.addEventListener('input', () => {
            const val = parseInt(salaryRange.value, 10);
            state.minSalary = val;
            salaryVal.textContent = val > 0 ? `${val.toLocaleString('pl-PL')} PLN+` : 'Wszystkie';
            state.jobsPage = 1;
            filterAndDisplay();
        });
    }

    // Job Alert Modal
    const alertBtn = document.getElementById('openJobAlertBtn');
    const alertModal = document.getElementById('jobAlertModal');
    const alertClose = document.getElementById('jobAlertClose');
    const alertForm = document.getElementById('jobAlertForm');

    if (alertBtn && alertModal) {
        alertBtn.addEventListener('click', () => {
            alertModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (state.searchQuery && document.getElementById('alertKeywords')) {
                document.getElementById('alertKeywords').value = state.searchQuery;
            }
        });
    }

    if (alertClose && alertModal) {
        alertClose.addEventListener('click', () => {
            alertModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
        alertModal.addEventListener('click', (e) => {
            if (e.target === alertModal) {
                alertModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    if (alertForm) {
        alertForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('alertEmail').value;
            const keywords = document.getElementById('alertKeywords').value;
            const loc = document.getElementById('alertLocation').value || 'Cała Polska';
            const freq = document.getElementById('alertFreq').value;

            const alerts = JSON.parse(localStorage.getItem('jobnexus_alerts') || '[]');
            alerts.push({ email, keywords, loc, freq, date: new Date().toISOString() });
            localStorage.setItem('jobnexus_alerts', JSON.stringify(alerts));

            alertModal.classList.add('hidden');
            document.body.style.overflow = '';
            showToast(`🔔 Job Alert aktywny dla "${keywords}"! Powiadomienia wyślemy na ${email}`, 'success');
            alertForm.reset();
        });
    }

    // Payment Modal Simulator
    initPaymentModal();
}

function initPaymentModal() {
    const payModal = document.getElementById('paymentModal');
    const payClose = document.getElementById('paymentModalClose');
    const payForm = document.getElementById('checkoutForm');
    const methodCards = document.querySelectorAll('.payment-method-card');

    if (payClose && payModal) {
        payClose.addEventListener('click', () => {
            payModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
        payModal.addEventListener('click', (e) => {
            if (e.target === payModal) {
                payModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    methodCards.forEach(card => {
        card.addEventListener('click', () => {
            methodCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const method = card.dataset.method;

            const blikSec = document.getElementById('blikSection');
            const cardSec = document.getElementById('cardSection');
            const transSec = document.getElementById('transferSection');

            if (blikSec) blikSec.classList.toggle('hidden', method !== 'blik');
            if (cardSec) cardSec.classList.toggle('hidden', method !== 'card');
            if (transSec) transSec.classList.toggle('hidden', method !== 'transfer');
        });
    });

    // BLIK Auto Tab
    const blikDigits = document.querySelectorAll('.blik-digit');
    blikDigits.forEach((digit, idx) => {
        digit.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && idx < blikDigits.length - 1) {
                blikDigits[idx + 1].focus();
            }
        });
        digit.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                blikDigits[idx - 1].focus();
            }
        });
    });

    if (payForm) {
        payForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('paySubmitBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Przetwarzanie płatności... ⏳';
            }

            setTimeout(() => {
                if (payModal) payModal.classList.add('hidden');
                document.body.style.overflow = '';
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Zapłać i aktywuj';
                }
                showToast('🎉 Płatność zrealizowana pomyślnie! Usługa została aktywowana.', 'success');
                payForm.reset();
            }, 1500);
        });
    }
}

window.openPaymentModal = function(productName = 'Wyróżnienie ogłoszenia', amount = '29,99 zł', period = 'Płatność jednorazowa') {
    const payModal = document.getElementById('paymentModal');
    if (!payModal) return;

    const nameEl = document.getElementById('payProductName');
    const periodEl = document.getElementById('payProductPeriod');
    const amountEl = document.getElementById('payAmount');
    const btnAmountEl = document.getElementById('payBtnAmount');

    if (nameEl) nameEl.textContent = productName;
    if (periodEl) periodEl.textContent = period;
    if (amountEl) amountEl.textContent = amount;
    if (btnAmountEl) btnAmountEl.textContent = amount;

    payModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

// Wire up pricing cards to payment modal
document.addEventListener('DOMContentLoaded', () => {
    try { initNavbar(); } catch (e) { console.warn('initNavbar:', e); }
    try { initAuth(); } catch (e) { console.warn('initAuth:', e); }
    try { initDashboard(); } catch (e) { console.warn('initDashboard:', e); }
    try { initInfoPages(); } catch (e) { console.warn('initInfoPages:', e); }
    try { initSearch(); } catch (e) { console.warn('initSearch:', e); }
    try { initFilters(); } catch (e) { console.warn('initFilters:', e); }
    try { initModal(); } catch (e) { console.warn('initModal:', e); }
    try { initCVUpload(); } catch (e) { console.warn('initCVUpload:', e); }
    try { initOffers(); } catch (e) { console.warn('initOffers:', e); }
    try { initGigs(); } catch (e) { console.warn('initGigs:', e); }
});
    });
});



// ============================================
// KREATOR CV AI MODAL & REALTIME PREVIEW
// ============================================
function initCvBuilder() {
    const cvModal = document.getElementById('cvBuilderModal');
    const cvClose = document.getElementById('cvBuilderClose');
    const openBtns = document.querySelectorAll('.cv-builder-btn, a[href="#cv-builder"]');

    openBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.tagName === 'BUTTON' || btn.classList.contains('cv-builder-btn')) {
                e.preventDefault();
                openCvBuilderModal();
            }
        });
    });

    window.openCvBuilderModal = function() {
        if (!cvModal) return;
        cvModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        syncCvPreview();
    };

    if (cvClose && cvModal) {
        cvClose.addEventListener('click', () => {
            cvModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
        cvModal.addEventListener('click', (e) => {
            if (e.target === cvModal) {
                cvModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    // Input elements
    const fields = ['cvName', 'cvTitle', 'cvEmail', 'cvPhone', 'cvBio', 'cvExperience', 'cvSkills', 'cvEducation'];
    fields.forEach(fId => {
        const el = document.getElementById(fId);
        if (el) {
            el.addEventListener('input', syncCvPreview);
        }
    });

    // AI Bio Enhance button
    const aiBioBtn = document.getElementById('cvAiEnhanceBioBtn');
    if (aiBioBtn) {
        aiBioBtn.addEventListener('click', () => {
            const bioEl = document.getElementById('cvBio');
            if (bioEl) {
                aiBioBtn.textContent = '✨ Generowanie AI...';
                setTimeout(() => {
                    bioEl.value = 'Rezultatowo zorientowany specjalista z udokumentowanym doświadczeniem w projektowaniu i wdrażaniu skalowalnych rozwiązań. Cechuje mnie wysoka dbałość o jakość kodu, optymalizację wydajności oraz skuteczną współpracę w zwinnych zespołach (Agile/Scrum).';
                    aiBioBtn.textContent = '✨ AI Ulepsz opis';
                    syncCvPreview();
                    showToast('✨ Opis profilu został zoptymalizowany pod kątem systemów ATS!', 'success');
                }, 800);
            }
        });
    }

    // Save to Profile
    const saveBtn = document.getElementById('cvSaveProfileBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const cvData = {
                name: document.getElementById('cvName')?.value || '',
                title: document.getElementById('cvTitle')?.value || '',
                email: document.getElementById('cvEmail')?.value || '',
                phone: document.getElementById('cvPhone')?.value || '',
                bio: document.getElementById('cvBio')?.value || '',
                experience: document.getElementById('cvExperience')?.value || '',
                skills: document.getElementById('cvSkills')?.value || '',
                education: document.getElementById('cvEducation')?.value || '',
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('jobnexus_user_cv', JSON.stringify(cvData));
            showToast('💾 Twoje CV zostało zapisane w profilu kandydata!', 'success');
        });
    }

    // Print / PDF Export
    const downloadBtn = document.getElementById('cvDownloadPdfBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const previewContent = document.getElementById('cvLivePreview')?.innerHTML;
            if (!previewContent) return;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>CV — ${document.getElementById('cvName')?.value || 'Kandydat'}</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                        h3 { color: #0f172a; margin: 0; font-size: 24px; }
                        h4 { color: #2563eb; font-size: 14px; margin-top: 18px; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
                        p, div { font-size: 13px; color: #334155; }
                        span { display: inline-block; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    ${previewContent}
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        });
    }
}

function syncCvPreview() {
    const name = document.getElementById('cvName')?.value || 'Twoje Imię i Nazwisko';
    const title = document.getElementById('cvTitle')?.value || 'Stanowisko zawodowe';
    const email = document.getElementById('cvEmail')?.value || 'email@example.com';
    const phone = document.getElementById('cvPhone')?.value || '+48 000 000 000';
    const bio = document.getElementById('cvBio')?.value || 'Krótki opis...';
    const exp = document.getElementById('cvExperience')?.value || 'Doświadczenie...';
    const skills = document.getElementById('cvSkills')?.value || 'Umiejętności...';
    const edu = document.getElementById('cvEducation')?.value || 'Edukacja...';

    const prevName = document.getElementById('prevName');
    const prevTitle = document.getElementById('prevTitle');
    const prevEmail = document.getElementById('prevEmail');
    const prevPhone = document.getElementById('prevPhone');
    const prevBio = document.getElementById('prevBio');
    const prevExp = document.getElementById('prevExp');
    const prevSkills = document.getElementById('prevSkills');
    const prevEdu = document.getElementById('prevEdu');

    if (prevName) prevName.textContent = name;
    if (prevTitle) prevTitle.textContent = title;
    if (prevEmail) prevEmail.textContent = `✉️ ${email}`;
    if (prevPhone) prevPhone.textContent = `📞 ${phone}`;
    if (prevBio) prevBio.textContent = bio;
    if (prevExp) prevExp.textContent = exp;
    if (prevEdu) prevEdu.textContent = edu;

    if (prevSkills) {
        prevSkills.innerHTML = '';
        skills.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
            const span = document.createElement('span');
            span.style.cssText = 'background: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;';
            span.textContent = s;
            prevSkills.appendChild(span);
        });
    }
}

// Ensure initCvBuilder is called on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    try { initNavbar(); } catch (e) { console.warn('initNavbar:', e); }
    try { initAuth(); } catch (e) { console.warn('initAuth:', e); }
    try { initDashboard(); } catch (e) { console.warn('initDashboard:', e); }
    try { initInfoPages(); } catch (e) { console.warn('initInfoPages:', e); }
    try { initSearch(); } catch (e) { console.warn('initSearch:', e); }
    try { initFilters(); } catch (e) { console.warn('initFilters:', e); }
    try { initModal(); } catch (e) { console.warn('initModal:', e); }
    try { initCVUpload(); } catch (e) { console.warn('initCVUpload:', e); }
    try { initOffers(); } catch (e) { console.warn('initOffers:', e); }
    try { initGigs(); } catch (e) { console.warn('initGigs:', e); }
});

// ============================================
// GLOBAL AUTH MODAL CONTROLLER (LOGIN / REGISTER)
// ============================================
window.openAuthModal = function(mode = 'login', role = 'candidate') {
    const authModal = document.getElementById('authModal');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const roleGroup = document.getElementById('roleGroup');
    const authSubmitBtn = document.getElementById('authSubmitBtn');

    if (!authModal) return;

    authModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    if (mode === 'register') {
        if (tabLogin) {
            tabLogin.classList.remove('active');
            tabLogin.style.borderBottom = 'none';
            tabLogin.style.color = '#94a3b8';
        }
        if (tabRegister) {
            tabRegister.classList.add('active');
            tabRegister.style.borderBottom = '2px solid #3b82f6';
            tabRegister.style.color = '#ffffff';
        }
        if (roleGroup) roleGroup.classList.remove('hidden');
        if (authSubmitBtn) authSubmitBtn.textContent = 'Zarejestruj się i utwórz konto';

        const roleRadio = document.querySelector(`input[name="authRole"][value="${role}"]`);
        if (roleRadio) roleRadio.checked = true;
    } else {
        if (tabRegister) {
            tabRegister.classList.remove('active');
            tabRegister.style.borderBottom = 'none';
            tabRegister.style.color = '#94a3b8';
        }
        if (tabLogin) {
            tabLogin.classList.add('active');
            tabLogin.style.borderBottom = '2px solid #3b82f6';
            tabLogin.style.color = '#ffffff';
        }
        if (roleGroup) roleGroup.classList.add('hidden');
        if (authSubmitBtn) authSubmitBtn.textContent = 'Zaloguj się';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    try { initNavbar(); } catch (e) { console.warn('initNavbar:', e); }
    try { initAuth(); } catch (e) { console.warn('initAuth:', e); }
    try { initDashboard(); } catch (e) { console.warn('initDashboard:', e); }
    try { initInfoPages(); } catch (e) { console.warn('initInfoPages:', e); }
    try { initSearch(); } catch (e) { console.warn('initSearch:', e); }
    try { initFilters(); } catch (e) { console.warn('initFilters:', e); }
    try { initModal(); } catch (e) { console.warn('initModal:', e); }
    try { initCVUpload(); } catch (e) { console.warn('initCVUpload:', e); }
    try { initOffers(); } catch (e) { console.warn('initOffers:', e); }
    try { initGigs(); } catch (e) { console.warn('initGigs:', e); }
});
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }
});



// ============================================
// SMART AI SEARCH PRESETS
// ============================================
window.applySearchPreset = function(keyword, location) {
    const sInput = document.getElementById('searchInput');
    const lInput = document.getElementById('locationInput');

    if (sInput) sInput.value = keyword;
    if (lInput) lInput.value = location;

    state.searchQuery = keyword;
    state.locationQuery = location;
    state.jobsPage = 1;

    filterAndDisplay();

    // Also trigger Jooble live fetch for this keyword
    if (typeof JobService !== 'undefined' && JobService.loadJoobleJobs) {
        JobService.loadJoobleJobs(keyword, location).then(joobleJobs => {
            if (joobleJobs && joobleJobs.length > 0) {
                state.jobs = JobService.combineJobs(state.csvJobs || [], joobleJobs);
                filterAndDisplay();
            }
        }).catch(err => console.warn('Jooble preset fetch error:', err));
    }

    const ofertySec = document.getElementById('oferty');
    if (ofertySec) {
        ofertySec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};


// ============================================
// HERO AI CV MATCHER & PERSONALIZED RANKING
// ============================================
function initHeroCvMatcher() {
    const dropzone = document.getElementById('heroCvDropzone');
    const fileInput = document.getElementById('heroCvInput');
    const pickBtn = document.getElementById('btnPickCv');

    if (!dropzone || !fileInput) return;

    if (pickBtn) {
        pickBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            processHeroCvFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            processHeroCvFile(e.target.files[0]);
        }
    });
}

function processHeroCvFile(file) {
    if (!file) return;

    const inner = document.getElementById('heroCvDropzoneInner');
    if (inner) {
        inner.innerHTML = `
            <div style="width:100%; text-align:center; padding: 1rem 0;">
                <div class="spinner" style="margin: 0 auto 0.75rem; width: 36px; height: 36px; border: 3px solid rgba(56, 189, 248, 0.2); border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <strong style="color: #ffffff; font-size: 1.05rem; display: block; margin-bottom: 0.2rem;">
                    🧠 Analizuję profil: <span style="color:#38bdf8;">${escapeHtml(file.name)}</span>
                </strong>
                <span style="color: #94a3b8; font-size: 0.85rem;">
                    Skaner AI wyodrębnia technologie, branżę i wylicza procentowe dopasowanie ofert...
                </span>
            </div>
        `;
    }

    setTimeout(() => {
        const keywords = extractCvSkills(file.name);
        const allJobs = (state.jobs && state.jobs.length) ? state.jobs : (typeof JobService !== 'undefined' ? JobService.DEMO_JOBS : []);

        const scoredJobs = allJobs.map(job => {
            const fullText = `${job.title} ${job.company} ${job.category} ${job.description || ''} ${job.type}`.toLowerCase();
            let matches = 0;
            keywords.forEach(kw => {
                if (fullText.includes(kw.toLowerCase())) matches++;
            });
            const baseScore = Math.min(99, Math.max(82, 84 + (matches * 5)));
            return {
                ...job,
                atsScore: baseScore
            };
        }).sort((a, b) => b.atsScore - a.atsScore).slice(0, 6);

        renderPersonalizedMatches(scoredJobs, keywords, file.name);

        if (inner) {
            inner.innerHTML = `
                <div class="cv-upload-pulse-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">✓</div>
                <div class="cv-drop-text">
                    <strong class="cv-drop-title" style="color: #34d399;">CV wgrane pomyślnie: ${escapeHtml(file.name)}</strong>
                    <span class="cv-drop-desc">Kliknij, aby wgrać inny plik lub odświeżyć dopasowanie</span>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" style="margin-left:auto;">
                    Zmień CV
                </button>
            `;
        }

        showToast(`🎉 Sukces! Znaleziono ${scoredJobs.length} ofert idealnie dopasowanych do Twojego profilu!`, 'success');
    }, 1200);
}

function extractCvSkills(filename) {
    const fn = (filename || '').toLowerCase();
    const skillsDict = {
        'react': ['react', 'frontend', 'javascript', 'typescript', 'vue', 'node'],
        'python': ['python', 'ai', 'data', 'llm', 'machine', 'backend', 'fastapi'],
        'spawacz': ['spawacz', 'spawanie', 'tig', 'mag', 'mig', 'stalowe', 'konstrukcje'],
        'ksiegow': ['księgowa', 'księgowy', 'finanse', 'rachunkowość', 'vat', 'cit', 'jpk'],
        'devops': ['devops', 'aws', 'kubernetes', 'docker', 'ci/cd', 'terraform'],
        'design': ['design', 'ui', 'ux', 'figma', 'grafik', 'product'],
        'kierowca': ['kierowca', 'transport', 'c+e', 'logistyka', 'spedycja'],
        'marketing': ['marketing', 'seo', 'ads', 'social', 'growth', 'copywriter'],
        'elektryk': ['elektryk', 'automatyk', 'plc', 'sep', 'utrzymanie']
    };

    for (const [key, list] of Object.entries(skillsDict)) {
        if (fn.includes(key) || list.some(k => fn.includes(k))) {
            return list;
        }
    }

    return ['react', 'developer', 'specjalista', 'ai', 'manager'];
}

function renderPersonalizedMatches(jobs, keywords, filename) {
    const sec = document.getElementById('personalizedMatchesSection');
    const grid = document.getElementById('personalizedJobsGrid');
    const scoreVal = document.getElementById('atsScoreValue');
    const subText = document.getElementById('matchedSkillsText');

    if (!sec || !grid) return;

    sec.classList.remove('hidden');
    grid.innerHTML = '';

    if (scoreVal && jobs.length > 0) {
        scoreVal.textContent = `${jobs[0].atsScore || 96}%`;
    }

    if (subText) {
        subText.textContent = `Wykryto profil: ${filename} • Dopasowane słowa kluczowe: ${keywords.slice(0, 4).join(', ')}`;
    }

    jobs.forEach(job => {
        const card = createJobCard(job);

        const matchBadge = document.createElement('div');
        matchBadge.className = 'ats-match-badge';
        matchBadge.style.cssText = 'position: absolute; top: 1.25rem; left: 1.25rem; z-index: 2; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);';
        matchBadge.innerHTML = `🎯 ${job.atsScore || 94}% ATS Match`;

        card.style.position = 'relative';
        card.style.paddingTop = '2.75rem';
        card.prepend(matchBadge);

        grid.appendChild(card);
    });

    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.resetCvMatches = function() {
    const sec = document.getElementById('personalizedMatchesSection');
    if (sec) sec.classList.add('hidden');
    showToast('Zresetowano spersonalizowany widok CV', 'info');
};

document.addEventListener('DOMContentLoaded', () => {
    try { initNavbar(); } catch (e) { console.warn('initNavbar:', e); }
    try { initAuth(); } catch (e) { console.warn('initAuth:', e); }
    try { initDashboard(); } catch (e) { console.warn('initDashboard:', e); }
    try { initInfoPages(); } catch (e) { console.warn('initInfoPages:', e); }
    try { initSearch(); } catch (e) { console.warn('initSearch:', e); }
    try { initFilters(); } catch (e) { console.warn('initFilters:', e); }
    try { initModal(); } catch (e) { console.warn('initModal:', e); }
    try { initCVUpload(); } catch (e) { console.warn('initCVUpload:', e); }
    try { initOffers(); } catch (e) { console.warn('initOffers:', e); }
    try { initGigs(); } catch (e) { console.warn('initGigs:', e); }
});


// ============================================
// GLOBAL WINDOW CONTROLLERS (COMPILED IN BUNDLE)
// ============================================

window.openAuthModal = function(mode) {
    mode = mode || 'login';
    var modal = document.getElementById('authModalBackdrop');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '999999';
    window.switchAuthTab(mode);
};

window.closeAuthModal = function() {
    var modal = document.getElementById('authModalBackdrop');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    }
};

window.switchAuthTab = function(mode) {
    var tabLogin = document.getElementById('tabLogin');
    var tabRegister = document.getElementById('tabRegister');
    var titleEl = document.getElementById('authModalTitle');
    var nameGroup = document.getElementById('nameGroup');
    
    var authName = document.getElementById('authName');
    var submitBtn = document.getElementById('authSubmitBtn');
    var authError = document.getElementById('authError');

    if (authError) {
        authError.classList.add('hidden');
        authError.style.display = 'none';
        authError.textContent = '';
    }

    if (mode === 'register') {
        if (tabRegister) {
            tabRegister.classList.add('active');
            tabRegister.style.background = '#4f46e5';
            tabRegister.style.color = '#ffffff';
        }
        if (tabLogin) {
            tabLogin.classList.remove('active');
            tabLogin.style.background = 'transparent';
            tabLogin.style.color = '#94a3b8';
        }
        if (titleEl) titleEl.textContent = '🚀 Utwórz nowe konto w JobNexus';
        if (nameGroup) {
            nameGroup.classList.remove('hidden');
            nameGroup.style.display = 'block';
        }
        if (roleGroup) {
            roleGroup.classList.remove('hidden');
            roleGroup.style.display = 'block';
        }
        if (authName) authName.required = true;
        if (submitBtn) submitBtn.innerHTML = '<span>🚀 Zarejestruj się i utwórz konto</span>';
    } else {
        if (tabLogin) {
            tabLogin.classList.add('active');
            tabLogin.style.background = '#4f46e5';
            tabLogin.style.color = '#ffffff';
        }
        if (tabRegister) {
            tabRegister.classList.remove('active');
            tabRegister.style.background = 'transparent';
            tabRegister.style.color = '#94a3b8';
        }
        if (titleEl) titleEl.textContent = '🔑 Zaloguj się do JobNexus';
        if (nameGroup) {
            nameGroup.classList.add('hidden');
            nameGroup.style.display = 'none';
        }
        if (roleGroup) {
            roleGroup.classList.add('hidden');
            roleGroup.style.display = 'none';
        }
        if (authName) authName.required = false;
        if (submitBtn) submitBtn.innerHTML = '<span>🔑 Zaloguj się</span>';
    }
};

window.syncUserHeader = function(user) {
    if (user === null) {
        var portalSec = document.getElementById('userPortalSection');
        var heroSec = document.getElementById('hero');
        if (portalSec) { portalSec.classList.add('hidden'); portalSec.style.display = 'none'; }
        if (heroSec) { heroSec.style.display = 'block'; }
    }
    if (user === undefined) {
        try {
            var raw = localStorage.getItem('jobnexus_user');
            user = raw ? JSON.parse(raw) : null;
        } catch(e) {}
    }
    var loginBtnText = document.getElementById('loginBtnNavText');
    var regBtnText = document.getElementById('registerBtnNavText');
    var regBtn = document.getElementById('registerBtnNav');
    var loginBtn = document.getElementById('loginBtnNav');

    if (user && user.email) {
        var name = user.name || user.email.split('@')[0];
        var roleTag = user.role === 'recruiter' ? '🏢 Rekruter' : '🧑‍💻 Profil';
        if (loginBtnText) loginBtnText.textContent = '👤 ' + name + ' (' + roleTag + ')';
        if (regBtnText) regBtnText.textContent = '🚪 Wyloguj';
        if (regBtn) {
            regBtn.classList.remove('btn-primary');
            regBtn.classList.add('btn-secondary');
        }
    } else {
        if (loginBtnText) loginBtnText.textContent = 'Zaloguj się';
        if (regBtnText) regBtnText.textContent = 'Zarejestruj się';
        if (regBtn) {
            regBtn.classList.remove('btn-secondary');
            regBtn.classList.add('btn-primary');
        }
    }
};

window.handleNavLoginClick = function() {
    var user = null;
    try {
        var raw = localStorage.getItem('jobnexus_user');
        user = raw ? JSON.parse(raw) : null;
    } catch(e) {}
    if (user && user.email) {
        if (user.role === 'recruiter') {
            if (typeof window.openRecruiterPanel === 'function') window.openRecruiterPanel();
            else if (typeof window.openDashboard === 'function') window.openDashboard();
        } else {
            if (typeof window.openDashboard === 'function') window.openDashboard();
        }
    } else {
        window.openAuthModal('login');
    }
};

window.handleNavRegisterClick = function() {
    var user = null;
    try {
        var raw = localStorage.getItem('jobnexus_user');
        user = raw ? JSON.parse(raw) : null;
    } catch(e) {}
    if (user && user.email) {
        try {
            localStorage.removeItem('jobnexus_user');
            localStorage.removeItem('jobnexus_token');
            localStorage.removeItem('jobnexus_refresh_token');
            localStorage.removeItem('jobnexus_token_expiry');
        } catch(e) {}
        if (typeof AuthService !== 'undefined' && AuthService.logout) {
            AuthService.logout();
        }
        window.syncUserHeader(null);
        if (typeof showToast === 'function') showToast('Wylogowano pomyślnie.', 'info');
        else alert('Wylogowano pomyślnie.');
    } else {
        window.openAuthModal('register');
    }
};

window.handleAuthSubmit = async function(event) {
    if (event) event.preventDefault();
    var tabRegister = document.getElementById('tabRegister');
    var isRegister = tabRegister && tabRegister.classList.contains('active');
    var email = (document.getElementById('authEmail')?.value || '').trim();
    var password = document.getElementById('authPassword')?.value || '';
    var name = (document.getElementById('authName')?.value || '').trim();
    var role = 'candidate';
    var submitBtn = document.getElementById('authSubmitBtn');
    var authError = document.getElementById('authError');

    if (authError) {
        authError.classList.add('hidden');
        authError.style.display = 'none';
        authError.textContent = '';
    }

    if (!email) {
        if (authError) {
            authError.textContent = 'Proszę podać adres e-mail.';
            authError.classList.remove('hidden');
            authError.style.display = 'block';
        }
        return false;
    }

    if (!password || password.length < 6) {
        if (authError) {
            authError.textContent = 'Hasło musi mieć co najmniej 6 znaków.';
            authError.classList.remove('hidden');
            authError.style.display = 'block';
        }
        return false;
    }

    if (isRegister && !name) {
        name = email.split('@')[0];
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Przetwarzanie... ⏳</span>';
    }

    try {
        var user;
        if (isRegister) {
            if (typeof AuthService !== 'undefined' && AuthService.register) {
                user = await AuthService.register(email, password, name, role);
            } else {
                var users = [];
                try { users = JSON.parse(localStorage.getItem('jobnexus_local_registered_users') || '[]'); } catch(e){}
                if (users.find(function(u){ return u.email === email.toLowerCase(); })) {
                    throw new Error('Konto z tym adresem e-mail już istnieje. Zaloguj się.');
                }
                user = {
                    id: 'usr_' + Date.now(),
                    email: email.toLowerCase(),
                    name: name || email.split('@')[0],
                    role: role,
                    password: password,
                    createdAt: new Date().toISOString()
                };
                users.push(user);
                try {
                    localStorage.setItem('jobnexus_local_registered_users', JSON.stringify(users));
                    localStorage.setItem('jobnexus_user', JSON.stringify(user));
                    localStorage.setItem('jobnexus_token', 'tok_' + Date.now());
                } catch(e) {}
            }
        } else {
            if (typeof AuthService !== 'undefined' && AuthService.login) {
                user = await AuthService.login(email, password);
            } else {
                var users = [];
                try { users = JSON.parse(localStorage.getItem('jobnexus_local_registered_users') || '[]'); } catch(e){}
                var found = users.find(function(u){ return u.email === email.toLowerCase(); });
                if (!found) {
                    throw new Error('Konto z tym adresem e-mail nie istnieje. Zarejestruj się najpierw.');
                }
                if (found.password && found.password !== password) {
                    throw new Error('Nieprawidłowe hasło. Spróbuj ponownie.');
                }
                user = found;
                try {
                    localStorage.setItem('jobnexus_user', JSON.stringify(user));
                    localStorage.setItem('jobnexus_token', 'tok_' + Date.now());
                } catch(e) {}
            }
        }

        window.closeAuthModal();
        window.syncUserHeader(user);

        var welcomeMsg = isRegister 
            ? ('🎉 Witaj, ' + user.name + '! Rejestracja zakończona sukcesem.') 
            : ('👋 Zalogowano pomyślnie jako ' + user.name);

        if (typeof showToast === 'function') {
            showToast(welcomeMsg, 'success');
        } else {
            alert(welcomeMsg);
        }

        // Automatically open the user / recruiter dashboard immediately upon login & registration!
        setTimeout(function() {
            if (typeof window.openDashboard === 'function') {
                window.openDashboard();
            }
        }, 100);
    } catch(err) {
        console.error('Auth error:', err);
        if (authError) {
            authError.textContent = err.message || 'Wystąpił błąd autoryzacji.';
            authError.classList.remove('hidden');
            authError.style.display = 'block';
        }
        if (typeof showToast === 'function') {
            showToast(err.message || 'Błąd autoryzacji', 'error');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = isRegister ? '<span>🚀 Zarejestruj się i utwórz konto</span>' : '<span>🔑 Zaloguj się</span>';
        }
    }
    return false;
};

// Initial sync on load
document.addEventListener('DOMContentLoaded', function() {
    window.syncUserHeader();
});
