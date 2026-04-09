import React from 'react';

const ActivityFeed = () => {
  const activities = [
    { id: 1, type: 'client', icon: '👤', title: 'New Client Onboarded', desc: 'Amit (C002) was added to the database.', time: '2 hours ago', color: '#0ea5e9' },
    { id: 2, type: 'sip', icon: '🔄', title: 'SIP Mandate Active', desc: '₹25,000 monthly SIP started for Vijay.', time: '5 hours ago', color: '#10b981' },
    { id: 3, type: 'txn', icon: '💸', title: 'Lumpsum Invested', desc: '₹1,50,000 invested in HDFC Flexi Cap.', time: 'Yesterday', color: '#f59e0b' },
    { id: 4, type: 'alert', icon: '⚠️', title: 'KYC Pending', desc: 'Aadhaar update required for client C005.', time: '2 days ago', color: '#ef4444' },
  ];

  return (
    <div style={{ background: 'var(--bg-card, #fff)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
      <h3 style={{ marginTop: 0, marginBottom: '25px', color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', transition: 'color 0.3s ease' }}>
        <span>🕒</span> Recent Activity Feed
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {activities.map(act => (
          <div key={act.id} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <div style={{ background: `${act.color}20`, color: act.color, padding: '12px', borderRadius: '50%', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {act.icon}
            </div>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-main, #0f172a)', fontSize: '14px', transition: 'color 0.3s ease' }}>{act.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', marginTop: '2px', transition: 'color 0.3s ease' }}>{act.desc}</div>
              <div style={{ fontSize: '11px', color: act.color, marginTop: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{act.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;