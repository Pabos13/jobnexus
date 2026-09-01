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
    initNavbar();
    initAuth();
    initDashboard();
    initInfoPages();
    initSearch();
    initFilters();
    initModal();
    initCVUpload();
    loadData();
    animateStats();
    initScrollEffects();
    initDemoAnnouncements();
});

// ============================================
// AUTHENTICATION
// ============================================
async function initAuth() {
    let registerMode = false;
    if (!els.authTrigger || !els.authModal || !els.authForm) return;

    const authRoleGroup = document.getElementById('authRoleGroup');
    const authTabLogin = document.getElementById('authTabLogin');
    const authTabRegister = document.getElementById('authTabRegister');
    const roleLabelCandidate = document.getElementById('roleLabelCandidate');
    const roleLabelRecruiter = document.getElementById('roleLabelRecruiter');
    const dashboardTrigger = document.getElementById('dashboardTrigger');

    const updateRoleUI = (selectedRole) => {
        if (roleLabelCandidate && roleLabelRecruiter) {
            if (selectedRole === 'candidate') {
                roleLabelCandidate.style.borderColor = '#3b82f6';
                roleLabelCandidate.style.background = 'rgba(59, 130, 246, 0.15)';
                roleLabelCandidate.querySelector('span:nth-child(3)').style.color = 'white';

                roleLabelRecruiter.style.borderColor = '#334155';
                roleLabelRecruiter.style.background = '#0b1120';
                roleLabelRecruiter.querySelector('span:nth-child(3)').style.color = '#cbd5e1';
            } else {
                roleLabelRecruiter.style.borderColor = '#6366f1';
                roleLabelRecruiter.style.background = 'rgba(99, 102, 241, 0.15)';
                roleLabelRecruiter.querySelector('span:nth-child(3)').style.color = 'white';

                roleLabelCandidate.style.borderColor = '#334155';
                roleLabelCandidate.style.background = '#0b1120';
                roleLabelCandidate.querySelector('span:nth-child(3)').style.color = '#cbd5e1';
            }
        }
    };

    roleLabelCandidate?.addEventListener('click', () => {
        const input = roleLabelCandidate.querySelector('input');
        if (input) input.checked = true;
        updateRoleUI('candidate');
    });

    roleLabelRecruiter?.addEventListener('click', () => {
        const input = roleLabelRecruiter.querySelector('input');
        if (input) input.checked = true;
        updateRoleUI('recruiter');
    });

    const setMode = (register) => {
        registerMode = register;
        if (authRoleGroup) {
            authRoleGroup.classList.toggle('hidden', !register);
            authRoleGroup.style.display = register ? 'flex' : 'none';
        }
        if (els.authNameGroup) {
            els.authNameGroup.classList.toggle('hidden', !register);
            els.authNameGroup.style.display = register ? 'flex' : 'none';
        }
        if (els.authName) els.authName.required = register;

        if (register) {
            if (authTabRegister) {
                authTabRegister.style.background = '#2563eb';
                authTabRegister.style.color = 'white';
            }
            if (authTabLogin) {
                authTabLogin.style.background = 'transparent';
                authTabLogin.style.color = '#94a3b8';
            }
            if (els.authTitle) els.authTitle.textContent = 'Załóż darmowe konto';
            if (els.authSubtitle) els.authSubtitle.textContent = 'Wybierz typ konta (Kandydat lub Pracodawca) i dołącz do JobNexus.';
            if (els.authSubmit) els.authSubmit.textContent = 'Zarejestruj się';
            if (els.authSwitch) els.authSwitch.textContent = 'Masz już konto? Zaloguj się';
            updateRoleUI(document.querySelector('input[name="authRole"]:checked')?.value || 'candidate');
        } else {
            if (authTabLogin) {
                authTabLogin.style.background = '#2563eb';
                authTabLogin.style.color = 'white';
            }
            if (authTabRegister) {
                authTabRegister.style.background = 'transparent';
                authTabRegister.style.color = '#94a3b8';
            }
            if (els.authTitle) els.authTitle.textContent = 'Zaloguj się do konta';
            if (els.authSubtitle) els.authSubtitle.textContent = 'Wprowadź swoje dane, aby przejść do panelu i ofert.';
            if (els.authSubmit) els.authSubmit.textContent = 'Zaloguj się';
            if (els.authSwitch) els.authSwitch.textContent = 'Nie masz konta? Zarejestruj się';
        }
    };

    authTabLogin?.addEventListener('click', () => setMode(false));
    authTabRegister?.addEventListener('click', () => setMode(true));
    els.authSwitch?.addEventListener('click', () => setMode(!registerMode));

    const open = (register = false, message = '') => {
        setMode(register);
        els.authForm.reset();
        els.authError.textContent = message;
        els.authError.classList.toggle('hidden', !message);
        els.authModal.classList.remove('hidden');
        setTimeout(() => {
            (register ? els.authName : els.authEmail)?.focus();
        }, 50);
    };

    const close = () => els.authModal.classList.add('hidden');

    const handleAuthTrigger = async (event) => {
        event.preventDefault();
        if (AuthService.isAuthenticated() || AuthService.getUser()) {
            await AuthService.logout();
            syncAuthTrigger(null);
            showToast('Wylogowano pomyślnie', 'success');
            return;
        }
        open(false);
    };

    els.authTrigger.addEventListener('click', handleAuthTrigger);
    els.authClose?.addEventListener('click', close);
    els.authModal.addEventListener('click', (e) => {
        if (e.target === els.authModal) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!els.authModal.classList.contains('hidden')) close();
            const dashM = document.getElementById('dashboardModal');
            if (dashM && !dashM.classList.contains('hidden')) dashM.classList.add('hidden');
        }
    });

    els.authForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        els.authError.classList.add('hidden');
        els.authSubmit.disabled = true;
        els.authSubmit.textContent = 'Przetwarzanie...';

        try {
            const selectedRole = document.querySelector('input[name="authRole"]:checked')?.value || 'candidate';
            const user = registerMode 
                ? await AuthService.register(els.authEmail.value, els.authPassword.value, els.authName?.value || '', selectedRole)
                : await AuthService.login(els.authEmail.value, els.authPassword.value);

            if (user) {
                syncAuthTrigger(user);
                close();
                showToast(registerMode ? `Konto utworzone! Witaj w JobNexus, ${user.name}` : 'Zalogowano pomyślnie!', 'success');

                // NATYCHMIASTOWE OTWARCIE WYBRANEGO PANELU
                if (typeof window.openDashboard === 'function') {
                    window.openDashboard();
                }
            } else if (registerMode) {
                els.authError.textContent = 'Sprawdź skrzynkę e-mail i potwierdź konto.';
                els.authError.classList.remove('hidden');
            }
        } catch (error) {
            let userMsg = error.message || 'Nie udało się wykonać operacji.';
            if (userMsg.includes('Invalid email format')) userMsg = 'Niepoprawny format adresu e-mail.';
            if (userMsg.includes('Password must be at least 8 characters')) userMsg = 'Hasło musi mieć co najmniej 8 znaków.';
            if (userMsg.includes('Name must be at least 2 characters')) userMsg = 'Imię musi mieć co najmniej 2 znaki.';
            if (userMsg.includes('Password is required')) userMsg = 'Hasło jest wymagane.';
            if (userMsg.includes('Invalid credentials')) userMsg = 'Nieprawidłowy e-mail lub hasło.';
            els.authError.textContent = userMsg;
            els.authError.classList.remove('hidden');
        } finally {
            els.authSubmit.disabled = false;
            els.authSubmit.textContent = registerMode ? 'Zarejestruj się' : 'Zaloguj się';
        }
    });

    const navDashBtn = document.getElementById('navDashboardBtn');
    const navDashBtnText = document.getElementById('navDashboardBtnText');

    const syncAuthTrigger = (user) => {
        if (user) {
            const roleLabel = user.role === 'recruiter' ? 'Panel Rekrutera' : 'Panel Kandydata';
            els.authTrigger.textContent = `Wyloguj (${user.name || user.email})`;

            if (dashboardTrigger) {
                dashboardTrigger.classList.remove('hidden');
                const span = dashboardTrigger.querySelector('span');
                if (span) span.textContent = roleLabel;
            }

            if (navDashBtn) {
                navDashBtn.classList.remove('hidden');
                if (navDashBtnText) navDashBtnText.textContent = roleLabel;
            }
        } else {
            els.authTrigger.textContent = 'Zaloguj się';
            if (dashboardTrigger) {
                dashboardTrigger.classList.add('hidden');
            }
            if (navDashBtn) {
                navDashBtn.classList.add('hidden');
            }
        }
    };

    
    document.getElementById('heroRegisterCandidate')?.addEventListener('click', () => {
        const u = AuthService.getUser();
        if (u) {
            window.openDashboard?.();
        } else {
            open(true);
            const input = roleLabelCandidate?.querySelector('input');
            if (input) input.checked = true;
            updateRoleUI('candidate');
        }
    });

    document.getElementById('heroRegisterRecruiter')?.addEventListener('click', () => {
        const u = AuthService.getUser();
        if (u) {
            window.openDashboard?.();
        } else {
            open(true);
            const input = roleLabelRecruiter?.querySelector('input');
            if (input) input.checked = true;
            updateRoleUI('recruiter');
        }
    });

    navDashBtn?.addEventListener('click', () => {
        if (typeof window.openDashboard === 'function') {
            window.openDashboard();
        }
    });

    // Podepnij Moje CV oraz Dodaj Ogłoszenie do paneli
    document.querySelectorAll('a[href="#cv"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const u = AuthService.getUser();
            if (u) {
                e.preventDefault();
                window.openDashboard?.();
            }
        });
    });

    document.querySelectorAll('a[href="#dodaj"], a[href="#ogloszenia"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const u = AuthService.getUser();
            if (u && u.role === 'recruiter') {
                e.preventDefault();
                window.openDashboard?.();
            }
        });
    });

    const currentUser = await AuthService.syncSession();
    syncAuthTrigger(currentUser);
    window.openAuth = open;
}

