/* eslint-disable no-unused-vars */
import { pool } from "../config/db.js";

/**
 * 🔍 ENTITY MAPPER
 * Normalizes request paths to standard Audit Entity types.
 */
const entityFromPath = (path) => {
  const p = path.toLowerCase();
  if (p.includes("clients")) return "CLIENT";
  if (p.includes("mf-schemes") || p.includes("schemes")) return "MF_SCHEME";
  if (p.includes("transactions")) return "TRANSACTION";
  if (p.includes("sips")) return "SIP";
  if (p.includes("sub-distributors")) return "SUB_DISTRIBUTOR";
  if (p.includes("reports")) return "REPORT";
  if (p.includes("auth")) return "SECURITY";
  return "SYSTEM";
};

const auditMiddleware = (req, res, next) => {
  const method = req.method;

  // 🛡️ Log only mutations: ADD (POST), EDIT (PUT), DELETE (DELETE)
  if (!["POST", "PUT", "DELETE"].includes(method)) {
    return next();
  }

  // We use the "finish" event to ensure we only log successful actions
  res.on("finish", async () => {
    try {
      // 🛡️ Don't log failed attempts or validation errors
      if (res.statusCode >= 400) return;

      const action =
        method === "POST" ? "ADD" : 
        method === "PUT"  ? "EDIT" : "DELETE";

      const entityType = entityFromPath(req.originalUrl);
      const performedBy = req.user?.username || "system";

      /**
       * 🛡️ FIX: ID CAPTURE LOGIC
       * 1. For EDIT/DELETE: ID is usually in req.params.id.
       * 2. For ADD: ID might be in req.body.id if using UUIDs, 
       * otherwise it's null (logged as a new entry).
       */
      const entityId = req.params?.id || req.body?.id || null;

      await pool.query(
        `INSERT INTO audit_logs 
          (entity_type, entity_id, action, performed_by, performed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          entityType,
          entityId,
          action,
          performedBy
        ]
      );
    } catch (err) {
      // Log error to console but don't crash the server
      console.error("❌ Audit Logging Failure:", err.message);
    }
  });

  next();
};

export default auditMiddleware;