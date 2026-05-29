import { createMySQLPool } from '../config/mysql.js';

export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const pool = createMySQLPool();

    // Get total count for pagination
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM audit_log');
    const total = countRows[0].total;

    // Get recent audit logs with pagination
    const [logs] = await pool.query(
      'SELECT id, action, actor_id, target_id, payload_json, created_at FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.status(200).json({
      page,
      limit,
      total,
      logs,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error while fetching audit logs' });
  }
};
