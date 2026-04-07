-- Ejecutar en Supabase SQL si aún no existen las columnas
alter table tickets add column if not exists ticket_seq integer;
alter table tickets add column if not exists received_by text;

create unique index if not exists tickets_ticket_seq_unique
  on tickets (ticket_seq)
  where ticket_seq is not null;
