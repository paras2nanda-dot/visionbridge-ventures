import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    { name: '📊 Dashboard', path: '/dashboard' },
    { name: '👥 Clients Database', path: '/clients' },
    { name: '🔄 SIP Tracker', path: '/sips' },
    { name: '💸 Transactions', path: '/transactions' },
    { name: '📂 MF Schemes', path: '/schemes' },
    { name: '📈 Charts & Analytics', path: '/charts' }, 
    { name: '📥 Download Reports', path: '/reports' },
  ];

  const handleLogout = () => {
    // 💡 THE FIX: Shred the session data
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    
    // 🧹 Also clear localStorage just in case old tokens are lingering
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    
    // Kick the user back to the login screen
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo" style={{ fontWeight: '900', fontSize: '20px', color: '#fff', padding: '20px' }}>
        VisionBridge 📈
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
            style={{ fontWeight: '900' }}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '20px' }}>
        <button 
          onClick={handleLogout} 
          className="sidebar-link" 
          style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#94a3b8' }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;