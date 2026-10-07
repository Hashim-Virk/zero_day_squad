// Checks login and role-based access against the running server.
// 1) npm run dev (in one terminal)   2) npx tsx prisma/test-access.ts (in another)
const BASE = "http://localhost:3000";
let failed = 0;

function check(name: string, ok: boolean) {
  console.log((ok ? "PASS  " : "FAIL  ") + name);
  if (!ok) failed++;
}

async function login(email: string, password = "Demo123!") {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  return { status: res.status, cookie };
}

async function get(path: string, cookie?: string) {
  const res = await fetch(BASE + path, { headers: cookie ? { Cookie: cookie } : {} });
  let data: any = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function main() {
  // ---- Login ----
  check("wrong password -> 401", (await login("ayesha@novaworks.example", "wrong")).status === 401);
  check("unknown email -> 401", (await login("nobody@novaworks.example")).status === 401);
  check("no cookie -> 401 on /api/projects", (await get("/api/projects")).status === 401);
  check("forged cookie -> 401", (await get("/api/projects", "session=abc.def.ghi")).status === 401);

  const admin = await login("admin@novaworks.example");
  const ayesha = await login("ayesha@novaworks.example");
  const ali = await login("ali@novaworks.example");
  const hamza = await login("hamza@novaworks.example");
  check("admin login works", admin.status === 200 && !!admin.cookie);
  check("ayesha login works", ayesha.status === 200 && !!ayesha.cookie);

  // ---- Admin sees everything ----
  const aProjects = await get("/api/projects", admin.cookie);
  const aTasks = await get("/api/tasks", admin.cookie);
  check("admin sees 3 projects", aProjects.data?.projects?.length === 3);
  check("admin sees 12 tasks", aTasks.data?.tasks?.length === 12);

  const idOf = (name: string) =>
    aProjects.data?.projects?.find((p: any) => p.name.includes(name))?.id as string;
  const urban = idOf("UrbanCart");
  const quick = idOf("QuickServe");

  // ---- Manager: Ayesha ----
  const yProjects = await get("/api/projects", ayesha.cookie);
  check("Ayesha sees only 1 project", yProjects.data?.projects?.length === 1);
  check("Ayesha's project is UrbanCart", yProjects.data?.projects?.[0]?.name === "UrbanCart Website");
  const yUrban = await get(`/api/projects/${urban}`, ayesha.cookie);
  check("Ayesha opens UrbanCart with 4 tasks", yUrban.status === 200 && yUrban.data?.tasks?.length === 4);
  check("Ayesha opening QuickServe by URL -> 404", (await get(`/api/projects/${quick}`, ayesha.cookie)).status === 404);
  check("Ayesha asking tasks of QuickServe -> 404",
    (await get(`/api/tasks?projectId=${quick}`, ayesha.cookie)).status === 404);

  // ---- Agent: Ali ----
  const lProjects = await get("/api/projects", ali.cookie);
  const lTasks = await get("/api/tasks", ali.cookie);
  check("Ali sees only 1 project", lProjects.data?.projects?.length === 1);
  check("Ali sees exactly 3 tasks", lTasks.data?.tasks?.length === 3);
  check("all Ali's tasks are assigned to Ali",
    lTasks.data?.tasks?.every((t: any) => t.assignee.id === "DEV01"));
  const lUrban = await get(`/api/projects/${urban}`, ali.cookie);
  check("Ali sees only his 3 tasks inside UrbanCart (not Hamza's API task)", lUrban.data?.tasks?.length === 3);
  check("Ali opening QuickServe by URL -> 404", (await get(`/api/projects/${quick}`, ali.cookie)).status === 404);

  // ---- Agent: Hamza ----
  const hProjects = await get("/api/projects", hamza.cookie);
  const hTasks = await get("/api/tasks", hamza.cookie);
  check("Hamza sees 2 projects", hProjects.data?.projects?.length === 2);
  check("Hamza sees exactly 2 tasks", hTasks.data?.tasks?.length === 2);

  // ---- Team ----
  const team = await get("/api/team", ali.cookie);
  check("team directory has 10 people", team.data?.team?.length === 10);
  check("team directory never exposes passwords",
    !JSON.stringify(team.data).toLowerCase().includes("passwordhash"));

  console.log(failed === 0 ? "\nALL TESTS PASSED" : `\n${failed} TEST(S) FAILED`);
}

main().catch((e) => {
  console.error("Could not reach the server. Is `npm run dev` running?", e.message);
});
