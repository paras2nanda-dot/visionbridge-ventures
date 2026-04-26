// 🟢 FIX: Used named import { pool } to match your db.js configuration
import { pool } from "../config/db.js";

const entityFromPath = (path) => {
  if (path.includes("clients")) return "CLIENT";
  if (path.includes("mf-schemes") || path.includes("schemes")) return "MF_SCHEME";
  if (path.includes("transactions")) return "TRANSACTION";
  if (path.includes("sips")) return "SIP";
  if (path.includes("dashboard")) return "DASHBOARD";
  if (path.includes("sub-distributors")) return "SUB_DISTRIBUTOR";
  if (path.includes("reports")) return "REPORT";
  return "SYSTEM";
};

const auditMiddleware = (req, res, next) => {
  const method = req.method;

  // Only log mutations (Add, Edit, Delete)
  if (!["POST", "PUT", "DELETE"].includes(method)) {
    return next();
  }

  res.on("finish", async () => {
    try {
      // Don't log failed requests (e.g., 400 or 500 errors)
      if (res.statusCode >= 400) return;

      const action =
        method === "POST"
          ? "ADD"
          : method === "PUT"
          ? "EDIT"
          : "DELETE";

      const entityType = entityFromPath(req.originalUrl);

      /**
       * 🟢 FIX: Use req.user.username set by your authMiddleware.
       * Falls back to "system" for public auth routes if needed.
       */
      const performedBy = req.user?.username || "system";

      // 🟢 CRIT-03 FIX: Aligned query with the audit_logs table schema
      await pool.query(
        `
        INSERT INTO audit_logs 
          (entity_type, entity_id, action, performed_by, performed_at)
        VALUES ($1, $2, $3, $4, NOW())
        `,
        [
          entityType,
          req.body?.id || null, // Captures the ID of the affected record if provided
          action,
          performedBy
        ]
      );
    } catch (err) {
      console.error("❌ Audit log failed:", err.message);
    }
  });

  next();
};

// 🟢 FIX: Exported as default to match your import in backend/index.js
export default auditMiddleware;