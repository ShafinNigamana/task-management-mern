# TaskSphere v2.0 Scope Reference Document

This reference document defines the complete architectural design, database schemas, API structures, and container models planned for the **TaskSphere v2.0 (SaaS scale & Real-Time Sync)** release.

---

## 1. Stateful JWT Rotation & Active Device Sessions

### Purpose
Implements stateless credentials combined with a stateful session verification system to enable active device listing, token rotation (Access Token: 15 mins, Refresh Token: 7 days), silent Axios interceptor token fetches, and device session revocation.

### Files Involved
* **Backend Model**: [Session.js](file:///d:/MyProject/task-management-mern/server/src/models/Session.js)
* **Backend Controller**: [authController.js](file:///d:/MyProject/task-management-mern/server/src/controllers/authController.js) (Login/logout/refresh logic)
* **Backend Route**: [auth.js](file:///d:/MyProject/task-management-mern/server/src/routes/auth.js)
* **Frontend View**: [SessionsPage.jsx](file:///d:/MyProject/task-management-mern/client/src/pages/Auth/SessionsPage.jsx)
* **Frontend Interceptor**: [api.js](file:///d:/MyProject/task-management-mern/client/src/services/api.js) (Axios Queue)

### Database Changes
Creates the Mongoose `sessions` collection:
```javascript
const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceOs: { type: String },
    browser: { type: String },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '7d' }, // Auto-cleans expired database rows
    },
  },
  {
    timestamps: true,
  }
);
```

### API Endpoints
* `POST /api/auth/refresh-token` -> Decodes and rotates tokens, replacing session rows.
* `GET /api/auth/sessions` -> Retrieves list of active device records.
* `DELETE /api/auth/sessions/:id` -> Instantly revokes session tokens, logging out target browser.
* `POST /api/auth/logout` -> Destroys active refresh database session row.

---

## 2. Weighted Hierarchical Roles

### Purpose
Transition from a binary permission system (`'manager'`, `'member'`) to a weighted roles hierarchy (`'super_admin'`, `'manager'`, `'team_lead'`, `'member'`) where higher weight levels automatically inherit lower weighted rules.

### Files Involved
* **Auth Guard Middleware**: [auth.js](file:///d:/MyProject/task-management-mern/server/src/middleware/auth.js)
* **User Model**: [User.js](file:///d:/MyProject/task-management-mern/server/src/models/User.js) (Updated Enum values)

### Implementation Mechanics
Define integer weights inside the authorization middleware:
```javascript
const ROLE_WEIGHTS = {
  member: 1,
  team_lead: 2,
  manager: 3,
  super_admin: 4,
};

export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'member';
    const userWeight = ROLE_WEIGHTS[userRole] || 0;
    
    // Check if user has weight >= the minimum required role weight
    const minRequiredWeight = Math.min(...allowedRoles.map(role => ROLE_WEIGHTS[role] || 99));
    
    if (userWeight >= minRequiredWeight) {
      return next();
    }
    
    return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
  };
};
```

---

## 3. Real-Time Board Synchronization (WebSockets)

### Purpose
Ensures instant interface updates across different developer machines without manual browser refreshes when kanban cards are moved, comments added, or team members edit.

### Technology Stack
* **Server-side**: `socket.io`
* **Client-side**: `socket.io-client`

### Synchronization Flows
```
Client A (Drag-and-Drop) -> POST /api/tasks/:id/update (DB Save)
                                  │
                                  ▼
WebSocket Server -> Emits event 'task:moved' to Room [TeamId]
                                  │
                                  ▼
Client B (Subscribed) -> Re-renders Kanban Columns dynamically
```

---

## 4. Task Dependencies & Subtask Checklists

### Purpose
Enables locking task completions until blocker items are fully resolved. Integrates subtask checklists directly inside detailed cards.

### Database Changes
Applies schema updates to Mongoose `Task` model:
```javascript
// Subtask nested schema
subtasks: [
  {
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }
],
// Dependencies references
dependencies: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }
]
```

### Pre-Save Validation Middleware
Runs a Mongoose schema hook before transitioning tasks to `'done'`:
```javascript
taskSchema.pre('save', async function (next) {
  if (this.isModified('status') && this.status === 'done') {
    const incompleteBlockers = await mongoose.model('Task').countDocuments({
      _id: { $in: this.dependencies },
      status: { $ne: 'done' }
    });
    if (incompleteBlockers > 0) {
      return next(new Error('Task is blocked by incomplete dependency tasks'));
    }
  }
  next();
});
```

---

## 5. stopwatch Time Tracking

### Purpose
Allows developers to record time spent on tasks, using start/stop stopwatch actions.

### Database Changes
Applies schema updates to Mongoose `Task` model:
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

### API Endpoints
* `POST /api/tasks/:id/time/start` -> Initializes log segment where `startAt = Date.now()`
* `POST /api/tasks/:id/time/stop` -> Assigns `endAt = Date.now()`, records the duration seconds delta, and updates the task aggregates.

---

## 6. S3 File Storage & SendGrid Transactional Emails

### AWS S3 Upload Pipeline
Refactors [upload.js](file:///d:/MyProject/task-management-mern/server/src/middleware/upload.js) from local filesystem disk writes to cloud uploads. Utilizes `@aws-sdk/client-s3` and `multer-s3` streams, storing bucket paths.

### BullMQ Background Workers
Sets up Redis background processing queues (`bullmq`) to send asynchronous email alerts via SendGrid API clients when:
* Tasks are overdue.
* Deadlines are approaching.
* Managers initiate password resets.

---

## 7. Container Orchestration (Docker Config)

### Docker Compose Layout
Organizes development environment microservices:
```yaml
version: '3.8'

services:
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - server

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://db:27017/task_db
      - PORT=5000
    depends_on:
      - db

  db:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```
