# Backend API (Member 2)

All routes answer JSON. Login is a signed httpOnly cookie named "session".

| Method | Route | Who | Returns |
|---|---|---|---|
| POST | /api/auth/login | anyone | body {email, password} -> {user} or 401 |
| POST | /api/auth/logout | anyone | {ok:true} |
| GET | /api/auth/me | logged in | {user:{id,name,email,role,specialization}} or 401 |
| GET | /api/projects | logged in | {projects:[{id,name,clientName,description,deadline,manager:{id,name},taskCount}]} (filtered by role) |
| GET | /api/projects/:id | logged in | {project, tasks} or 404 if not allowed |
| GET | /api/tasks | logged in | {tasks:[... with project info]} (agent: only theirs) |
| GET | /api/tasks?projectId=ID | logged in | {tasks} filtered by role, 404 if project not allowed |
| GET | /api/team | logged in | {team:[{id,name,role,specialization,skills}]} |

## For the AI teammate
```ts
import { requireAdmin } from "@/lib/auth";
import { getDirectory } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const { user, error } = await requireAdmin();
if (error) return error;                 // blocks non-admins
const directory = await getDirectory();  // id, name, role, skills (no passwords)
```
Use prisma.$transaction([...]) to save projects + tasks together.

## Setup after git pull
npm install
copy .env.example to .env
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
