-- 1. Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    manager_id UUID -- Reference to the manager user
);

-- 2. Insert "Тест" group
INSERT INTO public.groups (name) VALUES ('Тест');

-- 3. Add group_id to tables
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.rejections ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- 4. Update existing records to point to "Тест" group
DO $$
DECLARE
  test_group_id UUID;
BEGIN
  SELECT id INTO test_group_id FROM public.groups WHERE name = 'Тест' LIMIT 1;
  
  UPDATE public.users SET group_id = test_group_id WHERE group_id IS NULL;
  UPDATE public.meetings SET group_id = test_group_id WHERE group_id IS NULL;
  UPDATE public.schedules SET group_id = test_group_id WHERE group_id IS NULL;
  UPDATE public.rejections SET group_id = test_group_id WHERE group_id IS NULL;
  UPDATE public.settings SET group_id = test_group_id WHERE group_id IS NULL;
END $$;

-- 5. Insert superadmin user (if not exists)
INSERT INTO public.users (username, "tempPassword", role, "fullName", status, "joinDate")
SELECT 'AdMIniSTRAtoRAbANKa', 'Prnm!67am@fdfm!4872', 'superadmin', 'Главный администратор', 'active', CURRENT_DATE
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE username = 'AdMIniSTRAtoRAbANKa'
);
