# Implementation Plan: V1 Core Scope Enhancements

This document captures the design decisions, data models, and step-by-step rollout plan for implementing the V1 future enhancements locally and self-contained, avoiding external third-party service dependencies.

---

## Scope & Architectural Decisions

To keep the application simple to run and test locally, all features use internal components instead of external services:

1. **Local File Attachments**:
   * **Implementation**: We will configure a local storage folder (e.g., `./server/uploads`) and use the `multer` middleware on the Express server to receive files. Files will be served statically via `express.static`.
   * **Relocated to V2**: AWS S3 and Cloudinary cloud bucket integrations.

2. **In-App Notification Feed**:
   * **Implementation**: A new Mongoose model (`Notification`) will track alerts. The frontend client will fetch notifications via polling (or local state) and render them in a header alert panel.
   * **Relocated to V2**: SMTP and Nodemailer/SendGrid email integration.

3. **Local Password Modification**:
   * **Implementation**: Password updates will be performed by administrators/managers directly editing credentials via user management dashboards, or via authenticated profile settings.
   * **Relocated to V2**: Email-based verification links and forgot-password flows.

4. **Production Logging**:
   * **Implementation**: Winston and Morgan log outputs will be written to local rotating daily log files (`.log`).
   * **Relocated to V2**: Sentry / Datadog APM setups.

---

## Database Schemas (V1 Additions)

### 1. Comment Model (`server/src/models/Comment.js`)
Stores discussions on specific tasks:
```javascript
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Comment', commentSchema);
```

### 2. Notification Model (`server/src/models/Notification.js`)
Stores in-app alerts for users:
```javascript
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_OVERDUE'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Notification', notificationSchema);
```

---

## Phased Implementation Plan

### Phase 1: Team & User Administration (Modules 1, 2, 6, 7)
* **API Changes**:
  * Modify `GET /api/teams` to filter results based on user enrollment.
  * Add `GET /api/users` supporting query searches (Managers only).
* **Frontend UI**:
  * Add a "Manage Teams" menu inside [TeamsPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Teams/TeamsPage.jsx) to Create/Edit/Delete teams.
  * Add member rosters and membership modification controllers to [TeamDetailPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Teams/TeamDetailPage.jsx).

### Phase 2: Task Operations & Team Boundaries (Modules 3, 4, 5)
* **API Changes**:
  * Create task verification middleware ensuring users can only read/edit tasks from teams they belong to.
* **Frontend UI**:
  * Add a "Create Task" button/modal to [TeamDetailPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Teams/TeamDetailPage.jsx) supporting title, description, assignee selection, priorities, and dates.

### Phase 3: Task Attachments & In-App Discussions (Modules 8, 9, 10)
* **API Changes**:
  * Create `POST /api/tasks/:id/comments` and `GET /api/tasks/:id/comments`.
  * Add a file upload API endpoint (`POST /api/tasks/:id/attachments`) using `multer` writing to server filesystem folders.
  * Create `GET /api/notifications` and `PATCH /api/notifications/:id` for user alert queues.
* **Frontend UI**:
  * Expand Kanban cards to open a detail view overlay modal when clicked.
  * Add comment strings, local upload buttons, and file attachment lists inside the card detail overlay.
  * Add a notification badge bell icon to the MainLayout header navigation bar.

### Phase 4: Extended Auditing, Session Lists, & Role Hierarchies (Modules 12, 13, 14)
* **API Changes**:
  * Track `LOGIN`, `LOGOUT`, and `TEAM_MODIFIED` events in MySQL `auditLogger`.
  * Support token validation hierarchies inside the `restrictTo` middleware.
  * Add `/api/auth/sessions` listing and revoking active user token sessions.

### Phase 5: Containerization & rate-limiting (Module 15)
* **API Changes**: Add API request limits using `express-rate-limit`.
* **Infrastructure**: Create custom `Dockerfile` templates and a multi-container `docker-compose.yml` linking Mongo, Node, and MySQL.

---

## Verification Plan

### Automated Checks
* Execute tests ensuring user limits and authentication scoping are fully verified.
* Verify Docker builds: `docker-compose build`.

### Manual Checks
1. Login as Member A, verify they cannot see other teams' tasks.
2. Login as Manager A, create team, assign task to Member A.
3. Verify Member A gets an in-app notification and can write comments on the task.
4. Verify attachments upload to the server folder and are downloadble.
