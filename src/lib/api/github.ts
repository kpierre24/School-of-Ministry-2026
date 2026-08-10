import { apiClient } from "./client";
import type { PullFromGithubResponse } from "./client";

export function pullFromGithub(repoUrl?: string): Promise<PullFromGithubResponse> {
  return apiClient<PullFromGithubResponse>("/api/github/pull-from-github", {
    method: "POST",
    body: JSON.stringify({ repoUrl: repoUrl || "https://github.com/kpierre24/School-of-Ministry-2026.git" }),
  });
}
