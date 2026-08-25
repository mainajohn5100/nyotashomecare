-- Reviews table + order confirmation support
-- Adds product reviews and ensures orders are insertable by authenticated users

-- ============================================================
-- 1. REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT DEFAULT '',
    body TEXT DEFAULT '',
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Prevent duplicate reviews per user per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product ON public.reviews(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- ============================================================
-- 2. RLS FOR REVIEWS
-- ============================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_approved_reviews" ON public.reviews;
CREATE POLICY "public_read_approved_reviews"
ON public.reviews FOR SELECT TO public
USING (is_approved = true OR public.is_admin());

DROP POLICY IF EXISTS "users_insert_own_reviews" ON public.reviews;
CREATE POLICY "users_insert_own_reviews"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_reviews" ON public.reviews;
CREATE POLICY "users_update_own_reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_delete_own_reviews" ON public.reviews;
CREATE POLICY "users_delete_own_reviews"
ON public.reviews FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 3. TRIGGER: auto-update reviews updated_at
-- ============================================================
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 4. FUNCTION: recalculate product rating after review change
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_product_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_product_id := OLD.product_id;
    ELSE
        target_product_id := NEW.product_id;
    END IF;

    UPDATE public.products
    SET
        rating = COALESCE((
            SELECT ROUND(AVG(rating)::NUMERIC, 2)
            FROM public.reviews
            WHERE product_id = target_product_id AND is_approved = true
        ), 0),
        review_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE product_id = target_product_id AND is_approved = true
        )
    WHERE id = target_product_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- ============================================================
-- 5. ENSURE ORDERS INSERT POLICY EXISTS FOR AUTHENTICATED USERS
-- ============================================================
DROP POLICY IF EXISTS "users_insert_own_orders" ON public.orders;
CREATE POLICY "users_insert_own_orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());
