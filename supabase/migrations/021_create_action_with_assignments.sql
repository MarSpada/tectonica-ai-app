-- Atomic action creation with optional targeted assignments.
-- Replaces the two-step insert pattern in /api/actions POST.
-- If either the action insert or assignments insert fails, both are rolled back.
create or replace function create_action_with_assignments(
  p_group_id       uuid,
  p_source         text,
  p_type           text,
  p_title          text,
  p_description    text,
  p_call_to_action text,
  p_url            text,
  p_suggested_bot_slug text,
  p_points_value   integer,
  p_priority       integer,
  p_assignment_scope text,
  p_starts_at      timestamptz,
  p_ends_at        timestamptz,
  p_visibility     text,
  p_created_by     uuid,
  p_assignee_ids   uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_action_id uuid;
  v_assignee  uuid;
begin
  -- Insert the action
  insert into actions (
    group_id, source, type, title, description, call_to_action,
    url, suggested_bot_slug, points_value, priority,
    assignment_scope, starts_at, ends_at, visibility, created_by
  ) values (
    p_group_id, p_source, p_type, p_title, p_description, p_call_to_action,
    p_url, p_suggested_bot_slug, p_points_value, p_priority,
    p_assignment_scope, p_starts_at, p_ends_at, p_visibility, p_created_by
  )
  returning id into v_action_id;

  -- Insert targeted assignments if scope is 'targeted' and IDs are provided
  if p_assignment_scope = 'targeted' and array_length(p_assignee_ids, 1) > 0 then
    foreach v_assignee in array p_assignee_ids loop
      insert into action_assignments (action_id, assigned_to_member_id, assigned_by)
      values (v_action_id, v_assignee, p_created_by);
    end loop;
  end if;

  return v_action_id;
end;
$$;
