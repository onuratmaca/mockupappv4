import express from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects API endpoints
  const projectsRouter = express.Router();

  // Get all projects
  projectsRouter.get("/", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get project by ID
  projectsRouter.get("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create new project
  projectsRouter.post("/", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const newProject = await storage.createProject(validatedData);
      res.status(201).json(newProject);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: fromZodError(error).message
        });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Update project
  projectsRouter.put("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Validate the update data
      const projectSchema = insertProjectSchema.extend({
        id: z.number()
      });
      
      const validatedData = projectSchema.parse({
        ...req.body,
        id
      });

      const updatedProject = await storage.updateProject(id, validatedData);
      res.json(updatedProject);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: fromZodError(error).message
        });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete project
  projectsRouter.delete("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Mount the projects router
  app.use("/api/projects", projectsRouter);

  const httpServer = createServer(app);
  return httpServer;
}
