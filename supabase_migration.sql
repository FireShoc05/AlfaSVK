-- 1. Удаляем старое ограничение, которое запрещало одинаковые ключи для разных групп
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS settings_key_key;

-- 2. Создаем правильное ограничение: ключ уникален только внутри одной конкретной группы
ALTER TABLE public.settings ADD CONSTRAINT settings_key_group_id_key UNIQUE (key, group_id);
