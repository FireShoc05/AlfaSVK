-- Разрешаем все действия с таблицей groups для всех (если RLS включен)
CREATE POLICY "Enable full access for groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
