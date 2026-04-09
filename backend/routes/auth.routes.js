// Inside loginUser in auth.service.js
const result = await pool.query(
  `SELECT * FROM users WHERE LOWER(username) = LOWER($1)`,
  [username]
);