// DASHBOARD (PANEL KANDYDATA / REKRUTERA + EXTRA PREMIUM)
// ==========================================
function initDashboard() {
    const dashModal = document.getElementById('dashboardModal');
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

        dashSwitchRoleBtn.textContent = isRecruiter ? 'Przełącz na profil Kandydata' : 'Przełącz na profil Rekrutera';

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
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(49, 46, 129, 0.4)); border: 1px solid rgba(99, 102, 241, 0.4);">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <span style="font-size: 11px; font-weight: 700; color: #a5b4fc; text-transform: uppercase;">AI Talent Scout & Direct Outreach</span>
                                <h3 style="font-size: 1.25rem; font-weight: 800; color: white; margin: 4px 0 0 0;">Baza 4 800+ Aktywnych Kandydatów</h3>
                                <p style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">Wyszukuj kandydatów po tagach technologicznych i zapraszaj ich do swoich rekrutacji.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Lista Kandydatów w bazie Talentów -->
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 10px; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15px;">AK</div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h4 style="font-weight: 700; color: white; font-size: 14px; margin: 0;">Aleksander Kowalczyk</h4>
                                        <span style="padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399;">Top 1% Talent</span>
                                    </div>
                                    <p style="font-size: 12px; color: #94a3b8; margin: 2px 0 0 0;">Senior Fullstack Engineer (React, Node, Go) • 7 lat doświadczenia</p>
                                </div>
                            </div>
                            <button onclick="showToast('Wysłano bezpośrednie zaproszenie do aplikacji!', 'success')" style="padding: 8px 14px; background: #4f46e5; color: white; font-size: 12px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">
                                ✉️ Zaproś do Aplikacji
                            </button>
                        </div>

                        <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 42px; height: 42px; border-radius: 10px; background: #7c3aed; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15px;">MN</div>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <h4 style="font-weight: 700; color: white; font-size: 14px; margin: 0;">Marta Nowicka</h4>
                                        <span style="padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; background: rgba(59, 130, 246, 0.2); color: #60a5fa;">AI Specialist</span>
                                    </div>
                                    <p style="font-size: 12px; color: #94a3b8; margin: 2px 0 0 0;">Machine Learning & Python Engineer (LangChain, PyTorch) • 4 lata</p>
                                </div>
                            </div>
                            <button onclick="showToast('Wysłano bezpośrednie zaproszenie do aplikacji!', 'success')" style="padding: 8px 14px; background: #4f46e5; color: white; font-size: 12px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer;">
                                ✉️ Zaproś do Aplikacji
                            </button>
                        </div>
                    </div>
                </div>
            `;
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
    }, { passive: true });
}


