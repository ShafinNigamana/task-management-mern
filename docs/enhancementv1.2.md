# TaskSphere v1.2 Scope Reference Document

This reference document defines the complete feature set, database schemas, API endpoints, frontend views, and file layouts planned for the **TaskSphere v1.2 (Collaboration & Advanced Reporting)** release.

---

## 1. Task Discussions & Comments

### Purpose
Allows team members and managers to write and read chronologically sorted updates directly on a task detail panel, encouraging communication inside the task context.

### Files Involved
* **Backend Model**: [Comment.js](file:///d:/MyProject/task-management-mern/server/src/models/Comment.js)
* **Backend Controller**: [commentController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/commentController.js)
* **Backend Routes**: [commentRoutes.js](file:///d:/MyProject/task-management-mern/server/src/routes/commentRoutes.js)
* **Frontend Service**: [commentService.js](file:///d:/MyProject/task-management-mern/client/src/services/commentService.js)
* **Frontend Component**: [TaskDetailModal.jsx](file:///d:/MyProject/task-management-mern/client/src/components/TaskDetailModal.jsx) (Comments pane)

### Database Changes
Creates the Mongoose `comments` collection:
```javascript
const commentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
```

### API Endpoints
* `POST /api/tasks/:taskId/comments` -> Create a comment
* `GET /api/tasks/:taskId/comments` -> Retrieve task comment timeline

---

## 2. In-App Notifications & Alerts

### Purpose
Triggers local alerts to notify users when tasks are assigned to them or when they are mentioned in comment discussion threads.

### Files Involved
* **Backend Model**: [Notification.js](file:///d:/MyProject/task-management-mern/server/src/models/Notification.js)
* **Backend Controller**: [notificationController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/notificationController.js)
* **Backend Routes**: [notificationRoutes.js](file:///d:/MyProject/task-management-mern/server/src/routes/notificationRoutes.js)
* **Frontend Service**: [notificationService.js](file:///d:/MyProject/task-management-mern/client/src/services/notificationService.js)
* **Frontend Component**: [NotificationBell.jsx](file:///d:/MyProject/task-management-mern/client/src/components/NotificationBell.jsx) (mounted in [MainLayout.jsx](file:///d:/MyProject/task-management-mern/client/src/layouts/MainLayout.jsx))

### Database Changes
Creates the Mongoose `notifications` collection:
```javascript
const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
  },
  {
    timestamps: true,
  }
);
```

### API Endpoints
* `GET /api/notifications` -> Fetch unread notifications for active user
* `PATCH /api/notifications/:id/read` -> Toggle single notification read status
* `POST /api/notifications/read-all` -> Mark all active user's notifications as read

---

## 3. Local File Attachments

### Purpose
Allows users to upload relevant project items (documents, screenshots) directly onto task cards. Files are stored on the server's filesystem under `./uploads` and served statically.

### Files Involved
* **Upload Middleware**: [upload.js](file:///d:/MyProject/task-management-mern/server/src/middleware/upload.js) (Configured with `multer`)
* **Task Schema Updater**: [Task.js](file:///d:/MyProject/task-management-mern/server/src/models/Task.js)
* **Task Attachment Controller**: [taskController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/taskController.js) (Upload receiver method)
* **Task Routes Mount**: [taskRoutes.js](file:///d:/MyProject/task-management-mern/server/src/routes/taskRoutes.js)
* **Frontend Dialog**: [TaskDetailModal.jsx](file:///d:/MyProject/task-management-mern/client/src/components/TaskDetailModal.jsx)

### Database Changes
Modifies the Mongoose `Task` model to include a nested array schema:
```javascript
attachments: [
  {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }
]
```

### API Endpoints
* `POST /api/tasks/:id/attachments` -> Upload file (Multipart form)
* `GET /uploads/:filename` -> Statically served file download route (via `express.static` in [app.js](file:///d:/MyProject/task-management-mern/server/src/app.js))

---

## 4. Manager Password Override Control

### Purpose
Allows team managers to instantly reset a team member's login credentials in cases of lockout, while writing an audit event for security tracking.

### Files Involved
* **Backend Routes**: [userRoutes.js](file:///d:/MyProject/task-management-mern/server/src/routes/userRoutes.js)
* **Backend Controller**: [authController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/authController.js) (Reset callback override)
* **Frontend Interface**: [TeamDetailPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Teams/TeamDetailPage.jsx) (Member lists settings)

### Database Changes
None (overwrites target user `passwordHash` in `User` collection).

### API Endpoints
* `POST /api/users/:id/reset-password` -> Hashes input password and updates database document record. Restricted strictly to users with the `'manager'` role.

---

## 5. Advanced Dashboard Reports

### Purpose
Improves analytical tools by presenting Average Task Resolution time gauges and a stacked bar breakdown chart of completed vs. active tasks across distinct teams.

### Files Involved
* **Reports Controller**: [reportController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/reportController.js)
* **Reports Dashboard View**: [ReportsPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Reports/ReportsPage.jsx)

### Database Changes
None.

### Calculations & APIs
* `GET /api/reports` -> Compiled aggregation object containing:
  * **Average Resolution Duration**: Evaluates the completion difference:
    ```javascript
    // Average hours calculation
    const doneTasks = await Task.find({ status: 'done', teamId: { $in: teamIds } });
    const totalHours = doneTasks.reduce((sum, task) => {
      const diffMs = task.updatedAt - task.createdAt;
      return sum + (diffMs / (1000 * 60 * 60));
    }, 0);
    const avgResolutionHours = doneTasks.length ? (totalHours / doneTasks.length) : 0;
    ```
  * **Team Productivity Stack**: Grouping aggregation counting `'done'` and other active statuses per team, mapped client-side to a Recharts `<BarChart>` component.
