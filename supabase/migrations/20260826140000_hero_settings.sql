-- Hero settings: stores hero slides with uploadable images and category assignments
CREATE TABLE IF NOT EXISTS public.hero_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sort_order integer NOT NULL DEFAULT 0,
  headline_line1 text NOT NULL DEFAULT '',
  headline_line2 text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  tag text NOT NULL DEFAULT '',
  price_from text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read hero_settings"
  ON public.hero_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage hero_settings"
  ON public.hero_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default hero slides
INSERT INTO public.hero_settings (sort_order, headline_line1, headline_line2, label, tag, price_from, images, is_active)
VALUES
  (0, 'Living Room', 'Reinvented', 'New Collection', 'Furniture', 'From KSh 38,870', ARRAY['https://images.unsplash.com/photo-1724780027758-623777e0488b'], true),
  (1, 'Kitchen', 'Elevated', 'Chef Favorites', 'Kitchenware', 'From KSh 6,370', ARRAY['https://images.unsplash.com/photo-1575882711815-7ac675ec1ebd'], true),
  (2, 'Bedroom', 'Sanctuary', 'Rest Well', 'Bedroom', 'From KSh 16,770', ARRAY['https://img.rocket.new/generatedImages/rocket_gen_img_1a7c50e83-1772063715990.png'], true)
ON CONFLICT DO NOTHING;
