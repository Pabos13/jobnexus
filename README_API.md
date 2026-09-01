# JobNexus API Documentation

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment

Create `.env` file in root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:3001
PORT=3001
```

### 3. Setup Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy your `SUPABASE_URL` and `ANON_KEY` from project settings
3. Run the SQL from `database.sql` in Supabase SQL Editor
4. Add credentials to `.env`

### 4. Run Development

**Frontend only:**
```bash
npm run dev
```

**Backend only:**
```bash
npm run dev:server
```

**Both (recommended):**
```bash
npm run dev:all
```

---

## API Endpoints

### Get All Jobs
```
GET /api/jobs
```
**Response:** Array of job objects
```json
[
  {
    "id": 1,
    "title": "Zlecenie: Strona wizytówkowa",
    "company": "Firma A",
    "location": "Warszawa",
    "type": "Zlecenie",
    "description": "...",
    "date_posted": "2026-09-01",
    "tags": ["web", "HTML", "CSS"],
    "contact": "kontakt@firmaa.pl"
  }
]
```

### Get Single Job
```
GET /api/jobs/:id
```
**Response:** Single job object (same structure as above)

### Create Job
```
POST /api/jobs
Content-Type: application/json

{
  "title": "My Job",
  "company": "My Company",
  "location": "Warsaw",
  "type": "Zlecenie",
  "description": "Description",
  "tags": ["react", "node"],
  "contact": "contact@example.com"
}
```

### Update Job
```
PUT /api/jobs/:id
Content-Type: application/json

{ /* same fields as POST */ }
```

### Delete Job
```
DELETE /api/jobs/:id
```
**Response:** `{ "message": "Job deleted successfully", "id": 1 }`

### Search Jobs
```
GET /api/jobs/search?q=react&location=warsaw&type=Zlecenie
```
**Query Parameters:**
- `q` - Search in title/description/tags
- `location` - Filter by location
- `type` - Filter by type (Zlecenie, Ogłoszenie)

---

## Integration in Frontend (app.js)

```javascript
import { JobsService } from './services/jobsService.js';

// Load all jobs
const allJobs = await JobsService.getAllJobs();

// Search
const results = await JobsService.searchJobs({ q: 'react', location: 'warsaw' });

// Create job
await JobsService.createJob({
  title: 'New Job',
  company: 'Company',
  location: 'City',
  type: 'Zlecenie',
  description: 'Desc',
  tags: ['tag1', 'tag2'],
  contact: 'email@example.com'
});
```

---

## Deployment

### Vercel (Frontend + Backend)
1. Push to GitHub
2. Deploy `server.js` as serverless function (create `api/` folder)
3. Set environment variables in Vercel dashboard
4. Update `VITE_API_URL` to production URL

### Heroku (Backend only)
```bash
git push heroku main
```

---

## Troubleshooting

**"Cannot connect to API"**
- Check `.env` file exists with correct `VITE_API_URL`
- Check backend running on `http://localhost:3001`

**"Jobs not loading"**
- Verify Supabase credentials in `.env`
- Check `jobs` table exists in Supabase
- Check network tab in DevTools for errors

**CORS errors**
- Backend has CORS enabled by default
- If issues persist, update `cors()` config in `server.js`
