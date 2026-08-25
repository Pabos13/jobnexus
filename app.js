/**
 * JobNexus — Futuristic Job Portal
 * Integrates Jooble API, CSV import, AI CV matching, announcements
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    JOOBLE_API_KEY: '5be594f9-f5e0-41f5-a41a-9c1ea12566be',
    JOOBLE_API_URL: 'https://pl.jooble.org/api/',
    CSV_PATH: 'data/offers.csv',
    ITEMS_PER_PAGE: 12,
    ANIMATION_DURATION: 800
};

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
    statNumbers: $$('.stat-number')
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
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
// NAVBAR
// ============================================
function initNavbar() {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        els.navbar.classList.toggle('scrolled', currentScroll > 50);
        lastScroll = currentScroll;
    }, { passive: true });
    
    els.navToggle.addEventListener('click', () => {
        els.navToggle.classList.toggle('active');
        els.navMenu.classList.toggle('open');
        document.body.style.overflow = els.navMenu.classList.contains('open') ? 'hidden' : '';
    });
    
    // Close mobile menu on link click
    els.navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            els.navToggle.classList.remove('active');
            els.navMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

// ============================================
// DATA LOADING
// ============================================
async function loadData() {
    showLoading(true);
    
    try {
        // Load CSV first
        await loadCSV();
        
        // Then load Jooble API
        await loadJoobleJobs();
        
        // Combine and display
        combineJobs();
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
// CSV PARSER
// ============================================
async function loadCSV() {
    try {
        const response = await fetch(CONFIG.CSV_PATH);
        if (!response.ok) throw new Error('CSV not found');
        
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        // Parse header
        const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
        
        // Parse rows
        const jobs = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
            const job = {};
            headers.forEach((h, idx) => {
                job[h.toLowerCase().replace(/\s+/g, '_')] = values[idx] || '';
            });
            
            // Normalize to common format
            jobs.push(normalizeCSVJob(job));
        }
        
        state.csvJobs = jobs;
        console.log(`Loaded ${jobs.length} jobs from CSV`);
        
    } catch (err) {
        console.warn('CSV load failed:', err);
        state.csvJobs = [];
    }
}

function normalizeCSVJob(raw) {
    const title = raw.stanowisko || raw.title || 'Oferta pracy';
    const company = raw.pracodawca || raw.company || 'Pracodawca';
    const location = raw.miejsce_pracy || raw.location || 'Polska';
    const type = raw.rodzaj_umowy || raw.type || 'Umowa o pracę';
    const date = raw.dostępna_od || raw.date || new Date().toISOString().split('T')[0];
    
    return {
        id: `csv-${Math.random().toString(36).substr(2, 9)}`,
        title,
        company,
        location,
        type,
        salary: 'Do negocjacji',
        date,
        description: `${title} w ${company}. ${type}.`,
        source: 'csv',
        featured: false,
        url: '#'
    };
}

// ============================================
// JOOBLE API
// ============================================
async function loadJoobleJobs() {
    try {
        const keywords = state.searchQuery || 'praca';
        const location = state.locationQuery || 'Polska';
        
        const body = JSON.stringify({
            keywords,
            location,
            page: '1',
            searchMode: '1'
        });
        
        const response = await fetch(`${CONFIG.JOOBLE_API_URL}${CONFIG.JOOBLE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });
        
        if (!response.ok) throw new Error(`Jooble API error: ${response.status}`);
        
        const data = await response.json();
        
        if (data && data.jobs) {
            state.jobs = data.jobs.map(job => normalizeJoobleJob(job));
            console.log(`Loaded ${state.jobs.length} jobs from Jooble`);
        } else {
            state.jobs = [];
        }
        
    } catch (err) {
        console.warn('Jooble API failed:', err);
        // Use fallback demo data
        state.jobs = getDemoJobs();
    }
}

function normalizeJoobleJob(raw) {
    return {
        id: raw.id || `jooble-${Math.random().toString(36).substr(2, 9)}`,
        title: raw.title || 'Oferta pracy',
        company: raw.company || 'Pracodawca',
        location: raw.location || 'Polska',
        type: detectJobType(raw.title, raw.snippet),
        salary: raw.salary || 'Do negocjacji',
        date: raw.updated || raw.date || new Date().toISOString().split('T')[0],
        description: raw.snippet || raw.description || '',
        source: 'jooble',
        featured: false,
        url: raw.link || raw.url || '#'
    };
}

function detectJobType(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (text.includes('zdaln') || text.includes('remote')) return 'Zdalna';
    if (text.includes('staż') || text.includes('praktyk') || text.includes('intern')) return 'Staż';
    if (text.includes('kontrakt') || text.includes('b2b') || text.includes('contract')) return 'Kontrakt';
    if (text.includes('część') || text.includes('part') || text.includes('half')) return 'Część etatu';
    return 'Pełny etat';
}

function getDemoJobs() {
    const demoTitles = [
        'Frontend Developer React', 'Backend Developer Node.js', 'Fullstack Developer',
        'DevOps Engineer', 'Data Scientist', 'Product Manager',
        'UX/UI Designer', 'QA Engineer', 'Scrum Master',
        'Java Developer', 'Python Developer', 'Mobile Developer',
        'Cloud Architect', 'Security Engineer', 'ML Engineer',
        'Project Manager', 'Business Analyst', 'HR Specialist',
        'Marketing Manager', 'Sales Representative', 'Accountant',
        'Customer Support', 'Content Writer', 'Graphic Designer'
    ];
    
    const companies = [
        'TechCorp Poland', 'InnovateSoft', 'Digital Ventures',
        'CloudNative Sp. z o.o.', 'DataDriven', 'FutureWorks',
        'CodeCraft', 'AppMasters', 'WebSolutions',
        'SmartSystems', 'NextGen IT', 'CyberShield'
    ];
    
    const locations = [
        'Warszawa, mazowieckie', 'Kraków, małopolskie', 'Wrocław, dolnośląskie',
        'Gdańsk, pomorskie', 'Poznań, wielkopolskie', 'Łódź, łódzkie',
        'Katowice, śląskie', 'Lublin, lubelskie', 'Szczecin, zachodniopomorskie',
        'Bydgoszcz, kujawsko-pomorskie', 'Białystok, podlaskie', 'Toruń, kujawsko-pomorskie'
    ];
    
    const types = ['Pełny etat', 'Zdalna', 'Kontrakt', 'Staż', 'Część etatu'];
    
    return demoTitles.map((title, i) => ({
        id: `demo-${i}`,
        title,
        company: companies[i % companies.length],
        location: locations[i % locations.length],
        type: types[i % types.length],
        salary: `${8000 + (i * 500)} - ${12000 + (i * 800)} zł`,
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        description: `Szukamy ${title} do naszego zespołu. Atrakcyjne warunki, możliwość rozwoju.`,
        source: 'demo',
        featured: i < 3,
        url: '#'
    }));
}

function combineJobs() {
    // Combine CSV + API/demo jobs, deduplicate by title+company
    const seen = new Set();
    const all = [];
    
    [...state.csvJobs, ...state.jobs].forEach(job => {
        const key = `${job.title}|${job.company}`.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            all.push(job);
        }
    });
    
    state.jobs = all;
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
        filterAndDisplay();
    };
    
    els.searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doSearch, 400);
    });
    
    els.locationInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doSearch, 400);
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

function filterJobs() {
    let filtered = [...state.jobs];
    
    // Text search
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(j => 
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            j.description.toLowerCase().includes(q)
        );
    }
    
    // Location filter
    if (state.locationQuery) {
        const loc = state.locationQuery.toLowerCase();
        filtered = filtered.filter(j => 
            j.location.toLowerCase().includes(loc)
        );
    }
    
    // Type filter
    const filterMap = {
        'fulltime': 'pełny etat',
        'parttime': 'część etatu',
        'remote': 'zdalna',
        'contract': 'kontrakt',
        'internship': 'staż'
    };
    
    if (state.currentFilter !== 'all' && filterMap[state.currentFilter]) {
        const typeQ = filterMap[state.currentFilter];
        filtered = filtered.filter(j => 
            j.type.toLowerCase().includes(typeQ)
        );
    }
    
    // Sort: featured first, then by date
    filtered.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.date) - new Date(a.date);
    });
    
    state.filteredJobs = filtered;
}

function filterAndDisplay() {
    filterJobs();
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
            <button class="job-apply" onclick="applyJob('${job.id}')">Aplikuj</button>
        </div>
    `;
    
    return card;
}

function getTypeIcon(type) {
    const icons = {
        'Zdalna': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
        'Staż': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>',
        'Kontrakt': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>'
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

function openAddModal(plan) {
    els.annFeatured.checked = plan === 'featured';
    els.submitPrice.textContent = plan === 'featured' ? '29,99 zł' : '9,99 zł';
    els.addModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

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
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
        showToast('Wybierz plik PDF, DOC lub DOCX', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('Plik jest za duży (max 10 MB)', 'error');
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

console.log('JobNexus initialized');
