/* eslint-disable no-unused-vars */
import ExcelJS from 'exceljs';
import { 
  getClientAumReportData, 
  getSchemeAumReportData, 
  getMonthlySipBookData,
  getMonthlyCommissionData,
  getFullClientsDatabaseData,
  getFullSchemeDatabaseData,
  getPartnerClientReportData 
} from '../services/reports.service.js';
import { pool } from '../config/db.js';

/**
 * 🟢 NEW: INDIVIDUAL PARTNER REPORT
 * Used for partner-facing performance reviews.
 */
export const downloadSubDistributorReport = async (req, res) => {
  const { id } = req.params; 
  try {
    const partnerRes = await pool.query('SELECT name FROM sub_distributors WHERE id = $1', [id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ success: false, message: "Partner not found" });
    const partnerName = partnerRes.rows[0].name;

    const data = await getPartnerClientReportData(id);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Client Performance');

    worksheet.columns = [
      { header: 'Client Name', key: 'full_name', width: 25 },
      { header: 'Client Code', key: 'client_code', width: 15 },
      { header: 'Mobile Number', key: 'mobile_number', width: 15 },
      { header: 'Scheme Name', key: 'scheme_name', width: 35 },
      { header: 'Invested AUM (₹)', key: 'invested_aum', width: 20 },
      { header: 'Monthly SIP (₹)', key: 'monthly_sip', width: 20 },
      { header: 'Onboarding Date', key: 'onboarding_date', width: 15 }
    ];

    // VisionBridge Branding (Sky Blue)
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };

    data.forEach(row => worksheet.addRow(row));

    const filename = `${partnerName.replace(/\s+/g, '_')}_Portfolio.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error("Partner Report Controller Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate file." });
  }
};

/**
 * 📊 REPORT 1: CLIENT-WISE AUM
 * Preserves the sub_distributor_name mapping.
 */
export const downloadClientAumReport = async (req, res) => {
  try {
    const data = await getClientAumReportData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('AUM Report');

    worksheet.columns = [
      { header: 'Client ID', key: 'client_id', width: 15 },
      { header: 'Client Name', key: 'client_name', width: 30 },
      { header: 'Sub Distributor', key: 'sub_distributor_name', width: 25 },
      { header: 'Invested AUM (₹)', key: 'invested_aum', width: 20 },
      { header: 'Monthly SIP (₹)', key: 'monthly_active_sip', width: 22 },
      { header: 'Monthly Income (₹)', key: 'monthly_income', width: 20 },
      { header: 'SIP/Income Ratio (%)', key: 'sip_to_income_ratio', width: 25 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Risk Profile', key: 'risk_profile', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="VisionBridge_Client_AUM.xlsx"');

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error("Client AUM Report Error:", error);
    res.status(500).json({ success: false, message: "Export failed." });
  }
};

/**
 * 📊 REPORT 2: SCHEME-WISE AUM
 */
export const downloadSchemeAumReport = async (req, res) => {
  try {
    const data = await getSchemeAumReportData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scheme Analysis');

    worksheet.columns = [
      { header: 'AMC Name', key: 'amc_name', width: 25 },
      { header: 'Scheme Name', key: 'scheme_name', width: 40 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Sub-Category', key: 'sub_category', width: 20 },
      { header: 'Comm. (%)', key: 'commission_percentage', width: 15 },
      { header: 'Invested AUM (₹)', key: 'invested_aum', width: 20 },
      { header: 'Market Value (₹)', key: 'total_market_value', width: 22 },
      { header: 'SIP Book (₹)', key: 'active_sip_book', width: 20 },
      { header: 'Clients', key: 'client_count', width: 15 },
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
    res.setHeader('Content-Disposition', 'attachment; filename="Scheme_Exposure_Report.xlsx"');

    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

/**
 * 📊 REPORT 3: MONTHLY SIP BOOK
 */
export const downloadMonthlySipBookReport = async (req, res) => {
  try {
    const data = await getMonthlySipBookData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('SIP Registry');

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
    res.setHeader('Content-Disposition', 'attachment; filename="Monthly_SIP_Book.xlsx"');

    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

/**
 * 📊 REPORT 4: MONTHLY COMMISSION REPORT
 */
export const downloadMonthlyCommissionReport = async (req, res) => {
  try {
    const data = await getMonthlyCommissionData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Commission Summary');

    worksheet.columns = [
      { header: 'AMC Name', key: 'amc_name', width: 25 },
      { header: 'Scheme Name', key: 'scheme_name', width: 40 },
      { header: 'Invested AUM (₹)', key: 'invested_aum', width: 20 },
      { header: 'Market Value (₹)', key: 'total_market_value', width: 20 },
      { header: 'Comm. Rate (%)', key: 'commission_pct', width: 15 },
      { header: 'Comm. (Invested)', key: 'monthly_comm_invested', width: 25 },
      { header: 'Comm. (Market)', key: 'monthly_comm_market', width: 25 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Commission_Projections.xlsx"');

    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

/**
 * 🗄️ REPORT 5: FULL CLIENTS DATABASE
 * Matches the corrected Service keys (e.g., dob_display, formatted_id)
 */
export const downloadFullClientsDatabase = async (req, res) => {
  try {
    const data = await getFullClientsDatabaseData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Client CRM');

    worksheet.columns = [
      { header: 'Client ID', key: 'formatted_id', width: 12 },
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'DOB', key: 'dob_display', width: 15 },
      { header: 'Onboarding Date', key: 'onboarding_display', width: 18 },
      { header: 'Added By', key: 'added_by', width: 15 },
      { header: 'Mobile', key: 'mobile_number', width: 15 },
      { header: 'Sourcing', key: 'sourcing_display', width: 15 },
      { header: 'Sourcing Type', key: 'sourcing_type', width: 20 },
      { header: 'Sub Distributor', key: 'sub_distributor_name', width: 25 },
      { header: 'External Source', key: 'external_source_name', width: 25 }, 
      { header: 'Monthly Income', key: 'monthly_income', width: 15 },
      { header: 'Experience', key: 'investment_experience', width: 15 },
      { header: 'Risk Profile', key: 'risk_profile', width: 15 },
      { header: 'PAN Card', key: 'pan', width: 15 },
      { header: 'Aadhaar No', key: 'aadhaar', width: 18 },
      { header: 'Email ID', key: 'email', width: 25 },
      { header: 'Nominee Name', key: 'nominee_name', width: 20 },
      { header: 'Nominee Relation', key: 'nominee_relation', width: 15 },
      { header: 'Nominee Mobile', key: 'nominee_mobile', width: 15 },
      { header: 'Internal Notes', key: 'client_notes', width: 30 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Full_Client_Registry.xlsx"');

    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

/**
 * 🗄️ REPORT 6: MF SCHEME DATABASE
 */
export const downloadFullSchemeDatabase = async (req, res) => {
  try {
    const data = await getFullSchemeDatabaseData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scheme Master');

    worksheet.columns = [
      { header: 'AMC Name', key: 'amc_name', width: 25 },
      { header: 'Scheme Name', key: 'scheme_name', width: 40 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Sub-Category', key: 'sub_category', width: 20 },
      { header: 'Comm. Rate (%)', key: 'commission_rate', width: 15 },
      { header: 'Market Value (₹)', key: 'total_current_value', width: 22 },
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
    res.setHeader('Content-Disposition', 'attachment; filename="VisionBridge_Scheme_Master.xlsx"');

    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false });
  }
};