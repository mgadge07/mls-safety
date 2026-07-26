-- =============================================================================
-- MLS SAFETY — Phase 1 Schema
-- Vehicle + Trailer daily inspections with QR selection, categorized checks,
-- problem photos, signature, and full audit trail.
-- Run this in the Supabase SQL Editor on a new project.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. VEHICLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number  TEXT NOT NULL UNIQUE,          -- what crews see & what QR encodes
    license_plate   TEXT,
    branch          TEXT DEFAULT 'Irvine',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_number ON vehicles(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(active) WHERE active = TRUE;

-- -----------------------------------------------------------------------------
-- 2. TRAILERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trailers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trailer_number  TEXT NOT NULL UNIQUE,          -- what crews see & what QR encodes
    license_plate   TEXT,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trailers_number ON trailers(trailer_number);
CREATE INDEX IF NOT EXISTS idx_trailers_active ON trailers(active) WHERE active = TRUE;

-- -----------------------------------------------------------------------------
-- 3. INSPECTIONS (one row per completed inspection)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspections (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type                TEXT NOT NULL CHECK (type IN ('vehicle', 'trailer')),
    vehicle_id          UUID REFERENCES vehicles(id),
    trailer_id          UUID REFERENCES trailers(id),
    inspection_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    is_monday_full      BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_by_name   TEXT NOT NULL,             -- from signature
    employee_number     TEXT,                       -- optional
    signature_path      TEXT,                       -- Supabase Storage path or base64
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    accuracy_m          DOUBLE PRECISION,
    device_info         TEXT,
    overall_status      TEXT NOT NULL CHECK (overall_status IN ('all_good', 'has_problems')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- exactly one of vehicle_id or trailer_id must be set
    CONSTRAINT inspections_unit_check CHECK (
        (type = 'vehicle' AND vehicle_id IS NOT NULL AND trailer_id IS NULL) OR
        (type = 'trailer' AND trailer_id IS NOT NULL AND vehicle_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_inspections_vehicle ON inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_trailer ON inspections(trailer_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(overall_status);

-- -----------------------------------------------------------------------------
-- 4. INSPECTION CATEGORIES (one row per category per inspection)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id       UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    category_key        TEXT NOT NULL,               -- e.g. 'tires_wheels'
    category_label      TEXT NOT NULL,               -- e.g. 'Tires & Wheels'
    status              TEXT NOT NULL CHECK (status IN ('good', 'problem')),
    problem_description TEXT,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insp_cat_inspection ON inspection_categories(inspection_id);

-- -----------------------------------------------------------------------------
-- 5. INSPECTION PHOTOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_photos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id       UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES inspection_categories(id) ON DELETE SET NULL,
    storage_path        TEXT NOT NULL,              -- Supabase Storage path
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insp_photos_inspection ON inspection_photos(inspection_id);

-- -----------------------------------------------------------------------------
-- 6. HELPER: touch updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vehicles_updated ON vehicles;
CREATE TRIGGER trg_vehicles_updated
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_trailers_updated ON trailers;
CREATE TRIGGER trg_trailers_updated
    BEFORE UPDATE ON trailers
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- -----------------------------------------------------------------------------
-- 7. BASIC RLS (tighten later once auth roles are defined)
-- For Phase 1 we allow authenticated users to read/write inspections.
-- -----------------------------------------------------------------------------
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;

-- Vehicles & trailers: anyone authenticated can read active ones
CREATE POLICY vehicles_select ON vehicles FOR SELECT TO authenticated USING (active = TRUE);
CREATE POLICY trailers_select ON trailers FOR SELECT TO authenticated USING (active = TRUE);

-- Managers/admins can manage the roster (we'll refine roles later)
CREATE POLICY vehicles_all ON vehicles FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY trailers_all ON trailers FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Inspections: authenticated users can insert and read
CREATE POLICY inspections_insert ON inspections FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY inspections_select ON inspections FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY insp_cat_insert ON inspection_categories FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY insp_cat_select ON inspection_categories FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY insp_photos_insert ON inspection_photos FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY insp_photos_select ON inspection_photos FOR SELECT TO authenticated USING (TRUE);

-- -----------------------------------------------------------------------------
-- 8. SEED a few sample vehicles & trailers so testing is easy
-- -----------------------------------------------------------------------------
INSERT INTO vehicles (vehicle_number, license_plate, branch) VALUES
    ('V-101', '7ABC123', 'Irvine'),
    ('V-104', '8DEF456', 'Irvine'),
    ('V-110', '9GHI789', 'Irvine')
ON CONFLICT (vehicle_number) DO NOTHING;

INSERT INTO trailers (trailer_number, license_plate) VALUES
    ('T-201', '4JKL012'),
    ('T-205', '5MNO345')
ON CONFLICT (trailer_number) DO NOTHING;

-- =============================================================================
-- DONE.
-- Next: create a Storage bucket named "inspection-photos" (public or authenticated).
-- =============================================================================
