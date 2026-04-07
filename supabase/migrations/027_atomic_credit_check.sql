-- 027_atomic_credit_check.sql
-- Atomic check-and-increment for image API credits.
-- Prevents TOCTOU race condition where concurrent requests could exceed credit limit.
--
-- Replaces the two-step pattern: check (credits_used < credits_allocated) then increment.
-- Both steps now happen in a single transaction with row-level locking.
--
-- Returns true if credit was successfully consumed, false if limit reached.

CREATE OR REPLACE FUNCTION public.check_and_increment_image_credits(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allocated integer;
  v_used integer;
BEGIN
  -- Lock the row to prevent concurrent updates
  SELECT image_api_credits_allocated, image_api_credits_used
    INTO v_allocated, v_used
    FROM org_integrations
   WHERE org_id = p_org_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_used >= v_allocated THEN
    RETURN false;
  END IF;

  UPDATE org_integrations
     SET image_api_credits_used = image_api_credits_used + 1
   WHERE org_id = p_org_id;

  RETURN true;
END;
$$;
