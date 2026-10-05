begin;

create temporary table shachris_dob_input (names text[] not null, dob date not null) on commit drop;
insert into shachris_dob_input values
  (array['Jacob Bornstien', 'Bornstien Jacob'], '2014-11-28'),
  (array['Avraham Eisenberg', 'Eisenberg Avraham'], '2015-04-07'),
  (array['Michael Erani', 'Erani Michael'], '2013-09-03'),
  (array['Bentzion Kahn', 'Kahn Bentzion'], '2012-12-26'),
  (array['Binyamin Kolodny', 'Kolodny Binyamin'], '2014-08-15'),
  (array['Gabriel Kolodny', 'Kolodny Gabriel'], '2014-08-15'),
  (array['Aron Marcus', 'Marcus Aron'], '2015-07-13'),
  (array['Tzvi Meltzer', 'Meltzer Tzvi'], '2013-06-27'),
  (array['Daniel Peterman', 'Peterman Daniel'], '2013-11-26'),
  (array['Shlomo Mordechai Schochet', 'Schochet Shlomo Mordechai'], '2013-10-06'),
  (array['Gavriel Stamler', 'Stamler Gavriel'], '2013-07-01'),
  (array['Yaakov Tennenbaum', 'Tennenbaum Yaakov'], '2013-05-17'),
  (array['Isaac Weingarten', 'Weingarten Isaac'], '2014-10-12'),
  (array['Yosef Zachai', 'Zachai Yosef'], '2015-03-24');

create temporary table shachris_dob_matches on commit drop as
select student.id, student.name, student.date_of_birth as existing_dob, input.dob, input.names
from public.students student join shachris_dob_input input
  on exists (select 1 from unnest(input.names) supplied_name where lower(regexp_replace(trim(student.name), '\s+', ' ', 'g')) = lower(supplied_name))
where student.is_active is not false;

select input.names[1] as supplied_name, count(matched.id) as matches
from shachris_dob_input input left join shachris_dob_matches matched on matched.names = input.names
group by input.names order by input.names[1];

select id, name, existing_dob, dob as supplied_dob from shachris_dob_matches order by name;

do $$
begin
  if exists (select 1 from shachris_dob_input input left join shachris_dob_matches matched on matched.names = input.names group by input.names having count(matched.id) <> 1)
    or (select count(distinct id) from shachris_dob_matches) <> 14 then
    raise exception 'DOB import stopped: verify missing or ambiguous names against real student IDs; no dates were changed.';
  end if;
  perform 1 from public.students where id in (select id from shachris_dob_matches) for update;
  if exists (select 1 from public.students student join shachris_dob_matches matched on matched.id = student.id where student.date_of_birth is not null and student.date_of_birth <> matched.dob) then
    raise exception 'DOB import stopped: an existing date conflicts with the supplied DOB; no dates were changed.';
  end if;
  update public.students student set date_of_birth = matched.dob
    from shachris_dob_matches matched where student.id = matched.id and student.date_of_birth is null;
end $$;

commit;