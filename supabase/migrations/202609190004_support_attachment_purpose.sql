-- Keep this enum extension separate: PostgreSQL does not permit using a new
-- enum value in the same migration transaction that adds it.
alter type public.private_media_purpose add value if not exists 'support_attachment';
