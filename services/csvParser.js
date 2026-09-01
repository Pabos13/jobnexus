/**
 * CSV Parser Service
 * Handles CSV parsing with validation and error recovery
 */

export class CSVParser {
    /**
     * Parse CSV text into array of objects
     * @param {string} text - CSV content
     * @param {string} delimiter - CSV delimiter (default: ';')
     * @returns {Array} Parsed data
     */
    static parse(text, delimiter = ';') {
        try {
            const lines = text.trim().split('\n');
            
            if (lines.length < 2) {
                throw new Error('CSV file is empty or has no data');
            }
            
            // Parse header
            const headers = this.parseCSVLine(lines[0], delimiter)
                .map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''));
            
            if (headers.length === 0) {
                throw new Error('No headers found in CSV');
            }
            
            // Parse rows
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Skip empty lines
                
                const values = this.parseCSVLine(line, delimiter);
                
                if (values.length !== headers.length) {
                    console.warn(`Row ${i} has ${values.length} columns, expected ${headers.length}. Skipping.`);
                    continue;
                }
                
                const row = {};
                headers.forEach((header, idx) => {
                    row[header] = (values[idx] || '').trim();
                });
                
                rows.push(row);
            }
            
            if (rows.length === 0) {
                throw new Error('No valid data rows found in CSV');
            }
            
            return rows;
        } catch (error) {
            throw new Error(`CSV parse error: ${error.message}`);
        }
    }
    
    /**
     * Parse a single CSV line handling quoted fields
     * @param {string} line - CSV line
     * @param {string} delimiter - CSV delimiter
     * @returns {Array} Parsed fields
     */
    static parseCSVLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }
    
    /**
     * Normalize job object from CSV
     * @param {Object} raw - Raw CSV row
     * @returns {Object} Normalized job object
     */
    static normalizeJob(raw) {
        const title = raw.stanowisko || raw.title || raw.job_title || 'Oferta pracy';
        const company = raw.pracodawca || raw.company || raw.employer || 'Pracodawca';
        const location = raw.miejsce_pracy || raw.location || raw.city || 'Polska';
        const type = raw.rodzaj_umowy || raw.type || raw.job_type || 'Umowa o pracę';
        const date = raw.dostępna_od || raw.date || raw.posted_date || new Date().toISOString().split('T')[0];
        const salary = raw.pensja || raw.salary || raw.wynagrodzenie || 'Do negocjacji';
        const description = raw.opis || raw.description || raw.job_description || '';
        
        return {
            id: `csv-${Math.random().toString(36).substr(2, 9)}`,
            title: this.sanitize(title),
            company: this.sanitize(company),
            location: this.sanitize(location),
            type: this.sanitize(type),
            salary: this.sanitize(salary),
            date: this.validateDate(date),
            description: this.sanitize(description),
            source: 'csv',
            featured: false,
            url: '#'
        };
    }
    
    /**
     * Sanitize string to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    static sanitize(str) {
        if (typeof str !== 'string') return '';
        return str
            .trim()
            .replace(/[<>]/g, '') // Remove angle brackets
            .substring(0, 500); // Limit length
    }
    
    /**
     * Validate and format date
     * @param {string} date - Date string
     * @returns {string} ISO date format
     */
    static validateDate(date) {
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                return new Date().toISOString().split('T')[0];
            }
            return d.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    }
}

export default CSVParser;
