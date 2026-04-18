-- Storage buckets (run after storage extension is enabled)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'org-logos',
    'org-logos',
    true,
    2097152,
    ARRAY['image/jpeg','image/png','image/svg+xml','image/webp']
  ),
  (
    'teacher-materials',
    'teacher-materials',
    false,
    20971520,
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  ),
  (
    'step-images',
    'step-images',
    true,
    5242880,
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS policies
-- ============================================================

-- org-logos: anyone can read, only admins can upload/update/delete
CREATE POLICY "org_logos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'org-logos');

CREATE POLICY "org_logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'org-logos'
    AND public.my_role() IN ('school_admin', 'super_admin')
  );

CREATE POLICY "org_logos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'org-logos'
    AND public.my_role() IN ('school_admin', 'super_admin')
  );

CREATE POLICY "org_logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'org-logos'
    AND public.my_role() IN ('school_admin', 'super_admin')
  );

-- teacher-materials: teacher can CRUD their own folder, admin can see all org materials
CREATE POLICY "materials_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'teacher-materials'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.my_role() IN ('school_admin', 'super_admin')
    )
  );

CREATE POLICY "materials_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'teacher-materials'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.my_role() IN ('teacher', 'school_admin')
  );

CREATE POLICY "materials_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'teacher-materials'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.my_role() IN ('school_admin', 'super_admin')
    )
  );

-- step-images: public read, teacher/admin upload
CREATE POLICY "step_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'step-images');

CREATE POLICY "step_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'step-images'
    AND public.my_role() IN ('teacher', 'school_admin', 'super_admin')
  );
