import { createMySQLPool } from '../config/mysql.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import mongoose from 'mongoose';

// Helper to get ISO week (YEARWEEK mode 1 equivalent)
function getISOYearWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() * 100 + weekNo;
}

// Helper to generate contiguous yearweeks since oldestDate
function generateContiguousWeeks(oldestDate) {
  const weeksList = [];
  let tempDate = new Date(oldestDate);
  const now = new Date();
  const currentYW = getISOYearWeek(now);
  while (tempDate <= now || getISOYearWeek(tempDate) === currentYW) {
    const yw = getISOYearWeek(tempDate);
    if (!weeksList.includes(yw)) {
      weeksList.push(yw);
    }
    tempDate.setDate(tempDate.getDate() + 7);
  }
  return weeksList;
}

export const getReportMetrics = async (req, res) => {
  try {
    const pool = createMySQLPool();

    // Fetch teams managed by current manager
    const managedTeams = await Team.find({ managerId: req.user.id });
    if (managedTeams.length === 0) {
      return res.status(200).json({
        tasksClosedPerWeek: [],
        topContributors: [],
        overdueRate: {
          totalActive: 0,
          overdue: 0,
          rate: 0,
        },
      });
    }

    const oldestTeam = managedTeams.reduce((oldest, current) => {
      return new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest;
    }, managedTeams[0]);
    const teamIds = managedTeams.map((t) => t._id.toString());

    // Find the oldest MySQL log date for this manager's teams
    const [oldestLogRows] = await pool.query(`
      SELECT MIN(created_at) as oldest_log
      FROM audit_log
      WHERE team_id IN (?)
    `, [teamIds]);
    const oldestLogDate = oldestLogRows[0]?.oldest_log ? new Date(oldestLogRows[0].oldest_log) : null;

    let oldestDate = oldestTeam ? new Date(oldestTeam.createdAt) : new Date();
    if (oldestLogDate && oldestLogDate < oldestDate) {
      oldestDate = oldestLogDate;
    }

    // 1. Metric 1: Tasks Closed Per Week (MySQL)
    const [closedRows] = await pool.query(`
      SELECT 
        YEARWEEK(created_at, 1) AS week,
        COUNT(*) AS closed_count
      FROM audit_log
      WHERE action = 'UPDATE_TASK'
        AND team_id IN (?)
        AND JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.updatedFields.status')) = 'done'
      GROUP BY YEARWEEK(created_at, 1)
      ORDER BY week DESC
    `, [teamIds]);

    const closedMap = new Map(closedRows.map((r) => [Number(r.week), r.closed_count]));
    const weeksList = generateContiguousWeeks(oldestDate);
    const tasksClosedPerWeek = weeksList
      .map((yw, index) => ({
        week: index + 1, // Relative week starting from 1
        closed_count: closedMap.get(yw) || 0,
      }))
      .sort((a, b) => b.week - a.week);

    // 2. Metric 2: Top 5 Contributors (MySQL)
    const [contributorRows] = await pool.query(`
      SELECT actor_id, COUNT(*) AS actions
      FROM audit_log
      WHERE actor_id != 'SYSTEM'
        AND team_id IN (?)
      GROUP BY actor_id
      ORDER BY actions DESC
      LIMIT 5
    `, [teamIds]);

    // Fetch user details for contributors from MongoDB
    const userIds = contributorRows
      .map((row) => row.actor_id)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const users = await User.find({ _id: { $in: userIds } }).select('_id name');
    const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    const topContributors = contributorRows.map((row) => ({
      actor_id: row.actor_id,
      name: userMap.get(row.actor_id) || 'Unknown User',
      actions: row.actions,
    }));

    // 3. Metric 3: Overdue Rate (using MongoDB Task data)
    const totalActive = await Task.countDocuments({ teamId: { $in: teamIds }, status: { $ne: 'done' } });
    const overdue = await Task.countDocuments({
      teamId: { $in: teamIds },
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() },
    });

    const rate = totalActive > 0 ? Number((overdue / totalActive).toFixed(4)) : 0;

    return res.status(200).json({
      tasksClosedPerWeek,
      topContributors,
      overdueRate: {
        totalActive,
        overdue,
        rate,
      },
    });
  } catch (error) {
    console.error('Error fetching report metrics:', error);
    return res.status(500).json({ message: 'Internal server error while compiling report metrics' });
  }
};

