import { Router, Request, Response } from "express";
import { getAuthoritativeState, saveAuthoritativeState, logAuditEvent } from "../services/supabaseServer";
import { logger } from "../../lib/logger";

export const libraryRouter = Router();

/**
 * GET /api/library
 * Retrieves library resources, syllabus handouts, and course materials.
 */
libraryRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userEmail = (req.query.userEmail as string) || undefined;
    const state = await getAuthoritativeState(userEmail);

    const resources = state?.libraryResources || [];
    const classroomMedia = state?.classroomMedia || [];

    return res.status(200).json({
      resources,
      classroomMedia,
      count: resources.length,
      updatedAt: state?.updatedAt || new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error("GET /api/library error:", err);
    return res.status(500).json({ error: "Failed to fetch library resources" });
  }
});

/**
 * POST /api/library
 * Adds a new resource to the digital library.
 */
libraryRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { resource, userEmail } = req.body;
    if (!resource || !resource.title) {
      return res.status(400).json({ error: "Resource title is required" });
    }

    const state = (await getAuthoritativeState(userEmail)) || {};
    const resources = [...(state.libraryResources || [])];

    const newResource = {
      id: resource.id || `LIB-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: resource.title,
      category: resource.category || "Study Guide",
      author: resource.author || "Faculty",
      courseCode: resource.courseCode || "General",
      url: resource.url || "",
      fileType: resource.fileType || "pdf",
      description: resource.description || "",
      uploadedAt: new Date().toISOString(),
    };

    resources.unshift(newResource);

    const updatedState = {
      ...state,
      libraryResources: resources,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || "teacher",
    };

    await saveAuthoritativeState(
      updatedState,
      userEmail,
      `Added library resource: ${newResource.title}`
    );

    await logAuditEvent({
      actorUserId: userEmail || "teacher",
      entityType: "library_resource",
      entityId: newResource.id,
      action: "create",
      newValues: newResource,
    });

    return res.status(201).json({
      status: "added",
      resource: newResource,
    });
  } catch (err: any) {
    logger.error("POST /api/library error:", err);
    return res.status(500).json({ error: "Failed to add library resource" });
  }
});

/**
 * DELETE /api/library/:id
 * Removes a resource from the library.
 */
libraryRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const userEmail = (req.query.userEmail as string) || undefined;
    const state = (await getAuthoritativeState(userEmail)) || {};

    let resources = [...(state.libraryResources || [])];
    const target = resources.find((r: any) => r.id === id);
    resources = resources.filter((r: any) => r.id !== id);

    const updatedState = {
      ...state,
      libraryResources: resources,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || "admin",
    };

    await saveAuthoritativeState(
      updatedState,
      userEmail,
      `Removed library resource: ${target?.title || id}`
    );

    await logAuditEvent({
      actorUserId: userEmail || "admin",
      entityType: "library_resource",
      entityId: id,
      action: "delete",
      oldValues: target,
    });

    return res.status(200).json({ status: "deleted", id });
  } catch (err: any) {
    logger.error("DELETE /api/library/:id error:", err);
    return res.status(500).json({ error: "Failed to delete library resource" });
  }
});
