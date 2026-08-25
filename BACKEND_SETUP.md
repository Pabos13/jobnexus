# Backend Setup Guide for JobNexus

## Overview

This guide shows how to create a secure backend proxy for the Jooble API integration.

---

## Prerequisites

- Node.js 16+ (or Python 3.8+)
- Jooble API Key
- Environment variables configured

---

## Option 1: Node.js + Express

### 1. Initialize Project
```bash
mkdir jobnexus-backend
cd jobnexus-backend
npm init -y
npm install express cors dotenv axios
```

### 2. Create `.env`
```env
JOOBLE_API_KEY=your-api-key-here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Create `server.js`
```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());

// Routes
app.post('/api/jobs/search', async (req, res) => {
    try {
        const { keywords = 'praca', location = 'Polska' } = req.body;
        
        // Validate input
        if (!keywords || typeof keywords !== 'string') {
            return res.status(400).json({ error: 'Invalid keywords' });
        }
        
        // Call Jooble API securely from backend
        const response = await axios.post(
            `https://pl.jooble.org/api/${process.env.JOOBLE_API_KEY}`,
            {
                keywords: keywords.substring(0, 100), // Limit length
                location: location.substring(0, 100),
                page: '1',
                searchMode: '1'
            },
            { timeout: 10000 }
        );
        
        // Return results
        res.json({
            success: true,
            jobs: response.data.jobs || []
        });
        
    } catch (error) {
        console.error('Jooble API Error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch jobs',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`JobNexus backend running on http://localhost:${PORT}`);
});
```

### 4. Run Server
```bash
node server.js
```

### 5. Test API
```bash
curl -X POST http://localhost:3000/api/jobs/search \
  -H "Content-Type: application/json" \
  -d '{"keywords": "developer", "location": "Warszawa"}'
```

---

## Option 2: Python + Flask

### 1. Initialize Project
```bash
mkdir jobnexus-backend
cd jobnexus-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install flask flask-cors python-dotenv requests
```

### 2. Create `.env`
```env
JOOBLE_API_KEY=your-api-key-here
FLASK_ENV=development
FLASK_DEBUG=True
CORS_ORIGIN=http://localhost:5173
```

### 3. Create `app.py`
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app, origins=[os.getenv('CORS_ORIGIN', '*')])

JOOBLE_API_KEY = os.getenv('JOOBLE_API_KEY')
JOOBLE_API_URL = 'https://pl.jooble.org/api/'

@app.route('/api/jobs/search', methods=['POST'])
def search_jobs():
    try:
        data = request.get_json()
        keywords = data.get('keywords', 'praca')[:100]  # Limit input
        location = data.get('location', 'Polska')[:100]
        
        if not keywords or not isinstance(keywords, str):
            return jsonify({'error': 'Invalid keywords'}), 400
        
        # Call Jooble API securely
        response = requests.post(
            f"{JOOBLE_API_URL}{JOOBLE_API_KEY}",
            json={
                'keywords': keywords,
                'location': location,
                'page': '1',
                'searchMode': '1'
            },
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Jooble API error'}), response.status_code
        
        return jsonify({
            'success': True,
            'jobs': response.json().get('jobs', [])
        })
        
    except Exception as error:
        print(f'Error: {str(error)}')
        return jsonify({
            'error': 'Failed to fetch jobs',
            'message': str(error) if os.getenv('FLASK_ENV') == 'development' else 'Server error'
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, port=3000)
```

### 4. Run Server
```bash
python app.py
```

---

## Production Deployment

### Environment Variables
**NEVER** commit `.env` file!

```bash
# .gitignore
.env
.env.local
.env.*.local
```

### Deploy on Heroku (Node.js)

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

heroku create jobnexus-backend
heroku config:set JOOBLE_API_KEY=your-key-here
heroku config:set CORS_ORIGIN=https://your-frontend.com
git push heroku main
```

### Deploy on Vercel (Node.js)

```bash
# Create vercel.json
{
  "buildCommand": "",
  "public": false,
  "env": {
    "JOOBLE_API_KEY": "@jooble-api-key",
    "CORS_ORIGIN": "@cors-origin"
  }
}
```

---

## Testing

### Unit Test (Node.js)
```javascript
const request = require('supertest');
const app = require('./server');

describe('GET /health', () => {
    it('should return status OK', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('OK');
    });
});
```

### Integration Test
```bash
curl -X POST http://localhost:3000/api/jobs/search \
  -H "Content-Type: application/json" \
  -d '{"keywords": "python", "location": "Kraków"}'
```

---

## Security Best Practices

✅ **Do:**
- Store API keys in environment variables
- Validate all input on backend
- Use HTTPS in production
- Set CORS properly
- Rate limit API endpoints
- Log errors (not sensitive data)

❌ **Don't:**
- Expose API keys in code
- Trust frontend validation alone
- Commit `.env` files
- Allow CORS from `*` in production
- Log user data

---

## Monitoring

### Logging
```javascript
// Winston logger
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

### Health Checks
```bash
# Monitor endpoint
GET /health → { status: 'OK', timestamp: '...' }
```

---

## Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### "CORS error"
Check `CORS_ORIGIN` in `.env` matches your frontend URL

### "Jooble API returns 401"
Verify `JOOBLE_API_KEY` is correct in `.env`

---

## References

- [Jooble API Docs](https://pl.jooble.org/api/)
- [Express.js](https://expressjs.com/)
- [Flask](https://flask.palletsprojects.com/)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

*Last updated: 2026-08-25*