export const exportReportMetrics = async (req, res) => {
  try {
    const pool = createMySQLPool();

    // Fetch teams managed by current manager
    const managedTeams = await Team.find({ managerId: req.user.id });
    if (managedTeams.length === 0) {
      let csvContent = 'Section,Metric,Value\n';
      csvContent += 'Tasks Closed Per Week,, \n';
      csvContent += ',, \n';
      csvContent += 'Top Contributors,, \n';
      csvContent += ',, \n';
      csvContent += 'Overdue Rate,, \n';
      csvContent += 'Overdue Rate,Total Active Tasks,0\n';
      csvContent += 'Overdue Rate,Overdue Tasks,0\n';
      csvContent += 'Overdue Rate,Overdue Percentage,0.0%\n';

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=report-metrics.csv');
      return res.send(csvContent);
    }

    const oldestTeam = managedTeams.reduce((oldest, current) => {
      return new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest;
    }, managedTeams[0]);
    const teamIds = managedTeams.map((t) => t._id.toString());

    // Find oldest log for export
    const [oldestLogRows] = await pool.query(`
      SELECT MIN(created_at) as oldest_log
      FROM audit_log
      WHERE team_id IN (?)
    `, [teamIds]);
    const oldestLogDate = oldestLogRows[0]?.oldest_log ? new Date(oldestLogRows[0].oldest_log) : null;

    let oldestDate = oldestTeam ? new Date(oldestTeam.createdAt) : new Date();
    if (oldestLogDate && oldestLogDate < oldestDate) {
      oldestDate = oldestLogDate;
    }

    // 1. Fetch Weekly Closed Tasks
    const [closedRows] = await pool.query(`
      SELECT 
        YEARWEEK(created_at, 1) AS week,
        COUNT(*) AS closed_count
      FROM audit_log
      WHERE action = 'UPDATE_TASK'
        AND team_id IN (?)
        AND JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.updatedFields.status')) = 'done'
      GROUP BY YEARWEEK(created_at, 1)
      ORDER BY week DESC
    `, [teamIds]);

    const closedMap = new Map(closedRows.map((r) => [Number(r.week), r.closed_count]));
    const weeksList = generateContiguousWeeks(oldestDate);
    const tasksClosedPerWeek = weeksList
      .map((yw, index) => ({
        week: index + 1,
        closed_count: closedMap.get(yw) || 0,
      }))
      .sort((a, b) => b.week - a.week);

    // 2. Fetch Top Contributors
    const [contributorRows] = await pool.query(`
      SELECT actor_id, COUNT(*) AS actions
      FROM audit_log
      WHERE actor_id != 'SYSTEM'
        AND team_id IN (?)
      GROUP BY actor_id
      ORDER BY actions DESC
      LIMIT 5
    `, [teamIds]);

    const userIds = contributorRows
      .map((row) => row.actor_id)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const users = await User.find({ _id: { $in: userIds } }).select('_id name');
    const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    // 3. Overdue Rate
    const totalActive = await Task.countDocuments({ teamId: { $in: teamIds }, status: { $ne: 'done' } });
    const overdue = await Task.countDocuments({
      teamId: { $in: teamIds },
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() },
    });
    const rate = totalActive > 0 ? Number((overdue / totalActive).toFixed(4)) : 0;

    // Generate CSV content
    let csvContent = 'Section,Metric,Value\n';
    
    // Add Closed Tasks Section
    csvContent += 'Tasks Closed Per Week,, \n';
    tasksClosedPerWeek.forEach(row => {
      csvContent += `Tasks Closed Per Week,Week ${row.week},${row.closed_count} tasks\n`;
    });
    csvContent += ',, \n'; // separator row

    // Add Top Contributors Section
    csvContent += 'Top Contributors,, \n';
    contributorRows.forEach((row, index) => {
      const name = userMap.get(row.actor_id) || 'Unknown User';
      csvContent += `Top Contributors,#${index + 1} ${name} (${row.actor_id}),${row.actions} actions\n`;
    });
    csvContent += ',, \n'; // separator row

    // Add Overdue Rate Section
    csvContent += 'Overdue Rate,, \n';
    csvContent += `Overdue Rate,Total Active Tasks,${totalActive}\n`;
    csvContent += `Overdue Rate,Overdue Tasks,${overdue}\n`;
    csvContent += `Overdue Rate,Overdue Percentage,${(rate * 100).toFixed(1)}%\n`;

    // Send CSV as a stream/attachment
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=report-metrics.csv');
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting report metrics:', error);
    return res.status(500).json({ message: 'Internal server error while exporting metrics' });
  }
};
