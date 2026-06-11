import { createMySQLPool } from '../config/mysql.js';

let isTableInitialized = false;

export const initAuditTable = async (pool) => {
  if (isTableInitialized) return;
  
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        actor_id VARCHAR(255) NOT NULL,
        target_id VARCHAR(255) NOT NULL,
        payload_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);

    // Safe schema migration: add team_id if it does not exist
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'audit_log' 
        AND COLUMN_NAME = 'team_id' 
        AND TABLE_SCHEMA = DATABASE()
    `);

    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE audit_log ADD COLUMN team_id VARCHAR(255) NULL
      `);
    }

    isTableInitialized = true;
  } catch (error) {
    console.error('Failed to initialize audit_log table:', error.message);
  }
};

/**
 * Logs an audit event to the MySQL database.
 * Fails safely without throwing errors.
 *
 * @param {string} action - The action performed (e.g. 'CREATE_TASK')
 * @param {string} actorId - ID of the user performing the action
 * @param {string} taskId - ID of the task affected
 * @param {string} teamIdOrPayload - The ID of the team, or the payload (for backward compatibility)
 * @param {object} [payload] - Relevant payload data snapshot
 */
export const logAudit = async (action, actorId, taskId, teamIdOrPayload, payload) => {
  try {
    const pool = createMySQLPool();
    await initAuditTable(pool);

    let finalTeamId = null;
    let finalPayload = null;

    if (payload === undefined && typeof teamIdOrPayload === 'object') {
      // Backward compatibility check: if 4 arguments are passed, map 4th to payload
      finalPayload = teamIdOrPayload;
    } else {
      finalTeamId = teamIdOrPayload || null;
      finalPayload = payload || null;
    }
    
    const query = `
      INSERT INTO audit_log (action, actor_id, target_id, team_id, payload_json)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const safePayload = finalPayload ? JSON.stringify(finalPayload) : null;
    const safeActorId = actorId || 'SYSTEM';
    const safeTaskId = taskId || 'UNKNOWN';

    await pool.execute(query, [action, safeActorId, safeTaskId, finalTeamId, safePayload]);
  } catch (error) {
    console.error(`Audit Logging Failed [${action}]:`, error.message);
  }
};
