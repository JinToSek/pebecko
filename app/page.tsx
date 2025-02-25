"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

const loginSchema = z.object({
  code: z.string().min(1, "Kód je povinný"),
});

type LoginForm = z.infer<typeof loginSchema>;

const voteSchema = z.object({
  projectIds: z.array(z.string()).min(1, "Vyberte alespoň 1 projekt").max(3, "Můžete vybrat maximálně 3 projekty"),
});

type VoteForm = z.infer<typeof voteSchema>;

type Project = {
  id: string;
  name: string;
  description: string | null;
  _count: { votes: number };
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [codes, setCodes] = useState<{ id: string; code: string; disabled: boolean }[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const voteForm = useForm<VoteForm>({
    resolver: zodResolver(voteSchema),
  });

  const handleProjectSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setSelectedCount(prev => checked ? prev + 1 : prev - 1);
  };

  const handleLogin = async (data: LoginForm) => {
    try {
      const response = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return;
      }

      setIsLoggedIn(true);
      setIsAdmin(result.isAdmin);
      setError("");

      if (result.isAdmin) {
        localStorage.setItem('adminCode', loginForm.getValues("code"));
        window.location.href = "/admin";
        return;
      }

      // Fetch projects
      const projectsResponse = await fetch("/api/project", {
        headers: {
          'x-auth-code': loginForm.getValues("code")
        }
      });
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // If admin, fetch codes
      if (result.isAdmin) {
        const codesResponse = await fetch("/api/code");
        const codesData = await codesResponse.json();
        setCodes(codesData);
      }
    } catch (error) {
      setError("Došlo k chybě");
    }
  };

  const handleVote = async (data: VoteForm) => {
    try {
      const response = await fetch("/api/code", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-auth-code": loginForm.getValues("code")
        },
        body: JSON.stringify({
          code: loginForm.getValues("code"),
          projectIds: data.projectIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return;
      }

      setSuccess("Hlas byl úspěšně odeslán!");
      setError("");
      setTimeout(() => {
        setIsLoggedIn(false);
        setSuccess("");
        loginForm.reset();
        voteForm.reset();
      }, 2000);
    } catch (error) {
      setError("Došlo k chybě");
    }
  };

  const createProject = async (name: string, description?: string) => {
    try {
      const response = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.message);
        return;
      }

      const projectsResponse = await fetch("/api/project", {
        headers: {
          'x-auth-code': loginForm.getValues("code")
        }
      });
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      setError("");
    } catch (error) {
      setError("Došlo k chybě");
    }
  };

  const createCodes = async (codes: string[]) => {
    try {
      const response = await fetch("/api/code", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.message);
        return;
      }

      setError("");
      setSuccess(`Created ${codes.length} new codes`);
      setTimeout(() => setSuccess(""), 2000);
    } catch (error) {
      setError("Došlo k chybě");
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/project/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.message);
        return;
      }

      const projectsResponse = await fetch("/api/project", {
        headers: {
          'x-auth-code': loginForm.getValues("code")
        }
      });
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      setError("");
      setSuccess("Project deleted successfully");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error) {
      setError("Došlo k chybě");
    }
  };

  const disableCode = async (codeId: string) => {
    try {
      const response = await fetch(`/api/code/${codeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.message);
        return;
      }

      const codesResponse = await fetch("/api/code");
      const codesData = await codesResponse.json();
      setCodes(codesData);
      setError("");
      setSuccess("Code disabled successfully");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error) {
      setError("Došlo k chybě");
    }
  };



  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Pébéčko 2025
          </h2>
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="mt-8 space-y-6">
            <div>
              <label htmlFor="code" className="sr-only">
                Code
              </label>
              <input
                id="code"
                type="text"
                {...loginForm.register("code")}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Zadejte svůj kód"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Potvrdit
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen p-8 bg-black">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-white">Administrátorský panel</h1>
          
          {/* Projects section
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Projects</h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded bg-white"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-600">{project.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-medium text-gray-900">{project._count.votes}</span>
                      <span className="text-gray-600"> votes</span>
                    </div>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Active Codes</h2>
            <div className="space-y-4">
              {codes.filter(code => !code.disabled).map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-4 border rounded bg-white"
                >
                  <span className="font-medium text-gray-900">{code.code}</span>
                  <button
                    onClick={() => disableCode(code.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Disable
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Project</h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Project name"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                id="newProjectName"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                id="newProjectDescription"
              />
              <button
                onClick={() => {
                  const name = (document.getElementById("newProjectName") as HTMLInputElement).value;
                  const description = (document.getElementById("newProjectDescription") as HTMLInputElement).value;
                  if (name) createProject(name, description || undefined);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Create Codes</h2>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Manual Input</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter codes separated by commas"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  id="newCodes"
                />        const blob = new Blob([codes.join("\n")], { type: "text/plain" });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "generated-codes.txt";
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                      
                          setError("");
                          setSuccess(`Generated ${count} codes and downloaded`);
                          setTimeout(() => setSuccess(""), 2000);
                      
                          // Refresh codes list
                          const codesResponse = await fetch("/api/code");
                          const codesData = await codesResponse.json();
                          setCodes(codesData);
                        } catch (error) {
                          setError("Došlo k chybě");
                        }
                      };
                      generateCodes(count);
                    }
                  
                <button
                  onClick={() => {
                    const codesInput = (document.getElementById("newCodes") as HTMLInputElement).value;
                    const codes = codesInput.split(",").map((code) => code.trim()).filter(Boolean);
                    if (codes.length > 0) createCodes(codes);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Auto Generate</h3>
              <div className="flex gap-4">
                <input
                  type="number"
                  min="1"
                  placeholder="Number of codes to generate"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  id="codeCount"
                />
                <button
                  onClick={() => {
                    const count = parseInt((document.getElementById("codeCount") as HTMLInputElement).value);
                    if (count > 0) generateCodes(count);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Used Codes</h2>
            <div className="space-y-4">
              {codes.filter(code => code.disabled).map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-4 border rounded bg-white"
                >
                  <span className="font-medium text-gray-900">{code.code}</span>
                  <span className="text-gray-600">Used</span>
                </div>
              ))}
            </div>
          </div>

          {(error || success) && (
            <div className={`p-4 rounded ${error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {error || success}
            </div>
          )}
            */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-black">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-white">Hlasování pro projekty</h1>
        <form onSubmit={voteForm.handleSubmit(handleVote)} className="space-y-6">
          <div className="space-y-4">
            {projects.map((project) => (
              <label
                key={project.id}
                className="flex items-start p-4 border rounded bg-white hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={project.id}
                  {...voteForm.register("projectIds")}
                  onChange={handleProjectSelect}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  {project.description && (
                    <p className="text-gray-600">{project.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}
          {selectedCount > 0 && selectedCount <= 3 && (
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Odeslat hlas
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
