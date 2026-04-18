import ExcelJS from 'exceljs';
import { 
  getClientAumReportData, 
  getSchemeAumReportData, 
  getMonthlySipBookData,
  getMonthlyCommissionData,
  getFullClientsDatabaseData,
  getFullSchemeDatabaseData
} from '../services/reports.service.js';

// --- REPORT 1: CLIENT-WISE AUM ---
export const downloadClientAumReport = async (req, res) => {
  try {
    const data = await getClientAumReportData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Client AUM Report');

    worksheet.columns = [
      { header: 'Client ID', key: 'client_id', width: 15 },
      { header: 'Client Name', key: 'client_name', width: 30 },
      { header: 'Invested AUM (₹)', key: 'invested_aum', width: 20 },
      { header: 'Monthly Active SIP (₹)', key: 'monthly_active_sip', width: 22 },
      { header: 'Monthly Income (₹)', key: 'monthly_income', width: 20 },
      { header: 'SIP to Income Ratio (%)', key: 'sip_to_income_ratio', width: 25 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Risk Profile', key: 'risk_profile', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Client_Invested_AUM_Report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Client Report Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate client report" });
  }
};

// --- REPORT 2: SCHEME-WISE AUM ---
export const downloadSchemeAumReport = async (req, res) => {
  try {
    const data = await getSchemeAumReportData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scheme-wise AUM');

    worksheet.columns = [
      { header: 'AMC Name', key: 'amc_name', width: 25 },
      { header: 'Scheme Name', key: 'scheme_name', width: 40 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Sub-Category', key: 'sub_category', width: 20 },
      { header: 'Commission (%)', key: 'commission_percentage', width: 15 },
      { header: 'Invested AUM (₹)', key: 'invested_aum', width: 20 },
      { header: 'Total Market Value (₹)', key: 'total_market_value', width: 22 },
      { header: 'Active SIP Book (₹)', key: 'active_sip_book', width: 20 },
      { header: 'Client Count', key: 'client_count', width: 15 },
      { header: 'Largecap %', key: 'largecap_pct', width: 12 },
      { header: 'Midcap %', key: 'midcap_pct', width: 12 },
      { header: 'Smallcap %', key: 'smallcap_pct', width: 12 },
      { header: 'Debt %', key: 'debt_pct', width: 12 },
      { header: 'Gold %', key: 'gold_pct', width: 12 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Scheme_wise_AUM_Report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Scheme Report Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate scheme report" });
  }
};

// --- REPORT 3: MONTHLY SIP BOOK ---
export const downloadMonthlySipBookReport = async (req, res) => {
  try {
    const data = await getMonthlySipBookData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly SIP Book');

    worksheet.columns = [
      { header: 'AMC Name', key: 'amc_name', width: 25 },
      { header: 'Scheme Name', key: 'scheme_name', width: 40 },
      { header: 'Active SIP Count', key: 'active_sip_count', width: 20 },
      { header: 'Active SIP Amount (₹)', key: 'active_sip_amount', width: 25 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Monthly_SIP_Book_Report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("SIP Book Report Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate SIP Book report" });
  }
};

// --- REPORT 4: MONTHLY COMMISSION REPORT ---
export const downloadMonthlyCommissionReport = async (req, res) => {
  try {
    const data = await getMonthlyCommissionData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly Commission');

    worksheet.columns = [
      { header: 'AMC Name', key: 'amc_name', width: 25 },
      { header: 'Scheme Name', key: 'scheme_name', width: 40 },
      { header: 'Invested AUM (₹)', key: 'invested_aum', width: 20 },
      { header: 'Total Market Value (₹)', key: 'total_market_value', width: 20 },
      { header: 'Commission (%)', key: 'commission_pct', width: 15 },
      { header: 'Comm. on Invested (Monthly)', key: 'monthly_comm_invested', width: 25 },
      { header: 'Comm. on Market (Monthly)', key: 'monthly_comm_market', width: 25 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Monthly_Commission_Report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Commission Report Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate commission report" });
  }
};

// --- REPORT 5: FULL CLIENTS DATABASE ---
export const downloadFullClientsDatabase = async (req, res) => {
  try {
    const data = await getFullClientsDatabaseData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clients Database');

    worksheet.columns = [
      { header: 'Client ID', key: 'formatted_id', width: 12 },
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'DOB', key: 'dob_display', width: 15 },                // Matches Service Alias
      { header: 'Onboarding Date', key: 'onboarding_display', width: 18 }, // Matches Service Alias
      { header: 'Added By', key: 'added_by', width: 15 },
      { header: 'Mobile', key: 'mobile_number', width: 15 },
      { header: 'Sourcing', key: 'sourcing_display', width: 15 },       // Matches Service Alias
      { header: 'Sourcing Type', key: 'sourcing_type', width: 20 },
      { header: 'External Source Name', key: 'external_source_name', width: 25 }, // 🟢 THE FIX: Added Column
      { header: 'Monthly Income', key: 'monthly_income', width: 15 },
      { header: 'Experience', key: 'investment_experience', width: 15 },
      { header: 'Risk Profile', key: 'risk_profile', width: 15 },
      { header: 'PAN Card', key: 'pan', width: 15 },
      { header: 'Aadhaar No', key: 'aadhaar', width: 18 },
      { header: 'Email ID', key: 'email', width: 25 },
      { header: 'Nominee Name', key: 'nominee_name', width: 20 },
      { header: 'Nominee Relation', key: 'nominee_relation', width: 15 },
      { header: 'Nominee Mobile', key: 'nominee_mobile', width: 15 },
      { header: 'Notes', key: 'client_notes', width: 30 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Full_Clients_Database.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Clients DB Report Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate clients database" });
  }
};

// --- REPORT 6: MF SCHEME DATABASE ---
export const downloadFullSchemeDatabase = async (req, res) => {
  try {
    const data = await getFullSchemeDatabaseData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('MF Schemes Database');

    worksheet.columns = [
      { header: 'AMC Name', key: 'amc_name', width: 25 },
      { header: 'Scheme Name', key: 'scheme_name', width: 40 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Sub-Category', key: 'sub_category', width: 20 },
      { header: 'Comm. Rate (%)', key: 'commission_rate', width: 15 },
      { header: 'Total Market Value (₹)', key: 'total_current_value', width: 22 },
      { header: 'Large Cap (%)', key: 'large_cap', width: 12 },
      { header: 'Mid Cap (%)', key: 'mid_cap', width: 12 },
      { header: 'Small Cap (%)', key: 'small_cap', width: 12 },
      { header: 'Debt (%)', key: 'debt_allocation', width: 12 },
      { header: 'Gold (%)', key: 'gold_allocation', width: 12 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Full_MF_Schemes_Database.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Scheme DB Report Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate scheme database" });
  }
};