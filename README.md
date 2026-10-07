# AI Project Manager CRM - Meeting to Execution

## Team
- Team name: NovaWorks Innovators
- Four members and responsibilities: 
  - Member 1: Frontend & UI Developer (Next.js, Tailwind)
  - Member 2: Backend Developer (Prisma, Auth, Data APIs)
  - Member 3: AI Specialist & Full-Stack Integrator (OpenRouter AI, Prompts, Final testing)
  - Member 4: N/A (Operating as a 3-member team)
- Repository: [GitHub URL]

## What Works
- **Seeded Login:** Demo accounts are successfully seeded. Users can log in without registration or password resets.
- **Admin Transcript Automation:** The Admin can paste a meeting transcript into the CRM. The AI successfully parses it, mapping spoken names to exact database IDs, and automatically generates projects and tasks.
- **Role-Based Access:** 
  - Admin sees all projects and the AI generation tool.
  - Managers see a filtered list of only their assigned projects.
  - Agents see a filtered "My Tasks" view containing only tasks assigned to them.
- **Saved Records:** Generated projects and tasks are persisted in the SQLite database and survive page refreshes.

## Technology Stack
- Frontend: Next.js (App Router) with Tailwind CSS
- Backend: Next.js API Routes (Node.js edge)
- Database: SQLite with Prisma ORM
- AI: OpenRouter (Claude 3.5 Sonnet / OpenAI compatible)
- Authentication/session approach: Simple HTTP-only cookie-based role session (optimized for MVP demo).

## Links
- Live application: [URL or Not deployed]
- Demo video: [accessible recording URL; required for a local database]

## Requirements
- Node.js (v18+)
- npm or yarn
- OpenRouter API Key

## Run Locally
1. Clone this repository and enter its directory:
   ```sh
   git clone [YOUR_REPOSITORY_URL]
   cd [YOUR_PROJECT_DIRECTORY]
   ```
2. Install dependencies: 
   ```sh
   npm install
   ```
3. Copy the provided `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```
4. Add your OpenRouter API Key to `.env`.
5. Apply schema and create local SQLite database: 
   ```sh
   npx prisma db push
   ```
6. Seed all ten demo users: 
   ```sh
   npx tsx prisma/seed.ts
   ```
7. Start the development server: 
   ```sh
   npm run dev
   ```

## Environment Variables
| Variable | Purpose | Where configured |
| --- | --- | --- |
| `DATABASE_URL` | SQLite database connection string | Backend |
| `OPENROUTER_API_KEY` | AI provider credential for transcript parsing | Backend |
| `AI_MODEL` | Specifies which model OpenRouter should route to | Backend |

## Demo Login Accounts
These emails are fictional identifiers, not mailboxes. Signup, email verification, and forgot password are unnecessary.

| Role | Name | Demo email | Password |
| --- | --- | --- | --- |
| Admin | Admin | admin@novaworks.example | Demo123! |
| Manager | Ayesha Khan | ayesha@novaworks.example | Demo123! |
| Manager | Bilal Ahmed | bilal@novaworks.example | Demo123! |
| Manager | Hina Malik | hina@novaworks.example | Demo123! |
| Agent | Ali Raza | ali@novaworks.example | Demo123! |
| Agent | Hamza Shah | hamza@novaworks.example | Demo123! |
| Agent | Sara Noor | sara@novaworks.example | Demo123! |
| Agent | Usman Tariq | usman@novaworks.example | Demo123! |
| Agent | Zain Abbas | zain@novaworks.example | Demo123! |
| Agent | Maryam Asif | maryam@novaworks.example | Demo123! |

## How Judges Can Test
1. Log in as admin (`admin@novaworks.example`); open Create from Transcript.
2. Paste the supplied meeting transcript (from the PDF).
3. Click create; expect three projects and twelve tasks to be saved to the database.
4. Open UrbanCart: verify manager is Ayesha, deadline is 20 October 2026, and it has four tasks.
5. Log out and log in as Ayesha (`ayesha@novaworks.example`): verify only her assigned project appears.
6. Log in as Ali (`ali@novaworks.example`): verify only his three assigned UrbanCart tasks appear.
7. Log in as Hamza (`hamza@novaworks.example`): his two API tasks span UrbanCart and QuickServe.
8. Verify other users' projects/tasks cannot be fetched directly (APIs restrict access based on role).
9. Refresh to verify persistence.

## Deployment Details
- Deployment status: Local only (for now)
- Database: Local SQLite

## Known Limitations
- No actual password hashing is implemented for the demo (plain text or simple matching for speed).
- Error handling on the frontend for AI timeouts could be improved.
