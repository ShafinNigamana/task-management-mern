# Version 1 Enhancements: Developer Verification Guide

This document provides a phase-by-phase developer verification guide, mapping the structural and logic differences between the **`main`** branch (initial setup) and this branch (**`feature/enhancement-updates`**). Use this to understand code changes and verify functionality.

---

## Phase 1: Team Scoping & Member Management

### 1. Architectural Differences
* **`main` Branch (Before)**:
  * No membership security boundaries: all authenticated users could view all teams and perform updates.
  * No interface existed on the frontend for creating teams or assigning team members.
  * No search utility existed to discover platform users.
* **`feature/enhancement-updates` (After)**:
  * **Team Catalog Filter**: `GET /api/teams` filters by user role. Managers see teams they create/manage or belong to. Members see only teams they are assigned to.
  * **User Discovery**: Exposes `GET /api/users?search=...` (restricted to managers) performing case-insensitive regex searches on name/email.
  * ** Roster UI**: Added team creation dialog forms and membership manager modals.

### 2. Files Modified / Added
* **[Team.js](file:///d:/MyProject/task-management-mern/server/src/models/Team.js)**: Added `managerId` (ref: `'User'`) to link team ownership.
* **[teamController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/teamController.js)**: Saves `managerId` automatically on creation and applies visibility filters.
* **[authController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/authController.js)**: Implemented `getUsers` case-insensitive regex search.
* **[userRoutes.js](file:///d:/MyProject/task-management-mern/server/src/routes/userRoutes.js)**: *[NEW]* Exposes user search API (restricted to managers).
* **[userService.js](file:///d:/MyProject/task-management-mern/client/src/services/userService.js)**: *[NEW]* Invokes client search API calls.
* **[TeamsPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Teams/TeamsPage.jsx)**: Adds team creation drawer forms (managers only).
* **[TeamDetailPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Teams/TeamDetailPage.jsx)**: Adds "Manage Members" modal roster and searches.

### 3. Developer Verification Steps
1. Log in as a user with a `manager` role.
2. In the sidebar, navigate to **Teams** and click **Create Team**. Set the name and search/add initial members. Verify the team lists you as the manager.
3. Log in as a standard `member` who was not added. Verify the team card is invisible.
4. Log back in as the manager, open the team, click **Manage Members**, search for the member's name, and add them.
5. Log in as the member again. Verify the team card is now visible on their dashboard.

---

## Phase 2: Task Operations & Team Boundaries

### 1. Architectural Differences
* **`main` Branch (Before)**:
  * Tasks were globally accessible: any user could fetch or edit tasks across any team by referencing task IDs.
  * No frontend interface existed to create tasks under teams.
* **`feature/enhancement-updates` (After)**:
  * **Query Visibility Scoping**: The task controllers verify that the requesting user's ID matches the task's parent `teamId.members` list.
  * **Board Task Form**: Integrated board task creation modals, restricting assignees strictly to the team manager and enrolled members.

### 2. Files Modified / Added
* **[taskController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/taskController.js)**: Added ownership verification checks to `createTask` and `getTasksByTeam`.
* **[TeamDetailPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Teams/TeamDetailPage.jsx)**: Mounted the board's "Create Task" button and modal form (Title, Description, Status, Priority, Due Date, Assignee).

### 3. Developer Verification Steps
1. Log in as a manager, open a team's board, and click **Create Task**.
2. Set the details, select a team member from the assignee dropdown, and click submit. Verify the card renders in the **To Do** column.
3. Drag the card to **In Progress** or **Done**. Refresh the browser and verify the status update persists.
4. Try to fetch this task's ID using an authenticated user who is not in the team. Verify the API rejects with a `403 Forbidden` error.

---

## Phase 3: Task Discussion, Local Attachments, & Alerts

### 1. Architectural Differences
* **`main` Branch (Before)**:
  * Tasks did not support comments, file uploads, or notifications.
* **`feature/enhancement-updates` (After)**:
  * **Comments System**: MongoDB comment threads linked to tasks.
  * **Attachments**: Multi-part file uploads (images, PDFs, documents) via `multer` saved to the server's local disk under `./uploads`.
  * **In-App Notifications**: Header notification bell polling alerts (assignments, comment activities) every 5 seconds.

### 2. Files Modified / Added
* **[Comment.js](file:///d:/MyProject/task-management-mern/server/src/models/Comment.js)** & **[Notification.js](file:///d:/MyProject/task-management-mern/server/src/models/Notification.js)**: *[NEW]* DB schemas.
* **[commentController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/commentController.js)**: *[NEW]* Handles comment postings and triggers alerts.
* **[notificationController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/notificationController.js)**: *[NEW]* Handles alert counts and statuses.
* **[upload.js](file:///d:/MyProject/task-management-mern/server/src/middleware/upload.js)**: *[NEW]* Multer local file upload middleware configuration.
* **[TaskDetailModal.jsx](file:///d:/MyProject/task-management-mern/client/src/components/TaskDetailModal.jsx)**: *[NEW]* Task hub detail overlay.
* **[NotificationBell.jsx](file:///d:/MyProject/task-management-mern/client/src/components/NotificationBell.jsx)**: *[NEW]* Polling alert bell dropdown.

### 3. Developer Verification Steps
1. Click on a task card on the board.
2. In the comments section, type a message and submit. Verify it immediately appends to the comment log.
3. Select a file in the file upload area, upload it, and verify the file appears as a downloadable attachment link.
4. In another browser, log in as the task's assignee. Verify the red unread badge appears on the notification bell in the header, and clicking it displays the assignment alert.

---

## Phase 4: Extended Security, Hierarchical Roles, & Active Sessions

### 1. Architectural Differences
* **`main` Branch (Before)**:
  * Used a single, long-lived JWT access token without refresh logic or session storage.
  * Flat user roles (`manager`, `member`) with no access overlap.
  * No active device logs or remote password resets existed.
* **`feature/enhancement-updates` (After)**:
  * **Token Rotation**: Generates short Access Tokens (15m) and rotates Refresh Tokens (7d) stored in a database-backed `Session` collection tracking IP/User-Agent.
  * **Weighted Role Hierarchy**: Checks weights: `super_admin (4) > manager (3) > team_lead (2) > member (1)`. Higher weights inherit permissions.
  * **Devices & Revocation**: Screen listing active user devices with manual session deletion.
  * **Roster Resets**: Direct password updates for members that purge their database session tokens, forcing immediate lockout.

### 2. Files Modified / Added
* **[Session.js](file:///d:/MyProject/task-management-mern/server/src/models/Session.js)**: *[NEW]* Session schemas.
* **[User.js](file:///d:/MyProject/task-management-mern/server/src/models/User.js)**: Expanded `role` enums.
* **[auth.js](file:///d:/MyProject/task-management-mern/server/src/middleware/auth.js)**: Rewrote `restrictTo` to verify numerical weights.
* **[authController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/authController.js)**: Handles session logging, token rotation, and password resets.
* **[api.js](file:///d:/MyProject/task-management-mern/client/src/services/api.js)**: Implemented Axios interceptors to refresh tokens silently.
* **[SessionsPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Auth/SessionsPage.jsx)**: *[NEW]* Devices console.

### 3. Developer Verification Steps
1. Go to the **Sessions** page. Confirm the list displays your current browser, operating system, and IP.
2. Open a separate incognito browser window, log in, and verify that a second session appears on the Sessions page.
3. Click **Revoke** next to the incognito session in the main window. Verify that the incognito session is logged out on its next action.
4. Log in as a manager, open the team roster modal, click the lock icon next to a member, and update their password. Try to perform an action on that member's device and verify they are logged out.

---

## Phase 5: API Rate Limiting & Advanced Metrics

### 1. Architectural Differences
* **`main` Branch (Before)**:
  * No rate limit protections: vulnerable to denial-of-service or brute-force logins.
  * Reports dashboard only displayed static numbers of closed tasks, top contributors, and overdue counts.
* **`feature/enhancement-updates` (After)**:
  * **Abuse Protection**: General limits (100 reqs/15m) and strict auth limits (10 reqs/15m) via `express-rate-limit`.
  * **Average Resolution Time**: MongoDB calculations tracking elapsed done task durations.
  * **stacked completions Chart**: stacked Recharts bar chart comparing completed vs active tasks per team.
  * **CSV Reporting**: Includes resolution hours and team productivity totals in exports.

### 2. Files Modified / Added
* **[rateLimiter.js](file:///d:/MyProject/task-management-mern/server/src/middleware/rateLimiter.js)**: *[NEW]* Rate-limit middlewares.
* **[app.js](file:///d:/MyProject/task-management-mern/server/src/app.js)**: Mounts general and auth-specific limiters.
* **[reportController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/reportController.js)**: Calculates resolution time and team productivity, and formats the CSV export.
* **[ReportsPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Reports/ReportsPage.jsx)**: Renders resolution cards and stacked bar charts.

### 3. Developer Verification Steps
1. Send rapid requests to `/api/auth/login` (more than 10 times in 15 minutes). Verify it rejects with `429 Too Many Requests`.
2. Navigate to **Reports**. Confirm that the **Average Resolution Time** card and **Team Productivity** stacked bar charts render matching calculations.
3. Click **Export CSV** and verify the downloaded spreadsheet contains the new sections.
