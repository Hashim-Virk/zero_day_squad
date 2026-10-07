# Comprehensive Implementation Plan: AI Project Manager CRM

## Goal Description
Build a Minimum Viable Product (MVP) of an AI-powered Project Management CRM for "NovaWorks Technologies" in 3 hours. 

**The Workflow:** 
1. Log in via seeded demo accounts.
2. Admin pastes a meeting transcript.
3. AI automatically parses the text to create projects, identify tasks, assign team members, and set deadlines.
4. Users view their restricted dashboards (Admin sees all, Manager sees their projects, Agent sees their tasks).

**Selected Tech Stack (Optimized for Speed):**
We are choosing a unified stack to minimize context switching and configuration overhead during the 3-hour hackathon.
*   **Framework:** **Next.js (App Router)** - Allows building the frontend UI and backend API routes in a single repository. No CORS issues, fast setup.
*   **Styling:** **Tailwind CSS** - For rapid UI development without writing custom CSS files.
*   **Database:** **SQLite via Prisma ORM** - SQLite requires zero database server setup, saving precious hackathon time. Prisma provides an easy schema and type-safe database queries.
*   **AI Provider:** **Google Gemini API** (`@google/genai`) - Excellent context window for transcripts and native support for Structured Outputs (JSON schema) to guarantee the AI returns the exact format we need to save to the database.

## Project Context for the Team
*   **No user registration:** We will hardcode 10 specific demo users (1 Admin, 3 Managers, 6 Agents) using a database seeder.
*   **Role-Based Access:** 
    *   `Admin`: Can see all projects, team directory, and has the exclusive ability to paste transcripts.
    *   `Manager`: Can only see projects where they are the `managerId`.
    *   `Agent`: Can only see tasks assigned to them (`assigneeId`).
*   **Hard Boundaries:** Do NOT build cost calculation, progress charts, live maps, real email sending, or password reset flows. Stick strictly to the MVP.

---

## Work Distribution & Proposed Changes (3 Members)

### Member 1: Frontend & UI Developer
**Focus:** Visuals, routing, and user experience.
*   **[NEW] `app/page.tsx` (Login):** A simple form accepting an email and password. It calls `/api/auth/login`. 
*   **[NEW] `components/Layout.tsx`:** A navigation bar showing the logged-in user's name, role, and a logout button.
*   **[NEW] `app/dashboard/page.tsx`:** The main view. Conditionally renders components based on the user's role.
*   **[NEW] `components/TranscriptForm.tsx` (Admin Only):** A large `<textarea>` and a "Create from Transcript" button. Shows a loading spinner while the API processes the text.
*   **[NEW] `components/ProjectList.tsx`:** Displays projects in cards (Client Name, Deadline, Manager). 
*   **[NEW] `components/TaskList.tsx`:** Displays tasks in a table or list (Title, Assignee, Estimated Hours, Deadline).
*   **[NEW] `app/team/page.tsx`:** A simple static read-only view of the 10 team members and their skills.

### Member 2: Database, Auth, & Backend Logic
**Focus:** Data storage, security, and API endpoints.
*   **[NEW] `prisma/schema.prisma`:** Define the database models.
    ```prisma
    model User {
      id             String  @id @default(uuid())
      name           String
      email          String  @unique
      passwordHash   String
      role           String  // "ADMIN", "MANAGER", "AGENT"
      specialization String?
      skills         String?
    }
    model Project {
      id          String @id @default(uuid())
      name        String
      clientName  String
      description String
      managerId   String
      deadline    String
      tasks       Task[]
    }
    model Task {
      id             String  @id @default(uuid())
      projectId      String
      project        Project @relation(fields: [projectId], references: [id])
      title          String
      description    String
      assigneeId     String
      deadline       String
      estimatedHours Float
    }
    ```
*   **[NEW] `prisma/seed.ts`:** Script to delete existing data and insert the 10 required NovaWorks demo users with the password `Demo123!`.
*   **[NEW] `app/api/auth/login/route.ts`:** Validates credentials. Since it's a hackathon, just set an HTTP-only cookie containing the `userId` and `role` upon successful login.
*   **[NEW] `app/api/projects/route.ts`:** Fetches projects from SQLite. Reads the cookie to determine the role. If Admin, return all. If Manager, return `where: { managerId: user.id }`.
*   **[NEW] `app/api/tasks/route.ts`:** Fetches tasks. If Agent, return `where: { assigneeId: user.id }`.

### Member 3: AI Specialist & Integration
**Focus:** Prompt engineering, AI API, and final submission.
*   **[NEW] `app/api/ai/parse/route.ts`:** The core AI endpoint.
    *   Takes the `transcript` string from the request body.
    *   Fetches the list of all Users from the database to provide to the AI as context (so it knows the valid names and IDs to assign).
    *   Calls the Gemini API using `responseSchema` to force it to return a JSON object containing an array of `projects`, each with an array of `tasks`.
*   **AI Prompt Logic:** Instruct the AI to act as a Project Manager, extract the 3 projects (UrbanCart, QuickServe, HelpDeskPro) from the transcript, format the dates as `YYYY-MM-DD`, and map the spoken names to the exact `User.id`s provided in the context.
*   **Database Transaction:** Once Gemini returns the JSON, use a Prisma transaction (`prisma.$transaction`) to insert the parsed `Project`s and their nested `Task`s into the database simultaneously.
*   **[NEW] `README.md`:** Write the final documentation required by the judges, including setup commands, demo credentials, and a link to the demo video.

---

## Verification Plan

### Automated/Local Setup
1.  Run `npm install`
2.  Run `npx prisma db push` to create the local `dev.db` SQLite file.
3.  Run `npx tsx prisma/seed.ts` to populate the users.
4.  Run `npm run dev` to start the Next.js server.

### Manual Verification (The Judge's Path)
1.  **Admin Flow:** Log in as `admin@novaworks.example`. Go to Dashboard. Paste the official transcript. Click "Create". Verify 3 projects and 12 tasks appear.
2.  **Manager Flow:** Open an incognito window. Log in as `ayesha@novaworks.example` (Manager). Verify she only sees the "UrbanCart" project and cannot see QuickServe or HelpDeskPro.
3.  **Agent Flow:** Log in as `ali@novaworks.example` (Agent). Verify he only sees his 3 frontend tasks for UrbanCart and cannot see backend tasks.
4.  **AI Accuracy:** Check that the AI correctly assigned "Website integration and testing" to Ali with 6 hours, due on 19 October (testing its ability to capture corrections made during the meeting).
