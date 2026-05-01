import { useState, useEffect, useMemo } from 'react';
import { Search, Mail, Phone, MessageCircle, Users } from 'lucide-react';
import { useUsersStore } from '../store/useUsersStore';
import { GlassCard, Button, Modal, Badge } from '../components/ui';
import '../styles/admin.css'; // Переиспользуем некоторые стили

export function ColleaguesPage() {
  const { globalUsers, fetchAllUsersGlobally } = useUsersStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetchAllUsersGlobally();
  }, [fetchAllUsersGlobally]);

  // Filter users
  const filteredUsers = useMemo(() => {
    // Only employees and admins
    let list = globalUsers.filter(u => u.role === 'employee' || u.role === 'agent' || u.role === 'admin');
    
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(u => 
        (u.fullName && u.fullName.toLowerCase().includes(lowerSearch)) ||
        (u.username && u.username.toLowerCase().includes(lowerSearch))
      );
    }
    
    return list;
  }, [globalUsers, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getRoleBadge = (role) => {
    if (role === 'admin') return <Badge variant="accent">НГ</Badge>;
    return <Badge variant="primary">СВК</Badge>;
  };

  return (
    <div className="colleagues-page" style={{ paddingBottom: '24px' }}>
      <div className="page-header">
        <h1 className="page-header__title">
          <Users size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
          Коллеги
        </h1>
        <p className="page-header__subtitle">Справочник сотрудников АльфаСВК</p>
      </div>

      <GlassCard style={{ marginBottom: '24px' }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '8px 12px', border: '1px solid var(--glass-border)' }}>
          <Search size={18} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Поиск по ФИО или логину..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '16px' }}
          />
        </div>
      </GlassCard>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {paginatedUsers.length > 0 ? (
          paginatedUsers.map(u => (
            <GlassCard 
              key={u.id} 
              style={{ cursor: 'pointer', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
              onClick={() => setSelectedUser(u)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', color: 'var(--accent)'
                }}>
                  {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'С'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>{u.fullName || u.username}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{u.status === 'На обучении' ? 'На обучении' : 'Активный'}</div>
                </div>
              </div>
              <div>
                {getRoleBadge(u.role)}
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="admin-empty">Никого не найдено</div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '24px', gap: '16px' }}>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Назад
          </Button>
          <span style={{ color: 'var(--text-secondary)' }}>
            Страница {currentPage} из {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Далее
          </Button>
        </div>
      )}

      {/* Modal for User Contacts */}
      <Modal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        title={selectedUser ? selectedUser.fullName || selectedUser.username : ''}
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={18} color="#38bdf8" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Telegram</div>
                <div style={{ fontSize: '15px' }}>{selectedUser.telegram || 'Не указан'}</div>
              </div>
              {selectedUser.telegram && (
                <Button size="sm" variant="ghost" onClick={() => window.open(`https://t.me/${selectedUser.telegram.replace('@', '')}`, '_blank')}>
                  Написать
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={18} color="#4ade80" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Телефон</div>
                <div style={{ fontSize: '15px' }}>{selectedUser.phone || 'Не указан'}</div>
              </div>
              {selectedUser.phone && (
                <Button size="sm" variant="ghost" onClick={() => window.open(`tel:${selectedUser.phone}`, '_self')}>
                  Позвонить
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(248, 113, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={18} color="#f87171" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Эл. почта</div>
                <div style={{ fontSize: '15px' }}>{selectedUser.email || 'Не указана'}</div>
              </div>
              {selectedUser.email && (
                <Button size="sm" variant="ghost" onClick={() => window.open(`mailto:${selectedUser.email}`, '_self')}>
                  Написать
                </Button>
              )}
            </div>
            
            <Button variant="primary" block onClick={() => setSelectedUser(null)} style={{ marginTop: '16px' }}>
              Закрыть
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
