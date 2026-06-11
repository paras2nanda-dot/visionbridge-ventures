/* eslint-disable no-unused-vars */
import { pool } from '../config/db.js';

export const getChartsData = async () => {
  // 1. Fetch Client Demographics (Handling both DOB columns)
  const clientData = await pool.query(`
    SELECT 
      added_by, sourcing, sourcing_type, risk_profile, investment_experience,
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, COALESCE(dob, date_of_birth))) as age
    FROM clients
  `);

  // 2. Fetch AUM Splits (SIP vs Transaction) - Filtered for Active SIPs & Past Dates
  const aumData = await pool.query(`
    SELECT 
      (SELECT COALESCE(SUM(amount::NUMERIC * (
          GREATEST(0, (EXTRACT(YEAR FROM AGE(LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), start_date)) * 12 + 
          EXTRACT(MONTH FROM AGE(LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), start_date)) + 1))
      )), 0) 
      FROM sips WHERE LOWER(status) = 'active' AND start_date <= CURRENT_DATE) as sip_aum,
      
      (SELECT COALESCE(SUM(CASE 
          WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN amount::NUMERIC 
          WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -amount::NUMERIC 
          ELSE 0 END), 0) 
      FROM transactions WHERE transaction_date <= CURRENT_DATE) as trans_aum
  `);

  // 3. Age Buckets for AUM (Handles COALESCE age, Active SIPs, & Past Dates)
  const ageAumData = await pool.query(`
    WITH client_total_aum AS (
      SELECT 
        c.id,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, COALESCE(c.dob, c.date_of_birth))) as age,
        COALESCE((
            SELECT SUM(CASE 
                WHEN LOWER(TRIM(transaction_type)) IN ('purchase', 'switch in', 'switch_in', 'sip installment') THEN amount::NUMERIC 
                WHEN LOWER(TRIM(transaction_type)) IN ('redemption', 'switch out', 'switch_out', 'sip missed') THEN -amount::NUMERIC 
                ELSE 0 END) 
            FROM transactions WHERE client_id::TEXT = c.id::TEXT AND transaction_date <= CURRENT_DATE
        ), 0) +
        COALESCE((
            SELECT SUM(amount::NUMERIC * (
                GREATEST(0, (EXTRACT(YEAR FROM AGE(LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), start_date)) * 12 + 
                EXTRACT(MONTH FROM AGE(LEAST(CURRENT_DATE, COALESCE(end_date, CURRENT_DATE)), start_date)) + 1))
            )) 
            FROM sips WHERE client_id::TEXT = c.id::TEXT AND LOWER(status) = 'active' AND start_date <= CURRENT_DATE
        ), 0) as total_invested
      FROM clients c
    )
    SELECT 
      CASE 
        WHEN age < 25 THEN 'Below 25'
        WHEN age BETWEEN 25 AND 30 THEN '25-30'
        WHEN age BETWEEN 31 AND 35 THEN '31-35'
        WHEN age BETWEEN 36 AND 40 THEN '36-40'
        WHEN age BETWEEN 41 AND 50 THEN '41-50'
        WHEN age BETWEEN 51 AND 60 THEN '51-60'
        WHEN age >= 61 THEN 'Above 60'
        ELSE 'Age Not Set'
      END as name,
      SUM(total_invested) as value
    FROM client_total_aum
    WHERE age IS NOT NULL
    GROUP BY 1
    ORDER BY name ASC
  `);

  // 📈 4. STOCK-STYLE TREND DATA
  // 🟢 THE FIX: Safely passing 0 as sip_growth to prevent missing DB column crash
  const trendData = await pool.query(`
    SELECT 
      snapshot_date as raw_date,
      total_invested as invested_aum,
      total_market_value as market_value_aum,
      0 as sip_growth, 
      actual_commission as commission
    FROM monthly_analytics
    ORDER BY snapshot_date ASC
  `);

  // --- HELPERS ---
  const formatPie = (rows, key) => {
    const counts = rows.reduce((acc, row) => {
      const val = row[key] || 'Not Set';
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  };

  const ageCountBuckets = () => {
    const buckets = { 'Below 25': 0, '25-30': 0, '31-35': 0, '36-40': 0, '41-50': 0, '51-60': 0, 'Above 60': 0 };
    clientData.rows.forEach(r => {
      if (r.age === null) return;
      if (r.age < 25) buckets['Below 25']++;
      else if (r.age <= 30) buckets['25-30']++;
      else if (r.age <= 35) buckets['31-35']++;
      else if (r.age <= 40) buckets['36-40']++;
      else if (r.age <= 50) buckets['41-50']++;
      else if (r.age <= 60) buckets['51-60']++;
      else buckets['Above 60']++;
    });
    return Object.keys(buckets).map(name => ({ name, value: buckets[name] }));
  };

  return {
    category1: {
      addedBy: formatPie(clientData.rows, 'added_by'),
      sourcing: formatPie(clientData.rows, 'sourcing'),
      sourcingType: formatPie(clientData.rows, 'sourcing_type'),
      riskProfile: formatPie(clientData.rows, 'risk_profile'),
      investmentExp: formatPie(clientData.rows, 'investment_experience'),
      ageBucketsCount: ageCountBuckets()
    },
    category2: {
      sipVsTrans: [
        { name: 'SIP AUM', value: parseFloat(aumData.rows[0].sip_aum) },
        { name: 'Transaction AUM', value: parseFloat(aumData.rows[0].trans_aum) }
      ],
      ageBucketsAum: ageAumData.rows.map(r => ({ name: r.name, value: parseFloat(r.value) }))
    },
    trends: trendData.rows.map(r => ({
      timestamp: new Date(r.raw_date).getTime(),
      invested_aum: parseFloat(r.invested_aum),
      market_value_aum: parseFloat(r.market_value_aum),
      sip_growth: parseFloat(r.sip_growth),
      commission: parseFloat(r.commission)
    }))
  };
};