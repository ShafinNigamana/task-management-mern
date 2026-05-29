import { createMySQLPool } from '../config/mysql.js';

let isTableInitialized = false;

const initAuditTable = async (pool) => {
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
 * @param {object} payload - Relevant payload data snapshot
 */
export const logAudit = async (action, actorId, taskId, payload) => {
  try {
    const pool = createMySQLPool();
    await initAuditTable(pool);
    
    const query = `
      INSERT INTO audit_log (action, actor_id, target_id, payload_json)
      VALUES (?, ?, ?, ?)
    `;
    
    const safePayload = payload ? JSON.stringify(payload) : null;
    const safeActorId = actorId || 'SYSTEM';
    const safeTaskId = taskId || 'UNKNOWN';

    await pool.execute(query, [action, safeActorId, safeTaskId, safePayload]);
  } catch (error) {
    console.error(`Audit Logging Failed [${action}]:`, error.message);
  }
};
