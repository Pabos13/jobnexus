import { CONFIG } from './config.js';
import { StorageService } from './services/storageService.js';
import { AuthService } from './services/authService.js';
import { FavoritesService } from './services/favoritesService.js';
import { NotificationService } from './services/notificationService.js';
import { AdvancedFilters } from './services/advancedFilters.js';
import { AnalyticsService } from './services/analyticsService.js';
import { JobService } from './services/jobService.js';

// ============================================
// GLOBAL AUTH MODAL & FLOW HANDLERS (IMMEDIATE ATTACH)
// ============================================
window.openAuthModal = function(mode = "login") {
    const modal = document.getElementById("authModalBackdrop");
    if (!modal) {
        console.warn("authModalBackdrop not found in DOM");
        return;
    }
    modal.classList.remove("hidden");
    modal.style.display = "flex";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
    window.switchAuthTab(mode);
};

window.closeAuthModal = function() {
    const modal = document.getElementById("authModalBackdrop");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
        modal.style.visibility = "hidden";
        modal.style.opacity = "0";
        modal.style.pointerEvents = "none";
    }
};

window.switchAuthTab = function(mode = "login") {
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const nameGroup = document.getElementById("nameGroup");
    const roleGroup = document.getElementById("roleGroup");
    const submitBtn = document.getElementById("authSubmitBtn");
    const modalTitle = document.getElementById("authModalTitle");

    if (mode === "register") {
        if (tabRegister) tabRegister.classList.add("active");
        if (tabLogin) tabLogin.classList.remove("active");
        if (nameGroup) nameGroup.classList.remove("hidden");
        if (roleGroup) roleGroup.classList.remove("hidden");
        if (submitBtn) submitBtn.textContent = "Zarejestruj się";
        if (modalTitle) modalTitle.textContent = "Zarejestruj się w JobNexus";
    } else {
        if (tabLogin) tabLogin.classList.add("active");
        if (tabRegister) tabRegister.classList.remove("active");
        if (nameGroup) nameGroup.classList.add("hidden");
        if (roleGroup) roleGroup.classList.add("hidden");
        if (submitBtn) submitBtn.textContent = "Zaloguj się";
        if (modalTitle) modalTitle.textContent = "Zaloguj się do JobNexus";
    }
};

window.handleAuthSubmit = async function(event) {
    if (event && event.preventDefault) event.preventDefault();
    const email = document.getElementById("authEmail")?.value;
    const password = document.getElementById("authPassword")?.value;
    const name = document.getElementById("authName")?.value || "";
    const role = document.getElementById("authRole")?.value || "candidate";
    const isRegister = document.getElementById("tabRegister")?.classList.contains("active");

    const submitBtn = document.getElementById("authSubmitBtn");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Przetwarzanie...";
    }

    try {
        let user;
        if (typeof AuthService !== "undefined") {
            if (isRegister) {
                user = await AuthService.register(email, password, name, role);
            } else {
                user = await AuthService.login(email, password);
            }
        } else {
            user = { email, name: name || email.split("@")[0], role };
            localStorage.setItem("jobnexus_user", JSON.stringify(user));
        }

        window.closeAuthModal();
        if (typeof NotificationService !== "undefined" && NotificationService.show) {
            NotificationService.show(`Witaj, ${user.name || user.email}!`, "success");
        } else {
            alert(`Witaj, ${user.name || user.email}! Zalogowano pomyślnie.`);
        }

        if (typeof window.openDashboardModal === "function") {
            window.openDashboardModal();
        }
    } catch (err) {
        alert(err.message || "Wystąpił błąd autoryzacji.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = isRegister ? "Zarejestruj się" : "Zaloguj się";
        }
    }
};

// Global application state
const state = {
    jobs: [],
    csvJobs: [],
    gigs: [],
    currentFilter: 'all',
    searchQuery: '',
    locationQuery: '',
    minSalary: 0,
    activeAdvancedFilters: {},
    currentPage: 1,
    itemsPerPage: CONFIG.ITEMS_PER_PAGE || 12,
    favorites: [],
    savedJobs: [],
    applications: []
};

document.addEventListener('DOMContentLoaded', () => {
    // Attach direct click events to navigation auth buttons
    const loginBtn = document.getElementById('loginBtnNav');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.openAuthModal('login');
        });
    }

    const registerBtn = document.getElementById('registerBtnNav');
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.openAuthModal('register');
        });
    }
});
