"use client";
import { api } from "~/trpc/react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "~/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { Session } from "next-auth";

const formSchema = z.object({
  text: z.string().min(1, "Task description is required"),
  isCompleted: z.boolean(),
  categoryId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdById: z.string(),
});

const categories = [
  { item: "Work", id: "1" },
  { item: "Personal", id: "2" },
  { item: "Other", id: "3" },
];
interface AddTodoFormProps {
  session: Session;
}
export function AddTodoForm({ session }: AddTodoFormProps) {
  const utils = api.useUtils();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      isCompleted: false,
      categoryId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: session.user.id,
    },
  });

  const createItem = api.todo.createToDo.useMutation({
    onSuccess: () => {
      form.reset();
      utils.todo.getItems.invalidate().catch(console.error);
      toast.success("Todo added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add todo");
      console.error("Mutation error:", error);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createItem.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Text Input */}
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Task Description
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="min-h-[100px] resize-y text-sm md:min-h-[120px]"
                  placeholder="Enter your task..."
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Category Select */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="text-sm"
                      >
                        {category.item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
   
        </div>

        <Button
          type="submit"
          className="w-full text-sm font-semibold md:w-auto"
          disabled={createItem.isPending}
        >
          {createItem.isPending ? "Adding..." : "Add Task"}
        </Button>
      </form>
    </Form>
  );
}

export function GetItems() {
  const utils = api.useUtils();
  const { data, isLoading } = api.todo.getItems.useQuery();
  const [loadingId, setLoadingId] = React.useState<number | null>(null); // Track loading state per item

  const updateItem = api.todo.updateCompletion.useMutation({
    onSuccess: () => {
      utils.todo.getItems.invalidate().catch(console.error);
      setLoadingId(null); // reset loading state on success
    },
    onError: (error) => {
      toast.error("Failed to update todo");
      console.error("Mutation error:", error);
      setLoadingId(null); // reset loading state on error
    },
  });

  const deleteItem = api.todo.deteleItem.useMutation({
    onSuccess: () => {
      utils.todo.getItems.invalidate().catch(console.error);
    },
    onError: (error) => {
      toast.error("Failed to delete todo");
      console.error("Mutation error:", error);
    },
  })
  const handleUpdateCompletion = (id: number, isCompleted: boolean) => {
    setLoadingId(id); // Set loading state for the clicked item
    updateItem.mutate({ id, isCompleted });
  };

  const handleDeleteItem = (id: number) => {
    deleteItem.mutate({ id });
  };

  if (isLoading) return <div className="text-sm text-gray-500">Loading...</div>;

  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Task</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="">Mark</TableHead>
            <TableHead className="">Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>
                {categories.find((c) => c.id === item.categoryId)?.item}
              </TableCell>
              <TableCell>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.isCompleted
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {item.isCompleted ? "Completed" : "Pending"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() =>
                    handleUpdateCompletion(item.id, !item.isCompleted)
                  }
                  disabled={loadingId === item.id}
                >
                  {loadingId === item.id
                    ? "Updating..."
                    : item.isCompleted
                      ? "Undo"
                      : "Complete"}
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() =>
                    handleDeleteItem(item.id)
                  }
                  disabled={loadingId === item.id}
                >
                  {loadingId === item.id ? "Deleting..." : "Delete"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
