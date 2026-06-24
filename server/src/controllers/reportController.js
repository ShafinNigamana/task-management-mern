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
        statusDistribution: [],
        priorityBreakdown: [],
        teamWorkload: [],
        memberWorkload: []
      });
    }

    const oldestTeam = managedTeams.reduce((oldest, current) => {
      return new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest;
    }, managedTeams[0]);
    const teamIds = managedTeams.map((t) => t._id.toString());
    const teamObjectIds = managedTeams.map((t) => t._id);

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

    // 1. Metric 1: Tasks Closed & Created Per Week (MySQL)
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

    const [createdRows] = await pool.query(`
      SELECT 
        YEARWEEK(created_at, 1) AS week,
        COUNT(*) AS created_count
      FROM audit_log
      WHERE action = 'CREATE_TASK'
        AND team_id IN (?)
      GROUP BY YEARWEEK(created_at, 1)
      ORDER BY week DESC
    `, [teamIds]);

    const closedMap = new Map(closedRows.map((r) => [Number(r.week), r.closed_count]));
    const createdMap = new Map(createdRows.map((r) => [Number(r.week), r.created_count]));
    const weeksList = generateContiguousWeeks(oldestDate);
    const tasksClosedPerWeek = weeksList
      .map((yw, index) => ({
        week: index + 1, // Relative week starting from 1
        closed_count: closedMap.get(yw) || 0,
        created_count: createdMap.get(yw) || 0,
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

    // 4. Metric 4: Status Distribution (MongoDB)
    const statusDistribution = await Task.aggregate([
      { $match: { teamId: { $in: teamObjectIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 5. Metric 5: Priority Breakdown (MongoDB)
    const priorityBreakdown = await Task.aggregate([
      { $match: { teamId: { $in: teamObjectIds } } },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    // 6. Metric 6: Team Workload (MongoDB)
    const teamWorkload = await Task.aggregate([
      { $match: { teamId: { $in: teamObjectIds } } },
      {
        $group: {
          _id: "$teamId",
          todo: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "teams",
          localField: "_id",
          foreignField: "_id",
          as: "teamDetails"
        }
      },
      {
        $unwind: {
          path: "$teamDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$teamDetails.name", "Unknown Team"] },
          todo: 1,
          inProgress: 1,
          done: 1,
          total: 1
        }
      }
    ]);

    // 7. Metric 7: Member Workload (MongoDB)
    const memberWorkload = await Task.aggregate([
      {
        $match: {
          teamId: { $in: teamObjectIds },
          status: { $ne: "done" },
          assigneeId: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$assigneeId",
          activeCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$userDetails.name", "Unassigned"] },
          activeCount: 1
        }
      },
      { $sort: { activeCount: -1 } },
      { $limit: 8 }
    ]);

    return res.status(200).json({
      tasksClosedPerWeek,
      topContributors,
      overdueRate: {
        totalActive,
        overdue,
        rate,
      },
      statusDistribution,
      priorityBreakdown,
      teamWorkload,
      memberWorkload
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
      csvContent += 'Tasks Closed & Created Per Week,, \n';
      csvContent += ',, \n';
      csvContent += 'Top Contributors,, \n';
      csvContent += ',, \n';
      csvContent += 'Overdue Rate,, \n';
      csvContent += 'Overdue Rate,Total Active Tasks,0\n';
      csvContent += 'Overdue Rate,Overdue Tasks,0\n';
      csvContent += 'Overdue Rate,Overdue Percentage,0.0%\n';
      csvContent += ',, \n';
      csvContent += 'Task Status Distribution,, \n';
      csvContent += ',, \n';
      csvContent += 'Priority Breakdown,, \n';
      csvContent += ',, \n';
      csvContent += 'Team Workload,, \n';
      csvContent += ',, \n';
      csvContent += 'Member Workload,, \n';

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=report-metrics.csv');
      return res.send(csvContent);
    }

    const oldestTeam = managedTeams.reduce((oldest, current) => {
      return new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest;
    }, managedTeams[0]);
    const teamIds = managedTeams.map((t) => t._id.toString());
    const teamObjectIds = managedTeams.map((t) => t._id);

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

    // 1. Fetch Weekly Tasks Closed & Created
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

    const [createdRows] = await pool.query(`
      SELECT 
        YEARWEEK(created_at, 1) AS week,
        COUNT(*) AS created_count
      FROM audit_log
      WHERE action = 'CREATE_TASK'
        AND team_id IN (?)
      GROUP BY YEARWEEK(created_at, 1)
      ORDER BY week DESC
    `, [teamIds]);

    const closedMap = new Map(closedRows.map((r) => [Number(r.week), r.closed_count]));
    const createdMap = new Map(createdRows.map((r) => [Number(r.week), r.created_count]));
    const weeksList = generateContiguousWeeks(oldestDate);
    const tasksClosedPerWeek = weeksList
      .map((yw, index) => ({
        week: index + 1,
        closed_count: closedMap.get(yw) || 0,
        created_count: createdMap.get(yw) || 0,
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

    // 4. Status Distribution
    const statusDistribution = await Task.aggregate([
      { $match: { teamId: { $in: teamObjectIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 5. Priority Breakdown
    const priorityBreakdown = await Task.aggregate([
      { $match: { teamId: { $in: teamObjectIds } } },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    // 6. Team Workload
    const teamWorkload = await Task.aggregate([
      { $match: { teamId: { $in: teamObjectIds } } },
      {
        $group: {
          _id: "$teamId",
          todo: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "teams",
          localField: "_id",
          foreignField: "_id",
          as: "teamDetails"
        }
      },
      {
        $unwind: {
          path: "$teamDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$teamDetails.name", "Unknown Team"] },
          todo: 1,
          inProgress: 1,
          done: 1,
          total: 1
        }
      }
    ]);

    // 7. Member Workload
    const memberWorkload = await Task.aggregate([
      {
        $match: {
          teamId: { $in: teamObjectIds },
          status: { $ne: "done" },
          assigneeId: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$assigneeId",
          activeCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$userDetails.name", "Unassigned"] },
          activeCount: 1
        }
      },
      { $sort: { activeCount: -1 } },
      { $limit: 8 }
    ]);

    // Generate CSV content
    let csvContent = 'Section,Metric,Value\n';
    
    // Add Weekly Trend Section
    csvContent += 'Tasks Weekly Trend,, \n';
    tasksClosedPerWeek.forEach(row => {
      csvContent += `Tasks Weekly Trend,Week ${row.week} Created,${row.created_count} tasks\n`;
      csvContent += `Tasks Weekly Trend,Week ${row.week} Closed,${row.closed_count} tasks\n`;
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
    csvContent += 'Overdue Rate & Task Health,, \n';
    csvContent += `Overdue Rate,Total Active Tasks,${totalActive}\n`;
    csvContent += `Overdue Rate,Overdue Tasks,${overdue}\n`;
    csvContent += `Overdue Rate,Overdue Percentage,${(rate * 100).toFixed(1)}%\n`;
    csvContent += ',, \n'; // separator row

    // Add Task Status Distribution Section
    csvContent += 'Task Status Distribution,, \n';
    statusDistribution.forEach(row => {
      csvContent += `Status Distribution,${row._id},${row.count} tasks\n`;
    });
    csvContent += ',, \n'; // separator row

    // Add Priority Breakdown Section
    csvContent += 'Priority Breakdown,, \n';
    priorityBreakdown.forEach(row => {
      csvContent += `Priority Breakdown,${row._id},${row.count} tasks\n`;
    });
    csvContent += ',, \n'; // separator row

    // Add Team Workload Section
    csvContent += 'Team Workload,, \n';
    teamWorkload.forEach(row => {
      csvContent += `Team Workload,${row.name} (Todo),${row.todo} tasks\n`;
      csvContent += `Team Workload,${row.name} (In Progress),${row.inProgress} tasks\n`;
      csvContent += `Team Workload,${row.name} (Done),${row.done} tasks\n`;
      csvContent += `Team Workload,${row.name} (Total),${row.total} tasks\n`;
    });
    csvContent += ',, \n'; // separator row

    // Add Member Workload Section
    csvContent += 'Member Workload,, \n';
    memberWorkload.forEach((row, index) => {
      csvContent += `Member Workload,#${index + 1} ${row.name},${row.activeCount} active tasks\n`;
    });

    // Send CSV as a stream/attachment
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=report-metrics.csv');
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting report metrics:', error);
    return res.status(500).json({ message: 'Internal server error while exporting metrics' });
  }
};
