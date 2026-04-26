import { pool } from '../config/db.js';
import { logActivity } from './activityController.js';

// ==========================================
// 🛠️ PRIVATE HELPERS
// ==========================================

/**
 * 🛡️ HIGH-03 FIX: CORE DELETION LOGIC
 * Extracted into a helper to be used by both single and bulk delete.
 */
const _deleteClientById = async (dbClient, id, username) => {
    // 1. Get client data for logging and family logic
    const clientData = await dbClient.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (clientData.rows.length === 0) throw new Error(`Client ID ${id} not found`);
    
    const deletedRecord = clientData.rows[0];
    const { family_id, family_role, full_name } = deletedRecord;

    // 2. Delete the client record
    await dbClient.query('DELETE FROM clients WHERE id = $1', [id]);

    // 3. Handle Family cleanup or promotion
    if (family_id) {
        const remainingRes = await dbClient.query(
            'SELECT id FROM clients WHERE family_id = $1 ORDER BY created_at ASC',
            [family_id]
        );

        if (remainingRes.rows.length > 0) {
            // Promote oldest member if Head was deleted
            if (family_role === 'HEAD') {
                const oldestMemberId = remainingRes.rows[0].id;
                await dbClient.query(
                    "UPDATE clients SET family_role = 'HEAD' WHERE id = $1",
                    [oldestMemberId]
                );
            }
        } else {
            // No members left, delete the family master record
            await dbClient.query('DELETE FROM families WHERE id = $1', [family_id]);
        }
    }

    // 4. Log Activity
    await logActivity(
        username, 
        'DELETE', 
        full_name, 
        `🗑️ Client record permanently purged. Family re-organized.`,
        deletedRecord,
        null
    );

    return deletedRecord;
};

// ==========================================
// 👥 CLIENT CONTROLLERS
// ==========================================

export const getFamilies = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM families ORDER BY family_name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🛡️ MED-08 FIX: ADDED PAGINATION
 * Supports 'limit' and 'page' query parameters.
 */
export const getClients = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) FROM clients`;
    const dataQuery = `
      SELECT c.*, f.family_name 
      FROM clients c 
      LEFT JOIN families f ON c.family_id = f.id 
      ORDER BY c.client_code ASC
      LIMIT $1 OFFSET $2`;

    const [countRes, dataRes] = await Promise.all([
        pool.query(countQuery),
        pool.query(dataQuery, [limit, offset])
    ]);

    res.json({
        total_count: parseInt(countRes.rows[0].count),
        page,
        limit,
        data: dataRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createClient = async (req, res) => {
  const c = req.body;
  const username = req.user?.username || "System";
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');
    const dobValue = c.date_of_birth || c.dob || null;
    let finalFamilyId = c.family_id;

    if (c.family_type === 'new') {
      const famName = c.family_name || `${c.full_name} Family`;
      const famRes = await dbClient.query(
        'INSERT INTO families (family_name) VALUES ($1) RETURNING id',
        [famName]
      );
      finalFamilyId = famRes.rows[0].id;
      c.family_role = 'HEAD';
    }

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

    const clientReviewDate = new Date(newClient.onboarding_date || new Date());
    clientReviewDate.setDate(clientReviewDate.getDate() + 30);

    await dbClient.query(
        `INSERT INTO review_schedules (entity_type, client_id, next_review_date) 
         VALUES ('CLIENT', $1, $2)`,
        [newClient.id, clientReviewDate]
    );

    if (finalFamilyId) {
        const countRes = await dbClient.query("SELECT COUNT(*) FROM clients WHERE family_id = $1", [finalFamilyId]);
        const memberCount = parseInt(countRes.rows[0].count);

        if (memberCount === 2) {
            const familyReviewDate = new Date();
            familyReviewDate.setDate(familyReviewDate.getDate() + 30);
            
            await dbClient.query(
                `INSERT INTO review_schedules (entity_type, family_id, next_review_date) 
                 VALUES ('FAMILY', $1, $2)
                 ON CONFLICT (family_id) DO NOTHING`,
                [finalFamilyId, familyReviewDate]
            );
        }
    }

    await dbClient.query('COMMIT');
    await logActivity(username, 'CREATE', newClient.full_name, `✨ New client established: ${newClient.full_name}`, null, newClient);
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

    if (c.family_role === 'HEAD' && c.family_name && c.family_id) {
        await dbClient.query('UPDATE families SET family_name = $1 WHERE id = $2', [c.family_name, c.family_id]);
        await dbClient.query("UPDATE clients SET family_role = 'MEMBER' WHERE family_id = $1 AND family_role = 'HEAD' AND id != $2", [c.family_id, id]);
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
    
    const result = await dbClient.query(query, [c.client_code, c.full_name, dobValue, c.onboarding_date, c.added_by, c.sourcing, c.sourcing_type, c.mobile_number, cleanIncome, c.risk_profile, c.investment_experience, c.pan, c.aadhaar, c.nominee_name, c.nominee_relation, c.nominee_mobile, c.notes, c.email, c.external_source_name || null, c.sub_distributor_id || null, c.family_id, c.family_role, id]);
    const newData = result.rows[0];

    if (newData.family_id && oldData.family_id !== newData.family_id) {
        const countRes = await dbClient.query("SELECT COUNT(*) FROM clients WHERE family_id = $1", [newData.family_id]);
        if (parseInt(countRes.rows[0].count) === 2) {
            const familyReviewDate = new Date();
            familyReviewDate.setDate(familyReviewDate.getDate() + 30);
            await dbClient.query(`INSERT INTO review_schedules (entity_type, family_id, next_review_date) VALUES ('FAMILY', $1, $2) ON CONFLICT (family_id) DO NOTHING`, [newData.family_id, familyReviewDate]);
        }
    }

    await dbClient.query('COMMIT');
    await logActivity(username, 'UPDATE', newData.full_name, `Updated profile for ${newData.full_name}`, oldData, newData);
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
    await _deleteClientById(dbClient, id, username);
    await dbClient.query('COMMIT');
    res.json({ message: 'Deleted' });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
};

/**
 * 🛡️ HIGH-03 FIX: CLEAN BULK DELETE
 * Uses the private helper within a single transaction for atomicity.
 */
export const bulkDeleteClients = async (req, res) => {
  const { ids } = req.body;
  const username = req.user?.username || "System";
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');
    for (const id of ids) {
        await _deleteClientById(dbClient, id, username);
    }
    await dbClient.query('COMMIT');
    res.json({ message: "Success" });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    dbClient.release();
  }
};