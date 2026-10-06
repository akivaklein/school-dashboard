begin;

create or replace function public.shachris_save_settings(p_config jsonb, p_revision integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare settings_row public.shachris_settings;
begin
	if not public.dashboard_is_admin() or not public.dashboard_has_permission('setup', 'edit') then raise exception 'Only leadership can change Shachris settings'; end if;
	select * into settings_row from public.shachris_settings where id = true for update;
	if not found then raise exception 'Shachris settings row not found'; end if;
	if settings_row.revision is distinct from p_revision then raise exception 'Settings changed elsewhere. Reload before saving.'; end if;
	if jsonb_typeof(p_config->'sections') is distinct from 'array' or jsonb_typeof(p_config->'milestones') is distinct from 'array'
		or jsonb_typeof(p_config->'ratings') is distinct from 'array' or jsonb_typeof(p_config->'rules') is distinct from 'array'
		or jsonb_typeof(p_config->'stayMilestones') is distinct from 'array' or jsonb_typeof(p_config->'stayRules') is distinct from 'array'
		or jsonb_array_length(p_config->'sections') = 0 or jsonb_array_length(p_config->'milestones') = 0 then raise exception 'Invalid Shachris settings'; end if;
	if exists (select 1 from jsonb_array_elements(p_config->'stayRules') rule
		where jsonb_typeof(rule) <> 'object' or coalesce(rule->>'id', '') = '' or (rule - 'id' - 'age' - 'milestoneId') <> '{}'::jsonb
			or coalesce(rule->>'age', '') not in ('11', '12', '13')
			or not exists (select 1 from jsonb_array_elements(p_config->'stayMilestones') milestone where milestone->>'id' = rule->>'milestoneId' and milestone->>'id' <> 'hodu'))
		or exists (select 1 from jsonb_array_elements(p_config->'stayRules') rule group by rule->>'age' having count(*) > 1)
		then raise exception 'Stay defaults must use one rule each for ages 11, 12, or 13'; end if;
	if exists (select 1 from jsonb_array_elements(p_config->'rules') rule
		where jsonb_typeof(rule) <> 'object' or coalesce(rule->>'grade', '') not in ('7', '8')
			or coalesce(rule->>'id', '') = '' or (rule - 'id' - 'grade' - 'milestoneId') <> '{}'::jsonb
			or not exists (select 1 from jsonb_array_elements(p_config->'milestones') milestone where milestone->>'id' = rule->>'milestoneId'))
		or exists (select 1 from jsonb_array_elements(p_config->'rules') rule group by rule->>'grade' having count(*) > 1)
		or exists (select 1 from jsonb_array_elements(p_config->'rules') rule group by rule->>'id' having count(*) > 1)
		then raise exception 'Davening progress defaults must use one rule per actual grade only'; end if;
	if exists (select 1 from jsonb_array_elements(settings_row.config->'sections') prior where not exists (select 1 from jsonb_array_elements(p_config->'sections') next where next->>'id' = prior->>'id'))
		or exists (select 1 from jsonb_array_elements(settings_row.config->'milestones') prior where not exists (select 1 from jsonb_array_elements(p_config->'milestones') next where next->>'id' = prior->>'id'))
		or exists (select 1 from jsonb_array_elements(settings_row.config->'stayMilestones') prior where not exists (select 1 from jsonb_array_elements(p_config->'stayMilestones') next where next->>'id' = prior->>'id'))
		then raise exception 'Existing section and milestone IDs must be preserved'; end if;
	update public.shachris_settings set config = p_config, revision = revision + 1, updated_by = auth.uid(), updated_at = clock_timestamp()
		where id = settings_row.id returning * into settings_row;
	return to_jsonb(settings_row);
end $$;

notify pgrst, 'reload schema';
commit;
