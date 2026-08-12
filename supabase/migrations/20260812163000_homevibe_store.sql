-- HomeVibe E-Commerce Schema Migration
-- Tables: user_profiles, categories, products, orders, order_items

-- ============================================================
-- 1. TYPES
-- ============================================================
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'customer');

DROP TYPE IF EXISTS public.order_status CASCADE;
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- ============================================================
-- 2. CORE TABLES
-- ============================================================

-- User Profiles (intermediary for auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    role public.user_role DEFAULT 'customer'::public.user_role,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT DEFAULT '',
    images JSONB DEFAULT '[]'::jsonb,
    badge TEXT DEFAULT '',
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    status public.order_status DEFAULT 'pending'::public.order_status,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_address TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ============================================================
-- 4. FUNCTIONS (BEFORE RLS POLICIES)
-- ============================================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Admin check function (uses auth metadata to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin'
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- user_profiles: own row + admin full access
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

-- categories: public read, admin write
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories"
ON public.categories FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;
CREATE POLICY "admin_manage_categories"
ON public.categories FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- products: public read, admin write
DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products"
ON public.products FOR SELECT TO public
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products"
ON public.products FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- orders: users see own orders, admin sees all
DROP POLICY IF EXISTS "users_manage_own_orders" ON public.orders;
CREATE POLICY "users_manage_own_orders"
ON public.orders FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- order_items: via order ownership
DROP POLICY IF EXISTS "users_view_own_order_items" ON public.order_items;
CREATE POLICY "users_view_own_order_items"
ON public.order_items FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id
        AND (o.user_id = auth.uid() OR public.is_admin())
    )
);

DROP POLICY IF EXISTS "users_insert_own_order_items" ON public.order_items;
CREATE POLICY "users_insert_own_order_items"
ON public.order_items FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id
        AND (o.user_id = auth.uid() OR public.is_admin())
    )
);

DROP POLICY IF EXISTS "admin_manage_order_items" ON public.order_items;
CREATE POLICY "admin_manage_order_items"
ON public.order_items FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- 7. TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 8. MOCK DATA
-- ============================================================
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    customer_uuid UUID := gen_random_uuid();
    cat_living UUID := gen_random_uuid();
    cat_bedroom UUID := gen_random_uuid();
    cat_kitchen UUID := gen_random_uuid();
    cat_decor UUID := gen_random_uuid();
    prod1_uuid UUID := gen_random_uuid();
    prod2_uuid UUID := gen_random_uuid();
    prod3_uuid UUID := gen_random_uuid();
    prod4_uuid UUID := gen_random_uuid();
    prod5_uuid UUID := gen_random_uuid();
    prod6_uuid UUID := gen_random_uuid();
    order1_uuid UUID := gen_random_uuid();
BEGIN
    -- Create admin and customer auth users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@homevibe.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Admin User', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (customer_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'customer@homevibe.com', crypt('customer123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Jane Smith'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Categories
    INSERT INTO public.categories (id, name, slug, description, sort_order) VALUES
        (cat_living, 'Living Room', 'living-room', 'Sofas, chairs, tables and more for your living space', 1),
        (cat_bedroom, 'Bedroom', 'bedroom', 'Bedding, pillows and bedroom essentials', 2),
        (cat_kitchen, 'Kitchenware', 'kitchenware', 'Cookware, mugs and kitchen accessories', 3),
        (cat_decor, 'Décor', 'decor', 'Vases, baskets and decorative accents', 4)
    ON CONFLICT (id) DO NOTHING;

    -- Products
    INSERT INTO public.products (id, name, slug, description, price, original_price, category_id, image_url, badge, rating, review_count, stock_quantity, is_featured) VALUES
        (prod1_uuid, 'Linen Cloud Sofa', 'linen-cloud-sofa',
         'Sink into pure comfort with our best-selling Linen Cloud Sofa. Crafted from premium Belgian linen in a warm sand tone, this sofa features deep cushions, rounded arms, and a solid hardwood frame. Perfect for living rooms that balance style with everyday comfort. Available in 3 colors.',
         899.00, 1199.00, cat_living,
         'https://img.rocket.new/generatedImages/rocket_gen_img_14cd98208-1772851737802.png',
         'Best Seller', 4.9, 312, 8, true),
        (prod2_uuid, 'Terracotta Mug Set', 'terracotta-mug-set',
         'A set of four handcrafted terracotta mugs with a beautiful matte glaze finish. Each mug holds 12oz and is dishwasher safe. The earthy tones bring warmth to your morning routine. Sold as a set of 4.',
         54.00, NULL, cat_kitchen,
         'https://images.unsplash.com/photo-1688938675788-657ea207453a',
         '', 4.8, 189, 24, true),
        (prod3_uuid, 'Rattan Accent Chair', 'rattan-accent-chair',
         'Handwoven from natural rattan with a cream cushion, this accent chair adds texture and warmth to any room. The natural finish complements both modern and bohemian interiors. Cushion cover is removable and washable.',
         349.00, NULL, cat_living,
         'https://images.unsplash.com/photo-1684424567465-8332058b1e6a',
         'New', 4.7, 98, 5, true),
        (prod4_uuid, 'Linen Duvet Cover', 'linen-duvet-cover',
         'Transform your bedroom with our washed linen duvet cover in warm stone. Pre-washed for extra softness, it gets better with every wash. Includes two matching pillowcases. Available in Queen and King sizes.',
         129.00, 159.00, cat_bedroom,
         'https://images.unsplash.com/photo-1721902020524-f0c0edd25f3f',
         '', 4.9, 445, 15, true),
        (prod5_uuid, 'Ceramic Vase Trio', 'ceramic-vase-trio',
         'Three ceramic vases in graduated sizes with a matte white and cream glaze. Each piece is hand-thrown and slightly unique. Perfect for dried flowers, pampas grass, or as standalone sculptural objects.',
         89.00, NULL, cat_decor,
         'https://images.unsplash.com/photo-1590860778262-2d8ddead7c1a',
         'Popular', 4.8, 221, 18, false),
        (prod6_uuid, 'Cast Iron Skillet', 'cast-iron-skillet',
         'Pre-seasoned and ready to use, this cast iron skillet delivers even heat distribution for perfect searing, baking, and frying. Compatible with all stovetops including induction. Comes with a silicone handle grip.',
         79.00, NULL, cat_kitchen,
         'https://images.unsplash.com/photo-1722795713888-60a6526b5979',
         '', 4.9, 567, 30, false)
    ON CONFLICT (id) DO NOTHING;

    -- Sample order for the customer
    INSERT INTO public.orders (id, user_id, status, total_amount, shipping_address) VALUES
        (order1_uuid, customer_uuid, 'delivered'::public.order_status, 983.00, '123 Main St, San Francisco, CA 94102')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, quantity, unit_price, total_price) VALUES
        (order1_uuid, prod1_uuid, 'Linen Cloud Sofa', 'https://img.rocket.new/generatedImages/rocket_gen_img_14cd98208-1772851737802.png', 1, 899.00, 899.00),
        (order1_uuid, prod2_uuid, 'Terracotta Mug Set', 'https://images.unsplash.com/photo-1688938675788-657ea207453a', 2, 54.00, 108.00)
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
