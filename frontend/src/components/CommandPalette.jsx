import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div style={styles.overlay} onClick={() => setIsOpen(false)}>
      <style>{`
        .cmd-modal {
          animation: cmdReveal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cmdReveal {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (max-width: 768px) {
          .cmd-overlay { padding-top: 0 !important; }
          .cmd-modal { width: 100% !important; max-width: none !important; height: 100% !important; max-height: none !important; border-radius: 0 !important; border: none !important; }
          .cmd-input { font-size: 16px !important; }
        }
      `}</style>
      
      <div className="cmd-modal" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={{ marginRight: '12px', fontSize: '20px', opacity: 0.6 }}>🔍</span>
          <input 
            ref={inputRef}
            style={styles.input}
            className="cmd-input"
            placeholder="Search everything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={styles.badge}>ESC</div>
        </div>
        
        <div style={styles.list}>
          {/* PAGES */}
          {filteredActions.length > 0 && <div style={styles.sectionTitle}>NAVIGATION</div>}
          {filteredActions.map((action, idx) => (
            <div key={`action-${idx}`} style={styles.item} onClick={() => handleAction(action.path)}>
              <span style={{ marginRight: '15px', fontSize: '18px' }}>{action.icon}</span>
              <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>{action.name}</span>
            </div>
          ))}

          {/* CLIENTS */}
          {filteredClients.length > 0 && <div style={styles.sectionTitle}>CLIENTS</div>}
          {filteredClients.map((client) => (
            <div key={`client-${client.id}`} style={styles.item} onClick={() => handleAction('/clients')}>
              <span style={{ marginRight: '15px', fontSize: '18px' }}>👤</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '900', color: '#0284c7', fontSize: '14px' }}>{client.client_code} <span style={{color: 'var(--text-main)', fontWeight: '800'}}>— {client.full_name}</span></span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>{client.mobile_number || 'No Mobile'}</span>
              </div>
            </div>
          ))}

          {/* SIPs */}
          {filteredSips.length > 0 && <div style={styles.sectionTitle}>SIP MANDATES</div>}
          {filteredSips.map((sip, idx) => (
            <div key={`sip-${idx}`} style={styles.item} onClick={() => handleAction('/sips')}>
              <span style={{ marginRight: '15px', fontSize: '18px' }}>🔄</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>{sip.scheme_name}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>{sip.client_name}</span>
              </div>
            </div>
          ))}

          {/* SCHEMES */}
          {filteredSchemes.length > 0 && <div style={styles.sectionTitle}>MUTUAL FUNDS</div>}
          {filteredSchemes.map((scheme, idx) => (
            <div key={`scheme-${idx}`} style={styles.item} onClick={() => handleAction('/schemes')}>
              <span style={{ marginRight: '15px', fontSize: '18px' }}>📂</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>{scheme.scheme_name}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>{scheme.amc_name}</span>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {hasNoResults && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🛰️</div>
              <div style={{ color: 'var(--text-main)', fontWeight: '900', fontSize: '16px' }}>No matches found</div>
              <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', marginTop: '4px' }}>Try searching for a different keyword</div>
            </div>
          )}
        </div>
        
        <div style={styles.footer}>
          <span style={{ opacity: 0.6 }}>Tip: Use arrows to navigate and Enter to select</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000000, display: 'flex', justifyContent: 'center', paddingTop: '10vh' },
  modal: { background: 'var(--bg-card)', width: '90%', maxWidth: '640px', borderRadius: '16px', boxShadow: '4px 4px 0px rgba(0,0,0,0.1), 0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh', border: '2.5px solid var(--border)' },
  header: { padding: '24px', borderBottom: '2.5px solid var(--border)', display: 'flex', alignItems: 'center', background: 'var(--bg-card)' },
  input: { flex: 1, border: 'none', outline: 'none', fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', background: 'transparent' },
  badge: { fontSize: '11px', fontWeight: '900', background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '8px', color: 'var(--text-muted)', border: '1.5px solid var(--border)', letterSpacing: '0.5px' },
  list: { overflowY: 'auto', padding: '12px', background: 'var(--bg-main)' },
  sectionTitle: { fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', padding: '20px 16px 8px', letterSpacing: '1.5px', textTransform: 'uppercase' },
  item: { padding: '16px', display: 'flex', alignItems: 'center', cursor: 'pointer', borderRadius: '12px', transition: 'all 0.2s', border: '1.5px solid transparent' },
  footer: { padding: '12px 24px', background: 'var(--bg-card)', borderTop: '2px solid var(--border)', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'center' }
};

export default CommandPalette;