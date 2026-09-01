/**
 * JobsService — handles all API calls to backend for job listings
 * Provides CRUD operations and search functionality
 */

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001';

export const JobsService = {
  /**
   * Fetch all jobs from API
   * @returns {Promise<Array>} Array of job objects
   */
  async getAllJobs() {
    try {
      const response = await fetch(`${API_BASE}/api/jobs`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch jobs:', error);
      // Fallback: return empty array
      return [];
    }
  },

  /**
   * Fetch single job by ID
   * @param {number} id - Job ID
   * @returns {Promise<Object>} Job object
   */
  async getJobById(id) {
    try {
      const response = await fetch(`${API_BASE}/api/jobs/${id}`);
      if (!response.ok) throw new Error('Job not found');
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch job:', error);
      return null;
    }
  },

  /**
   * Create new job listing
   * @param {Object} jobData - Job details
   * @returns {Promise<Object>} Created job object
   */
  async createJob(jobData) {
    try {
      const response = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      if (!response.ok) throw new Error(`Failed to create job: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to create job:', error);
      throw error;
    }
  },

  /**
   * Update existing job
   * @param {number} id - Job ID
   * @param {Object} jobData - Updated job details
   * @returns {Promise<Object>} Updated job object
   */
  async updateJob(id, jobData) {
    try {
      const response = await fetch(`${API_BASE}/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      if (!response.ok) throw new Error(`Failed to update job: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to update job:', error);
      throw error;
    }
  },

  /**
   * Delete job by ID
   * @param {number} id - Job ID
   * @returns {Promise<Object>} Confirmation message
   */
  async deleteJob(id) {
    try {
      const response = await fetch(`${API_BASE}/api/jobs/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to delete job: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to delete job:', error);
      throw error;
    }
  },

  /**
   * Search jobs by query, location, type
   * @param {Object} filters - Search filters { q, location, type }
   * @returns {Promise<Array>} Matching jobs
   */
  async searchJobs(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.location) params.append('location', filters.location);
      if (filters.type) params.append('type', filters.type);

      const response = await fetch(`${API_BASE}/api/jobs/search?${params}`);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Search failed:', error);
      return [];
    }
  }
};

export default JobsService;