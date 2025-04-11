import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private projectsMap: Map<number, Project>;
  private userCurrentId: number;
  private projectCurrentId: number;

  constructor() {
    this.usersMap = new Map();
    this.projectsMap = new Map();
    this.userCurrentId = 1;
    this.projectCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.usersMap.set(id, user);
    return user;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projectsMap.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projectsMap.values())
      .sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const project: Project = { ...insertProject, id };
    this.projectsMap.set(id, project);
    return project;
  }

  async updateProject(id: number, updatedData: Partial<Project>): Promise<Project> {
    const existingProject = this.projectsMap.get(id);
    
    if (!existingProject) {
      throw new Error(`Project with ID ${id} not found`);
    }
    
    const updatedProject: Project = { ...existingProject, ...updatedData };
    this.projectsMap.set(id, updatedProject);
    
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    this.projectsMap.delete(id);
  }
}

export const storage = new MemStorage();
