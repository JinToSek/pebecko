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
  const [codes, setCodes] = useState<
    {
      isAdmin: boolean;
      id: string;
      code: string;
      disabled: boolean;
    }[]
  >([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const code = localStorage.getItem("adminCode");
        if (!code) {
          router.push("/");
          return;
        }

        // Verify if the code has admin privileges
        const verifyResponse = await fetch("/api/code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-code": code,
          },
          body: JSON.stringify({ code }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(
            errorData.error ||
              `Verification failed with status: ${verifyResponse.status}`
          );
        }

        const verifyResult = await verifyResponse.json();
        if (!verifyResult.isAdmin) {
          router.push("/");
          return;
        }

        // Fetch projects and codes
        const [projectsResponse, codesResponse] = await Promise.all([
          fetch("/api/project", {
            headers: {
              "Content-Type": "application/json",
              "x-auth-code": code,
            },
          }),
          fetch("/api/code", {
            headers: {
              "Content-Type": "application/json",
              "x-auth-code": code,
            },
          }),
        ]);

        if (!projectsResponse.ok || !codesResponse.ok) {
          let errorMessage = "Failed to fetch data";
          try {
            if (!projectsResponse.ok) {
              const projectError = await projectsResponse.json();
              errorMessage = projectError.error || errorMessage;
            }
            if (!codesResponse.ok) {
              const codeError = await codesResponse.json();
              errorMessage = codeError.error || errorMessage;
            }
          } catch (e) {
            console.error("Error parsing response:", e);
          }
          throw new Error(errorMessage);
        }

        const projectsData = await projectsResponse.json();
        const codesData = await codesResponse.json();

        setProjects(projectsData);
        setCodes(codesData);
      } catch (error: any) {
        setError(
          "Nepodařilo se načíst administrátorská data: " + error.toString()
        );
        // router.push('/');
      }
    };

    fetchData();
  }, []);

  const handleCreateProject = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    try {
      const code = localStorage.getItem("adminCode");
      if (!code) {
        router.push("/");
        return;
      }

      const response = await fetch("/api/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-code": code,
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error);
        return;
      }

      const projectsResponse = await fetch("/api/project", {
        headers: {
          "Content-Type": "application/json",
          "x-auth-code": code,
        },
      });
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
      if (
        !confirm(
          "Opravdu chcete smazat tento projekt? Toto také smaže všechny hlasy pro tento projekt."
        )
      ) {
        setSuccess("Akce byla úspěšně zrušena.");
        setTimeout(() => setSuccess(""), 2000);
        return;
      }

      const code = localStorage.getItem("adminCode");
      if (!code) {
        router.push("/");
        return;
      }

      const response = await fetch(`/api/project/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-auth-code": code,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error);
        return;
      }

      const projectsResponse = await fetch("/api/project", {
        headers: {
          "x-auth-code": code,
        },
      });
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      setSuccess("Projekt byl úspěšně smazán!");
      setError("");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error) {
      setError("Nepodařilo se smazat projekt");
    }
  };

  const handleCreateCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const codeValue = formData.get("code") as string;

    try {
      const adminCode = localStorage.getItem("adminCode");
      if (!adminCode) {
        router.push("/");
        return;
      }

      const response = await fetch("/api/code", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-auth-code": adminCode,
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
          "x-auth-code": adminCode,
        },
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

  const handleCreateBulkCodes = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const codesText = formData.get("codes") as string;
    const codesList = codesText
      .split("\n")
      .map((code) => code.trim())
      .filter(Boolean);

    try {
      const adminCode = localStorage.getItem("adminCode");
      if (!adminCode) {
        router.push("/");
        return;
      }

      const response = await fetch("/api/code", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-auth-code": adminCode,
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
          "x-auth-code": adminCode,
        },
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
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join("");
        generatedCodes.add(code);
      }

      const genCodes = Array.from(generatedCodes);
      const adminCode = localStorage.getItem("adminCode");
      if (!adminCode) {
        router.push("/");
        return;
      }

      // Create codes one by one using PATCH method
      for (const codeValue of genCodes) {
        const response = await fetch("/api/code", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-auth-code": adminCode,
          },
          body: JSON.stringify({ code: codeValue }),
        });

        if (!response.ok) {
          const error = await response.json();
          setError(error.message);
          return;
        }
      }

      // Create a blob with the codes
      const blob = new Blob([genCodes.join("\n")], { type: "text/plain" });
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
      const codesResponse = await fetch("/api/code", {
        headers: {
          "x-auth-code": adminCode,
        },
      });
      const codesData = await codesResponse.json();
      setCodes(codesData);
    } catch (error) {
      setError("Došlo k chybě");
    }
  };

  const handleDeleteCode = async (id: string, codeValue: string) => {
    try {
      if (
        !confirm(
          "Opravdu chcete smazat kód " +
            codeValue +
            "? Toto také smaže hlasy provedené tímto kódem."
        )
      ) {
        setSuccess("Akce byla úspěšně zrušena.");
        setTimeout(() => setSuccess(""), 2000);
        return;
      }

      const adminCode = localStorage.getItem("adminCode");
      if (!adminCode) {
        router.push("/");
        return;
      }

      const response = await fetch(`/api/code/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-auth-code": adminCode,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete code");
        return;
      }

      const codesResponse = await fetch("/api/code", {
        headers: {
          "x-auth-code": adminCode,
        },
      });
      const codesData = await codesResponse.json();
      setCodes(codesData);
      setSuccess("Kód byl úspěšně smazán!");
      setError("");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error) {
      setError("Nepodařilo se smazat kód");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold mb-8">Administrátorský panel</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Projekty</h2>
          <form
            onSubmit={handleCreateProject}
            className="bg-white/5 p-4 rounded mb-4"
          >
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2">
                Název
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full p-2 rounded bg-white/10"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block mb-2">
                Popis
              </label>
              <textarea
                id="description"
                className="w-full p-2 rounded bg-white/10"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Vytvořit projekt
            </button>
          </form>

          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white/5 p-4 rounded flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm opacity-70">{project.description}</p>
                  )}
                  <p className="text-xs">
                    Hlasů:{" "}
                    <a className="font-bold text-base">
                      {project._count.votes}
                    </a>
                  </p>
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
          <form
            onSubmit={handleCreateCode}
            className="bg-white/5 p-4 rounded mb-4"
          >
            <div className="mb-4">
              <label htmlFor="code" className="block mb-2">
                Jednotlivý kód
              </label>
              <input
                type="text"
                id="code"
                name="code"
                required
                className="w-full p-2 rounded bg-white/10"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Vytvořit kód
            </button>
          </form>

          <form
            onSubmit={handleCreateBulkCodes}
            className="bg-white/5 p-4 rounded mb-4"
          >
            <div className="mb-4">
              <label htmlFor="codes" className="block mb-2">
                Hromadné kódy (jeden na řádek)
              </label>
              <textarea
                id="codes"
                name="codes"
                required
                className="w-full p-2 rounded bg-white/10 h-32"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Vytvořit hromadné kódy
            </button>
          </form>

          <form className="bg-white/5 p-4 rounded mb-4">
            <div className="mb-4">
              <label htmlFor="codeCount" className="block mb-2">
                Generovat náhodné kódy
              </label>
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
                    const count = parseInt(
                      (document.getElementById("codeCount") as HTMLInputElement)
                        .value
                    );
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
              .filter((code) => code.isAdmin === false)
              .sort((a, b) =>
                a.disabled === b.disabled ? 0 : a.disabled ? 1 : -1
              )
              .map((code) => (
                <div
                  key={code.id}
                  className={`p-2 rounded ${
                    code.disabled ? "bg-gray-500/20" : "bg-white/5"
                  } flex justify-between items-center`}
                >
                  <code>{code.code}</code>
                  <div className="flex items-center gap-2">
                    {code.disabled ? (
                      <span className="ml-2 text-sm opacity-70">(Použito)</span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const adminCode = localStorage.getItem("adminCode");
                            if (!adminCode) {
                              router.push("/");
                              return;
                            }

                            const response = await fetch(
                              `/api/code/${code.id}`,
                              {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                  "x-auth-code": adminCode,
                                },
                                body: JSON.stringify({ disabled: true }),
                              }
                            );

                            if (!response.ok) {
                              const data = await response.json();
                              setError(
                                data.error || "Failed to mark code as used"
                              );
                              return;
                            }

                            const codesResponse = await fetch("/api/code", {
                              headers: {
                                "x-auth-code": adminCode,
                              },
                            });

                            if (!codesResponse.ok) {
                              const data = await codesResponse.json();
                              setError(data.error || "Failed to refresh codes");
                              return;
                            }

                            const codesData = await codesResponse.json();
                            if (Array.isArray(codesData)) {
                              setCodes(codesData);
                              setSuccess("Code marked as used!");
                              setError("");
                              setTimeout(() => setSuccess(""), 2000);
                            } else {
                              setError("Invalid response format from server");
                            }
                          } catch (error) {
                            setError("Failed to mark code as used");
                          }
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Označit jako použitý
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCode(code.id, code.code)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
