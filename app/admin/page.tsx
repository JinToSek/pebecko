"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description: string | null;
  _count: { votes: number };
};

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [codes, setCodes] = useState<{
      isAdmin: boolean; id: string; code: string; disabled: boolean 
}[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const code = localStorage.getItem('adminCode');
        if (!code) {
          router.push('/');
          return;
        }

        // Verify if the code has admin privileges
        const verifyResponse = await fetch("/api/code", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-auth-code": code
          },
          body: JSON.stringify({ code }),
        });

        const verifyResult = await verifyResponse.json();
        if (!verifyResult.isAdmin) {
          router.push('/');
          return;
        }

        // Fetch projects and codes
        const [projectsResponse, codesResponse] = await Promise.all([
          fetch("/api/project", {
            headers: {
              'Content-Type': 'application/json',
              'x-auth-code': code
            }
          }),
          fetch("/api/code", {
            headers: {
              'Content-Type': 'application/json',
              'x-auth-code': code
            }
          }),
        ]);

        const projectsData = await projectsResponse.json();
        const codesData = await codesResponse.json();

        setProjects(projectsData);
        setCodes(codesData);
      } catch (error) {
        setError("Nepodařilo se načíst administrátorská data");
        router.push('/');
      }
    };

    fetchData();
  }, []);

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    try {
      const code = localStorage.getItem('adminCode');
      if (!code) {
        router.push('/');
        return;
      }

      const response = await fetch("/api/project", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-auth-code": code
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error);
        return;
      }

      const projectsResponse = await fetch("/api/project");
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      setSuccess("Projekt byl úspěšně vytvořen!");
      setError("");
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      setError("Nepodařilo se vytvořit projekt");
    }
  };

  const handleDeleteProject = async (id: string) => {

    try {
      const code = localStorage.getItem('adminCode');
      if (!code) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/project/${id}`, {
        method: "DELETE",
        headers: {
          "x-auth-code": code
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error);
        return;
      }

      const projectsResponse = await fetch("/api/project");
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      setSuccess("Projekt byl úspěšně smazán!");
      setError("");
    } catch (error) {
      setError("Nepodařilo se smazat projekt");
    }
  };

  const handleCreateCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const codeValue = formData.get("code") as string;

    try {
      const adminCode = localStorage.getItem('adminCode');
      if (!adminCode) {
        router.push('/');
        return;
      }

      const response = await fetch("/api/code", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-auth-code": adminCode
        },
        body: JSON.stringify({ code: codeValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error);
        return;
      }

      const codesResponse = await fetch("/api/code", {
        headers: {
          "x-auth-code": adminCode
        }
      });
      const codesData = await codesResponse.json();
      setCodes(codesData);
      setSuccess("Kód byl úspěšně vytvořen!");
      setError("");
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      setError("Nepodařilo se vytvořit kód");
    }
  };

  const handleCreateBulkCodes = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const codesText = formData.get("codes") as string;
    const codesList = codesText.split("\n").map((code) => code.trim()).filter(Boolean);

    try {
      const adminCode = localStorage.getItem('adminCode');
      if (!adminCode) {
        router.push('/');
        return;
      }

      const response = await fetch("/api/code", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "x-auth-code": adminCode
        },
        body: JSON.stringify({ codes: codesList }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error);
        return;
      }

      const codesResponse = await fetch("/api/code", {
        headers: {
          "x-auth-code": adminCode
        }
      });
      const codesData = await codesResponse.json();
      setCodes(codesData);
      setSuccess(`${codesList.length} kódů bylo úspěšně vytvořeno!`);
      setError("");
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      setError("Nepodařilo se vytvořit kódy");
    }
  };

  const generateCodes = async (count: number) => {

    try {
      // Generate unique codes
      const generatedCodes = new Set<string>();
      while (generatedCodes.size < count) {
        const code = Array.from({ length: 7 }, () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join('');
        generatedCodes.add(code);
      }
  
      const codes = Array.from(generatedCodes);
  
      const code = localStorage.getItem('adminCode');
      if (!code) {
        router.push('/');
        return;
      }

      const response = await fetch("/api/code", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "x-auth-code": code
        },
        body: JSON.stringify({ codes }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        setError(error.message);
        return;
      }
  
      // Create a blob with the codes
      const blob = new Blob([codes.join("\n")], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "generated-codes.txt";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  
      setError("");
      setSuccess(`Vygenerováno ${count} kódů a staženo`);
      setTimeout(() => setSuccess(""), 2000);
  
      // Refresh codes list
      const codesResponse = await fetch("/api/code");
      const codesData = await codesResponse.json();
      setCodes(codesData);
    } catch (error) {
      setError("Došlo k chybě");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold mb-8">Administrátorský panel</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-4">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Projekty</h2>
          <form onSubmit={handleCreateProject} className="bg-white/5 p-4 rounded mb-4">
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2">Název</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full p-2 rounded bg-white/10"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block mb-2">Popis</label>
              <textarea
                id="description"
                name="description"
                className="w-full p-2 rounded bg-white/10"
              />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Vytvořit projekt
            </button>
          </form>

          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="bg-white/5 p-4 rounded flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{project.name}</h3>
                  {project.description && <p className="text-sm opacity-70">{project.description}</p>}
                  <p className="text-sm">Tento projekt získal <b>{project._count.votes}</b> hlasy/ů.</p>
                </div>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Smazat
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Kódy</h2>
          <form onSubmit={handleCreateCode} className="bg-white/5 p-4 rounded mb-4">
            <div className="mb-4">
              <label htmlFor="code" className="block mb-2">Jednotlivý kód</label>
              <input
                type="text"
                id="code"
                name="code"
                required
                className="w-full p-2 rounded bg-white/10"
              />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Vytvořit kód
            </button>
          </form>

          <form onSubmit={handleCreateBulkCodes} className="bg-white/5 p-4 rounded mb-4">
            <div className="mb-4">
              <label htmlFor="codes" className="block mb-2">Hromadné kódy (jeden na řádek)</label>
              <textarea
                id="codes"
                name="codes"
                required
                className="w-full p-2 rounded bg-white/10 h-32"
              />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Vytvořit hromadné kódy
            </button>
          </form>

          <form className="bg-white/5 p-4 rounded mb-4">
            <div className="mb-4">
              <label htmlFor="codeCount" className="block mb-2">Generovat náhodné kódy</label>
              <div className="flex gap-4">
                <input
                  type="number"
                  id="codeCount"
                  min="1"
                  placeholder="Počet kódů ke generování"
                  className="flex-1 p-2 rounded bg-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    const count = parseInt((document.getElementById("codeCount") as HTMLInputElement).value);
                    if (count > 0) generateCodes(count);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Generovat
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-2">
            {[...codes]
              .filter(code => code.code !== "ADMIN")
              .sort((a, b) => (a.disabled === b.disabled ? 0 : a.disabled ? 1 : -1))
              .map((code) => (
              <div
                key={code.id}
                className={`p-2 rounded ${code.disabled ? 'bg-gray-500/20' : 'bg-white/5'} flex justify-between items-center`}
              >
                <code>{code.code}</code>
                {code.disabled ? (
                  <span className="ml-2 text-sm opacity-70">(Použito)</span>
                ) : (
                  <button
                    onClick={() => {
                      fetch(`/api/code/${code.id}`, {
                        method: "PATCH",
                        headers: { 
                          "Content-Type": "application/json",
                          "x-auth-code": localStorage.getItem('adminCode') || ''
                        },
                        body: JSON.stringify({ disabled: true }),
                      }).then(async (response) => {
                        if (!response.ok) {
                          const data = await response.json();
                          setError(data.error);
                          return;
                        }
                        const codesResponse = await fetch("/api/code");
                        const codesData = await codesResponse.json();
                        setCodes(codesData);
                        setSuccess("Code marked as used!");
                        setError("");
                        setTimeout(() => setSuccess(""), 2000);
                      }).catch(() => {
                        setError("Failed to mark code as used");
                      });
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Označit jako použitý
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}