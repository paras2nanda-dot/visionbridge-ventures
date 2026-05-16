/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { toast } from 'react-toastify';
import { Award, Star, Handshake, Users, Info } from 'lucide-react'; 

const LeaderboardsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/leaderboards')
      .then(res => { 
        setData(res.data); 
        setLoading(false); 
      })
      .catch((err) => { 
        console.error("Leaderboards Sync Error:", err);
        toast.error("Failed to sync rankings");
        setLoading(false); 
      });
  }, []);

  if (loading) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '800', letterSpacing: '1px' }}>
        CALCULATING PERFORMANCE RANKINGS...
      </div>
    </div>
  );

  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: '#ef4444', fontWeight: '800' }}>❌ Connection Error.</div>;

  const formatINR = (val) => new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(Math.round(Number(val) || 0));

  return (
    <div className="fade-in" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* 🟢 TOP ANALYTICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* 🏆 TOP 5 FUNDS BY NET EXPOSURE */}
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '17px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.5px' }}>
            <Award size={22} color="#0284c7" /> Top 5 Funds by Exposure
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.topFunds?.map((fund, idx) => {
              const percentage = data.total_invested_aum > 0 ? ((Number(fund.invested_value) / Number(data.total_invested_aum)) * 100).toFixed(1) : 0;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percentage}%`, background: 'rgba(2, 132, 199, 0.04)', zIndex: 0 }}></div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--border)', color: idx < 3 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px' }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px' }}>{fund.scheme_name}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, zIndex: 1 }}>
                    <div style={{ fontWeight: '900', color: '#10b981', fontSize: '16px' }}>₹{formatINR(fund.invested_value)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase' }}>{percentage}% Weight</div>
                  </div>
                </div>
              );
            })}
            {(!data.topFunds || data.topFunds.length === 0) && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border)', fontSize: '13px' }}>No fund data detected.</div>}
          </div>
        </div>

        {/* ⭐ TOP 10 CLIENTS BY ACCURATE AUM */}
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '17px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.5px' }}>
            <Star size={22} color="#f59e0b" /> Top 10 Clients by Net AUM
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.topClients?.map((client, idx) => {
               const percentage = data.total_invested_aum > 0 ? ((Number(client.invested_value) / Number(data.total_invested_aum)) * 100).toFixed(1) : 0;
               return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px' }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>{client.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase' }}>{client.client_code}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '900', color: '#0284c7', fontSize: '16px' }}>₹{formatINR(client.invested_value)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', marginTop: '4px' }}>{percentage}% of Book</div>
                  </div>
                </div>
               );
            })}
            {(!data.topClients || data.topClients.length === 0) && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed var(--border)', fontSize: '13px' }}>No active client portfolios.</div>}
          </div>
        </div>

        {/* 🤝 TOP PARTNERS BY PERFORMANCE */}
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '17px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.5px' }}>
            <Handshake size={22} color="#8b5cf6" /> Partner Leaderboard
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.topSources?.map((source, idx) => {
               const percentage = data.total_invested_aum > 0 ? ((Number(source.invested_value) / Number(data.total_invested_aum)) * 100).toFixed(1) : 0;
               return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px' }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>{source.name || 'External'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12}/> {source.client_count} {source.client_count === 1 ? 'Client' : 'Clients'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '900', color: '#8b5cf6', fontSize: '16px' }}>₹{formatINR(source.invested_value)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase' }}>{percentage}% Share</div>
                  </div>
                </div>
               );
            })}
            {(!data.topSources || data.topSources.length === 0) && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--border)', fontSize: '13px', fontWeight: '600' }}>
                Register sub-distributors to see rankings.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaderboardsDashboard;