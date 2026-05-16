/* eslint-disable no-unused-vars */
import { pool } from '../config/db.js';
import { MathService } from '../services/MathService.js';

// 🛡️ Safe Date Parser Helper
const parseSafeDate = (dateStr) => {
  if (!dateStr || String(dateStr).trim() === "") return null;
  if (dateStr instanceof Date) return dateStr;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[2].length === 4) { 
    d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

// 🛡️ Safe Age Calculator Helper
const calculateAge = (dobString) => {
  const birthDate = parseSafeDate(dobString);
  if (!birthDate) return "N/A";
  return Math.floor((new Date() - birthDate) / 31557600000);
};

/**
 * 👤 INDIVIDUAL CLIENT ANALYTICS CONTROLLER (Overwritten & Corrected)
 * Route: GET /api/client-dashboard/:id
 */
export async function getClientDashboard(req, res) {
  try {
    const { id } = req.params; 
    
    if (!id) {
        return res.status(400).json({ success: false, error: "Client ID is required." });
    }

    // 1. Fetch Primary Client Profile data
    const clientRes = await pool.query("SELECT * FROM clients WHERE id::TEXT = $1::TEXT", [id]);
    if (clientRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Client not found" });
    }
    const client = clientRes.rows[0];

    // 2. Fetch Total Business AUM for Book Weight calculations
    const totalBusinessAUM = await MathService.calculateInvestedAUM();

    // 3. Gather Family Group Cohorts
    let familyMembers = [];
    if (client.family_id) {
      const famRes = await pool.query("SELECT * FROM clients WHERE family_id = $1 AND is_active = true", [client.family_id]);
      familyMembers = famRes.rows;
    } else {
      // Standalone clients represent their own household unit size of 1
      familyMembers = [client];
    }

    // 4. Compute Net Invested AUM & Active SIP totals for each Family Member
    let groupAUM = 0;
    let nomineesVerified = true;

    const processedMembers = await Promise.all(familyMembers.map(async (m) => {
      const memberAUM = await MathService.calculateInvestedAUM(m.id);
      groupAUM += memberAUM;

      const sipRes = await pool.query(
        "SELECT COALESCE(SUM(amount::NUMERIC), 0) as monthly_sip FROM sips WHERE client_id::TEXT = $1::TEXT AND LOWER(status) = 'active'", 
        [m.id]
      );
      const monthlySip = parseFloat(sipRes.rows[0]?.monthly_sip || 0);

      // Audit Nominee text lines across the entire household group
      if (!m.nominee_name || m.nominee_name.trim() === '') {
        nomineesVerified = false; 
      }

      return {
        id: m.id,
        full_name: m.full_name,
        client_code: m.client_code,
        role: String(m.id) === String(id) ? "Primary" : "Dependent",
        age: calculateAge(m.dob || m.date_of_birth),
        monthly_sip: monthlySip,
        invested_aum: memberAUM,
        weight: 0 
      };
    }));

    // Finalize individual member weights inside their group pool
    processedMembers.forEach(m => {
      m.weight = groupAUM > 0 ? Number(((m.invested_aum / groupAUM) * 100).toFixed(1)) : 0;
    });

    // 5. Gather Scheme Allocation Weights for Chart Rendering
    const allocationQuery = `
      SELECT 
        m.scheme_name AS name,
        SUM(CASE 
          WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
          WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
          ELSE 0 END) as value
      FROM transactions t
      JOIN mf_schemes m ON t.scheme_id::TEXT = m.id::TEXT
      WHERE t.client_id::TEXT = $1::TEXT
      GROUP BY m.scheme_name
      HAVING SUM(CASE 
        WHEN LOWER(TRIM(t.transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN t.amount::NUMERIC 
        WHEN LOWER(TRIM(t.transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -t.amount::NUMERIC 
        ELSE 0 END) > 0;
    `;
    const allocationRes = await pool.query(allocationQuery, [id]);

    // 6. Format Onboarding Date cleanly to bypass N/A evaluations
    const rawDate = client.onboarding_date || client.created_at;
    const formattedOnboardingDate = rawDate 
      ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
      : "N/A";

    const bookPercentage = totalBusinessAUM > 0 ? Number(((groupAUM / totalBusinessAUM) * 100).toFixed(2)) : 0;

    // 7. Respond with fully synchronized, structured keys that match the frontend
    res.json({
      success: true,
      profile: { 
        ...client, 
        age: calculateAge(client.dob || client.date_of_birth),
        onboarding_date: formattedOnboardingDate,
        nominees_verified: nomineesVerified
      },
      summary: {
        totalAUM: await MathService.calculateInvestedAUM(id),
        group_aum: groupAUM,
        book_percentage: bookPercentage
      },
      family: {
        total_members: familyMembers.length,
        group_aum: groupAUM,
        book_percentage: bookPercentage,
        nominees_verified: nomineesVerified,
        members: processedMembers
      },
      allocation: allocationRes.rows
    });

  } catch (error) {
    console.error("❌ Client Dashboard Controller Error:", error.message);
    res.status(500).json({ 
        success: false, 
        error: "Failed to load comprehensive client profile and family analytics." 
    });
  }
}