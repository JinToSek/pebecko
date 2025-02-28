"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

const loginSchema = z.object({
  code: z.string().min(1, "Prosím, vyplňte kód"),
});

type LoginForm = z.infer<typeof loginSchema>;

const voteSchema = z.object({
  projectIds: z
    .array(z.string())
    .min(1, "Vyberte alespoň 1 projekt")
    .max(3, "Můžete vybrat maximálně 3 projekty"),
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
  const [codes, setCodes] = useState<
    { id: string; code: string; disabled: boolean }[]
  >([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const voteForm = useForm<VoteForm>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      projectIds: [],
    },
  });

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setSuccess("");
    setError("");
    try {
      const response = await fetch("/api/code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-code": data.code,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);
      setIsAdmin(result.isAdmin);
      setError("");

      if (result.isAdmin) {
        localStorage.setItem("adminCode", loginForm.getValues("code"));
        window.location.href = "/admin";
        return;
      }

      // Fetch projects
      const projectsResponse = await fetch("/api/project", {
        headers: {
          "Content-Type": "application/json",
          "x-auth-code": loginForm.getValues("code"),
        },
      });
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // If admin, fetch codes
      if (result.isAdmin) {
        const codesResponse = await fetch("/api/code", {
          headers: {
            "Content-Type": "application/json",
            "x-auth-code": loginForm.getValues("code"),
          },
        });
        const codesData = await codesResponse.json();
        setCodes(codesData);
      }
    } catch (error) {
      setError("Došlo k chybě při ověřování kódu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (data: VoteForm) => {
    console.log("handleVote called with data:", data); // Add logging
    setIsLoading(true);
    try {
      const response = await fetch("/api/code", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-code": loginForm.getValues("code"),
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

      setSuccess("Váš hlas byl úspěšně zaznamenán!");
      setError("");
      setSelectedCount(0);
      setTimeout(() => {
        setIsLoggedIn(false);
        setSuccess("");
        loginForm.reset();
        voteForm.reset();
      }, 10_000);
    } catch (error) {
      setError("Došlo k chybě při odesílání hlasu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    const currentProjectIds = voteForm.getValues("projectIds") || [];
    const newProjectIds = checked
      ? [...currentProjectIds, event.target.value]
      : currentProjectIds.filter((id) => id !== event.target.value);
    voteForm.setValue("projectIds", newProjectIds, { shouldValidate: true });
    setSelectedCount(newProjectIds.length);
    console.log("Selected projects:", newProjectIds); // Add logging
  };
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Pébéčko 2025
          </h2>
          <form
            onSubmit={loginForm.handleSubmit(handleLogin)}
            className="mt-8 space-y-6"
          >
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
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              {isLoading ? "Načítání..." : "Potvrdit"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen p-8 bg-black">
        <h1>Načítání...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-black">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-white">
          Hlasování pro projekty
        </h1>
        <form
          onSubmit={voteForm.handleSubmit(handleVote)}
          className="space-y-6"
        >
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
          {success && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
                <svg
                  className="mx-auto h-12 w-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Děkujeme za váš hlas!
                </h3>
                <p className="mt-2 text-sm text-gray-600">{success}</p>
              </div>
            </div>
          )}
          {selectedCount > 0 && selectedCount <= 3 && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Odesílání...
                </>
              ) : (
                "Odeslat hlas"
              )}
            </button>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
