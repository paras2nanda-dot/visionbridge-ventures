/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  CalendarCheck, User, Users, Search, AlertCircle, CheckCircle2, 
  ChevronRight, Clock, ExternalLink, MessageSquare, History, Plus, X
} from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ overdue: 0, due_7d: 0, completed_7d: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ad-hoc Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Execution Modal State
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [viewMode, setViewMode] = useState('execute'); // 'execute' or 'history'
  const [history, setHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    outcome: 'No review needed',
    remarks: '',
    next_review_date: ''
  });

  const currentUser = sessionStorage.getItem('username') || 'Advisor';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendRes, statsRes] = await Promise.all([
        api.get('/dashboard/reviews/pending'),
        api.get('/dashboard/reviews/stats')
      ]);
      setReviews(Array.isArray(pendRes.data) ? pendRes.data : []);
      setStats(statsRes.data);
    } catch (err) {
      toast.error("Failed to sync review cycle");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 AD-HOC SEARCH LOGIC (Issue 2 & 3)
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await api.get(`/dashboard/reviews/search?term=${searchQuery}`);
          setSearchResults(res.data);
        } catch (err) { console.error(err); }
        finally { setIsSearching(false); }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const openReviewModal = async (review, mode = 'execute') => {
    setSelectedReview(review);
    setViewMode(mode);
    setFormData({
      outcome: 'No review needed',
      remarks: '',
      next_review_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
    });

    if (mode === 'history' || true) {
        try {
            const id = review.client_id || review.family_id || review.id;
            const type = review.entity_type || review.type;
            const res = await api.get(`/dashboard/client/${id}`);
            // Extract history based on type
            setHistory(type === 'CLIENT' ? res.data.review_history : res.data.family_review_history);
        } catch (err) { console.error("History fetch failed"); }
    }
    setIsModalOpen(true);
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!formData.remarks.trim()) return toast.warning("Remarks are mandatory.");
    
    try {
      setExecuting(true);
      const payload = {
        schedule_id: selectedReview.id || null, // null for ad-hoc
        entity_type: selectedReview.entity_type || selectedReview.type,
        entity_id: selectedReview.client_id || selectedReview.family_id || selectedReview.id,
        outcome: formData.outcome,
        remarks: formData.remarks,
        next_review_date: formData.next_review_date,
        reviewed_by: currentUser
      };

      await api.post('/dashboard/reviews/execute', payload);
      toast.success(`Review recorded.`);
      setIsModalOpen(false);
      setSearchQuery('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Execution failed");
    } finally {
      setExecuting(false);
    }
  };

  const filteredReviews = reviews.filter(r => 
    (r.entity_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.client_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isOverdue = (date) => new Date(date) < new Date().setHours(0,0,0,0);

  return (
    <div className="fade-in" style={{ padding: '0 20px 40px 20px' }}>
      
      {/* 📊 SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px' }}><AlertCircle color="#ef4444" /></div>
            <div><div style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{stats.overdue}</div><div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>OVERDUE REVIEWS</div></div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px' }}><Clock color="#f59e0b" /></div>
            <div><div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>{stats.due_7d}</div><div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>DUE IN 7 DAYS</div></div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}><CheckCircle2 color="#10b981" /></div>
            <div><div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>{stats.completed_7d || 0}</div><div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>DONE LAST 7 DAYS</div></div>
        </div>
      </div>

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ minWidth: '300px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>Review Management</h1>
          <div style={{ position: 'relative', marginTop: '16px' }}>
             <input 
                type="text" 
                placeholder="Start New Review: Search Client or Family..."
                style={{ width: '100%', padding: '14px 16px 14px 44px', background: '#0284c710', border: '2px solid #0284c730', borderRadius: '12px', color: 'var(--text-main)', outline: 'none', fontWeight: '700' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
             <Plus size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
             
             {/* Search Dropdown */}
             {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '110%', left: 0, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                    {searchResults.map(res => (
                        <div key={res.id} onClick={() => { openReviewModal(res); setSearchResults([]); }} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="search-item-hover">
                            <div>
                                <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{res.name}</div>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: res.type === 'CLIENT' ? '#0284c7' : '#8b5cf6' }}>{res.type} {res.client_code ? `(${res.client_code})` : ''}</div>
                            </div>
                            <Plus size={16} color="var(--text-muted)" />
                        </div>
                    ))}
                </div>
             )}
          </div>
        </div>

        <div style={{ position: 'relative', width: '350px' }}>
          <label style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Filter Pending List</label>
          <div style={{ position: 'relative' }}>
            <input 
                type="text" 
                placeholder="Find in current cycle..."
                style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', outline: 'none', fontWeight: '600' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)', fontWeight: '700' }}>SYNCING...</div>
      ) : filteredReviews.length > 0 ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '18px 24px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '900' }}>ENTITY / TYPE</th>
                  <th style={{ padding: '18px 24px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '900' }}>IDENTIFIER</th>
                  <th style={{ padding: '18px 24px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '900' }}>DUE DATE</th>
                  <th style={{ padding: '18px 24px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: item.entity_type === 'CLIENT' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.entity_type === 'CLIENT' ? <User size={18} color="#0284c7" /> : <Users size={18} color="#8b5cf6" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{item.entity_name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900' }}>{item.entity_type}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', fontWeight: '700', color: 'var(--text-main)' }}>{item.client_code || '-'}</td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isOverdue(item.next_review_date) ? '#ef4444' : 'var(--text-main)', fontWeight: '800' }}>
                        <Clock size={14} />
                        {new Date(item.next_review_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {isOverdue(item.next_review_date) && <span style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>OVERDUE</span>}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openReviewModal(item, 'history')} style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><History size={16}/></button>
                        <button onClick={() => openReviewModal(item, 'execute')} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>Review Now</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
          <CheckCircle2 size={48} color="#10b981" style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-main)', fontWeight: '800' }}>All Caught Up!</h3>
        </div>
      )}

      {/* Execution / History Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'var(--bg-card)', width: '650px', maxHeight: '90vh', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                <button onClick={() => setViewMode('execute')} style={{ flex: 1, padding: '20px', background: viewMode === 'execute' ? 'transparent' : 'rgba(255,255,255,0.02)', border: 'none', color: viewMode === 'execute' ? '#0284c7' : 'var(--text-muted)', fontWeight: '900', cursor: 'pointer', borderBottom: viewMode === 'execute' ? '3px solid #0284c7' : 'none' }}>EXECUTE REVIEW</button>
                <button onClick={() => setViewMode('history')} style={{ flex: 1, padding: '20px', background: viewMode === 'history' ? 'transparent' : 'rgba(255,255,255,0.02)', border: 'none', color: viewMode === 'history' ? '#0284c7' : 'var(--text-muted)', fontWeight: '900', cursor: 'pointer', borderBottom: viewMode === 'history' ? '3px solid #0284c7' : 'none' }}>REVIEW HISTORY</button>
                <button onClick={() => setIsModalOpen(false)} style={{ padding: '20px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            <div style={{ padding: '32px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>{selectedReview?.entity_name || selectedReview?.name}</div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7' }}>{selectedReview?.client_code || 'Family Group'}</div>
                </div>

                {viewMode === 'execute' ? (
                    <form onSubmit={handleExecute}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '8px' }}>OUTCOME</label>
                            <select style={{ width: '100%', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontWeight: '700' }} value={formData.outcome} onChange={(e) => setFormData({...formData, outcome: e.target.value})}>
                                <option>No review needed</option>
                                <option>SIP / Lumpsum invested</option>
                                <option>KYC / Nominee completed</option>
                                <option>Client not interested</option>
                                <option>Client not reachable</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '8px' }}>NOTES *</label>
                            <textarea required style={{ width: '100%', height: '100px', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontWeight: '600' }} value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})}></textarea>
                        </div>
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '8px' }}>RESCHEDULE DATE *</label>
                            <input type="date" required style={{ width: '100%', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontWeight: '700' }} value={formData.next_review_date} onChange={(e) => setFormData({...formData, next_review_date: e.target.value})} />
                        </div>
                        <button type="submit" disabled={executing} style={{ width: '100%', padding: '16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>{executing ? "SAVING..." : "SUBMIT REVIEW"}</button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {history && history.length > 0 ? history.map((h, i) => (
                            <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#0284c7' }}>{new Date(h.review_date).toLocaleDateString()}</span>
                                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)' }}>BY: {h.reviewed_by}</span>
                                </div>
                                <div style={{ fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>{h.outcome}</div>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{h.remarks}</p>
                            </div>
                        )) : <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No past review logs found.</div>}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover { background: rgba(2, 132, 199, 0.03) !important; }
        .search-item-hover:hover { background: rgba(2, 132, 199, 0.08) !important; }
      `}</style>
    </div>
  );
};

export default Reviews;