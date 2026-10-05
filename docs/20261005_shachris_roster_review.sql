select student.id, student.name, assignment.class_id
from public.students student
join public.student_class_assignments assignment on assignment.student_id = student.id
where student.is_active is not false and assignment.class_id in ('yk-a', 'yk-b')
order by student.name;

with supplied(names) as (
  values
    (array['Jacob Bornstien', 'Bornstien Jacob']),
    (array['Avraham Eisenberg', 'Eisenberg Avraham']),
    (array['Michael Erani', 'Erani Michael']),
    (array['Bentzion Kahn', 'Kahn Bentzion']),
    (array['Binyamin Kolodny', 'Kolodny Binyamin']),
    (array['Gabriel Kolodny', 'Kolodny Gabriel']),
    (array['Aron Marcus', 'Marcus Aron']),
    (array['Tzvi Meltzer', 'Meltzer Tzvi']),
    (array['Daniel Peterman', 'Peterman Daniel']),
    (array['Shlomo Mordechai Schochet', 'Schochet Shlomo Mordechai']),
    (array['Gavriel Stamler', 'Stamler Gavriel']),
    (array['Yaakov Tennenbaum', 'Tennenbaum Yaakov']),
    (array['Isaac Weingarten', 'Weingarten Isaac']),
    (array['Yosef Zachai', 'Zachai Yosef'])
), active_roster as (
  select student.id, student.name
  from public.students student
  join public.student_class_assignments assignment on assignment.student_id = student.id
  where student.is_active is not false and assignment.class_id in ('yk-a', 'yk-b')
)
select active.id, active.name as missing_supplied_dob
from active_roster active
where not exists (
  select 1 from supplied, unnest(supplied.names) supplied_name
  where lower(regexp_replace(trim(active.name), '\s+', ' ', 'g')) = lower(supplied_name)
)
order by active.name;