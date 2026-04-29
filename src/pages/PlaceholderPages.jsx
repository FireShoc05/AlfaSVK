import { PlaceholderPage } from '../components/ui';
import { KeyRound, Shield, Clock } from 'lucide-react';

const pages = {
  passwords: {
    icon: <KeyRound size={32} />,
    title: 'Логины и пароли',
    description: 'Раздел находится в разработке. Здесь будет безопасное хранилище учётных данных.',
  },

  admin: {
    icon: <Shield size={32} />,
    title: 'Админ панель',
    description: 'Раздел находится в разработке. Здесь будет управление пользователями и настройками.',
  },
  pending: {
    icon: <Clock size={32} />,
    title: 'Ожидание подтверждения',
    description: 'Администратор проверяет ваши данные. Пожалуйста, ожидайте.',
  },
};

export function PlaceholderPages({ type }) {
  const page = pages[type] || pages.pending;

  return (
    <PlaceholderPage
      icon={page.icon}
      title={page.title}
      description={page.description}
    />
  );
}
