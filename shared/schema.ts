import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Project table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  lastEdited: text("last_edited").notNull(),
  designImage: text("design_image").notNull(),
  selectedMockupId: integer("selected_mockup_id").notNull().default(1),
  designSize: integer("design_size").notNull().default(60),
  designPosition: text("design_position").notNull().default("center"),
  designXOffset: integer("design_x_offset").notNull().default(0),
  designYOffset: integer("design_y_offset").notNull().default(0),
  designRatio: text("design_ratio").notNull().default("square"),
  thumbnail: text("thumbnail").notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Keep the existing user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
