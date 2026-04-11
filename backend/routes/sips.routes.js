import express from 'express';
import { getSips, createSip } from '../controllers/sips.controller.js';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/', getSips);
router.post('/', createSip);

// UPDATE SIP
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const s = req.body;
  const user = req.user.username;

  try {
    const query = `
      UPDATE sips SET 
        amount=$1, start_date=$2, end_date=$3, frequency=$4, 
        sip_day=$5, status=$6, platform=$7, notes=$8
      WHERE id=$9 RETURNING *`;
    
    const values = [
      s.amount.toString().replace(/,/g, ''), s.start_date, s.end_date,
      s.frequency, s.sip_day, s.status, s.platform, s.notes, id
    ];

    const result = await pool.query(query, values);

    // 🕒 LOG ACTIVITY
    await pool.query(
      'INSERT INTO activities (user_name, action_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      [user, 'UPDATE', s.sip_id, `Updated SIP ${s.sip_id} for ${s.client_name}`]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE SIP
router.delete('/:id', async (req, res) => {
  const user = req.user.username;
  try {
    // 1. Capture details before they are gone
    const sipData = await pool.query('SELECT sip_id, client_name FROM sips WHERE id = $1', [req.params.id]);
    if (sipData.rows.length === 0) return res.status(404).json({ error: "Not found" });
    
    const { sip_id, client_name } = sipData.rows[0];

    // 2. Delete
    await pool.query('DELETE FROM sips WHERE id = $1', [req.params.id]);

    // 3. 🕒 LOG ACTIVITY
    await pool.query(
      'INSERT INTO activities (user_name, action_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      [user, 'DELETE', sip_id, `Permanently deleted SIP ${sip_id} for ${client_name}`]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;