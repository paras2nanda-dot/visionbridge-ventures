/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import SettingsModal from './SettingsModal';
import { toast } from 'react-toastify';
import { 
  LayoutDashboard, 
  Users, 
  Repeat, 
  ArrowLeftRight, 
  FolderOpen, 
  LineChart, 
  Download, 
  Settings, 
  LogOut,
  TrendingUp,
  Handshake,
  CalendarCheck,
  Receipt,
  Database,
  ShieldCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ closeMobileMenu, isMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = sessionStorage.getItem('username') || 'Advisor';
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 🟢 STATE FOR SUB-MENU ACCORDION
  const [openMenus, setOpenMenus] = useState({
    relations: false,
    portfolio: false,
    business: false
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // 🟢 AUTO-EXPAND SUB-MENU IF A SUB-ITEM IS ACTIVE
  useEffect(() => {
    if (['/clients', '/reviews', '/sub-distributors'].includes(location.pathname)) setOpenMenus(p => ({ ...p, relations: true }));
    if (['/sips', '/transactions', '/schemes'].includes(location.pathname)) setOpenMenus(p => ({ ...p, portfolio: true }));
    if (['/invoices', '/reports'].includes(location.pathname)) setOpenMenus(p => ({ ...p, business: true }));
  }, [location.pathname]);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await api.get('/dashboard/backup');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VisionBridge_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("✅ Full System Backup Exported Successfully!");
    } catch (err) {
      toast.error("❌ Backup Failed");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true); 
    try { await api.post('/auth/logout'); } 
    catch (err) { console.error("Logout failed", err); } 
    finally { sessionStorage.clear(); navigate('/login'); }
  };

  return (
    <>
      <div className="sidebar" style={{ 
        display: 'flex', flexDirection: 'column', height: '100vh', width: '100%',
        background: 'var(--sidebar)', borderRight: '1px solid rgba(255,255,255,0.05)', 
        zIndex: 999999, overflow: 'hidden'
      }}>
        
        <style>{`
          .sidebar-nav { flex: 1; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; padding-top: 15px; }
          .sidebar-nav::-webkit-scrollbar { display: none; }
          
          .sidebar-link, .menu-trigger {
            display: flex; align-items: center; gap: 12px; padding: 14px 24px;
            color: #94a3b8; text-decoration: none; font-weight: 700; font-size: 14px;
            transition: all 0.2s ease; border-left: 4px solid transparent; cursor: pointer;
            width: 100%; border: none; background: transparent;
          }

          .sidebar-link:hover, .menu-trigger:hover { background: rgba(255, 255, 255, 0.05); color: #f8fafc; }

          .sidebar-link.active {
            background: rgba(2, 132, 199, 0.15); color: #0284c7; border-left: 4px solid #0284c7; font-weight: 900;
          }

          .sub-menu { background: rgba(0, 0, 0, 0.2); padding-bottom: 8px; }
          .sub-link {
            padding: 10px 24px 10px 56px; color: #64748b; font-size: 13px; font-weight: 700;
            display: flex; align-items: center; text-decoration: none; transition: all 0.2s;
          }
          .sub-link:hover { color: #f8fafc; }
          .sub-link.active { color: #0284c7; font-weight: 900; }

          .sidebar-action-btn {
            width: 100%; text-align: left; background: transparent !important; border: none !important;
            box-shadow: none !important; font-size: 14px !important; font-weight: 800 !important;
            padding: 14px 24px !important; display: flex; align-items: center; gap: 12px;
            cursor: pointer; transition: all 0.2s ease !important; border-radius: 0 !important; 
          }
          .btn-settings { color: #94a3b8 !important; }
          .btn-backup { color: #10b981 !important; border-top: 1px solid rgba(255,255,255,0.05) !important; }
          .btn-logout { color: #ef4444 !important; border-top: 1px solid rgba(255,255,255,0.05) !important; }
          
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        {/* LOGO AREA */}
        <div className="sidebar-logo" style={{ padding: '30px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontWeight: '900', fontSize: '22px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              VisionBridge <TrendingUp size={22} color="#0284c7" />
            </div>
            <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {userName}
            </div>
          </div>
        </div>
        
        {/* REFACTORED NAVIGATION */}
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          {/* 🟢 GROUP 1: RELATIONSHIP MANAGEMENT */}
          <div>
            <div className="menu-trigger" onClick={() => toggleMenu('relations')}>
              <Users size={18} /> Relationship Management {openMenus.relations ? <ChevronDown size={14} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </div>
            {openMenus.relations && (
              <div className="sub-menu">
                <NavLink to="/clients" className={({ isActive }) => isActive ? 'sub-link active' : 'sub-link'}>Clients Database</NavLink>
                <NavLink to="/reviews" className={({ isActive }) => isActive ? 'sub-link active' : 'sub-link'}>Client Reviews</NavLink>
                <NavLink to="/sub-distributors" className={({ isActive }) => isActive ? 'sub-link active' : 'sub-link'}>Sub-Distributors</NavLink>
              </div>
            )}
          </div>

          {/* 🟢 GROUP 2: PORTFOLIO DESK */}
          <div>
            <div className="menu-trigger" onClick={() => toggleMenu('portfolio')}>
              <Repeat size={18} /> Portfolio Desk {openMenus.portfolio ? <ChevronDown size={14} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </div>
            {openMenus.portfolio && (
              <div className="sub-menu">
                <NavLink to="/sips" className={({ isActive }) => isActive ? 'sub-link active' : 'sub-link'}>SIP Tracker</NavLink>
                <NavLink to="/transactions" className={({ isActive }) => isActive ? 'sub-link active' : 'sub-link'}>Transactions</NavLink>
                <NavLink to="/schemes" className={({ isActive }) => isActive ? 'sub-link active' : 'sub-link'}>MF Schemes</NavLink>
              </div>
            )}
          </div>

          {/* 🟢 GROUP 3: BUSINESS OPS */}
          <div>
            <div className="menu-trigger" onClick={() => toggleMenu('business')}>
              <Receipt size={18} /> Business Suite {openMenus.business ? <ChevronDown size={14} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </div>
            {openMenus.business && (
              <div className="sub-menu">
                <NavLink to="/invoices" className={({ isActive }) => isActive ? 'sub-link active' : 'sub-link'}>Invoice Manager</NavLink>
                <NavLink to="/reports" className={({ isActive }) => isActive ? 'sub-link active' : 'sub-link'}>Download Reports</NavLink>
              </div>
            )}
          </div>

          <NavLink to="/charts" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
            <LineChart size={18} /> Charts & Analytics
          </NavLink>
        </nav>

        {/* BOTTOM SECTION */}
        <div style={{ background: 'transparent' }}>
          <button onClick={handleBackup} disabled={isBackingUp} className="sidebar-action-btn btn-backup">
            {isBackingUp ? <Database size={18} className="spin" /> : <ShieldCheck size={18} />} 
            {isBackingUp ? "Backing up..." : "Backup System"}
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="sidebar-action-btn btn-settings">
            <Settings size={18} /> Settings
          </button>
          <button onClick={handleLogout} disabled={isLoggingOut} className="sidebar-action-btn btn-logout">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
};

export default Sidebar;