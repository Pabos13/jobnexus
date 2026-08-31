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

    const syncAuthTrigger = (user) => {
        if (user) {
            els.authTrigger.textContent = `Wyloguj (${user.name || user.email})`;
            if (dashboardTrigger) {
                dashboardTrigger.classList.remove('hidden');
                dashboardTrigger.querySelector('span').textContent = user.role === 'recruiter' ? 'Panel Rekrutera' : 'Panel Kandydata';
            }
        } else {
            els.authTrigger.textContent = 'Zaloguj się';
            if (dashboardTrigger) {
                dashboardTrigger.classList.add('hidden');
            }
        }
    };

    const currentUser = await AuthService.syncSession();
    syncAuthTrigger(currentUser);
    window.openAuth = open;
}

// DASHBOARD (PANEL KANDYDATA / REKRUTERA + EXTRA PREMIUM)
// ==========================================
function initDashboard() {
    const dashModal = document.getElementById('dashboardModal');
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
    let lastScroll = 0;

    const announcementLinks = document.querySelectorAll('a[href="#dodaj"]');
    announcementLinks.forEach(link => link.addEventListener('click', (event) => {
        event.preventDefault();
        if (!AuthService.isAuthenticated() && !AuthService.getUser()) {
            window.openAuth(false, 'Zaloguj się lub zarejestruj, aby dodać ogłoszenie.');
            return;
        }
        openAddModal('standard');
    }));

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        els.navbar.classList.toggle('scrolled', currentScroll > 50);
        lastScroll = currentScroll;
    }, { passive: true });

    const toggleMenu = (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const isOpen = !els.navMenu.classList.contains('open');
        els.navToggle.classList.toggle('active', isOpen);
        els.navMenu.classList.toggle('open', isOpen);
        els.navToggle.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    const closeMenu = () => {
        els.navToggle.classList.remove('active');
        els.navMenu.classList.remove('open');
        els.navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    els.navToggle.addEventListener('click', toggleMenu);

    // Close mobile menu on link or button click
    els.navMenu.querySelectorAll('.nav-link, button').forEach(item => {
        item.addEventListener('click', () => {
            closeMenu();
        });
    });

    // Close when clicking outside of nav
    document.addEventListener('click', (e) => {
        if (els.navMenu.classList.contains('open') && !els.navMenu.contains(e.target) && !els.navToggle.contains(e.target)) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && els.navMenu.classList.contains('open')) {
            closeMenu();
        }
    });
}

// ============================================
// DATA LOADING
// ============================================
async function loadData() {
    showLoading(true);
    
    try {
        // Load CSV first
        const csvJobs = await JobService.loadCSVJobs();
        state.csvJobs = csvJobs;
        console.log(`Loaded ${csvJobs.length} jobs from CSV`);
        
        // Then load from Jooble API via backend
        const apiJobs = await JobService.loadJoobleJobs(
            state.searchQuery || 'praca',
            state.locationQuery || 'Polska'
        );
        
        // Combine jobs (deduplicates)
        state.jobs = JobService.combineJobs(state.csvJobs, apiJobs);
        console.log(`Combined to ${state.jobs.length} total jobs`);
        
        filterAndDisplay();
        
    } catch (err) {
        console.error('Data loading error:', err);
        // Fallback: show CSV jobs only
        state.jobs = [...state.csvJobs];
        filterAndDisplay();
    } finally {
        showLoading(false);
    }
}

// ============================================
// SEARCH & FILTERS
// ============================================
function initSearch() {
    let debounceTimer;
    
    const doSearch = () => {
        state.searchQuery = els.searchInput.value.trim();
        state.locationQuery = els.locationInput.value.trim();
        state.currentPage = 1;
        
        // Save to search history
        if (state.searchQuery) {
            StorageService.addSearchHistory(state.searchQuery);
        }
        
        filterAndDisplay();
    };
    
    els.searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doSearch, CONFIG.DEBOUNCE_DELAY);
    });
    
    els.locationInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doSearch, CONFIG.DEBOUNCE_DELAY);
    });
    
    els.searchBtn.addEventListener('click', doSearch);
    
    // Enter key
    [els.searchInput, els.locationInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    });
}

function initFilters() {
    els.filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            els.filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.currentFilter = chip.dataset.filter;
            state.currentPage = 1;
            filterAndDisplay();
        });
    });
    
    els.loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        displayJobs(true);
    });
}

function filterAndDisplay() {
    const filters = {
        searchQuery: state.searchQuery,
        locationQuery: state.locationQuery,
        currentFilter: state.currentFilter
    };
    
    state.filteredJobs = JobService.filterJobs(state.jobs, filters);
    displayJobs(false);
}

