-- ============================================================
-- Audit Logging (FERPA compliance)
-- Tracks who accessed or modified student educational records
-- ============================================================

CREATE TABLE public.audit_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role   text,
  action       text        NOT NULL,
  target_table text,
  target_id    uuid,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id   ON public.audit_logs (actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action     ON public.audit_logs (action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_admin_select ON public.audit_logs
  FOR SELECT USING (
    public.my_role() IN ('school_admin', 'super_admin')
  );

-- Audit logs are INSERT-only from application (no updates or deletes)
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT WITH CHECK (true);
