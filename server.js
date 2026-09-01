import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase initialization
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============ GET ALL JOBS ============
app.get('/api/jobs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('date_posted', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ============ GET SINGLE JOB ============
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// ============ CREATE NEW JOB ============
app.post('/api/jobs', async (req, res) => {
  try {
    const { title, company, location, type, description, date_posted, tags, contact } = req.body;

    if (!title || !company || !contact) {
      return res.status(400).json({ error: 'Missing required fields: title, company, contact' });
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          title,
          company,
          location: location || '',
          type: type || 'Zlecenie',
          description: description || '',
          date_posted: date_posted || new Date().toISOString().split('T')[0],
          tags: tags || [],
          contact
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// ============ UPDATE JOB ============
app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { title, company, location, type, description, tags, contact } = req.body;

    const { data, error } = await supabase
      .from('jobs')
      .update({
        title,
        company,
        location,
        type,
        description,
        tags,
        contact
      })
      .eq('id', req.params.id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// ============ DELETE JOB ============
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Job deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// ============ SEARCH JOBS ============
app.get('/api/jobs/search', async (req, res) => {
  try {
    const { q, location, type } = req.query;

    let query = supabase.from('jobs').select('*');

    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`);
    }
    if (location) {
      query = query.ilike('location', `%${location}%`);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('date_posted', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search jobs' });
  }
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`✅ JobNexus API running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /api/jobs`);
  console.log(`   GET  /api/jobs/:id`);
  console.log(`   POST /api/jobs`);
  console.log(`   PUT  /api/jobs/:id`);
  console.log(`   DELETE /api/jobs/:id`);
  console.log(`   GET  /api/jobs/search?q=react&location=warszawa&type=Zlecenie`);
});