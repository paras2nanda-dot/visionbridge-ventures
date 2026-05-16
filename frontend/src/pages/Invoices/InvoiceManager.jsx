/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, RefreshCw, Save, Printer, Trash2, Edit, BookOpen, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const SLABS = [
  { id: 'slab1', name: 'Slab-1', desc: 'Less than Rs 10 lacs AUM' },
  { id: 'slab2', name: 'Slab-2', desc: 'Rs 10 - 50 lacs AUM' },
  { id: 'slab3', name: 'Slab-3', desc: 'Above Rs 50 lacs AUM' }
];

const InvoiceManager = () => {
  const [subDistributors, setSubDistributors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // LEDGER MODAL STATE
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerConfig, setLedgerConfig] = useState({
    sd_id: '',
    start_date: '',
    end_date: ''
  });

  // Scheme & Client level granular line items table container state
  const [calculatedSchemes, setCalculatedSchemes] = useState([]);

  const initialFormState = {
    sub_distributor_id: '',
    invoice_no: `VBV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    start_date: '',
    end_date: '',
    slab_name: 'Slab-1',
    sharing_percentage: 90.00, // 🟢 Variable Global Input: Sharing split ratio %
    gross_commission: 0,
    platform_applicable: true,
    txn_rate: 5,         // ₹5 Per Transaction Execution
    ops_applicable: true,
    ops_rate_pm: 10,     // ₹10 Per Active Client Per Month
    tds_applicable: true,
    tds_rate_percent: 5,
    previous_balance: 0,
    txn_count: 0,
    client_count: 0,
    duration_months: 1
  };

  const [formData, setFormData] = useState(initialFormState);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sdRes, invRes] = await Promise.all([
        api.get('/sub-distributors'),
        api.get('/sub-distributors/invoices')
      ]);
      
      setSubDistributors(sdRes.data);
      if (invRes.data.success) setInvoices(invRes.data.data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to sync invoice registry datasets");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEditing && formData.sub_distributor_id && formData.start_date && formData.end_date) {
      fetchPreview();
    }
  }, [formData.sub_distributor_id, formData.start_date, formData.end_date, isEditing]);

  const fetchPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await api.get(`/sub-distributors/${formData.sub_distributor_id}/invoice-preview`, {
        params: { startDate: formData.start_date, endDate: formData.end_date }
      });
      const json = res.data;
      if (json.success) {
        setCalculatedSchemes(json.data.schemesTable || []);
        setFormData(prev => ({
          ...prev,
          txn_count: json.data.txnCount || 0,
          client_count: json.data.clientCount || 0,
          previous_balance: json.data.previousBalance || 0,
          duration_months: json.data.monthFactor || 1.0,
          sharing_percentage: json.data.sharingPercentage !== undefined ? parseFloat(json.data.sharingPercentage) : prev.sharing_percentage,
          gross_commission: json.data.grossCommission || 0
        }));
      }
    } catch (err) {
      console.error("Preview aggregation pipeline error", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  /**
   * 🟢 REACTIVE ENGINE: RECALCULATE ON LIVE INPUT CHANGES
   * Recompute math dynamically when you adjust Sharing % or Scheme Commission % row-by-row
   */
  const recalculateDynamicYield = (updatedSchemes, updatedSharingPct) => {
    let accumulatedGross = 0;
    const splitMultiplier = parseFloat(updatedSharingPct || 0) / 100;

    const modifiedRows = updatedSchemes.map(row => {
      const eligibleAmt = parseFloat(row.eligible_investment || 0);
      const rateFactor = parseFloat(row.commission_rate || 0) / 100;
      // Yield Formula: (Eligible Assets * Scheme Rate) / 12 * Variable Partner Share Split
      const rowYield = ((eligibleAmt * rateFactor) / 12) * splitMultiplier;
      accumulatedGross += rowYield;

      return {
        ...row,
        calculated_commission: parseFloat(rowYield.toFixed(2))
      };
    });

    setCalculatedSchemes(modifiedRows);
    setFormData(prev => ({
      ...prev,
      sharing_percentage: updatedSharingPct,
      gross_commission: parseFloat(accumulatedGross.toFixed(2))
    }));
  };

  // Triggers when modifying global partner split percentage field input
  const handleGlobalSplitChange = (value) => {
    const nextSplit = value === '' ? '' : parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, sharing_percentage: value }));
    if (value !== '') {
      recalculateDynamicYield(calculatedSchemes, parseFloat(value) || 0);
    }
  };

  // Triggers when typing an override rate row-by-row for specific schemes
  const handleSchemeRateOverride = (index, value) => {
    const nextSchemes = [...calculatedSchemes];
    nextSchemes[index].commission_rate = value === '' ? '' : parseFloat(value) || 0;
    setCalculatedSchemes(nextSchemes);
    
    if (value !== '') {
      recalculateDynamicYield(nextSchemes, parseFloat(formData.sharing_percentage) || 0);
    }
  };

  const calculateTotals = () => {
    const roundedMonths = Math.round(formData.duration_months || 1);
    const platformDeduction = formData.platform_applicable ? (formData.txn_count * formData.txn_rate) : 0;
    const opsDeduction = formData.ops_applicable ? (formData.client_count * formData.ops_rate_pm * roundedMonths) : 0;
    const netCommission = formData.gross_commission - platformDeduction - opsDeduction;
    const tdsDeduction = formData.tds_applicable ? (netCommission * (formData.tds_rate_percent / 100)) : 0;
    const netPayout = netCommission - tdsDeduction + formData.previous_balance;

    return { platformDeduction, opsDeduction, netCommission, tdsDeduction, netPayout, roundedMonths };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    try {
      const payload = { 
        ...formData, 
        sharing_percentage: parseFloat(formData.sharing_percentage) || 0,
        net_payout: totals.netPayout,
        schemesTable: calculatedSchemes
      };
      
      const res = isEditing 
        ? await api.put(`/sub-distributors/invoices/${editingId}`, payload)
        : await api.post('/sub-distributors/invoices', payload);

      if (res.data.success) {
        toast.success(isEditing ? "Invoice update logged successfully" : "Automated billing committed cleanly");
        setIsEditing(false);
        setEditingId(null);
        setFormData(initialFormState);
        setCalculatedSchemes([]);
        fetchInitialData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Composing request runtime failure");
    }
  };

  const handleEdit = async (inv) => {
    setIsEditing(true);
    setEditingId(inv.id);
    const start = new Date(inv.start_date).toISOString().split('T')[0];
    const end = new Date(inv.end_date).toISOString().split('T')[0];

    setFormData({
      ...inv,
      start_date: start,
      end_date: end,
      sharing_percentage: parseFloat(inv.sharing_percentage || 90.00),
      gross_commission: parseFloat(inv.gross_commission),
      txn_rate: parseFloat(inv.txn_rate),
      ops_rate_pm: parseFloat(inv.ops_rate_pm),
      tds_rate_percent: parseFloat(inv.tds_rate_percent),
      previous_balance: parseFloat(inv.previous_balance),
      txn_count: parseInt(inv.txn_count),
      client_count: parseInt(inv.client_count),
      duration_months: parseFloat(inv.duration_months)
    });

    // Fetch child lines for editing
    try {
      setPreviewLoading(true);
      const res = await api.get(`/sub-distributors/${inv.sub_distributor_id}/invoice-preview`, {
        params: { startDate: start, endDate: end }
      });
      if (res.data?.success) {
        setCalculatedSchemes(res.data.data.schemesTable || []);
      }
    } catch (err) {
      console.error("Failed to load historical lines", err);
    } finally {
      setPreviewLoading(false);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;
    try {
      const res = await api.delete(`/sub-distributors/invoices/${id}`);
      if (res.status === 200) {
        toast.success("Invoice removed from history registers");
        fetchInitialData();
      }
    } catch (err) {
      toast.error("Failed to delete record");
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      const res = await api.put(`/sub-distributors/invoices/${id}/status`, { status: 'Paid' });
      if (res.data.success) {
        toast.success("Settlement recorded cleanly");
        fetchInitialData();
      } else {
        toast.error("Failed to update execution status");
      }
    } catch (err) {
      toast.error("Network interface connection failure");
    }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const getLedgerData = () => {
    if (!ledgerConfig.sd_id || !ledgerConfig.start_date || !ledgerConfig.end_date) return null;

    const sdInvoices = invoices.filter(inv => inv.sub_distributor_id == ledgerConfig.sd_id);
    const ledgerStart = new Date(ledgerConfig.start_date);
    const ledgerEnd = new Date(ledgerConfig.end_date);

    const priorUnpaid = sdInvoices.filter(inv => new Date(inv.start_date) < ledgerStart && inv.status !== 'Paid');
    const openingBalance = priorUnpaid.reduce((sum, inv) => sum + parseFloat(inv.net_payout), 0);

    const periodInvoices = sdInvoices.filter(inv => {
      const invStart = new Date(inv.start_date);
      return invStart >= ledgerStart && invStart <= ledgerEnd;
    }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    const totalUnpaidInPeriod = periodInvoices
        .filter(inv => inv.status !== 'Paid')
        .reduce((sum, inv) => sum + parseFloat(inv.net_payout), 0);
    const totalPayable = openingBalance + totalUnpaidInPeriod;

    return { openingBalance, periodInvoices, totalPayable };
  };

  const ledgerData = showLedger ? getLedgerData() : null;

  const cardStyle = { background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const paperStyle = { background: '#ffffff', color: '#0f172a', padding: '50px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'relative' };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)' }}>SYNCHRONIZING INVOICE RECONCILIATION SUITE...</div>;

  return (
    <div className="fade-in print-root">
      
      {showLedger && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '800px', borderRadius: '20px', border: '1px solid var(--border)', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}><BookOpen color="#0284c7" /> Partner Statement of Account</h2>
              <button onClick={() => setShowLedger(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Select Partner</label>
                <select style={inputStyle} value={ledgerConfig.sd_id} onChange={(e) => setLedgerConfig({...ledgerConfig, sd_id: e.target.value})}>
                  <option value="">Select...</option>
                  {subDistributors.map(sd => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>From Date</label><input type="date" style={inputStyle} value={ledgerConfig.start_date} onChange={(e) => setLedgerConfig({...ledgerConfig, start_date: e.target.value})} /></div>
              <div><label style={labelStyle}>To Date</label><input type="date" style={inputStyle} value={ledgerConfig.end_date} onChange={(e) => setLedgerConfig({...ledgerConfig, end_date: e.target.value})} /></div>
            </div>
            {ledgerData && (
              <div style={{ background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: 'rgba(2, 132, 199, 0.1)' }}>
                  <span style={{ fontWeight: '800', color: '#0284c7' }}>Opening Balance</span>
                  <span style={{ fontWeight: '900', color: '#0284c7' }}>{formatINR(ledgerData.openingBalance)}</span>
                </div>
                <table style={{ width: '100%', textAlign: 'left', fontSize: '14px' }}>
                  <tbody>
                    {ledgerData.periodInvoices.map(inv => (
                      <tr key={inv.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>{new Date(inv.start_date).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '12px 16px' }}>{inv.invoice_no}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800' }}>{formatINR(inv.net_payout)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}><span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', background: inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: inv.status === 'Paid' ? '#10b981' : '#ef4444' }}>{inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '20px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '900', color: 'var(--text-muted)' }}>Total Outstanding Payable</span>
                  <span style={{ fontWeight: '900', color: '#ef4444', fontSize: '18px' }}>{formatINR(ledgerData.totalPayable)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: '1 1 350px' }} className="no-print">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => setShowLedger(true)} style={{ width: '100%', background: '#0284c7', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(2, 132, 199, 0.2)' }}>
              <BookOpen size={18} /> View Ledger Register
            </button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', fontWeight: '800', fontSize: '16px' }}>
              <RefreshCw size={18} className={previewLoading ? "spin" : ""} color="#8b5cf6" /> 
              {isEditing ? 'Edit Invoice Adjustments' : 'Automation Configurator'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Sub-Distributor</label>
                <select style={inputStyle} value={formData.sub_distributor_id} onChange={(e) => setFormData({...formData, sub_distributor_id: e.target.value})} disabled={isEditing}>
                  <option value="">Select Distributor</option>
                  {subDistributors.map(sd => <option key={sd.id} value={sd.id}>{sd.name} ({sd.code})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Start Date</label><input type="date" style={inputStyle} value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} disabled={isEditing} /></div>
                <div><label style={labelStyle}>End Date</label><input type="date" style={inputStyle} value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} disabled={isEditing} /></div>
              </div>

              {/* 🟢 VARIABLE VARIABLE INPUT FIELD #1: MASTER COMMISSION SHARING SPLIT % */}
              <div style={{ background: 'rgba(139, 92, 246, 0.04)', padding: '16px', borderRadius: '12px', border: '1px dashed #8b5cf6' }}>
                <label style={{ ...labelStyle, color: '#8b5cf6', fontWeight: '900' }}>Variable: Commission Sharing %</label>
                <input 
                  type="number" 
                  step="0.01" 
                  style={{ ...inputStyle, border: '1px solid #8b5cf6' }} 
                  value={formData.sharing_percentage} 
                  onChange={(e) => handleGlobalSplitChange(e.target.value)} 
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', display: 'block', fontWeight: '600' }}>
                  Modifies contract sharing multiplier across all fund yields simultaneously.
                </span>
              </div>

              <div>
                <label style={labelStyle}>Slab Category</label>
                <select style={inputStyle} value={formData.slab_name} onChange={(e) => setFormData({...formData, slab_name: e.target.value})}>
                  {SLABS.map(s => <option key={s.id} value={s.name}>{s.name} - {s.desc}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Gross Commission Total (₹)</label>
                <input type="number" style={{ ...inputStyle, background: 'var(--bg-main)', opacity: 0.85, cursor: 'not-allowed' }} value={formData.gross_commission} readOnly />
              </div>

              <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Platform Fee (₹5/txn)</span>
                  <input type="checkbox" checked={formData.platform_applicable} onChange={(e) => setFormData({...formData, platform_applicable: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Operational Audit Fee (₹10/client)</span>
                  <input type="checkbox" checked={formData.ops_applicable} onChange={(e) => setFormData({...formData, ops_applicable: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Apply TDS (5%)</span>
                  <input type="checkbox" checked={formData.tds_applicable} onChange={(e) => setFormData({...formData, tds_applicable: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button onClick={handleSave} disabled={!formData.sub_distributor_id || formData.gross_commission <= 0} style={{ flex: 1, background: '#8b5cf6', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: (!formData.sub_distributor_id || formData.gross_commission <= 0) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (!formData.sub_distributor_id || formData.gross_commission <= 0) ? 0.5 : 1 }}>
                  <Save size={18} /> {isEditing ? "UPDATE INVOICE" : "LOG SETTLEMENT"}
                </button>
                {isEditing && <button onClick={() => { setIsEditing(false); setEditingId(null); setFormData(initialFormState); setCalculatedSchemes([]); }} style={{ flex: 0.5, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>CANCEL</button>}
              </div>
            </div>
          </div>
        </div>

        {/* PRINT MEDIA DOCUMENT SPACE */}
        <div style={{ flex: '2 1 600px' }} className="print-main-column">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }} className="no-print">
            <button onClick={() => window.print()} style={{ background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
              <Printer size={18} /> Download / Print Invoice PDF
            </button>
          </div>

          <div id="invoice-printable" style={paperStyle}>
            
            {/* ==================== PAGE 1: EXECUTIVE RECONCILIATION SUMMARY ==================== */}
            <div className="invoice-page-container">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#1e40af', margin: '0 0 5px 0', letterSpacing: '-1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>VisionBridge Ventures</h1>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '3px' }}>Commission Reconciliation Invoice</h3>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', margin: '5px 0 0 0' }}>MUTUAL FUND B2B DISTRIBUTION PROFILE</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', gap: '20px' }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 5px 0' }}>Invoiced To:</p>
                  <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>{subDistributors.find(sd => sd.id == formData.sub_distributor_id)?.name || "---"}</h2>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', margin: 0 }}>{subDistributors.find(sd => sd.id == formData.sub_distributor_id)?.location || "Location Not Set"}</p>
                </div>
                
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 5px 0' }}>Invoice Details:</p>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>#{formData.invoice_no}</h3>
                  <p style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', margin: '0 0 5px 0' }}>Period: <span style={{ color: '#0f172a' }}>{formData.start_date || 'N/A'}</span> to <span style={{ color: '#0f172a' }}>{formData.end_date || 'N/A'}</span></p>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#8b5cf6', textTransform: 'uppercase', margin: 0 }}>Variable Sharing Split: {formData.sharing_percentage}%</p>
                </div>
              </div>

              <div style={{ width: '100%', margin: '0 auto 40px auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1e40af' }}>
                      <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Description Parameter</th>
                      <th style={{ textAlign: 'center', padding: '12px 10px', fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Volume Basis</th>
                      <th style={{ textAlign: 'right', padding: '12px 10px', fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Disbursement Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '16px 10px', fontWeight: '800', color: '#1e293b', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>Gross Calculated Shared Commission</td>
                      <td style={{ padding: '16px 10px', textAlign: 'center', fontWeight: '700', color: '#64748b', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>Annexure Derived</td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: '900', color: '#1e40af', fontSize: '15px', borderBottom: '1px solid #e2e8f0' }}>{formatINR(formData.gross_commission)}</td>
                    </tr>
                    {formData.platform_applicable && (
                      <tr>
                        <td style={{ padding: '16px 10px', fontWeight: '700', color: '#475569', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>(-) Platform Transaction Fees</td>
                        <td style={{ padding: '16px 10px', textAlign: 'center', fontWeight: '700', color: '#475569', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>{formData.txn_count} txns @ ₹{formData.txn_rate}</td>
                        <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: '900', color: '#475569', fontSize: '15px', borderBottom: '1px solid #e2e8f0' }}>- {formatINR(totals.platformDeduction)}</td>
                      </tr>
                    )}
                    {formData.ops_applicable && (
                      <tr>
                        <td style={{ padding: '16px 10px', fontWeight: '700', color: '#475569', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>(-) Operational Maintenance Expenses</td>
                        <td style={{ padding: '16px 10px', textAlign: 'center', fontWeight: '700', color: '#475569', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>{formData.client_count} accounts @ ₹{formData.ops_rate_pm}/mo</td>
                        <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: '900', color: '#475569', fontSize: '15px', borderBottom: '1px solid #e2e8f0' }}>- {formatINR(totals.opsDeduction)}</td>
                      </tr>
                    )}
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ padding: '16px 10px', fontWeight: '900', color: '#0f172a', fontSize: '14px' }}>Net Subtotal Yield (Before TDS)</td>
                      <td style={{ padding: '16px 10px' }}></td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: '900', color: '#0f172a', fontSize: '15px' }}>{formatINR(totals.netCommission)}</td>
                    </tr>
                    {formData.tds_applicable && (
                      <tr>
                        <td style={{ padding: '16px 10px', fontStyle: 'italic', fontWeight: '700', color: '#64748b', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>(-) TDS Operational Deduction</td>
                        <td style={{ padding: '16px 10px', textAlign: 'center', fontWeight: '700', color: '#64748b', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>{formData.tds_rate_percent}% on Net</td>
                        <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: '900', color: '#64748b', fontSize: '15px', borderBottom: '1px solid #e2e8f0' }}>- {formatINR(totals.tdsDeduction)}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: '16px 10px', fontStyle: 'italic', fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>Previous Balance Carryforward Arrears</td>
                      <td style={{ padding: '16px 10px', textAlign: 'center', fontWeight: '700', color: '#94a3b8', fontSize: '12px' }}>Outstanding Ledgers</td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: '900', color: '#0f172a', fontSize: '15px' }}>+ {formatINR(formData.previous_balance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <div style={{ border: '2px solid #e2e8f0', background: '#f0fdf4', padding: '24px 60px', borderRadius: '16px', textAlign: 'center', minWidth: '350px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '900', color: '#15803d', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 10px 0' }}>FINAL NET PAYOUT POSITION</p>
                  <h2 style={{ fontSize: '42px', fontWeight: '900', color: '#15803d', margin: 0 }}>{formatINR(totals.netPayout)}</h2>
                </div>
              </div>
            </div>

            {/* ==================== PAGE 2: GRANULAR CLIENT INVESTMENTS ANNEXURE ==================== */}
            <div className="invoice-page-break" style={{ marginTop: '50px', paddingTop: '30px', borderTop: '2px solid #0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e40af', paddingBottom: '10px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1e40af', margin: 0, textTransform: 'uppercase' }}>Annexure Ledger: Detailed Client Holdings</h3>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>Granular scheme allocations captured across the billing parameters</p>
                </div>
                <span className="no-print" style={{ fontSize: '10px', fontWeight: '800', background: '#f3e8ff', color: '#6b21a8', padding: '5px 10px', borderRadius: '12px' }}>
                  ⚙️ Line Rates Overridable
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ textAlign: 'left', padding: '10px 6px', fontWeight: '800' }}>CLIENT NAME (CODE)</th>
                    <th style={{ textAlign: 'left', padding: '10px 6px', fontWeight: '800' }}>MUTUAL FUND SCHEME NAME</th>
                    <th style={{ textAlign: 'right', padding: '10px 6px', fontWeight: '800' }}>OPENING PRINCIPAL</th>
                    <th style={{ textAlign: 'right', padding: '10px 6px', fontWeight: '800' }}>REDEMPTIONS</th>
                    <th style={{ textAlign: 'right', padding: '10px 6px', fontWeight: '800' }}>ELIGIBLE ASSET</th>
                    {/* 🟢 VARIABLE INPUT OVERRIDE #2: INDEPENDENT MUTUAL FUND RATE CELLS */}
                    <th style={{ textAlign: 'center', padding: '10px 6px', fontWeight: '900', color: '#8b5cf6', width: '90px' }}>SCHEME %</th>
                    <th style={{ textAlign: 'right', padding: '10px 6px', fontWeight: '800' }}>PARTNER SHARE</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedSchemes.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 6px', fontWeight: '700', color: '#1e293b' }}>
                        {row.client_name} <br />
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{row.client_code}</span>
                      </td>
                      <td style={{ padding: '10px 6px', color: '#334155', fontWeight: '500' }}>{row.scheme_name}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatINR(row.opening_balance)}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'right', color: row.redemptions > 0 ? '#ef4444' : '#64748b' }}>
                        {row.redemptions > 0 ? `-${formatINR(row.redemptions)}` : '₹0'}
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: '600' }}>{formatINR(row.eligible_investment)}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          step="0.0001" 
                          className="no-print"
                          style={{ width: '75px', padding: '5px', textAlign: 'center', borderRadius: '6px', border: '1px solid #8b5cf6', fontWeight: '700' }} 
                          value={row.commission_rate}
                          onChange={(e) => handleSchemeRateOverride(idx, e.target.value)}
                        />
                        <span className="print-only" style={{ fontWeight: '600' }}>{row.commission_rate}%</span>
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: '800', color: '#1e40af' }}>{formatINR(row.calculated_commission)}</td>
                    </tr>
                  ))}
                  {calculatedSchemes.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontWeight: '600' }}>
                        Select channel partner parameters above to synthesize detailed client allocation lines.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* OUTLINE COMPLIANCE TERMS & CONDITIONS */}
              <div style={{ marginTop: '45px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1', fontSize: '10px', color: '#64748b', lineHeight: '1.6' }}>
                <p style={{ fontWeight: '800', color: '#475569', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Commission Payout Terms & Conditions</p>
                <ol style={{ margin: 0, paddingLeft: '14px' }}>
                  <li>Commission is calculated scheme-wise on the opening invested balance as on the first day of the billing period. Only amounts remaining invested throughout the month are eligible; any redemption or switch-out during the month proportionately reduces eligibility.</li>
                  <li>No commission is payable on fresh purchases or SIP instalments during the billing period, market or closing value, or on any redeemed or switched-out amount.</li>
                  <li>Gross commission represents the total calculated commission before deductions. Deductions include ₹5 per purchase/SIP transaction and ₹10 per active client per month towards operational and administrative services.</li>
                </ol>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .print-only { display: none !important; }

        @media print {
          .print-only { display: inline-block !important; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 12mm 10mm; }
          body, html, #root, .print-root { background: white !important; color: #0f172a !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .print-main-column { width: 100% !important; flex: none !important; }
          #invoice-printable { border: none !important; box-shadow: none !important; padding: 0 !important; }
          .invoice-page-break { page-break-before: always !important; break-before: page !important; margin-top: 20px !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceManager;