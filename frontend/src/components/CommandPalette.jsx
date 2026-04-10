import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  const [clients, setClients] = useState([]);
  const [sips, setSips] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [schemes, setSchemes] = useState([]);

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

  useEffect(() => {
    const fetchAllSearchData = async () => {
      if (!sessionStorage.getItem('username')) return;
      
      try {
        api.get('/clients').then(res => setClients(Array.isArray(res.data) ? res.data : [])).catch(() => {});
        api.get('/sips').then(res => setSips(Array.isArray(res.data) ? res.data : [])).catch(() => {});
        api.get('/transactions').then(res => setTransactions(Array.isArray(res.data) ? res.data : [])).catch(() => {});
        api.get('/schemes').then(res => setSchemes(Array.isArray(res.data) ? res.data : [])).catch(() => {});
      } catch (err) {
        console.error("Command Palette Sync Error", err);
      }
    };
    fetchAllSearchData();
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
    const handleManualOpen = () => setIsOpen(true);
    window.addEventListener('open-cmd-k', handleManualOpen);
    return () => window.removeEventListener('open-cmd-k', handleManualOpen);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery(''); 
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredActions = actions.filter(action => action.name.toLowerCase().includes(q));
  const filteredClients = q === '' ? [] : clients.filter(c => 
    c.full_name?.toLowerCase().includes(q) || c.client_code?.toLowerCase().includes(q) || c.mobile_number?.includes(q)
  ).slice(0, 4); 
  const filteredSips = q === '' ? [] : sips.filter(s => 
    s.scheme_name?.toLowerCase().includes(q) || s.client_name?.toLowerCase().includes(q) || s.folio_number?.toLowerCase().includes(q)
  ).slice(0, 3);
  const filteredTxns = q === '' ? [] : transactions.filter(t => 
    t.scheme_name?.toLowerCase().includes(q) || t.client_name?.toLowerCase().includes(q) || t.transaction_type?.toLowerCase().includes(q)
  ).slice(0, 3);
  const filteredSchemes = q === '' ? [] : schemes.filter(s => 
    s.scheme_name?.toLowerCase().includes(q) || s.amc_name?.toLowerCase().includes(q)
  ).slice(0, 3);

  const handleAction = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const hasNoResults = q !== '' && filteredActions.length === 0 && filteredClients.length === 0 && filteredSips.length === 0 && filteredTxns.length === 0 && filteredSchemes.length === 0;

  // 🎨 Dynamic hover color based on theme
  const hoverColor = 'var(--bg-main)';

  return (
    <div style={styles.overlay} onClick={() => setIsOpen(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <input 
            ref={inputRef}
            style={styles.input}
            placeholder="Search pages, clients, SIPs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={styles.badge}>ESC</div>
        </div>
        
        <div style={styles.list}>
          {/* PAGES */}
          {filteredActions.length > 0 && <div style={styles.sectionTitle}>PAGES</div>}
          {filteredActions.map((action, idx) => (
            <div key={`action-${idx}`} style={styles.item} onClick={() => handleAction(action.path)} onMouseOver={(e) => e.currentTarget.style.background = hoverColor} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ marginRight: '15px', fontSize: '20px' }}>{action.icon}</span>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{action.name}</span>
            </div>
          ))}

          {/* CLIENTS */}
          {filteredClients.length > 0 && <div style={styles.sectionTitle}>CLIENTS</div>}
          {filteredClients.map((client) => (
            <div key={`client-${client.id}`} style={styles.item} onClick={() => handleAction('/clients')} onMouseOver={(e) => e.currentTarget.style.background = hoverColor} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ marginRight: '15px', fontSize: '20px' }}>👤</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '700', color: '#0ea5e9' }}>{client.client_code} <span style={{color: 'var(--text-main)'}}>— {client.full_name}</span></span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Mobile: {client.mobile_number || 'N/A'}</span>
              </div>
            </div>
          ))}

          {/* SIPs */}
          {filteredSips.length > 0 && <div style={styles.sectionTitle}>SIP TRACKER</div>}
          {filteredSips.map((sip, idx) => (
            <div key={`sip-${idx}`} style={styles.item} onClick={() => handleAction('/sips')} onMouseOver={(e) => e.currentTarget.style.background = hoverColor} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ marginRight: '15px', fontSize: '20px' }}>🔄</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{sip.scheme_name || 'Unknown Scheme'}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Client: {sip.client_name || 'N/A'}</span>
              </div>
            </div>
          ))}

          {/* TRANSACTIONS */}
          {filteredTxns.length > 0 && <div style={styles.sectionTitle}>TRANSACTIONS</div>}
          {filteredTxns.map((txn, idx) => (
            <div key={`txn-${idx}`} style={styles.item} onClick={() => handleAction('/transactions')} onMouseOver={(e) => e.currentTarget.style.background = hoverColor} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ marginRight: '15px', fontSize: '20px' }}>💸</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{txn.scheme_name || 'Unknown Scheme'}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{txn.transaction_type || 'TXN'} • Client: {txn.client_name || 'N/A'}</span>
              </div>
            </div>
          ))}

          {/* SCHEMES */}
          {filteredSchemes.length > 0 && <div style={styles.sectionTitle}>MF SCHEMES</div>}
          {filteredSchemes.map((scheme, idx) => (
            <div key={`scheme-${idx}`} style={styles.item} onClick={() => handleAction('/schemes')} onMouseOver={(e) => e.currentTarget.style.background = hoverColor} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ marginRight: '15px', fontSize: '20px' }}>📂</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{scheme.scheme_name || 'Unknown Scheme'}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>AMC: {scheme.amc_name || 'N/A'}</span>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {hasNoResults && (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
              <div style={{ fontSize: '30px', marginBottom: '10px' }}>🔍</div>
              No results found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 999999, display: 'flex', justifyContent: 'center', paddingTop: '12vh', fontFamily: "'Inter', sans-serif" },
  modal: { background: 'var(--bg-card)', width: '90%', maxWidth: '600px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '500px', border: '1px solid var(--border)' },
  header: { padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' },
  input: { flex: 1, border: 'none', outline: 'none', fontSize: '18px', color: 'var(--text-main)', background: 'transparent' },
  badge: { fontSize: '10px', fontWeight: '800', background: 'var(--bg-main)', padding: '6px 10px', borderRadius: '6px', color: 'var(--text-muted)', letterSpacing: '1px' },
  list: { overflowY: 'auto', padding: '10px', paddingBottom: '20px' },
  sectionTitle: { fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', padding: '15px 15px 5px', letterSpacing: '1px' },
  item: { padding: '12px 15px', display: 'flex', alignItems: 'center', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }
};

export default CommandPalette;