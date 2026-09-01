-- JobNexus Database Schema for Supabase
-- Run this in Supabase SQL Editor to set up the jobs table

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(100),
  type VARCHAR(50) DEFAULT 'Zlecenie',
  description TEXT,
  date_posted DATE DEFAULT CURRENT_DATE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  contact VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX idx_jobs_title ON jobs(title);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_date ON jobs(date_posted DESC);

-- Enable Row Level Security (optional)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON jobs
  FOR SELECT USING (true);

-- Allow authenticated users to create/edit jobs
CREATE POLICY "Allow authenticated create" ON jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON jobs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON jobs
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample data (the 50 jobs from jobs.json)
INSERT INTO jobs (title, company, location, type, description, date_posted, tags, contact) VALUES
('Zlecenie: Strona wizytówkowa dla lokalnej firmy', 'Firma A', 'Warszawa', 'Zlecenie', 'Proste one-page, responsywna, integracja z formularzem kontaktowym.', '2026-09-01', '{"web","HTML","CSS"}', 'kontakt@firmaa.pl'),
('Ogłoszenie: Projekt logo i identyfikacja wizualna', 'Studio Kreatywne', 'Zdalnie', 'Ogłoszenie', 'Nowe logo, kolorystyka, wersje do druku i online.', '2026-08-28', '{"design","logo"}', 'kontakt@studiokreatywne.com'),
('Zlecenie: Sklep internetowy (WooCommerce)', 'Sklepik', 'Kraków', 'Zlecenie', 'Migracja produktów, konfiguracja płatności i szablonu.', '2026-08-30', '{"wordpress","ecommerce"}', 'kontakt@sklepik.pl'),
('Ogłoszenie: Tłumaczenie tekstów technicznych PL->EN', 'Biuro Tłumaczeń', 'Zdalnie', 'Ogłoszenie', 'Dokumentacja techniczna, termin 2 tygodnie.', '2026-08-25', '{"tłumaczenia"}', 'tlumaczenia@biuro.pl'),
('Zlecenie: Aplikacja mobilna (Flutter) - MVP', 'Startup X', 'Wrocław', 'Zlecenie', 'Prosty MVP do rejestracji użytkowników i przeglądu ofert.', '2026-08-20', '{"flutter","mobile"}', 'jobs@startupx.io'),
('Ogłoszenie: Sesja zdjęciowa produktowa', 'E-commerce Y', 'Poznań', 'Ogłoszenie', 'Zdjęcia packshot, retusz, dostawa 100 zdjęć.', '2026-08-22', '{"foto","ecommerce"}', 'photo@ecommercey.pl'),
('Zlecenie: Optymalizacja SEO strony', 'Agencja SEO', 'Zdalnie', 'Zlecenie', 'Audyt, optymalizacja on-page, propozycje treści.', '2026-08-18', '{"seo"}', 'seo@agencja.pl'),
('Ogłoszenie: Copywriter - artykuły blogowe', 'BlogTech', 'Zdalnie', 'Ogłoszenie', 'Regularne artykuły 1000-1500 słów, tematyka IT.', '2026-08-15', '{"copywriting"}', 'redakcja@blogtech.com'),
('Zlecenie: Integracja API kurierskiego', 'Logistyka S.A.', 'Gdańsk', 'Zlecenie', 'Podłączenie API do systemu zamówień, testy end-to-end.', '2026-08-10', '{"api","backend"}', 'devs@logistyka.pl'),
('Ogłoszenie: Animacja intro do filmów YouTube', 'Kanał V', 'Zdalnie', 'Ogłoszenie', 'Krótka animacja 5-7s, wersje hd i mobile.', '2026-08-12', '{"animacja","video"}', 'kontakt@kanalv.tv');