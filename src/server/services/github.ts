import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";
import { logger } from "../../lib/logger";
import { isValidGitUrl } from "../middleware/security";

export function pullFromGithub(
  repoUrl: string = "https://github.com/kpierre24/School-of-Ministry-2026.git",
  targetDir: string = process.cwd()
): { success: boolean; message?: string; error?: string } {
  if (!isValidGitUrl(repoUrl)) {
    logger.warn(`Rejected invalid or untrusted GitHub repository URL: ${repoUrl}`);
    return {
      success: false,
      error: "Invalid repository URL format. Only verified GitHub HTTPS repository URLs are permitted."
    };
  }

  const tempDir = path.join("/tmp", `github_pull_${Date.now()}`);
  try {
    logger.info(`Cloning ${repoUrl} safely into temporary directory...`);
    // execFileSync passes arguments in an array preventing shell command injection
    execFileSync("git", ["clone", "--depth", "1", repoUrl, tempDir], { stdio: "pipe" });

    const copyRecursive = (src: string, dst: string) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        if ([".git", "node_modules", ".vite", "dist"].includes(entry.name)) continue;
        const srcPath = path.join(src, entry.name);
        const dstPath = path.join(dst, entry.name);
        if (entry.isDirectory()) {
          if (!fs.existsSync(dstPath)) {
            fs.mkdirSync(dstPath, { recursive: true });
          }
          copyRecursive(srcPath, dstPath);
        } else {
          fs.copyFileSync(srcPath, dstPath);
        }
      }
    };

    copyRecursive(tempDir, targetDir);
    fs.rmSync(tempDir, { recursive: true, force: true });
    logger.info("Successfully updated workspace from GitHub repository.");
    return { success: true, message: "Workspace successfully updated from GitHub repository." };
  } catch (err: any) {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    logger.error("Failed to pull from GitHub:", err);
    return { success: false, error: err?.message || String(err) };
  }
}
