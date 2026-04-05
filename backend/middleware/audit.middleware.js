import pool from "../config/db.js";

const entityFromPath = (path) => {
  if (path.includes("clients")) return "CLIENT";
  if (path.includes("mf-schemes")) return "MF_SCHEME";
  if (path.includes("transactions")) return "TRANSACTION";
  if (path.includes("sips")) return "SIP";
  if (path.includes("dashboard")) return "DASHBOARD";
  return "SYSTEM";
};

export const auditMiddleware = (req, res, next) => {
  const method = req.method;

  if (!["POST", "PUT", "DELETE"].includes(method)) {
    return next();
  }

  res.on("finish", async () => {
    try {
      if (res.statusCode >= 400) return;

      const action =
        method === "POST"
          ? "ADD"
          : method === "PUT"
          ? "EDIT"
          : "DELETE";

      const entityType = entityFromPath(req.originalUrl);

      const performedBy =
        req.headers["x-user"] || "system";

      await pool.query(
        `
        INSERT INTO audit_logs
          (entity_type, entity_id, action, performed_by, performed_at)
        VALUES ($1, $2, $3, $4, NOW())
        `,
        [
          entityType,
          req.body?.id || null,
          action,
          performedBy
        ]
      );
    } catch (err) {
      console.error("Audit log failed:", err.message);
    }
  });

  next();
};