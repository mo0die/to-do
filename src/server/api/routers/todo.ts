import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { todos } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq ,and} from "drizzle-orm";

export const todoRouter = createTRPCRouter({
  createToDo: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        isCompleted: z.boolean().optional().default(false),
        categoryId: z.string().optional(),
        createdAt: z.date().default(() => new Date()),
        updatedAt: z.date().default(() => new Date()),
        createdById: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.insert(todos).values({
          title: input.text,
          isCompleted: input.isCompleted ?? false, // Default to false if not provided
          categoryId: input.categoryId,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
          createdById: input.createdById,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create ToDo: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  getItems: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.db
      .select({
        id: todos.id,
        title: todos.title,
        isCompleted: todos.isCompleted,
        categoryId: todos.categoryId,
        createdAt: todos.createdAt,
      })
      .from(todos)
      .where(eq(todos.createdById, ctx.session.user.id))
      .orderBy(todos.createdAt);

    return items;
  }),

  updateCompletion: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        isCompleted: z.boolean(),
    }),
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure you're importing the table and the eq operator correctly
    const result = await ctx.db
        .update(todos)
        .set({ isCompleted: input.isCompleted })
        .where(eq(todos.id, input.id))
        .returning(); // returns the updated row(s)

      // Optionally check that the update affected a row
    if (!result.length) {
        throw new Error("No todo updated");
    }
    }),
    deteleItem: protectedProcedure
    .input(
      z.object({
        id: z.number(),
    }),
    ).mutation(async ({ input, ctx }) => {
      const result = await ctx.db.delete(todos).where(
        and(eq(todos.id, input.id),eq(todos.createdById, ctx.session.user.id))).returning();
      if (!result.length) {
        throw new Error("No todo deleted");
      }
    }),
});
