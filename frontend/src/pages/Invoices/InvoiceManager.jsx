import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, CheckCircle, AlertCircle, 
  User, Calendar, Percent, IndianRupee, Printer, Save, RefreshCw 
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
  
  // Form State
  const [formData, setFormData] = useState({
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
  });

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

  // 🔄 AUTO-FILL PREVIEW LOGIC
  useEffect(() => {
    if (formData.sub_distributor_id && formData.start_date && formData.end_date) {
      fetchPreview();
    }
  }, [formData.sub_distributor_id, formData.start_date, formData.end_date]);

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

  // 🧮 CALCULATION LOGIC
  const calculateTotals = () => {
    const platformDeduction = formData.platform_applicable ? (formData.txn_count * formData.txn_rate) : 0;
    const opsDeduction = formData.ops_applicable ? (formData.client_count * formData.ops_rate_pm * formData.duration_months) : 0;
    const netCommission = formData.gross_commission - platformDeduction - opsDeduction;
    const tdsDeduction = formData.tds_applicable ? (netCommission * (formData.tds_rate_percent / 100)) : 0;
    const netPayout = netCommission - tdsDeduction + formData.previous_balance;

    return {
      platformDeduction,
      opsDeduction,
      netCommission,
      tdsDeduction,
      netPayout
    };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch('https://visionbridge-backend.onrender.com/api/sub-distributors/invoices', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ ...formData, net_payout: totals.netPayout })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Invoice Generated Successfully!");
        fetchInitialData();
      }
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const handleMarkPaid = async (id) => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch(`https://visionbridge-backend.onrender.com/api/sub-distributors/invoices/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status: 'Paid' })
      });
      if (res.ok) {
        toast.success("Payment Recorded!");
        fetchInitialData();
      }
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">SYNCHRONIZING INVOICE ENGINE...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-600" /> COMMISSION SETTLEMENT
          </h1>
          <p className="text-slate-500 text-sm font-medium">Generate professional invoices for sub-distributors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: CONFIGURATION FORM */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <RefreshCw size={16} className={previewLoading ? "animate-spin" : ""} /> Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sub-Distributor</label>
                <select 
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold"
                  value={formData.sub_distributor_id}
                  onChange={(e) => setFormData({...formData, sub_distributor_id: e.target.value})}
                >
                  <option value="">Select Distributor</option>
                  {subDistributors.map(sd => <option key={sd.id} value={sd.id}>{sd.name} ({sd.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                  <input type="date" className="w-full p-2 rounded-lg border text-sm" onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
                  <input type="date" className="w-full p-2 rounded-lg border text-sm" onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Slab Category</label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold" onChange={(e) => setFormData({...formData, slab_name: e.target.value})}>
                  {SLABS.map(s => <option key={s.id} value={s.name}>{s.name} - {s.desc}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gross Commission (Manual)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                  <input 
                    type="number" 
                    className="w-full p-2.5 pl-8 rounded-xl border border-slate-200 font-bold text-sm"
                    value={formData.gross_commission}
                    onChange={(e) => setFormData({...formData, gross_commission: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              {/* TOGGLES */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Platform Charges</span>
                  <input type="checkbox" checked={formData.platform_applicable} onChange={(e) => setFormData({...formData, platform_applicable: e.target.checked})} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Operational Exp.</span>
                  <input type="checkbox" checked={formData.ops_applicable} onChange={(e) => setFormData({...formData, ops_applicable: e.target.checked})} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Apply TDS (5%)</span>
                  <input type="checkbox" checked={formData.tds_applicable} onChange={(e) => setFormData({...formData, tds_applicable: e.target.checked})} />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={!formData.sub_distributor_id || !formData.gross_commission}
                className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save size={18} /> GENERATE INVOICE
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: PROFESSIONAL INVOICE PREVIEW */}
        <div className="lg:col-span-8">
          <div id="invoice-printable" className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xl min-h-[800px] flex flex-col">
            
            {/* INVOICE HEADER */}
            <div className="flex justify-between border-b-2 border-slate-100 pb-8 mb-8">
              <div>
                <h2 className="text-xl font-black text-indigo-600 tracking-tighter">VisionBridge Ventures</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">(MF Distribution)</p>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Invoice</h1>
                <p className="text-sm font-bold text-slate-500">#{formData.invoice_no}</p>
              </div>
            </div>

            {/* INFO GRID */}
            <div className="grid grid-cols-2 gap-12 mb-12">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Invoiced To:</h4>
                <p className="font-black text-slate-800 text-lg">
                  {subDistributors.find(sd => sd.id == formData.sub_distributor_id)?.name || "---"}
                </p>
                <p className="text-sm font-bold text-slate-500">
                  {subDistributors.find(sd => sd.id == formData.sub_distributor_id)?.location || "Location Not Set"}
                </p>
              </div>
              <div className="text-right">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Period:</h4>
                <p className="font-bold text-slate-800">
                  {formData.start_date || 'N/A'} <span className="text-slate-300 mx-2">to</span> {formData.end_date || 'N/A'}
                </p>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">Slab: {formData.slab_name}</p>
              </div>
            </div>

            {/* CALCULATION TABLE */}
            <div className="flex-grow">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="text-center py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metric</th>
                    <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="py-5 font-bold text-slate-800 text-sm">Gross Commission Received</td>
                    <td className="py-5 text-center text-slate-400 font-bold text-xs">Self Declared</td>
                    <td className="py-5 text-right font-black text-slate-800">{formatINR(formData.gross_commission)}</td>
                  </tr>
                  {formData.platform_applicable && (
                    <tr className="text-rose-500">
                      <td className="py-5 font-bold text-sm">(-) Platform Transaction Charges</td>
                      <td className="py-5 text-center font-bold text-xs">{formData.txn_count} txns @ ₹{formData.txn_rate}</td>
                      <td className="py-5 text-right font-black">- {formatINR(totals.platformDeduction)}</td>
                    </tr>
                  )}
                  {formData.ops_applicable && (
                    <tr className="text-rose-500">
                      <td className="py-5 font-bold text-sm">(-) Operational Expenses</td>
                      <td className="py-5 text-center font-bold text-xs">{formData.client_count} clients ({formData.duration_months} mo)</td>
                      <td className="py-5 text-right font-black">- {formatINR(totals.opsDeduction)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50">
                    <td className="py-4 px-4 font-black text-slate-800 text-sm">Net Commission (Before TDS)</td>
                    <td></td>
                    <td className="py-4 px-4 text-right font-black text-slate-800">{formatINR(totals.netCommission)}</td>
                  </tr>
                  {formData.tds_applicable && (
                    <tr className="text-slate-500">
                      <td className="py-5 font-bold text-sm italic">(-) TDS Deduction</td>
                      <td className="py-5 text-center font-bold text-xs">{formData.tds_rate_percent}% on Net</td>
                      <td className="py-5 text-right font-black">- {formatINR(totals.tdsDeduction)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-5 font-bold text-slate-800 text-sm italic">Previous Balance Carryforward</td>
                    <td className="py-5 text-center text-slate-400 font-bold text-xs">Pending Invoices</td>
                    <td className="py-5 text-right font-black text-slate-800">+ {formatINR(formData.previous_balance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* FINAL PAYOUT BOX */}
            <div className="mt-8 border-t-2 border-slate-100 pt-8 flex justify-end">
              <div className="bg-indigo-600 text-white p-6 rounded-2xl min-w-[300px] shadow-xl shadow-indigo-100">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Final Net Payout</p>
                <h2 className="text-3xl font-black">{formatINR(totals.netPayout)}</h2>
              </div>
            </div>

            <div className="mt-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              This is a computer generated invoice and doesn't require signature. <br />
              VisionBridge Ventures © {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT INVOICES LIST (Edit/Paid Logic) */}
      <div className="mt-12 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Recent Settlement History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Partner</th>
                <th className="p-4">Period</th>
                <th className="p-4">Payout</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-black text-slate-800">{inv.invoice_no}</td>
                  <td className="p-4 font-bold text-slate-600">{inv.sd_name}</td>
                  <td className="p-4 text-xs font-medium text-slate-500">
                    {new Date(inv.start_date).toLocaleDateString()} - {new Date(inv.end_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-black text-indigo-600">{formatINR(inv.net_payout)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {inv.status !== 'Paid' && (
                      <button onClick={() => handleMarkPaid(inv.id)} className="text-emerald-600 font-bold text-xs hover:underline flex items-center gap-1 ml-auto">
                        <CheckCircle size={14} /> MARK AS PAID
                      </button>
                    )}
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