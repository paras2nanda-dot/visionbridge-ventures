import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

// 🟢 Fetch all families for the frontend dropdown
export const getFamilies = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM families ORDER BY family_name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getClients = async (req, res) => {
  try {
    // Join with families table to include family_name in the response
    const query = `
      SELECT c.*, f.family_name 
      FROM clients c 
      LEFT JOIN families f ON c.family_id = f.id 
      ORDER BY c.client_code ASC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createClient = async (req, res) => {
  const c = req.body;
  const username = req.user?.username || "System";
  const dbClient = await pool.connect(); // Use a dedicated client for transaction

  try {
    await dbClient.query('BEGIN');
    const dobValue = c.date_of_birth || c.dob || null;
    let finalFamilyId = c.family_id;

    // 1. Handle New Family Creation
    if (c.family_type === 'new') {
      const famName = c.family_name || `${c.full_name} Family`;
      const famRes = await dbClient.query(
        'INSERT INTO families (family_name) VALUES ($1) RETURNING id',
        [famName]
      );
      finalFamilyId = famRes.rows[0].id;
      c.family_role = 'HEAD';
    }

    // 2. Handle Single Head Logic: Auto-demote existing head if this one is Head
    if (c.family_role === 'HEAD' && finalFamilyId) {
      await dbClient.query(
        "UPDATE clients SET family_role = 'MEMBER' WHERE family_id = $1 AND family_role = 'HEAD'",
        [finalFamilyId]
      );
    }

    const query = `
      INSERT INTO clients (
        client_code, full_name, dob, onboarding_date, added_by, 
        sourcing, sourcing_type, mobile_number, monthly_income, risk_profile, 
        investment_experience, pan, aadhaar, nominee_name, nominee_relation, 
        nominee_mobile, notes, email, external_source_name, sub_distributor_id, 
        family_id, family_role, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, true) 
      RETURNING *`;
    
    const values = [
      c.client_code, c.full_name, dobValue, c.onboarding_date, c.added_by,
      c.sourcing, c.sourcing_type, c.mobile_number, 
      c.monthly_income ? c.monthly_income.toString().replace(/,/g, '') : null, 
      c.risk_profile, c.investment_experience, c.pan, c.aadhaar, 
      c.nominee_name, c.nominee_relation, c.nominee_mobile, c.notes, c.email,
      c.external_source_name || null,
      c.sub_distributor_id || null,
      finalFamilyId,
      c.family_role || 'MEMBER'
    ];

    const result = await dbClient.query(query, values);
    const newClient = result.rows[0];

    // --- 🟢 REVIEW MODULE INTEGRATION (PHASE-1) ---

    // 1. Auto-schedule Client Review: 30 days after onboarding date
    const clientReviewDate = new Date(newClient.onboarding_date || new Date());
    clientReviewDate.setDate(clientReviewDate.getDate() + 30);

    await dbClient.query(
        `INSERT INTO review_schedules (entity_type, client_id, next_review_date) 
         VALUES ('CLIENT', $1, $2)`,
        [newClient.id, clientReviewDate]
    );

    // 2. Auto-schedule Family Review: Triggered when the 2nd member is added
    if (finalFamilyId) {
        const countRes = await dbClient.query("SELECT COUNT(*) FROM clients WHERE family_id = $1", [finalFamilyId]);
        const memberCount = parseInt(countRes.rows[0].count);

        if (memberCount === 2) {
            const familyReviewDate = new Date();
            familyReviewDate.setDate(familyReviewDate.getDate() + 30);
            
            // We use ON CONFLICT to prevent duplicate schedules for the same family
            await dbClient.query(
                `INSERT INTO review_schedules (entity_type, family_id, next_review_date) 
                 VALUES ('FAMILY', $1, $2)
                 ON CONFLICT (family_id) DO NOTHING`,
                [finalFamilyId, familyReviewDate]
            );
        }
    }

    await dbClient.query('COMMIT');

    await logActivity(
        username, 
        'CREATE', 
        newClient.full_name, 
        `✨ New client record established for ${newClient.full_name} (${newClient.client_code}). Review cycle initialized.`,
        null, 
        newClient
    );

    res.status(201).json(newClient);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    dbClient.release();
  }
};

export const updateClient = async (req, res) => {
  const { id } = req.params;
  const c = req.body;
  const username = req.user?.username || "System";
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');
    const oldRes = await dbClient.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (oldRes.rows.length === 0) throw new Error("Client not found");
    const oldData = oldRes.rows[0];

    const dobValue = c.date_of_birth || c.dob || null;
    const cleanIncome = c.monthly_income?.toString().replace(/,/g, '') || null;

    // Requirement: If user is HEAD, they can rename the family master record
    if (c.family_role === 'HEAD' && c.family_name && c.family_id) {
        await dbClient.query(
          'UPDATE families SET family_name = $1 WHERE id = $2',
          [c.family_name, c.family_id]
        );

        // Auto-demote any other head in this family to ensure only ONE head
        await dbClient.query(
          "UPDATE clients SET family_role = 'MEMBER' WHERE family_id = $1 AND family_role = 'HEAD' AND id != $2",
          [c.family_id, id]
        );
    }

    const query = `
      UPDATE clients SET 
        client_code=$1, full_name=$2, dob=$3, onboarding_date=$4, added_by=$5, 
        sourcing=$6, sourcing_type=$7, mobile_number=$8, monthly_income=$9, 
        risk_profile=$10, investment_experience=$11, pan=$12, aadhaar=$13, 
        nominee_name=$14, nominee_relation=$15, nominee_mobile=$16, notes=$17, 
        email=$18, external_source_name=$19, sub_distributor_id=$20, 
        family_id=$21, family_role=$22, is_active=true 
      WHERE id=$23 RETURNING *`;
    
    const values = [
      c.client_code, c.full_name, dobValue, c.onboarding_date, c.added_by, 
      c.sourcing, c.sourcing_type, c.mobile_number, cleanIncome, 
      c.risk_profile, c.investment_experience, c.pan, c.aadhaar, 
      c.nominee_name, c.nominee_relation, c.nominee_mobile, c.notes, c.email, 
      c.external_source_name || null,
      c.sub_distributor_id || null,
      c.family_id,
      c.family_role,
      id
    ];
    
    const result = await dbClient.query(query, values);
    const newData = result.rows[0];

    // --- 🟢 REVIEW MODULE INTEGRATION (PHASE-1) ---
    // If family was changed and user is now the 2nd member, trigger family review scheduling
    if (newData.family_id && oldData.family_id !== newData.family_id) {
        const countRes = await dbClient.query("SELECT COUNT(*) FROM clients WHERE family_id = $1", [newData.family_id]);
        const memberCount = parseInt(countRes.rows[0].count);

        if (memberCount === 2) {
            const familyReviewDate = new Date();
            familyReviewDate.setDate(familyReviewDate.getDate() + 30);
            
            await dbClient.query(
                `INSERT INTO review_schedules (entity_type, family_id, next_review_date) 
                 VALUES ('FAMILY', $1, $2)
                 ON CONFLICT (family_id) DO NOTHING`,
                [newData.family_id, familyReviewDate]
            );
        }
    }

    await dbClient.query('COMMIT');
    const detailMsg = `Updated profile and family role (${newData.family_role}) for ${newData.full_name}.`;
    await logActivity(username, 'UPDATE', newData.full_name, detailMsg, oldData, newData);

    res.json(newData);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    dbClient.release();
  }
};

export const deleteClient = async (req, res) => {
  const { id } = req.params;
  const username = req.user?.username || "System";
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');
    const clientData = await dbClient.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (clientData.rows.length === 0) throw new Error("Not found");
    const deletedRecord = clientData.rows[0];
    const { family_id, family_role } = deletedRecord;

    // 1. Delete the client record
    await dbClient.query('DELETE FROM clients WHERE id = $1', [id]);

    // 2. Handle Family cleanup or promotion
    const remainingRes = await dbClient.query(
      'SELECT id FROM clients WHERE family_id = $1 ORDER BY created_at ASC',
      [family_id]
    );

    if (remainingRes.rows.length > 0) {
      // Requirement: Promote oldest member if Head was deleted
      if (family_role === 'HEAD') {
        const oldestMemberId = remainingRes.rows[0].id;
        await dbClient.query(
          "UPDATE clients SET family_role = 'HEAD' WHERE id = $1",
          [oldestMemberId]
        );
      }
    } else {
      // Requirement: No members left, delete the family master record
      await dbClient.query('DELETE FROM families WHERE id = $1', [family_id]);
    }

    await dbClient.query('COMMIT');
    await logActivity(
        username, 
        'DELETE', 
        deletedRecord.full_name, 
        `🗑️ Client record permanently purged. Family re-organized.`,
        deletedRecord,
        null
    );
    
    res.json({ message: 'Deleted' });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
};

export const bulkDeleteClients = async (req, res) => {
  const { ids } = req.body;
  const username = req.user?.username || "System";
  try {
    for (const id of ids) {
        // We reuse the delete logic per ID to ensure family promotion rules trigger correctly
        await deleteClient({ params: { id }, user: req.user }, { json: () => {}, status: () => ({ json: () => {} }) });
    }
    res.json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};