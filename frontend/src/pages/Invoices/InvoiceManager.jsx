import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, RefreshCw, Save, Printer, Trash2, Edit, BookOpen, X
} from 'lucide-react';
import { toast } from 'react-toastify';

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

  // 🟢 LEDGER MODAL STATE
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerConfig, setLedgerConfig] = useState({
    sd_id: '',
    start_date: '',
    end_date: ''
  });

  const initialFormState = {
    sub_distributor_id: '',
    invoice_no: `VBV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    start_date: '',
    end_date: '',
    slab_name: 'Slab-1',
    gross_commission: 0,
    platform_applicable: true,
    txn_rate: 5,
    ops_applicable: true,
    ops_rate_pm: 50,
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
    const token = sessionStorage.getItem("token");
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [sdRes, invRes] = await Promise.all([
        fetch('https://visionbridge-backend.onrender.com/api/sub-distributors', { headers }),
        fetch('https://visionbridge-backend.onrender.com/api/sub-distributors/invoices', { headers })
      ]);
      const sds = await sdRes.json();
      const invs = await invRes.json();
      setSubDistributors(sds);
      if (invs.success) setInvoices(invs.data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to sync data");
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
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch(
        `https://visionbridge-backend.onrender.com/api/sub-distributors/${formData.sub_distributor_id}/invoice-preview?startDate=${formData.start_date}&endDate=${formData.end_date}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json.success) {
        setFormData(prev => ({
          ...prev,
          txn_count: json.data.txnCount,
          client_count: json.data.clientCount,
          previous_balance: json.data.previousBalance,
          duration_months: json.data.monthFactor
        }));
      }
    } catch (err) {
      console.error("Preview fetch failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const calculateTotals = () => {
    const platformDeduction = formData.platform_applicable ? (formData.txn_count * formData.txn_rate) : 0;
    const opsDeduction = formData.ops_applicable ? (formData.client_count * formData.ops_rate_pm * formData.duration_months) : 0;
    const netCommission = formData.gross_commission - platformDeduction - opsDeduction;
    const tdsDeduction = formData.tds_applicable ? (netCommission * (formData.tds_rate_percent / 100)) : 0;
    const netPayout = netCommission - tdsDeduction + formData.previous_balance;

    return { platformDeduction, opsDeduction, netCommission, tdsDeduction, netPayout };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `https://visionbridge-backend.onrender.com/api/sub-distributors/invoices/${editingId}`
        : 'https://visionbridge-backend.onrender.com/api/sub-distributors/invoices';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, net_payout: totals.netPayout })
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success(isEditing ? "Invoice Updated!" : "Invoice Generated!");
        setIsEditing(false);
        setEditingId(null);
        setFormData(initialFormState);
        fetchInitialData();
      }
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const handleEdit = (inv) => {
    setIsEditing(true);
    setEditingId(inv.id);
    const start = new Date(inv.start_date).toISOString().split('T')[0];
    const end = new Date(inv.end_date).toISOString().split('T')[0];

    setFormData({
      ...inv,
      start_date: start,
      end_date: end,
      gross_commission: parseFloat(inv.gross_commission),
      txn_rate: parseFloat(inv.txn_rate),
      ops_rate_pm: parseFloat(inv.ops_rate_pm),
      tds_rate_percent: parseFloat(inv.tds_rate_percent),
      previous_balance: parseFloat(inv.previous_balance),
      txn_count: parseInt(inv.txn_count),
      client_count: parseInt(inv.client_count),
      duration_months: parseFloat(inv.duration_months)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This cannot be undone.")) return;
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch(`https://visionbridge-backend.onrender.com/api/sub-distributors/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Invoice Deleted");
        fetchInitialData();
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleMarkPaid = async (id) => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch(`https://visionbridge-backend.onrender.com/api/sub-distributors/invoices/${id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Paid' })
      });
      
      const responseData = await res.json();
      
      if (res.ok && responseData.success) {
        toast.success("Payment Recorded!");
        fetchInitialData();
      } else {
        toast.error("Update failed. Check console.");
      }
    } catch (err) {
      toast.error("Network Error. Is backend deployed?");
    }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  // 🚀 FIXED PRINT LOGIC: Independent Window to prevent layout clipping
  const handlePrint = () => {
    const partnerName = subDistributors.find(sd => sd.id == formData.sub_distributor_id)?.name || "Partner";
    const partnerLoc = subDistributors.find(sd => sd.id == formData.sub_distributor_id)?.location || "Delhi";
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice_${formData.invoice_no}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #0f172a; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .biz-name { font-size: 42px; font-weight: 900; margin: 0; text-transform: uppercase; }
            .sub-title { font-size: 16px; letter-spacing: 4px; color: #64748b; margin: 5px 0; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .info-box h2 { margin: 0; font-size: 24px; }
            .info-box p { margin: 2px 0; color: #64748b; font-weight: 600; }
            table { width: 90%; margin: 0 auto 40px auto; border-collapse: collapse; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #0f172a; font-size: 12px; }
            td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .amt { text-align: right; font-weight: 700; }
            .total-wrap { display: flex; justify-content: center; }
            .total-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px 50px; border-radius: 12px; text-align: center; min-width: 300px; }
            .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="biz-name">VisionBridge Ventures</h1>
            <h3 class="sub-title">COMMISSION REPORT</h3>
            <p style="margin:0; font-size: 11px;">MUTUAL FUND DISTRIBUTION</p>
          </div>
          <div class="info-grid">
            <div class="info-box">
              <p style="font-size: 10px; color: #94a3b8;">INVOICED TO:</p>
              <h2>${partnerName}</h2>
              <p>${partnerLoc}</p>
            </div>
            <div class="info-box" style="text-align: right;">
              <p style="font-size: 10px; color: #94a3b8;">INVOICE DETAILS:</p>
              <h3 style="margin:0;">#${formData.invoice_no}</h3>
              <p>Period: ${formData.start_date} to ${formData.end_date}</p>
              <p>Slab: ${formData.slab_name}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>DESCRIPTION</th><th style="text-align:center">METRIC</th><th class="amt">AMOUNT</th></tr>
            </thead>
            <tbody>
              <tr><td>Gross Commission Received</td><td style="text-align:center">Self Declared</td><td class="amt">${formatINR(formData.gross_commission)}</td></tr>
              ${formData.platform_applicable ? `<tr><td style="color:#ef4444">(-) Platform Charges</td><td style="text-align:center">${formData.txn_count} txns</td><td class="amt" style="color:#ef4444">- ${formatINR(totals.platformDeduction)}</td></tr>` : ''}
              ${formData.ops_applicable ? `<tr><td style="color:#ef4444">(-) Operational Expenses</td><td style="text-align:center">${formData.client_count} clients</td><td class="amt" style="color:#ef4444">- ${formatINR(totals.opsDeduction)}</td></tr>` : ''}
              <tr style="font-weight:900; background:#f8fafc"><td>Net Commission</td><td></td><td class="amt">${formatINR(totals.netCommission)}</td></tr>
              ${formData.tds_applicable ? `<tr><td style="font-style:italic">(-) TDS Deduction</td><td style="text-align:center">5%</td><td class="amt">- ${formatINR(totals.tdsDeduction)}</td></tr>` : ''}
              <tr><td style="font-style:italic">Previous Balance</td><td style="text-align:center">Carryforward</td><td class="amt">+ ${formatINR(formData.previous_balance)}</td></tr>
            </tbody>
          </table>
          <div class="total-wrap">
            <div class="total-box">
              <p style="font-size: 11px; color: #64748b; margin-bottom: 5px;">FINAL NET PAYOUT</p>
              <h2 style="font-size: 32px; margin:0;">${formatINR(totals.netPayout)}</h2>
            </div>
          </div>
          <div class="footer">
            THIS IS A COMPUTER GENERATED DOCUMENT AND DOES NOT REQUIRE A SIGNATURE.<br/>
            VisionBridge Ventures © ${new Date().getFullYear()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

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
  const inputStyle = { width: '100%', padding: '12px 16px', fontSize: '14px', outline: 'none', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '600' };
  const paperStyle = { background: '#ffffff', color: '#0f172a', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative' };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: '800', color: 'var(--text-muted)' }}>SYNCHRONIZING INVOICE ENGINE...</div>;

  return (
    <div className="fade-in print-container">
      
      {showLedger && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '800px', borderRadius: '20px', border: '1px solid var(--border)', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}><BookOpen color="#0284c7" /> Partner Statement of Account (Ledger)</h2>
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
                  <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Period</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Invoice #</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-muted)', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-muted)', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.periodInvoices.map(inv => (
                      <tr key={inv.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>{new Date(inv.start_date).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{inv.invoice_no}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800' }}>{formatINR(inv.net_payout)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', background: inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: inv.status === 'Paid' ? '#10b981' : '#ef4444' }}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ padding: '20px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-card)' }}>
                  <span style={{ fontWeight: '900', color: 'var(--text-muted)' }}>Total Outstanding</span>
                  <span style={{ fontWeight: '900', color: '#ef4444', fontSize: '18px' }}>{formatINR(ledgerData.totalPayable)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: '1 1 350px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => setShowLedger(true)} style={{ flex: 1, background: '#0284c7', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <BookOpen size={18} /> View Ledger
            </button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-main)', fontWeight: '800' }}>
              <RefreshCw size={18} className={previewLoading ? "spin" : ""} color="#8b5cf6" /> {isEditing ? 'Edit Invoice' : 'Configuration'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <select style={inputStyle} value={formData.sub_distributor_id} onChange={(e) => setFormData({...formData, sub_distributor_id: e.target.value})} disabled={isEditing}>
                <option value="">Select Distributor</option>
                {subDistributors.map(sd => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="date" style={inputStyle} value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} disabled={isEditing} />
                <input type="date" style={inputStyle} value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} disabled={isEditing} />
              </div>
              <input type="number" placeholder="Gross Commission" style={inputStyle} value={formData.gross_commission} onChange={(e) => setFormData({...formData, gross_commission: parseFloat(e.target.value) || 0})} />
              <button onClick={handleSave} disabled={!formData.sub_distributor_id || !formData.gross_commission} style={{ background: '#8b5cf6', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: '800' }}>
                <Save size={18} /> {isEditing ? "UPDATE INVOICE" : "GENERATE"}
              </button>
              {isEditing && <button onClick={() => { setIsEditing(false); setEditingId(null); setFormData(initialFormState); }} style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: '800' }}>CANCEL</button>}
            </div>
          </div>
        </div>

        <div style={{ flex: '2 1 600px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={handlePrint} style={{ background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Printer size={18} /> Download / Print PDF
            </button>
          </div>

          <div style={paperStyle}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '30px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '0' }}>VisionBridge Ventures</h1>
              <h3 style={{ fontSize: '14px', color: '#64748b', margin: '5px 0', letterSpacing: '2px' }}>COMMISSION REPORT</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '10px', color: '#94a3b8' }}>INVOICED TO:</p>
                <h2 style={{ margin: 0 }}>{subDistributors.find(sd => sd.id == formData.sub_distributor_id)?.name || "---"}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', color: '#94a3b8' }}>INVOICE DETAILS:</p>
                <h3 style={{ margin: 0 }}>#{formData.invoice_no}</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>Period: {formData.start_date} to {formData.end_date}</p>
              </div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8' }}>Invoice Content Preview Locked. Click Print to view full document.</p>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: '40px' }}>
        <h3 style={{ marginBottom: '24px', color: 'var(--text-main)', fontWeight: '800' }}>Recent Settlement History</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px', textAlign: 'left' }}>Invoice #</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Partner</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Payout</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '800' }}>{inv.invoice_no}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{inv.sd_name}</td>
                  <td style={{ padding: '16px', fontWeight: '900', color: '#8b5cf6' }}>{formatINR(inv.net_payout)}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', background: inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: inv.status === 'Paid' ? '#10b981' : '#ef4444' }}>{inv.status}</span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      {inv.status !== 'Paid' && <button onClick={() => handleMarkPaid(inv.id)} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}><CheckCircle size={14} /></button>}
                      <button onClick={() => handleEdit(inv)} style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer' }}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(inv.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManager;