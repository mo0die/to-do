"use client";
import { api } from "~/trpc/react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormItem } from "~/components/ui/form";
import {useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


const formSchema = z.object({
    text: z.string(),
    isCompleted: z.boolean(),
    categoryId: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
    createdById: z.string(),
})

export function AddTodoForm({session},...props) {
  const [text, setText] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [isCompleted, setIsCompleted] = React.useState(false);
  const utils = api.useUtils();

  const createItem = api.todo.createToDo.useMutation({
    onSuccess: () => {
      setText("");
      setCategoryId("");
      setIsCompleted(false);
      // Invalidate the getItems query to trigger refetch
      utils.todo.getItems.invalidate().catch((err) =>
        console.error("Failed to invalidate cache:", err)
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      createItem.mutate({
        text,
        isCompleted,
        categoryId,
        createdById: "your-user-id-here", // Replace with actual user ID
      });
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      isCompleted: false,
      categoryId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: session.user.id, // Replace with actual user ID
    },
  });
  

  return (
    <Form {...form}>
    <form onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <label htmlFor="text">Task Name</label>
              <input
                {...field}
                id="text"
                type="text"
                placeholder="Enter task name"
              />
            </FormItem>
          )}
        />
      <Button type="submit">Add To-Do</Button>
    </form>
      
    </Form>
  );
}

export function GetItems(){
    const { data, isLoading } = api.todo.getItems.useQuery();
    if (isLoading) return <div>Loading...</div>;
    return (
        <ul>
            {data?.map((item) => (
                <li key={item.id}>
                    {item.title} - {item.isCompleted ? "Completed" : "Not Completed"}
                </li>
            ))}
        </ul>
    );

}