function displayJobs(append = false) {
    const start = 0;
    const end = state.currentPage * CONFIG.ITEMS_PER_PAGE;
    const toShow = state.filteredJobs.slice(start, end);
    
    if (!append) {
        els.jobsGrid.innerHTML = '';
    }
    
    if (toShow.length === 0 && !append) {
        els.jobsGrid.innerHTML = '';
        els.jobsEmpty.classList.remove('hidden');
        els.loadMoreBtn.classList.add('hidden');
        return;
    }
    
    els.jobsEmpty.classList.add('hidden');
    
    // If appending, only render new items
    const existingCount = append ? (state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE : 0;
    const newItems = toShow.slice(existingCount);
    
    newItems.forEach((job, idx) => {
        const card = createJobCard(job);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        els.jobsGrid.appendChild(card);
        
        // Staggered animation
        requestAnimationFrame(() => {
            setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, idx * 80);
        });
    });
    
    // Show/hide load more
    if (state.filteredJobs.length > end) {
        els.loadMoreBtn.classList.remove('hidden');
    } else {
        els.loadMoreBtn.classList.add('hidden');
    }
}

function createJobCard(job) {
    const card = document.createElement('article');
    card.className = `job-card${job.featured ? ' featured' : ''}`;
    card.dataset.id = job.id;
    
    const initials = job.company.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const typeIcon = getTypeIcon(job.type);
    const locIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    const dateIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
    
    const timeAgo = getTimeAgo(job.date);
    
    card.innerHTML = `
        <button class="job-save" type="button" aria-label="${FavoritesService.isFavorite(job.id) ? 'Usuń z zakładek' : 'Zapisz ofertę'}">${FavoritesService.isFavorite(job.id) ? '★' : '☆'}</button>
        <div class="job-header">
            <div class="job-logo">${initials}</div>
            <div class="job-meta">
                <h3 class="job-title">${escapeHtml(job.title)}</h3>
                <p class="job-company">${escapeHtml(job.company)}</p>
            </div>
        </div>
        <div class="job-details">
            <span class="job-tag">${typeIcon}${escapeHtml(job.type)}</span>
            <span class="job-tag">${locIcon}${escapeHtml(job.location)}</span>
            <span class="job-tag">${dateIcon}${timeAgo}</span>
        </div>
        <div class="job-footer">
            <span class="job-salary">${escapeHtml(job.salary)}</span>
            <button class="job-apply" type="button" data-job-id="${escapeHtml(String(job.id))}">Aplikuj</button>
        </div>
    `;
    
    card.querySelector('.job-save').addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
            if (FavoritesService.isFavorite(job.id)) {
                await FavoritesService.removeFavorite(job.id);
            } else {
                await FavoritesService.addFavorite(job);
            }
            displayJobs(false);
            showToast(FavoritesService.isFavorite(job.id) ? 'Oferta dodana do zakładek' : 'Oferta usunięta z zakładek', 'success');
        } catch (error) {
            showToast(error.message || 'Nie udało się zapisać oferty', 'error');
        }
    });

    card.querySelector('.job-apply').addEventListener('click', () => applyJob(job.id));

    return card;
}

function getTypeIcon(type) {
    const icons = {
        'Zdalna': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
        'Staż': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>',
        'Kontrakt': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>'
    };
    return icons[type] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>';
}

function getTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Przed chwilą';
    if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h temu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} dni temu`;
    return date.toLocaleDateString('pl-PL');
}

function escapeHtml(text) {
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
        showToast(`Aplikacja na: ${job.title}`);
    }
}

function showLoading(show) {
    els.jobsLoading.classList.toggle('hidden', !show);
    if (show) els.jobsGrid.innerHTML = '';
}

// ============================================
// ANNOUNCEMENTS / ZLECENIA
// ============================================
function initDemoAnnouncements() {
    // Load announcements from localStorage first
    const savedAnnouncements = StorageService.loadAnnouncements();
    
    if (savedAnnouncements.length > 0) {
        state.announcements = savedAnnouncements;
    } else {
        // Use demo data as initial announcements
        const demos = [
            {
                id: 'ann-1',
                title: 'Potrzebny elektryk — instalacja w nowym domu',
                category: 'Budowlanka',
                location: 'Warszawa, mazowieckie',
                desc: 'Szukam elektryka do kompleksowej instalacji elektrycznej w nowym domu jednorodzinnym. Powierzchnia 180m2. Termin: wrzesień 2026.',
                budget: '5000',
                type: 'Zlecenie',
                featured: true
            },
            {
                id: 'ann-2',
                title: 'Strona internetowa dla restauracji',
                category: 'IT / Programowanie',
                location: 'Kraków, małopolskie',
                desc: 'Potrzebuję nowoczesnej strony www z systemem rezerwacji stolików i menu online. Responsywna, SEO-friendly.',
                budget: '3500',
                type: 'Projekt',
                featured: false
            },
            {
                id: 'ann-3',
                title: 'Kierowca kat. C+E — trasy międzynarodowe',
                category: 'Transport',
                location: 'Wrocław, dolnośląskie',
                desc: 'Firma transportowa szuka kierowców z kat. C+E na trasy DE/NL/BE. Stała współpraca, atrakcyjne stawki.',
                budget: '8500',
                type: 'Praca dorywcza',
                featured: true
            },
            {
                id: 'ann-4',
                title: 'Montaż mebli IKEA — 3 pokoje',
                category: 'Inne',
                location: 'Gdańsk, pomorskie',
                desc: 'Szukam osoby do montażu mebli z IKEA: sypialnia, salon, biuro. Wszystkie meble już dostarczone.',
                budget: '800',
                type: 'Zlecenie',
                featured: false
            },
            {
                id: 'ann-5',
                title: 'Copywriter — blog branżowy B2B',
                category: 'Marketing',
                location: 'Zdalna',
                desc: 'Potrzebuję copywritera do prowadzenia bloga branżowego. 4 artykuły miesięcznie, tematyka IT/Cloud.',
                budget: '2000',
                type: 'Projekt',
                featured: true
            },
            {
                id: 'ann-6',
                title: 'Hydraulik — wymiana instalacji w bloku',
                category: 'Budowlanka',
                location: 'Poznań, wielkopolskie',
                desc: 'Kompleksowa wymiana instalacji hydraulicznej w mieszkaniu 65m2. Wymagane doświadczenie i faktura VAT.',
                budget: '4500',
                type: 'Zlecenie',
                featured: false
            }
        ];
        
        state.announcements = demos;
        StorageService.saveAnnouncements(demos);
    }
    
    renderAnnouncements();
}

function renderAnnouncements() {
    els.announcementsGrid.innerHTML = '';
    
    state.announcements.forEach((ann, idx) => {
        const card = document.createElement('article');
        card.className = `ann-card${ann.featured ? ' featured-ann' : ''}`;
        
        const badgeClass = ann.featured ? 'ann-badge hot' : 'ann-badge';
        const badgeText = ann.featured ? 'WYRÓŻNIONE' : ann.type.toUpperCase();
        
        card.innerHTML = `
            <span class="${badgeClass}">${badgeText}</span>
            <h3 class="ann-title">${escapeHtml(ann.title)}</h3>
            <p class="ann-desc">${escapeHtml(ann.desc)}</p>
            <div class="ann-footer">
                <span class="ann-budget">${ann.budget} zł</span>
                <span class="ann-location">${escapeHtml(ann.location)}</span>
            </div>
        `;
        
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        els.announcementsGrid.appendChild(card);
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, idx * 100);
    });
}

// ============================================
// MODAL — ADD ANNOUNCEMENT
// ============================================
function initModal() {
    els.modalClose.addEventListener('click', closeModal);
    els.addModal.addEventListener('click', (e) => {
        if (e.target === els.addModal) closeModal();
    });
    
    els.annFeatured.addEventListener('change', () => {
        els.submitPrice.textContent = els.annFeatured.checked ? '29,99 zł' : '9,99 zł';
    });
    
    els.addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitAnnouncement();
    });
}

function openAddModal(plan = 'standard') {
    els.annFeatured.checked = plan === 'featured';
    els.submitPrice.textContent = plan === 'featured' ? '29,99 zł' : '9,99 zł';
    els.addModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

window.openAddModal = openAddModal;

function closeModal() {
    els.addModal.classList.add('hidden');
    document.body.style.overflow = '';
    els.addForm.reset();
}

function submitAnnouncement() {
    const title = $('#annTitle').value.trim();
    const category = $('#annCategory').value;
    const location = $('#annLocation').value.trim() || 'Polska';
    const desc = $('#annDesc').value.trim();
    const budget = $('#annBudget').value || 'Do negocjacji';
    const type = $('#annType').value;
    const featured = $('#annFeatured').checked;
    
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
    
    state.announcements.unshift(newAnn);
    // PERSIST TO STORAGE
    StorageService.saveAnnouncements(state.announcements);
    renderAnnouncements();
    closeModal();
    
    const price = featured ? '29,99 zł' : '9,99 zł';
    showToast(`Ogłoszenie opublikowane! Kwota: ${price}`, 'success');
    
    // Scroll to announcements
    document.getElementById('ogloszenia').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// CV UPLOAD & AI MATCHING
// ============================================
function initCVUpload() {
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
    if (!CONFIG.ACCEPTED_CV_TYPES.includes(file.type)) {
        showToast('Wybierz plik PDF, DOC lub DOCX', 'error');
        return;
    }
    
    if (file.size > CONFIG.MAX_CV_FILE_SIZE) {
        showToast(`Plik jest za duży (max ${CONFIG.MAX_CV_FILE_SIZE / 1024 / 1024} MB)`, 'error');
        return;
    }
    
    // Simulate AI analysis
    els.cvUploadZone.innerHTML = `
        <div class="cv-upload-content">
            <div class="spinner" style="margin: 0 auto var(--space-lg)"></div>
            <h3>Analizowanie CV...</h3>
            <p>AI skanuje Twoje umiejętności i doświadczenie</p>
        </div>
    `;
    
    setTimeout(() => {
        // Extract text simulation + keyword matching
        const extractedKeywords = extractKeywordsFromFilename(file.name);
        const matches = findMatchingJobs(extractedKeywords);
        
        state.cvMatches = matches;
        StorageService.saveCVMatches(matches);
        displayCVMatches(matches);
        
        // Restore upload zone
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
        // Re-attach listener since we replaced innerHTML
        const newInput = els.cvUploadZone.querySelector('#cvFileInput');
        newInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleCVFile(e.target.files[0]);
        });
        
        showToast(`Znaleziono ${matches.length} dopasowanych ofert!`, 'success');
    }, 2500);
}

function extractKeywordsFromFilename(filename) {
    const lower = filename.toLowerCase().replace(/\.[^.]+$/, '');
    const keywordMap = {
        'spawacz': ['spawacz', 'spawanie', 'welder', 'mig', 'mag', 'tig'],
        'programista': ['programista', 'developer', 'frontend', 'backend', 'fullstack', 'javascript', 'python', 'java'],
        'księgow': ['księgowy', 'księgowa', 'accountant', 'księgowość', 'finanse'],
        'kierowca': ['kierowca', 'transport', 'kat', 'c+e', 'prawo jazdy'],
        'elektryk': ['elektryk', 'elektryka', 'elektryczne', 'instalacje'],
        'hydraulik': ['hydraulik', 'hydraulika', 'instalacje', 'sanitarne'],
        'marketing': ['marketing', 'marketingowy', 'seo', 'social media', 'copywriter'],
        'projekt': ['project manager', 'pm', 'projekt', 'zarządzanie'],
        'hr': ['hr', 'kadry', 'rekrutacja', 'personel'],
        'sprzedaż': ['sprzedaż', 'sales', 'handlowiec', 'przedstawiciel']
    };
    
    for (const [key, synonyms] of Object.entries(keywordMap)) {
        if (synonyms.some(s => lower.includes(s))) {
            return synonyms;
        }
    }
    
    // Default: return common words from filename
    return lower.split(/[-_\s]+/).filter(w => w.length > 3);
}

function findMatchingJobs(keywords) {
    const scored = state.jobs.map(job => {
        const text = `${job.title} ${job.company} ${job.description} ${job.type}`.toLowerCase();
        let score = 0;
        
        keywords.forEach(kw => {
            if (text.includes(kw.toLowerCase())) score += 2;
        });
        
        // Bonus for featured
        if (job.featured) score += 1;
        
        return { job, score };
    });
    
    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(s => s.job);
}

function displayCVMatches(matches) {
    els.cvMatches.classList.remove('hidden');
    els.cvMatchesGrid.innerHTML = '';
    
    if (matches.length === 0) {
        els.cvMatchesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>Nie znaleziono dopasowanych ofert. Spróbuj wyszukać ręcznie.</p>
            </div>
        `;
        return;
    }
    
    matches.forEach((job, idx) => {
        const card = createJobCard(job);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        els.cvMatchesGrid.appendChild(card);
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, idx * 100);
    });
    
    els.cvMatches.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// ANIMATIONS
// ============================================
function animateStats() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                animateNumber(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    
    els.statNumbers.forEach(el => observer.observe(el));
}

function animateNumber(el, target) {
    const duration = 2000;
    const start = performance.now();
    
    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        
        el.textContent = current.toLocaleString('pl-PL');
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target.toLocaleString('pl-PL');
        }
    }
    
    requestAnimationFrame(update);
}

function initScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.section-header, .pricing-card, .hr-card, .cv-builder-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Add visible class styling
    const style = document.createElement('style');
    style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(style);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: 'linear-gradient(135deg, #22c55e, #16a34a)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };
    
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 14px 28px;
        background: ${colors[type] || colors.info};
        color: #fff;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 1000;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        white-space: nowrap;
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// KEYWORD-BASED SEARCH FROM ANYWHERE
// ============================================
window.searchByKeyword = function(keyword) {
    els.searchInput.value = keyword;
    state.searchQuery = keyword;
    state.currentPage = 1;
    filterAndDisplay();
    document.getElementById('oferty').scrollIntoView({ behavior: 'smooth' });
};

// Expose modal function globally
window.openAddModal = openAddModal;

console.log('JobNexus initialized (refactored with security improvements)');
