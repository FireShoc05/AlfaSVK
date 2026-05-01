import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard, Button, Badge, Modal } from '../../components/ui';
import { useMeetingsStore } from '../../store/useMeetingsStore';
import { useRejectionsStore } from '../../store/useRejectionsStore';
import { FileX, CheckCircle, Search, Calendar, Info, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export function AdminMeetingsTab() {
  const { meetings, fetchAllMeetings } = useMeetingsStore();
  const { rejections, fetchRejections } = useRejectionsStore();

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // Offset timezone if needed or just use simple yyyy-mm-dd
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
    return localISOTime;
  });
  
  const [searchAgent, setSearchAgent] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');

  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    fetchAllMeetings();
    fetchRejections();
  }, [fetchAllMeetings, fetchRejections]);

  const unifiedData = useMemo(() => {
    const merged = [];

    (meetings || []).forEach(m => {
      merged.push({
        _id: `meet_${m.id}`,
        type: 'success',
        userFullName: m.users?.fullName || '—',
        meetingId: m.meetingId === 'ЗАБЫЛ' ? 'Без ID (забыл указать)' : (m.meetingId || '—'),
        dateString: m.meeting_timestamp ? m.meeting_timestamp.split('T')[0] : (m.created_at ? m.created_at.split('T')[0] : ''),
        timestamp: new Date(m.created_at || m.meeting_timestamp).getTime(),
        createdAtFormatted: new Date(m.created_at || m.meeting_timestamp).toLocaleString('ru-RU', {
          day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
        }),
        products: m.products || [],
        totalEarned: m.total_earned || 0
      });
    });

    (rejections || []).forEach(r => {
      merged.push({
        _id: `rej_${r.id}`,
        type: 'failure',
        subType: r.type, // 'Отказ', 'НДЗ', 'Перенос'
        userFullName: r.users?.fullName || '—',
        meetingId: r.meetingId === 'ЗАБЫЛ' ? 'Без ID (забыл указать)' : (r.meetingId || '—'),
        dateString: r.created_at ? r.created_at.split('T')[0] : '',
        timestamp: new Date(r.created_at).getTime(),
        createdAtFormatted: new Date(r.created_at).toLocaleString('ru-RU', {
          day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
        }),
        reason: r.reason,
        transferDate: r.transferDate,
        comment: r.comment
      });
    });

    return merged.filter(item => {
      if (item.dateString !== selectedDate) return false;
      if (searchAgent.trim() && !item.userFullName.toLowerCase().includes(searchAgent.toLowerCase())) return false;
      if (searchId.trim() && !String(item.meetingId).toLowerCase().includes(searchId.toLowerCase())) return false;
      if (searchStatus === 'success' && item.type !== 'success') return false;
      if (searchStatus === 'failure' && item.type !== 'failure') return false;

      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [meetings, rejections, selectedDate, searchAgent, searchId, searchStatus]);

  return (
    <GlassCard className="admin-card">
      <div className="admin-card__header" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="admin-card__title">
          <Calendar size={18} /> База встреч
        </h3>
        
        {/* Filters Panel */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Дата</label>
            <input 
              type="date" 
              className="admin-link-row__input" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ minWidth: '150px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ФИО сотрудника</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="admin-link-row__input" 
                placeholder="Поиск по ФИО..."
                value={searchAgent}
                onChange={(e) => setSearchAgent(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID встречи</label>
            <input 
              type="text" 
              className="admin-link-row__input" 
              placeholder="Введите ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Статус</label>
            <select 
              className="admin-link-row__input" 
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="all">Все статусы</option>
              <option value="success">Успешные</option>
              <option value="failure">Неуспешные</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        {unifiedData.length === 0 ? (
          <div className="admin-empty">За выбранную дату встреч не найдено</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table" style={{ cursor: 'pointer' }}>
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>ID встречи</th>
                  <th>Статус</th>
                  <th>Дата и время регистрации</th>
                </tr>
              </thead>
              <tbody>
                {unifiedData.map(item => (
                  <tr key={item._id} onClick={() => setSelectedMeeting(item)} className="admin-table-row-hover">
                    <td><strong>{item.userFullName}</strong></td>
                    <td className="monospace-cell">{item.meetingId}</td>
                    <td>
                      {item.type === 'success' ? (
                        <Badge variant="success"><CheckCircle size={12} style={{marginRight:4}}/> Успешная</Badge>
                      ) : (
                        <Badge variant={item.subType === 'НДЗ' ? 'warning' : item.subType === 'Перенос' ? 'primary' : 'danger'}>
                          <FileX size={12} style={{marginRight:4}}/> {item.subType || 'Неуспешная'}
                        </Badge>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                      {item.createdAtFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Details */}
      {selectedMeeting && (
        <Modal
          isOpen={!!selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          title={`Детали встречи ${selectedMeeting.meetingId}`}
        >
          <div style={{ padding: 'var(--space-md)' }}>
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Сотрудник:</span>
                <strong>{selectedMeeting.userFullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Дата:</span>
                <span>{selectedMeeting.createdAtFormatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Статус:</span>
                {selectedMeeting.type === 'success' ? (
                  <span style={{ color: 'var(--success)' }}>Успешная</span>
                ) : (
                  <span style={{ color: 'var(--danger)' }}>{selectedMeeting.subType || 'Неуспешная'}</span>
                )}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--glass-border)', margin: '16px 0' }} />

            {selectedMeeting.type === 'success' ? (
              <div>
                <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} color="var(--success)" /> Проданные продукты
                </h4>
                {selectedMeeting.products && selectedMeeting.products.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedMeeting.products.map((p, idx) => (
                      <div key={idx} style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>{p.name}</strong>
                          <span style={{ color: 'var(--accent)' }}>{formatCurrency(p.earned)}</span>
                        </div>
                        {p.options && Object.keys(p.options).length > 0 && (
                          <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>
                            Опции: {Object.entries(p.options).filter(([_, v]) => v).map(([k]) => k).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ marginTop: '12px', textAlign: 'right', fontSize: '1.1em' }}>
                      <strong>Итого заработок: </strong> 
                      <span style={{ color: 'var(--accent)' }}>{formatCurrency(selectedMeeting.totalEarned)}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>Нет данных о продуктах.</p>
                )}
              </div>
            ) : (
              <div>
                <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} color="var(--danger)" /> Детали отмены
                </h4>
                
                {selectedMeeting.subType === 'Перенос' && selectedMeeting.transferDate && (
                  <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                      <Clock size={16} /> <strong>Дата переноса:</strong> {selectedMeeting.transferDate}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedMeeting.reason && (
                    <div>
                      <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginBottom: '2px' }}>Причина:</div>
                      <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                        {selectedMeeting.reason}
                      </div>
                    </div>
                  )}
                  {selectedMeeting.comment && (
                    <div>
                      <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginBottom: '2px' }}>Комментарий:</div>
                      <div style={{ padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', fontStyle: 'italic' }}>
                        {selectedMeeting.comment}
                      </div>
                    </div>
                  )}
                  {!selectedMeeting.reason && !selectedMeeting.comment && (
                    <p style={{ color: 'var(--text-secondary)' }}>Нет дополнительных деталей.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      
      {/* Required style to add hover effect to table row */}
      <style>{`
        .admin-table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.05);
          transition: background-color 0.2s ease;
        }
      `}</style>
    </GlassCard>
  );
}
