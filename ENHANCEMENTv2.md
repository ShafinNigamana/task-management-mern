# Version 2 SaaS Scale & Architecture Roadmap

This document outlines the detailed architectural designs, database schemas, and event structures planned for the Version 2 (SaaS) migration of the Team Task Management Platform.

---

## 1. Collaborative Real-Time Synchronization (WebSockets)

### WebSocket Server Integration
* **Protocol**: Integrate `socket.io` inside `server/src/server.js` by wrapping the standard Express HTTP server.
* **Namespaces & Rooms**: Map socket rooms to Team IDs:
  ```javascript
  io.on('connection', (socket) => {
    socket.on('join:team', (teamId) => {
      socket.join(teamId);
    });
  });
  ```

### Real-Time Broadcast Events
When task modifications or discussions occur, the backend will emit events to the target Team room:
* `task:created`: Broadcasts new task document metadata to instantly add a card on active client boards.
* `task:moved`: Emits event containing `{ taskId, sourceStatus, targetStatus }` to synchronize drag-and-drop movements for users currently viewing the same board.
* `comment:added`: Emits `{ commentId, taskId, authorName, text }` to append comments to open detail panels without manual refresh.
* `presence:update`: Emits the list of user profile initials currently viewing the same team namespace. Client updates a top-right visual avatar list.

---

## 2. Task Dependencies & Checklists (V2 Models)

### Subtask Checklist Subdocument
Add checking arrays directly inside the task database schema:
* **Task Schema Update**:
  ```javascript
  subtasks: [
    {
      title: { type: String, required: true },
      isCompleted: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ]
  ```
* **Frontend Component**: Displays subtask lists on cards as `(completedCount / totalCount)`. Checking a box triggers a `PATCH` update, recalculating a progress bar.

### Task Dependencies Linkages
Allows linking blocking tasks to other tasks:
* **Task Schema Update**:
  ```javascript
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
  ```
* **Backend State Blocker (Middleware)**:
  Before transitioning status from `'in-progress'` to `'done'`, a pre-save check verifies if all referenced dependency tasks are in a `'done'` status. If any are incomplete, it rejects the update with `400 Task blocked by parent task dependency`.

---

## 3. stopwatch Time Tracking

### Time Log Array Schema
Tracks time spent on tasks by developer:
* **Task Schema Update**:
  ```javascript
  timeLogs: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      startAt: { type: Date, required: true },
      endAt: { type: Date },
      durationSeconds: { type: Number, default: 0 }
    }
  ]
  ```
* **Timer Operations API**:
  * `POST /api/tasks/:id/time/start`: Creates a time log entry with `startAt = Date.now()`. Rejects if a timer is already active.
  * `POST /api/tasks/:id/time/stop`: Sets `endAt = Date.now()`, computes the delta in seconds, adds it to `durationSeconds`, and recalculates the task's total accumulated time.

---

## 4. Cloud Infrastructure Migrations

### AWS S3 / Cloudinary File Storage
Replaces local server storage `./uploads`:
* **AWS SDK Integrations**: Use `@aws-sdk/client-s3` and `multer-s3` in the backend upload middleware.
* **Upload Mechanism**: File streams pipe directly to an S3 bucket. Access endpoints saved to database records point to Cloudfront CDN or S3 URLs.

### Nodemailer / SendGrid Email Notifications
* **SMTP Client**: Set up a nodemailer transport or SendGrid API client wrapper.
* **Background Worker**: Offload email processing to a background message broker (like Redis-backed `bull-mq`) to send transactional notifications (e.g. task due warning digests, password reset links).

### Sentry Exception Logs
* **Instrumentation**: Integrate `@sentry/node` on the server and `@sentry/react` on the client.
* **Error Handling**: Connect Sentry's request handlers before standard router middlewares to log server exception stacks.

---

## 5. Docker Containers Deployment (Production Scaling)

### Server Dockerfile
Multi-stage build compiling Express dependencies:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
RUN npm install -g pnpm && pnpm install --filter server...
COPY server/ ./server/
RUN pnpm --filter server build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/server ./server
EXPOSE 5000
CMD ["node", "server/src/server.js"]
```

### Client Dockerfile & Nginx Proxy
A multi-stage Docker build compiling Vite assets and serving them via Nginx:
* **Nginx Configuration**: Configures Nginx to listen on port 80, serving static build output, and proxies `/api` endpoints to backend upstream endpoints to prevent CORS issues.

### Orchestration (`docker-compose.yml`)
Spins up the complete container environment:
* `mongodb`: Containerized local MongoDB database.
* `mysql`: MySQL container holding audit database tables.
* `server`: Task manager backend service.
* `client`: Client frontend container running Nginx, exposed on port 80.
