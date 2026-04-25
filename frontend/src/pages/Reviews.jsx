/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  CalendarCheck, 
  User, 
  Users, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Clock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Execution Modal State
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [formData, setFormData] = useState({
    outcome: '',
    remarks: '',
    next_review_date: ''
  });

  const currentUser = sessionStorage.getItem('username') || 'Advisor';

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/reviews/pending');
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to sync review cycle");
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (review) => {
    setSelectedReview(review);
    setFormData({
      outcome: 'No review needed',
      remarks: '',
      // Default next review to 3 months from now
      next_review_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    
    // 1. Mandatory Validations (Requirement 10)
    if (!formData.remarks.trim()) {
      return toast.warning("Remarks/Notes are mandatory for audit safety.");
    }

    const nextDate = new Date(formData.next_review_date);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    if (nextDate > maxDate) {
      return toast.warning("Next review must be scheduled within the next 12 months.");
    }

    try {
      setExecuting(true);
      const payload = {
        schedule_id: selectedReview.id,
        entity_type: selectedReview.entity_type,
        entity_id: selectedReview.entity_type === 'CLIENT' ? selectedReview.client_id : selectedReview.family_id,
        outcome: formData.outcome,
        remarks: formData.remarks,
        next_review_date: formData.next_review_date,
        reviewed_by: currentUser
      };

      await api.post('/dashboard/reviews/execute', payload);
      toast.success(`Review completed for ${selectedReview.entity_name}`);
      setIsModalOpen(false);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || "Review execution failed");
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
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarCheck size={32} color="#0284c7" /> Review Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px', fontWeight: '600' }}>
            Periodic Advisory Cycle & Client Compliance
          </p>
        </div>

        <div style={{ position: 'relative', width: '350px' }}>
          <input 
            type="text" 
            placeholder="Search by name or client code..."
            style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', outline: 'none', fontWeight: '600' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)', fontWeight: '700' }}>SYNCING REVIEW CYCLE...</div>
      ) : filteredReviews.length > 0 ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '18px 24px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '1px' }}>Entity / Type</th>
                  <th style={{ padding: '18px 24px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '1px' }}>Identifier</th>
                  <th style={{ padding: '18px 24px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '1px' }}>Source / Distributor</th>
                  <th style={{ padding: '18px 24px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '1px' }}>Review Due Date</th>
                  <th style={{ padding: '18px 24px', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: item.entity_type === 'CLIENT' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.entity_type === 'CLIENT' ? <User size={18} color="#0284c7" /> : <Users size={18} color="#8b5cf6" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{item.entity_name}</div>
                          <div style={{ fontSize: '11px', color: item.entity_type === 'CLIENT' ? '#0284c7' : '#8b5cf6', fontWeight: '900', marginTop: '2px' }}>{item.entity_type}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', fontWeight: '700', color: 'var(--text-main)' }}>{item.client_code || '-'}</td>
                    <td style={{ padding: '20px 24px', fontWeight: '600', color: 'var(--text-muted)' }}>{item.sub_distributor_name || 'Direct / Self'}</td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isOverdue(item.next_review_date) ? '#ef4444' : 'var(--text-main)', fontWeight: '800' }}>
                        <Clock size={14} />
                        {new Date(item.next_review_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {isOverdue(item.next_review_date) && <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>OVERDUE</span>}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <button 
                        onClick={() => openReviewModal(item)}
                        style={{ padding: '8px 20px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        Action Review <ChevronRight size={16} />
                      </button>
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
          <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>No pending or overdue reviews found.</p>
        </div>
      )}

      {/* Execution Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-card)', width: '500px', borderRadius: '20px', border: '1px solid var(--border)', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>Record Review Outcome</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', fontWeight: '600' }}>Reviewing: <span style={{ color: '#0284c7' }}>{selectedReview?.entity_name}</span></p>

            <form onSubmit={handleExecute}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Outcome</label>
                <select 
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '700', outline: 'none' }}
                  value={formData.outcome}
                  onChange={(e) => setFormData({...formData, outcome: e.target.value})}
                >
                  <option>No review needed</option>
                  <option>SIP / Lumpsum invested</option>
                  <option>KYC / Nominee completed</option>
                  <option>Client not interested</option>
                  <option>Client not reachable</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Remarks / Discussion Notes *</label>
                <textarea 
                  required
                  placeholder="Summarize the discussion and action points..."
                  style={{ width: '100%', height: '100px', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '600', outline: 'none', resize: 'none' }}
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                ></textarea>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Reschedule Next Review *</label>
                <input 
                  type="date" 
                  required
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '700', outline: 'none' }}
                  value={formData.next_review_date}
                  onChange={(e) => setFormData({...formData, next_review_date: e.target.value})}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: '600' }}>Note: Must be within 12 months from today.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '14px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={executing}
                  style={{ flex: 1, padding: '14px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', opacity: executing ? 0.7 : 1 }}
                >
                  {executing ? "Saving..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover {
          background: rgba(2, 132, 199, 0.03) !important;
        }
      `}</style>
    </div>
  );
};

export default Reviews;