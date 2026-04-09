import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // 💡 Import API to fetch live data

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState([]); // 💡 Store clients for searching
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const actions = [
    { name: 'Go to Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'View Clients Database', path: '/clients', icon: '👥' },
    { name: 'Track SIPs', path: '/sips', icon: '🔄' },
    { name: 'View Transactions', path: '/transactions', icon: '💸' },
    { name: 'Mutual Fund Schemes', path: '/schemes', icon: '📂' },
    { name: 'Charts & Analytics', path: '/charts', icon: '📈' },
    { name: 'Download Reports', path: '/reports', icon: '📥' },
  ];

  // 💡 Fetch clients silently in the background
  useEffect(() => {
    const fetchClientsForSearch = async () => {
      try {
        if (sessionStorage.getItem('token')) {
          const res = await api.get('/clients');
          setClients(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error("Command Palette Sync Error", err);
      }
    };
    fetchClientsForSearch();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); 
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery(''); 
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Filter standard navigation actions
  const filteredActions = actions.filter(action => 
    action.name.toLowerCase().includes(query.toLowerCase())
  );

  // 2. Filter Live Database Clients (only show if they type something)
  const filteredClients = query.trim() === '' ? [] : clients.filter(c => 
    c.full_name?.toLowerCase().includes(query.toLowerCase()) ||
    c.client_code?.toLowerCase().includes(query.toLowerCase()) ||
    c.mobile_number?.includes(query)
  ).slice(0, 5); // Limit to top 5 results to keep the UI clean

  const handleAction = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div style={styles.overlay} onClick={() => setIsOpen(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <input 
            ref={inputRef}
            style={styles.input}
            placeholder="Search clients or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={styles.badge}>ESC to close</div>
        </div>
        
        <div style={styles.list}>
          {/* Render Page Links */}
          {filteredActions.length > 0 && (
            <div style={styles.sectionTitle}>PAGES</div>
          )}
          {filteredActions.map((action, idx) => (
            <div 
              key={`action-${idx}`} 
              style={styles.item}
              onClick={() => handleAction(action.path)}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ marginRight: '15px', fontSize: '20px' }}>{action.icon}</span>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{action.name}</span>
            </div>
          ))}

          {/* Render Live Database Results */}
          {filteredClients.length > 0 && (
            <div style={styles.sectionTitle}>CLIENTS DATABASE</div>
          )}
          {filteredClients.map((client) => (
            <div 
              key={`client-${client.id}`} 
              style={styles.item}
              onClick={() => handleAction('/clients')} // Takes them to the client page
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ marginRight: '15px', fontSize: '20px' }}>👤</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '700', color: '#0ea5e9' }}>{client.client_code} <span style={{color: '#1e293b'}}>— {client.full_name}</span></span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Mobile: {client.mobile_number || 'N/A'}</span>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredActions.length === 0 && filteredClients.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
              No results found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '12vh', fontFamily: "'Inter', sans-serif" },
  modal: { background: '#fff', width: '90%', maxWidth: '600px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '450px' },
  header: { padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' },
  input: { flex: 1, border: 'none', outline: 'none', fontSize: '18px', color: '#0f172a', background: 'transparent' },
  badge: { fontSize: '10px', fontWeight: '800', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', color: '#64748b', letterSpacing: '1px' },
  list: { overflowY: 'auto', padding: '10px' },
  sectionTitle: { fontSize: '11px', fontWeight: '800', color: '#94a3b8', padding: '10px 15px 5px', letterSpacing: '1px' },
  item: { padding: '12px 15px', display: 'flex', alignItems: 'center', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }
};

export default CommandPalette;