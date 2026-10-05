with supplied(student_id, names, dob) as (
  values
    (121, array['Jacob Bornstien', 'Bornstien Jacob', 'Yaakov Bornstien'], '2014-11-28'),
    (132, array['Avraham Eisenberg', 'Eisenberg Avraham', 'Avi Eisenberg'], '2015-04-07'),
    (122, array['Michael Erani', 'Erani Michael'], '2013-09-03'),
    (137, array['Bentzion Kahn', 'Kahn Bentzion', 'Bentzy Kahn'], '2012-12-26'),
    (135, array['Binyamin Kolodny', 'Kolodny Binyamin'], '2014-08-15'),
    (136, array['Gabriel Kolodny', 'Kolodny Gabriel', 'Gavriel Kolodny'], '2014-08-15'),
    (125, array['Aron Marcus', 'Marcus Aron'], '2015-07-13'),
    (133, array['Tzvi Meltzer', 'Meltzer Tzvi'], '2013-06-27'),
    (126, array['Daniel Peterman', 'Peterman Daniel'], '2013-11-26'),
    (127, array['Shlomo Mordechai Schochet', 'Schochet Shlomo Mordechai', 'Motti Schochet'], '2013-10-06'),
    (128, array['Gavriel Stamler', 'Stamler Gavriel'], '2013-07-01'),
    (129, array['Yaakov Tennenbaum', 'Tennenbaum Yaakov'], '2013-05-17'),
    (130, array['Isaac Weingarten', 'Weingarten Isaac', 'levi Weingarten'], '2014-10-12'),
    (131, array['Yosef Zachai', 'Zachai Yosef', 'Yossi Zachai'], '2015-03-24'),
    (123, array['David Goldberger', 'Goldberger David'], '2013-04-30'),
    (124, array['Benyamin Goldberger', 'Goldberger Benyamin'], '2013-04-30')
)
select supplied.student_id as reviewed_id, supplied.names[1] as supplied_name, student.name as database_name,
  case assignment.class_id when 'yk-b' then '7' when 'yk-a' then '8' else null end as actual_grade,
  supplied.dob as supplied_dob, to_jsonb(student)->>'date_of_birth' as existing_dob,
  matches.active_name_matches,
  coalesce(student.is_active is not false and assignment.class_id in ('yk-a', 'yk-b') and matches.active_name_matches = 1
    and exists (select 1 from unnest(supplied.names) supplied_name where lower(regexp_replace(trim(student.name), '\s+', ' ', 'g')) = lower(supplied_name))
    and (to_jsonb(student)->>'date_of_birth' is null or to_jsonb(student)->>'date_of_birth' = supplied.dob), false) as verified,
  (select count(*) from public.students active join public.student_class_assignments primary_assignment on primary_assignment.student_id = active.id where active.is_active is not false and primary_assignment.class_id in ('yk-a', 'yk-b')) as active_roster_size
from supplied
left join public.students student on student.id = supplied.student_id
left join public.student_class_assignments assignment on assignment.student_id = student.id
left join lateral (
  select count(*) as active_name_matches from public.students candidate
  where candidate.is_active is not false and exists (
    select 1 from unnest(supplied.names) supplied_name where lower(regexp_replace(trim(candidate.name), '\s+', ' ', 'g')) = lower(supplied_name)
  )
) matches on true
order by supplied.student_id;