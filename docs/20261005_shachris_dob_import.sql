begin;

create temporary table shachris_dob_input (student_id bigint primary key, names text[] not null, dob date not null) on commit drop;
insert into shachris_dob_input values
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
  (124, array['Benyamin Goldberger', 'Goldberger Benyamin'], '2013-04-30');

do $$
begin
  if (select count(*) from shachris_dob_input) <> 16 then
    raise exception 'DOB import stopped: exactly 16 reviewed DOBs are required before any import.';
  end if;
end $$;

create temporary table shachris_dob_matches on commit drop as
select student.id, input.student_id as reviewed_student_id, student.name, student.date_of_birth as existing_dob, input.dob, input.names
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
    or exists (select 1 from shachris_dob_matches where id <> reviewed_student_id)
    or (select count(distinct id) from shachris_dob_matches) <> 16 then
    raise exception 'DOB import stopped: verify missing or ambiguous names against real student IDs; no dates were changed.';
  end if;
  perform 1 from public.students where id in (select id from shachris_dob_matches) for update;
  if (select count(*) from public.students where id in (select id from shachris_dob_matches) and is_active is not false) <> 16 then
    raise exception 'DOB import stopped: the active roster changed during review; no dates were changed.';
  end if;
  if exists (select 1 from public.students student join shachris_dob_matches matched on matched.id = student.id where student.date_of_birth is not null and student.date_of_birth <> matched.dob) then
    raise exception 'DOB import stopped: an existing date conflicts with the supplied DOB; no dates were changed.';
  end if;
  update public.students student set date_of_birth = matched.dob
    from shachris_dob_matches matched where student.id = matched.id and student.date_of_birth is null;
end $$;

commit;