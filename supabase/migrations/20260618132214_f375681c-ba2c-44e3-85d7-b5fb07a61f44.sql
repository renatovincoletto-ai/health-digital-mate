
CREATE POLICY "Public read brand assets" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'brand-assets');

CREATE POLICY "Members upload brand assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = public.user_tenant_id(auth.uid())::text
  );

CREATE POLICY "Members update brand assets" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = public.user_tenant_id(auth.uid())::text
  );

CREATE POLICY "Members delete brand assets" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = public.user_tenant_id(auth.uid())::text
  );
