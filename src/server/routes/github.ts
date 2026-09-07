import { Router } from "express";
import { pullFromGithub } from "../services/github";
import { requireAuth, requirePermission } from "../middleware/rbac";

export const githubRouter = Router();

githubRouter.post(
  "/pull-from-github",
  requireAuth,
  requirePermission(["roles:manage", "all:access"]),
  (req, res) => {
    const repoUrl = req.body?.repoUrl || "https://github.com/kpierre24/School-of-Ministry-2026.git";
    const result = pullFromGithub(repoUrl);
    if (result.success) {
      return res.json(result);
    }
    return res.status(500).json(result);
  }
);

