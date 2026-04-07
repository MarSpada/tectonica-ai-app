-- 032_debit_image_credit_rpc.sql
-- Atomic debit + log for image generation billing.
-- Callable by any authenticated user — SECURITY DEFINER elevates privileges.
--
-- In a single transaction:
--   1. Inserts a row into image_generation_log
--   2. Upserts group_billing — decrements credit_balance_usd (creates row with
--      negative balance if none exists)
--
-- Returns the updated credit_balance_usd so the client can refresh without
-- a second API call.
--
-- Balance can go negative — generation is never blocked by insufficient credits.

CREATE OR REPLACE FUNCTION public.debit_image_credit(
  p_group_id uuid,
  p_org_id uuid,
  p_user_id uuid,
  p_fal_request_id text,
  p_endpoint text,
  p_output_width integer,
  p_output_height integer,
  p_input_image_count integer,
  p_mp_total decimal,
  p_cost_usd decimal
)
RETURNS decimal
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance decimal;
BEGIN
  -- 1. Log the generation
  INSERT INTO image_generation_log (
    group_id, org_id, user_id, fal_request_id, endpoint,
    output_width, output_height, input_image_count, mp_total, cost_usd
  ) VALUES (
    p_group_id, p_org_id, p_user_id, p_fal_request_id, p_endpoint,
    p_output_width, p_output_height, p_input_image_count, p_mp_total, p_cost_usd
  );

  -- 2. Upsert group_billing and decrement balance atomically
  INSERT INTO group_billing (group_id, org_id, credit_balance_usd)
    VALUES (p_group_id, p_org_id, 0 - p_cost_usd)
    ON CONFLICT (group_id) DO UPDATE
      SET credit_balance_usd = group_billing.credit_balance_usd - p_cost_usd,
          updated_at = now()
    RETURNING credit_balance_usd INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;
