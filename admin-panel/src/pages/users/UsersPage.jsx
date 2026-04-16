import React, { useEffect, useState, useCallback } from 'react';
import { usersAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ page, limit: 20, search });
      setUsers(res.data.data.users);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (id, current) => {
    try {
      await usersAPI.update(id, { isActive: !current });
      toast.success(`User ${!current ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#1A1A2E' }}>👥 Users</h1>

      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Search by name or email..."
          style={{ width: '100%', padding: '9px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>⏳ Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>{['User','Phone','Role','Joined','Status','Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#C8A96E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>{u.phone || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: u.role === 'admin' ? '#EDE9FE' : '#F3F4F6', color: u.role === 'admin' ? '#5B21B6' : '#374151', textTransform: 'capitalize' }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>{formatDate(u.createdAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: u.isActive !== false ? '#D1FAE5' : '#FEE2E2', color: u.isActive !== false ? '#065F46' : '#991B1B' }}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleActive(u._id, u.isActive !== false)} style={{ padding: '5px 12px', background: u.isActive !== false ? '#FEF2F2' : '#D1FAE5', color: u.isActive !== false ? '#DC2626' : '#065F46', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                      {u.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>No users found</td></tr>}
            </tbody>
          </table>
        )}

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid #F3F4F6' }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13 }}>← Prev</button>
            <span style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center' }}>Page {page} of {pagination.pages} ({pagination.total} users)</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page===pagination.pages} style={{ padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
