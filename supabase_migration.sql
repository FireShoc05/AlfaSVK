-- 1. Создаем таблицу settings (если вдруг её вообще нет)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    value JSONB
);

-- 2. Добавляем колонку group_id в таблицу settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- 3. Разрешаем полный доступ к таблице settings (RLS Policy)
CREATE POLICY "Enable full access for settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
