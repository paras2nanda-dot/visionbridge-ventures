import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // 💡 Add future actions here (like searching for specific clients)
  const actions = [
    { name: 'Go to Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'View Clients Database', path: '/clients', icon: '👥' },
    { name: 'Track SIPs', path: '/sips', icon: '🔄' },
    { name: 'View Transactions', path: '/transactions', icon: '💸' },
    { name: 'Mutual Fund Schemes', path: '/schemes', icon: '📂' },
    { name: 'Charts & Analytics', path: '/charts', icon: '📈' },
    { name: 'Download Reports', path: '/reports', icon: '📥' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); // Stop Chrome's default search
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
      setQuery(''); // Reset search when opened
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredActions = actions.filter(action => 
    action.name.toLowerCase().includes(query.toLowerCase())
  );

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
            placeholder="Search or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={styles.badge}>ESC to close</div>
        </div>
        <div style={styles.list}>
          {filteredActions.length > 0 ? filteredActions.map((action, idx) => (
            <div 
              key={idx} 
              style={styles.item}
              onClick={() => handleAction(action.path)}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ marginRight: '15px', fontSize: '20px' }}>{action.icon}</span>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{action.name}</span>
            </div>
          )) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>No results found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '12vh', fontFamily: "'Inter', sans-serif" },
  modal: { background: '#fff', width: '90%', maxWidth: '600px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '400px' },
  header: { padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' },
  input: { flex: 1, border: 'none', outline: 'none', fontSize: '18px', color: '#0f172a', background: 'transparent' },
  badge: { fontSize: '10px', fontWeight: '800', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', color: '#64748b', letterSpacing: '1px' },
  list: { overflowY: 'auto', padding: '10px' },
  item: { padding: '15px 20px', display: 'flex', alignItems: 'center', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }
};

export default CommandPalette;