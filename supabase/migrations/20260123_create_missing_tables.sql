-- Create missing tables referenced by the app.
-- Safe to run multiple times (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS public.label_transactions (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  label_profile_id uuid REFERENCES public.profiles(id),
  amount numeric NOT NULL,
  kind text DEFAULT 'fund',
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.label_projects (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  label_profile_id uuid REFERENCES public.profiles(id),
  name text NOT NULL,
  status text DEFAULT 'PLANNING',
  deadline timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.label_project_tasks (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES public.label_projects(id),
  title text NOT NULL,
  assignee_id uuid,
  status text DEFAULT 'TODO',
  priority text DEFAULT 'NORMAL',
  deadline timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id),
  url text NOT NULL,
  storage_path text,
  type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.room_photos (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  room_id uuid REFERENCES public.rooms(id),
  photo_url text NOT NULL,
  storage_path text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id),
  booking_id uuid REFERENCES public.bookings(id),
  amount numeric,
  currency text DEFAULT 'usd',
  status text,
  provider text DEFAULT 'stripe',
  stripe_payment_intent_id text,
  stripe_charge_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
