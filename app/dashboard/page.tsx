"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string; role: string; specialization?: string; skills?: string };
type Task = { id: string; title: string; description: string; assigneeId: string; deadline: string; estimatedHours: number; project?: Project };
type Project = { id: string; name: string; clientName: string; description: string; managerId: string; deadline: string; manager?: User; _count?: { tasks: number } };

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/");
        return;
      }
      const userData = await meRes.json();
      setUser(userData.user);

      const [projRes, tasksRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks")
      ]);
      
      if (projRes.ok) setProjects((await projRes.json()).projects || []);
      if (tasksRes.ok) setTasks((await tasksRes.json()).tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const handleCreateFromTranscript = async () => {
    if (!transcript) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (res.ok) {
        setTranscript("");
        await fetchData(); // Refresh data
        alert("Projects and tasks created successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process transcript");
      }
    } catch (e) {
      alert("Error calling AI API");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">NovaWorks CRM</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium">{user.name} ({user.role})</span>
            <button onClick={handleLogout} className="text-sm text-blue-600 hover:underline">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Transcript Section */}
        {user.role === "ADMIN" && (
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Create from Transcript</h2>
            <textarea
              className="w-full h-32 p-3 border rounded-md mb-4 font-mono text-sm"
              placeholder="Paste meeting transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            <button
              onClick={handleCreateFromTranscript}
              disabled={aiLoading || !transcript}
              className="bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              {aiLoading ? "Processing with AI..." : "Create Projects & Tasks"}
            </button>
          </section>
        )}

        {/* Projects Section (Admin & Manager) */}
        {(user.role === "ADMIN" || user.role === "MANAGER") && (
          <section>
            <h2 className="text-xl font-bold mb-4">Projects</h2>
            {projects.length === 0 ? (
              <p className="text-gray-500">No projects found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p) => (
                  <div key={p.id} className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">Client: {p.clientName}</p>
                    <p className="text-sm text-gray-700 mb-4">{p.description}</p>
                    <div className="text-sm">
                      <p><strong>Deadline:</strong> {p.deadline}</p>
                      <p><strong>Tasks:</strong> {p._count?.tasks || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tasks Section (Agent) */}
        {user.role === "AGENT" && (
          <section>
            <h2 className="text-xl font-bold mb-4">My Tasks</h2>
            {tasks.length === 0 ? (
              <p className="text-gray-500">No assigned tasks.</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Hours</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.project?.name || "Unknown"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <p className="font-semibold">{t.title}</p>
                          <p className="text-xs text-gray-500">{t.description}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{t.deadline}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{t.estimatedHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
