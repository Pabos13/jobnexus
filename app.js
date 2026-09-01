// JobNexus App - Jooble API Integration
// API Key: 5be594f9-f5e0-41f5-a41a-9c1ea12566be
// Display: 7 items per page, vertical layout with pagination

const JOOBLE_API_KEY = '5be594f9-f5e0-41f5-a41a-9c1ea12566be';
const JOOBLE_API_BASE = 'https://api.jooble.org/api/v1/vacancies';
const ITEMS_PER_PAGE = 7;

// Global state
let currentPage = 1;
let allJobs = [];
let filteredJobs = [];
let currentSearchQuery = '';
let currentLocation = '';

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadInitialJobs();
  setupEventListeners();
  setupAuthHandlers();
});

// Load initial job listings
async function loadInitialJobs() {
  const jobsGrid = document.getElementById('jobsGrid');
  const loading = document.getElementById('jobsLoading');
  
  if (loading) loading.style.display = 'flex';
  if (jobsGrid) jobsGrid.innerHTML = '';
  
  try {
    // Fetch jobs from Jooble API
    const jobs = await fetchJobsFromJooble('', '');
    allJobs = jobs;
    filteredJobs = jobs;
    currentPage = 1;
    
    renderJobsPage(1);
    setupPagination();
  } catch (error) {
    console.error('Error loading jobs:', error);
    showJobsError('Błąd przy ładowaniu ofert. Spróbuj ponownie.');
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

// Fetch jobs from Jooble API
async function fetchJobsFromJooble(keyword = '', location = '') {
  try {
    const payload = {
      keywords: keyword || ['programista', 'developer', 'python', 'react', 'java'],
      location: location || 'Polska',
      radiusDistance: 50,
      page: 1
    };

    const response = await fetch(JOOBLE_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JOOBLE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Fallback: use mock data if API fails
      console.log('Using mock job data (API unavailable)');
      return getMockJobs();
    }

    const data = await response.json();
    return data.vacancies || [];
  } catch (error) {
    console.error('Jooble API error:', error);
    return getMockJobs();
  }
}

// Mock job data (fallback)
function getMockJobs() {
  return [
    {
      id: 1,
      title: 'Senior React & Node.js Developer',
      company: 'Nexus Tech Innovations',
      location: 'Warszawa',
      salary: '18 000 - 24 000 PLN netto',
      type: 'Pełny etat',
      description: 'Szukamy doświadczonego React Developera do pracy nad nowoczesnymi aplikacjami SaaS.',
      logo: '💻',
      tags: ['React', 'TypeScript', 'Node.js', 'AWS']
    },
    {
      id: 2,
      title: 'Python Data Scientist',
      company: 'AI Analytics Pro',
      location: 'Kraków',
      salary: '16 000 - 22 000 PLN',
      type: 'Zdalna',
      description: 'Analiza danych, machine learning, budowanie modeli predykcyjnych.',
      logo: '🧠',
      tags: ['Python', 'TensorFlow', 'Pandas', 'SQL']
    },
    {
      id: 3,
      title: 'UI/UX Designer',
      company: 'Creative Studio Warszawa',
      location: 'Warszawa',
      salary: '12 000 - 16 000 PLN',
      type: 'Hybrydowa',
      description: 'Projektowanie interfejsów użytkownika dla aplikacji webowych i mobilnych.',
      logo: '🎨',
      tags: ['Figma', 'UI Design', 'Prototyping']
    },
    {
      id: 4,
      title: 'DevOps Engineer',
      company: 'Cloud Systems Ltd',
      location: 'Warszawa',
      salary: '19 000 - 26 000 PLN',
      type: 'Hybrydowa',
      description: 'Zarządzanie infrastrukturą, CI/CD pipelines, Kubernetes.',
      logo: '⚙️',
      tags: ['Kubernetes', 'Docker', 'AWS', 'Terraform']
    },
    {
      id: 5,
      title: 'Full-Stack JavaScript Developer',
      company: 'StartUp Innovation Hub',
      location: 'Wrocław',
      salary: '15 000 - 20 000 PLN',
      type: 'Zdalna',
      description: 'Budowanie skalowlanych aplikacji webowych z Next.js i TypeScript.',
      logo: '⚡',
      tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'GraphQL']
    },
    {
      id: 6,
      title: 'QA Automation Engineer',
      company: 'TestPro Solutions',
      location: 'Gdańsk',
      salary: '14 000 - 18 000 PLN',
      type: 'Pełny etat',
      description: 'Automatyzacja testów, CI/CD, Selenium, Cypress.',
      logo: '🧪',
      tags: ['Selenium', 'Cypress', 'Python', 'Jest']
    },
    {
      id: 7,
      title: 'Backend Java Developer',
      company: 'Enterprise Solutions Corp',
      location: 'Poznań',
      salary: '17 000 - 23 000 PLN',
      type: 'Stacjonarna',
      description: 'Rozwój aplikacji backendowych w Javie, Spring Boot, mikroserwisy.',
      logo: '☕',
      tags: ['Java', 'Spring Boot', 'Microservices', 'Docker']
    },
    {
      id: 8,
      title: 'Mobile iOS Developer (Swift)',
      company: 'Mobile First Agency',
      location: 'Warszawa',
      salary: '16 000 - 21 000 PLN',
      type: 'Hybrydowa',
      description: 'Tworzenie natywnych aplikacji iOS w Swift, integracja API.',
      logo: '🍎',
      tags: ['Swift', 'iOS', 'UIKit', 'Alamofire']
    },
    {
      id: 9,
      title: 'Product Manager Tech',
      company: 'Digital Ventures',
      location: 'Warszawa',
      salary: '20 000 - 28 000 PLN',
      type: 'Zdalna',
      description: 'Zarządzanie produktem, roadmap, komunikacja z zespołem.',
      logo: '📊',
      tags: ['Product Strategy', 'Analytics', 'Agile', 'Communication']
    },
    {
      id: 10,
      title: 'WordPress & PHP Developer',
      company: 'Web Solutions Sp. z o.o.',
      location: 'Łódź',
      salary: '11 000 - 15 000 PLN',
      type: 'Hybrydowa',
      description: 'Tworzenie stron internetowych i pluginów WordPress.',
      logo: '📱',
      tags: ['WordPress', 'PHP', 'JavaScript', 'MySQL']
    }
  ];
}

// Render jobs for current page
function renderJobsPage(pageNum) {
  const jobsGrid = document.getElementById('jobsGrid');
  const emptyState = document.getElementById('jobsEmpty');
  
  if (!jobsGrid) return;
  
  if (filteredJobs.length === 0) {
    jobsGrid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  
  if (emptyState) emptyState.classList.add('hidden');
  
  const startIdx = (pageNum - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const pageJobs = filteredJobs.slice(startIdx, endIdx);
  
  jobsGrid.innerHTML = pageJobs.map(job => createJobCard(job)).join('');
  currentPage = pageNum;
}

// Create job card HTML
function createJobCard(job) {
  const salary = job.salary || 'Brak informacji';
  const tags = (job.tags || []).slice(0, 3).map(tag => 
    `<span class="job-tag">${tag}</span>`
  ).join('');
  
  return `
    <div class="job-card">
      <div class="job-card-header">
        <div class="job-company-logo">${job.logo || '💼'}</div>
        <div class="job-card-title-section">
          <h3 class="job-title">${job.title || 'Stanowisko'}</h3>
          <div class="job-company-info">
            <span class="job-company">${job.company || 'Pracodawca'}</span>
            <span class="job-location">📍 ${job.location || 'Polska'}</span>
          </div>
        </div>
      </div>
      
      <p class="job-description">${job.description || 'Opis stanowiska'}</p>
      
      <div class="job-meta">
        <span class="job-salary">💰 ${salary}</span>
        <span class="job-type">${job.type || 'Pełny etat'}</span>
      </div>
      
      <div class="job-tags">
        ${tags}
      </div>
      
      <div class="job-card-footer">
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.viewJobDetails(${job.id})">
          Więcej informacji
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.applyForJob(${job.id})">
          Aplikuj
        </button>
      </div>
    </div>
  `;
}

// Setup pagination
function setupPagination() {
  const paginationContainer = document.getElementById('jobsPagination');
  if (!paginationContainer) return;
  
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let html = '<div class="pagination-controls">';
  
  // Previous button
  if (currentPage > 1) {
    html += `<button class="pagination-btn" onclick="window.goToPage(${currentPage - 1})">← Poprzednia</button>`;
  }
  
  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  if (startPage > 1) {
    html += `<button class="pagination-btn" onclick="window.goToPage(1)">1</button>`;
    if (startPage > 2) html += '<span class="pagination-dots">...</span>';
  }
  
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += `<button class="pagination-btn pagination-btn-active">${i}</button>`;
    } else {
      html += `<button class="pagination-btn" onclick="window.goToPage(${i})">${i}</button>`;
    }
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += '<span class="pagination-dots">...</span>';
    html += `<button class="pagination-btn" onclick="window.goToPage(${totalPages})">${totalPages}</button>`;
  }
  
  // Next button
  if (currentPage < totalPages) {
    html += `<button class="pagination-btn" onclick="window.goToPage(${currentPage + 1})">Następna →</button>`;
  }
  
  html += '</div>';
  paginationContainer.innerHTML = html;
}

// Global functions for buttons
window.goToPage = function(pageNum) {
  renderJobsPage(pageNum);
  setupPagination();
  document.getElementById('jobsGrid').scrollIntoView({ behavior: 'smooth' });
};

window.viewJobDetails = function(jobId) {
  const job = allJobs.find(j => j.id === jobId);
  if (job) {
    alert(`Szczegóły: ${job.title}\n\n${job.description}\n\nWynagrodzenie: ${job.salary}`);
  }
};

window.applyForJob = function(jobId) {
  const job = allJobs.find(j => j.id === jobId);
  if (job) {
    alert(`Aplikacja wysłana na stanowisko:\n${job.title}\n\nZa pracodawcę: ${job.company}`);
  }
};

// Search functionality
window.handleSearch = function() {
  const searchInput = document.getElementById('searchInput');
  const locationInput = document.getElementById('locationInput');
  
  currentSearchQuery = searchInput?.value || '';
  currentLocation = locationInput?.value || '';
  
  // Filter jobs locally
  filteredJobs = allJobs.filter(job => {
    const matchesKeyword = !currentSearchQuery || 
      (job.title && job.title.toLowerCase().includes(currentSearchQuery.toLowerCase())) ||
      (job.description && job.description.toLowerCase().includes(currentSearchQuery.toLowerCase())) ||
      (job.tags || []).some(tag => tag.toLowerCase().includes(currentSearchQuery.toLowerCase()));
    
    const matchesLocation = !currentLocation ||
      (job.location && job.location.toLowerCase().includes(currentLocation.toLowerCase()));
    
    return matchesKeyword && matchesLocation;
  });
  
  currentPage = 1;
  renderJobsPage(1);
  setupPagination();
};

// Search button click handler
const searchBtn = document.getElementById('searchBtn');
if (searchBtn) {
  searchBtn.addEventListener('click', window.handleSearch);
}

// Enter key on search inputs
const searchInput = document.getElementById('searchInput');
const locationInput = document.getElementById('locationInput');
if (searchInput) searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && window.handleSearch());
if (locationInput) locationInput.addEventListener('keypress', (e) => e.key === 'Enter' && window.handleSearch());

