# JobNexus Development Guide

## Project Overview

JobNexus is a modern job portal featuring:
- Jooble API integration for job listings
- CSV import for local job data
- User authentication with JWT
- AI-powered CV matching
- Advanced filtering and search
- Favorites/bookmarks system
- Analytics tracking
- Mobile-responsive design

---

## Technology Stack

### Frontend
- **Framework:** Vanilla JavaScript (ES6+)
- **Build Tool:** Vite
- **Testing:** Jest
- **Styling:** CSS3 + Mobile-first approach
- **Storage:** localStorage + Backend API

### Backend (To be implemented)
- **Runtime:** Node.js or Python
- **Framework:** Express.js or Flask
- **Authentication:** JWT tokens
- **Database:** PostgreSQL or MongoDB

---

## Getting Started

### Prerequisites
- Node.js 16+ or Python 3.8+
- Git
- Modern web browser

### Installation

```bash
# Clone repository
git clone https://github.com/Pabos13/jobnexus.git
cd jobnexus

# Install dependencies
npm install

# Create .env file
cp .env.example .env.local

# Edit environment variables
vim .env.local
```

### Running Locally

```bash
# Development mode
npm run dev

# Open http://localhost:5173 in browser
```

---

## Project Structure

```
jobnexus/
├── services/              # Business logic layer
│   ├── authService.js     # Authentication
│   ├── jobService.js      # Job operations
│   ├── csvParser.js       # CSV parsing
│   ├── storageService.js  # Data persistence
│   ├── favoritesService.js
│   ├── analyticsService.js
│   ├── notificationService.js
│   └── advancedFilters.js
│
├── __tests__/             # Test files
│   ├── csvParser.test.js
│   ├── storageService.test.js
│   └── jobService.test.js
│
├── app.js                 # Main application
├── config.js              # Configuration
├── index.html             # HTML template
├── styles.css             # Desktop styles
├── styles-mobile.css      # Mobile styles
├── jest.config.js         # Jest configuration
├── package.json           # Dependencies
└── README.md              # Documentation
```

---

## Core Services

### AuthService
Handles user authentication, login, and JWT token management.

```javascript
const user = await AuthService.register(email, password, name);
await AuthService.login(email, password);
AuthService.logout();
const isAuth = AuthService.isAuthenticated();
```

### JobService
Manages job data from CSV and API sources.

```javascript
const csvJobs = await JobService.loadCSVJobs();
const apiJobs = await JobService.loadJoobleJobs(keywords, location);
const combined = JobService.combineJobs(csvJobs, apiJobs);
const filtered = JobService.filterJobs(jobs, filters);
```

### FavoritesService
Manages user's saved jobs.

```javascript
await FavoritesService.addFavorite(job);
const favorites = FavoritesService.getFavorites();
await FavoritesService.removeFavorite(jobId);
```

### StorageService
Handles localStorage operations.

```javascript
StorageService.saveAnnouncements(announcements);
const ann = StorageService.loadAnnouncements();
StorageService.addSearchHistory(query);
```

### AnalyticsService
Tracks user events.

```javascript
AnalyticsService.trackEvent('job_view', { jobId });
AnalyticsService.trackSearch(query, location, count);
AnalyticsService.trackJobApply(jobId, job);
```

---

## Development Workflow

### Creating a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b features/your-feature-name
   ```

2. **Implement feature**
   - Add code to appropriate service
   - Write tests in `__tests__/`
   - Update styles if needed

3. **Test locally**
   ```bash
   npm test
   npm run dev
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```

5. **Create Pull Request**
   - Push to GitHub
   - Open PR with description
   - Request review

### Code Style

- Use ES6+ syntax
- Follow JSDoc comments
- Keep functions focused and small
- Use meaningful variable names
- Add error handling

```javascript
/**
 * Fetch and process jobs
 * @param {string} query - Search query
 * @returns {Promise<Array>} Job results
 * @throws {Error} If API call fails
 */
async function getJobs(query) {
    try {
        const response = await fetch(...);
        if (!response.ok) throw new Error('API error');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
```

---

## Testing

### Run Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

```javascript
import { YourService } from '../../services/yourService';

describe('YourService', () => {
    beforeEach(() => {
        // Setup
    });

    it('should do something', () => {
        const result = YourService.method();
        expect(result).toBe(expected);
    });
});
```

---

## Building for Production

```bash
# Build optimized bundle
npm run build

# Output in dist/ folder
# Deploy to hosting service
```

---

## Environment Variables

### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_JOOBLE_API_URL=https://pl.jooble.org/api/
```

### Backend (.env)
```env
JOOBLE_API_KEY=your-key-here
JWT_SECRET=your-secret-here
DATABASE_URL=postgresql://...
NODE_ENV=production
```

---

## Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "API not responding"
- Check backend is running
- Verify environment variables
- Check network tab in DevTools

### "Tests failing"
```bash
npm run test:watch
# Check specific test output
```

### "Mobile layout broken"
- Open DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Check styles-mobile.css

---

## Performance Tips

1. **Lazy load images**
   ```html
   <img loading="lazy" src="...">
   ```

2. **Debounce search**
   - Already implemented in app.js
   - Configurable in config.js

3. **Cache API responses**
   - Use StorageService for caching
   - Set expiry times

4. **Minimize bundle**
   ```bash
   npm run build
   # Check dist/ folder size
   ```

---

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
# Follow prompts
```

### GitHub Pages
```bash
npm run build
# Push dist/ to gh-pages branch
```

### Traditional Hosting
```bash
npm run build
# Upload dist/ folder to server
```

---

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Write tests
5. Submit PR

---

## Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [Jest Documentation](https://jestjs.io/)
- [Vite Guide](https://vitejs.dev/guide/)
- [REST API Best Practices](https://restfulapi.net/)

---

*Last updated: 2026-08-25*
