import { createMySQLPool } from '../config/mysql.js';
import { initAuditTable } from '../utils/auditLogger.js';
import Team from '../models/Team.js';

export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { teamId } = req.query;

    // Fetch teams user has visibility access to
    const userTeams = await Team.find({
      $or: [
        { managerId: req.user.id },
        { members: req.user.id }
      ]
    });
    const teamIds = userTeams.map((t) => t._id.toString());

    if (teamId && !teamIds.includes(teamId)) {
      return res.status(403).json({ message: "Forbidden: You do not have access to this team's audit logs" });
    }

    const pool = createMySQLPool();
    await initAuditTable(pool);

    let countQuery = 'SELECT COUNT(*) as total FROM audit_log';
    let logsQuery = 'SELECT id, action, actor_id, target_id, team_id, payload_json, created_at FROM audit_log';
    const queryParams = [];

    if (teamId) {
      countQuery += ' WHERE team_id = ?';
      logsQuery += ' WHERE team_id = ?';
      queryParams.push(teamId);
    } else {
      if (teamIds.length === 0) {
        return res.status(200).json({
          page,
          limit,
          total: 0,
          logs: [],
        });
      }
      countQuery += ' WHERE team_id IN (?)';
      logsQuery += ' WHERE team_id IN (?)';
      queryParams.push(teamIds);
    }

    // Get total count for pagination
    const [countRows] = await pool.query(countQuery, queryParams);
    const total = countRows[0].total;

    // Get recent audit logs with pagination
    logsQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const [logs] = await pool.query(logsQuery, [...queryParams, limit, offset]);

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
