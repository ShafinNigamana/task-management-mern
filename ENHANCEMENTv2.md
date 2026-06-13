# FUTURE_ENHANCEMENTS - VERSION 2

This document captures features and business logic that are required for a production-ready task management SaaS platform, combining both the original core expansion goals (V1) and advanced collaboration ideas (V2).

---

# Current Project Scope

The implemented system currently supports:
* Authentication (Login / Signup)
* JWT Authorization & Role-Based access control
* Protected Routes
* Dashboard
* Teams List
* Team Kanban Board (Drag and Drop status updates)
* Activity Feed (MySQL Audit Logs)
* Reports Dashboard (Recharts & CSV Export)
* Audit Logging (MySQL actions)

---

# Core Expansion Goals (V1 - Purely Local & Self-Contained)

## 1. Team Management Module
* **Future Work**: Managers should be able to create teams, edit team names, delete teams, and add/remove members from the frontend.
* **Suggested UI**: Sidebar links for creation, Add Member Modals in Team Details page.

## 2. Team Membership Restrictions
* **Future Work**: Restrict visibility so that users can only view teams they belong to (or manage).
* **Backend Logic**: Update `GET /api/teams` to filter by membership array.

## 3. Task Creation Module
* **Future Work**: Frontend UI to create tasks under specific teams.
* **Suggested UI**: A "Create Task" button on the Kanban board heading that opens a task creation modal form (Title, Description, Assignee, Priority, Due Date).

## 4. Task Assignment Workflow
* **Future Work**: Interface for managers to assign/reassign tasks and inspect user workloads.

## 5. Team-Based Task Visibility
* **Future Work**: Ensure that users can only fetch or modify tasks belonging to teams they have membership in.
* **Backend Logic**: Enforce strict query ownership checks in task middlewares.

## 6. User Management Module
* **Future Work**: Admin/Manager console to search users, view lists, and update roles.

## 7. Team Invitations
* **Future Work**: Flow to invite users to teams via in-app invitations (Manager -> Send Invite -> User Accepts -> Added).

## 8. Comments System
* **Future Work**: Discussion threads on tasks for team feedback and issue coordination.

## 9. File Attachments (Local Disk Storage)
* **Future Work**: Uploading attachments (PDFs, images, docs) to task cards. Files are stored directly on the server's local disk space (e.g. `/uploads` directory).
* **V2 Move**: Cloud file storage (AWS S3, Cloudinary) is moved to V2.

## 10. Notifications (In-App Only)
* **Future Work**: Real-time or polled in-app notifications (bell icon alert menu) for task assignment, status updates, and due dates.
* **V2 Move**: SMTP Email delivery (Nodemailer, SendGrid) is moved to V2.

## 11. Advanced Reports
* **Future Work**: Add metrics like average resolution times and individual productivity graphs.
* **V2 Move**: External SLA compliance reporting is moved to V2.

## 12. Audit Log Improvements
* **Future Work**: Audit additional events like logins, logouts, team lifecycle changes, and membership additions.

## 13. Role Hierarchy Expansion
* **Future Work**: Add hierarchical roles: `super_admin` > `manager` > `team_lead` > `member`. Enforced locally in `restrictTo` middleware.

## 14. Security Enhancements
* **Future Work**: Implement Refresh Tokens, Session Listings, and Account Lockouts.
* **V2 Move**: Email-based Password Resets and Email Verification are moved to V2.

## 15. Production Readiness
* **Future Work**: Add Docker setups, local automated testing, API rate limiting, and standard error log files.
* **V2 Move**: External SaaS error monitoring (Sentry, Datadog) is moved to V2.

---

# Advanced SaaS & External Enhancements (V2)

## 16. Task Dependencies & Subtask Checklists
* **Future Work**:
  * **Subtasks**: Nested checkbox lists inside tasks with a progress percentage bar.
  * **Dependencies**: Block task transitions to "Done" if blocked by an uncompleted dependency task.

## 17. Real-Time Collaboration (WebSockets)
* **Future Work**:
  * **Instant sync**: Board changes, feed events, and updates broadcast instantly via Socket.io.
  * **Co-Presence**: Show avatars of team members currently viewing the same Kanban board.

## 18. Integrated Time Tracking
* **Future Work**: A stopwatch feature on task cards to log active development time and generate timesheets.

## 19. Interface Personalization & Dark Mode
* **Future Work**: LocalStorage-saved Theme toggles enabling light, dark, and system-default layouts.

## 20. AI Task Copilot
* **Future Work**: Auto-drafting task templates from titles and providing managers with weekly Standup digests of team activity.

## 21. External & Cloud Services Integration (Moved from V1)
* **AWS S3 / Cloudinary**: Cloud-based file storage for task attachments to replace local server file directories.
* **Nodemailer / SendGrid**: Email notifications for notifications (due dates, assignments) and password reset/email verification flows.
* **Sentry / Datadog**: Professional SaaS error logs, application performance monitoring (APM), and health tracking.
