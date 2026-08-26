-- Add phone to orders, pickup_locations table, and update handle_new_user to capture phone

-- ============================================================
-- 1. ADD PHONE TO ORDERS TABLE
-- ============================================================
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS pickup_location TEXT DEFAULT '';

-- ============================================================
-- 2. PICKUP LOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pickup_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT '',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pickup_locations_is_active ON public.pickup_locations(is_active);

ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pickup_locations" ON public.pickup_locations;
CREATE POLICY "public_read_pickup_locations"
ON public.pickup_locations FOR SELECT TO public
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_manage_pickup_locations" ON public.pickup_locations;
CREATE POLICY "admin_manage_pickup_locations"
ON public.pickup_locations FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- 3. UPDATE handle_new_user TO CAPTURE PHONE
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role,
        COALESCE(NEW.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 4. SEED PICKUP LOCATIONS
-- ============================================================
DO $$
BEGIN
    INSERT INTO public.pickup_locations (id, name, address, area, latitude, longitude, sort_order)
    VALUES
        (gen_random_uuid(), 'Nyotas Homecare - Westlands', 'Westlands Square, Waiyaki Way', 'Westlands', -1.2676, 36.8108, 1),
        (gen_random_uuid(), 'Nyotas Homecare - CBD', 'Kenyatta Avenue, Nairobi CBD', 'CBD', -1.2833, 36.8172, 2),
        (gen_random_uuid(), 'Nyotas Homecare - Kilimani', 'Yaya Centre, Argwings Kodhek Rd', 'Kilimani', -1.2921, 36.7876, 3),
        (gen_random_uuid(), 'Nyotas Homecare - Karen', 'Karen Shopping Centre, Karen Rd', 'Karen', -1.3167, 36.7167, 4),
        (gen_random_uuid(), 'Nyotas Homecare - Eastleigh', 'Eastleigh Shopping Mall, 1st Ave', 'Eastleigh', -1.2667, 36.8500, 5),
        (gen_random_uuid(), 'Nyotas Homecare - Thika Road', 'Garden City Mall, Thika Superhighway', 'Thika Road', -1.2333, 36.8833, 6)
    ON CONFLICT (id) DO NOTHING;
END $$;