// Show error
function showJobsError(message) {
  const jobsGrid = document.getElementById('jobsGrid');
  const emptyState = document.getElementById('jobsEmpty');
  
  if (emptyState) {
    emptyState.querySelector('h3').textContent = 'Błąd';
    emptyState.querySelector('p').textContent = message;
    emptyState.classList.remove('hidden');
  }
}

// Auth handlers (implemented)
function setupAuthHandlers() {
  // Login/Register modal openers
  window.handleNavLoginClick = () => {
    const backdrop = document.getElementById('authModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('hidden');
      backdrop.style.display = 'flex';
      window.switchAuthTab('login');
    }
  };
  
  window.handleNavRegisterClick = () => {
    const backdrop = document.getElementById('authModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('hidden');
      backdrop.style.display = 'flex';
      window.switchAuthTab('register');
    }
  };
  
  window.closeAuthModal = () => {
    const backdrop = document.getElementById('authModalBackdrop');
    if (backdrop) {
      backdrop.classList.add('hidden');
      backdrop.style.display = 'none';
    }
  };
  
  // Switch between login and register tabs
  window.switchAuthTab = (tab) => {
    const loginTab = document.getElementById('tabLogin');
    const registerTab = document.getElementById('tabRegister');
    const nameGroup = document.getElementById('nameGroup');
    const authModalTitle = document.getElementById('authModalTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');

    if (!authSubmitBtn || !authModalTitle) return;

    if (tab === 'register') {
      nameGroup?.classList.remove('hidden');
      if (nameGroup) nameGroup.style.display = 'block';
      authModalTitle.textContent = 'Zarejestruj się';
      authSubmitBtn.textContent = 'Zarejestruj się';
      loginTab?.classList.remove('active');
      registerTab?.classList.add('active');
    } else {
      nameGroup?.classList.add('hidden');
      if (nameGroup) nameGroup.style.display = 'none';
      authModalTitle.textContent = 'Zaloguj się do JobNexus';
      authSubmitBtn.textContent = 'Zaloguj się';
      registerTab?.classList.remove('active');
      loginTab?.classList.add('active');
    }
  };
  
  // Handle auth form submission (login or register)
  window.handleAuthSubmit = async (event) => {
    event.preventDefault();
    const authErrorEl = document.getElementById('authError');
    if (authErrorEl) { authErrorEl.style.display = 'none'; }

    const name = document.getElementById('authName')?.value?.trim();
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPassword')?.value;
    const isRegister = !document.getElementById('nameGroup')?.classList.contains('hidden');

    if (!email || !password) {
      showAuthError('Proszę podać adres e-mail i hasło.');
      return;
    }

    try {
      if (isRegister) {
        if (!name) return showAuthError('Proszę podać imię i nazwisko lub nazwę firmy.');
        // Use AuthService if available
        if (window.AuthService && typeof window.AuthService.register === 'function') {
          const user = await window.AuthService.register(email, password, name, 'candidate');
          afterLogin(user);
        } else {
          // Fallback: simulate register
          const user = { id: 'usr_local_' + Date.now(), email, name, role: 'candidate' };
          window.localStorage.setItem('jobnexus_user', JSON.stringify(user));
          afterLogin(user);
        }
      } else {
        // Login
        if (window.AuthService && typeof window.AuthService.login === 'function') {
          const user = await window.AuthService.login(email, password);
          afterLogin(user);
        } else {
          // Fallback: local users
          const users = JSON.parse(localStorage.getItem('jobnexus_local_registered_users') || '[]');
          const found = users.find(u => u.email === email && u.password === password);
          if (!found) return showAuthError('Nieprawidłowe dane logowania.');
          const safeUser = { id: found.id, email: found.email, name: found.name, role: found.role || 'candidate' };
          window.localStorage.setItem('jobnexus_user', JSON.stringify(safeUser));
          afterLogin(safeUser);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      showAuthError(err?.message || 'Błąd logowania/rejestracji');
    }
  };
}

function showAuthError(msg) {
  const authErrorEl = document.getElementById('authError');
  if (!authErrorEl) {
    alert(msg);
    return;
  }
  authErrorEl.style.display = 'block';
  authErrorEl.textContent = msg;
}

// After successful login/register
function afterLogin(user) {
  if (!user) return;
  // Close auth modal
  window.closeAuthModal();

  try {
    // Render header to show user info
    renderLoggedInHeader(user);

    // Populate dashboard/profile UI
    fillUserPortal(user);

    // Open dashboard/modal or navigate to profile section
    // If recruiter, open recruiter panel, else open dashboard modal
    if (user.role === 'recruiter') {
      // open recruiter panel (if implemented)
      window.openRecruiterPanel?.();
    }

    // Show dashboard modal (profile)
    window.openDashboardModal();
  } catch (e) {
    console.error('afterLogin error', e);
  }
}

function renderLoggedInHeader(user) {
  const headerActions = document.getElementById('headerAuthActions');
  if (!headerActions) return;

  headerActions.innerHTML = '';

  const nameBtn = document.createElement('button');
  nameBtn.type = 'button';
  nameBtn.className = 'btn btn-secondary';
  nameBtn.textContent = user.name || user.email || 'Moje konto';
  nameBtn.onclick = () => window.openDashboardModal();

  const logoutBtn = document.createElement('button');
  logoutBtn.type = 'button';
  logoutBtn.className = 'btn btn-primary';
  logoutBtn.textContent = 'Wyloguj';
  logoutBtn.onclick = async () => {
    if (window.AuthService && typeof window.AuthService.logout === 'function') {
      await window.AuthService.logout();
    } else {
      localStorage.removeItem('jobnexus_user');
    }
    // reload header
    location.reload();
  };

  headerActions.appendChild(nameBtn);
  headerActions.appendChild(logoutBtn);
}

function fillUserPortal(user) {
  try {
    const portalUserName = document.getElementById('portalUserName');
    const portalUserEmail = document.getElementById('portalUserEmail');
    const portalUserRoleBadge = document.getElementById('portalUserRoleBadge');
    if (portalUserName) portalUserName.textContent = user.name || 'Panel Użytkownika';
    if (portalUserEmail) portalUserEmail.textContent = user.email || '';
    if (portalUserRoleBadge) portalUserRoleBadge.textContent = (user.role || 'candidate').toUpperCase();

    const dashUserName = document.getElementById('dashUserName');
    const dashUserEmail = document.getElementById('dashUserEmail');
    const dashUserRoleBadge = document.getElementById('dashUserRoleBadge');
    if (dashUserName) dashUserName.textContent = user.name || 'Panel Użytkownika';
    if (dashUserEmail) dashUserEmail.textContent = user.email || '';
    if (dashUserRoleBadge) dashUserRoleBadge.textContent = (user.role || 'candidate').toUpperCase();
  } catch (e) {
    console.warn('fillUserPortal error', e);
  }
}

// Dashboard modal controls
window.openDashboardModal = function() {
  const modal = document.getElementById('dashboardModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
};

window.closeDashboardModal = function() {
  const modal = document.getElementById('dashboardModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
};

// Add offer modal handlers
window.openAddModal = (type) => {
  const modal = document.getElementById('addModalBackdrop');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
};

window.closeAddModal = () => {
  const modal = document.getElementById('addModalBackdrop');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
};

window.handleAddOfferSubmit = (event) => {
  event.preventDefault();
  alert('Offer submitted - integrate with backend payment');
  window.closeAddModal();
};

// Additional stub functions
window.openRecruiterPanel = () => alert('Recruiter panel - PRO feature');
window.openCvBuilder = () => alert('CV Builder - 14,99 zł');
window.toggleBrowseOffersView = () => alert('Browse offers view');
window.resetCvMatches = () => alert('Reset CV matches');
window.processCheckoutPayment = (event) => {
  event.preventDefault();
  alert('Payment processing - integrate with gateway');
};
window.togglePaymentMethodFields = () => {};

function setupEventListeners() {
  // Add any additional event listeners here
}
