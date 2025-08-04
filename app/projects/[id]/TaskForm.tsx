"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import type { Task, User, Membership } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FullTask = Task & { assignee: User | null };
type FullMember = Membership & { user: User };

interface TaskFormProps {
  projectId: string;
  members: FullMember[];
  initialData?: FullTask | null;
  onSubmitSuccess: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "done"]),
  assigneeId: z.string().optional(),
});

export function TaskForm({
  projectId,
  members,
  initialData,
  onSubmitSuccess,
}: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      assigneeId: undefined,
    },
  });

  useEffect(() => {
    form.reset({
      title: initialData?.title || "",
      description: initialData?.description || "",
      status: initialData?.status || "todo",
      assigneeId: initialData?.assigneeId || undefined,
    });
  }, [initialData, form.reset]);

  // Fungsi untuk mengirim data (membuat atau mengupdate)
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    try {
      const url = initialData
        ? `/api/projects/${projectId}/tasks/${initialData.id}`
        : `/api/projects/${projectId}/tasks`;
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to save task.");
      }
      
      onSubmitSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Fungsi untuk menghapus task ---
  async function handleDelete() {
    if (!initialData) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${initialData.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error("Failed to delete task.");
      }
      onSubmitSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Design the homepage" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Add more details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="assigneeId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Assignee (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                        {member.user.email}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <div className="flex justify-between items-center pt-4">
            <div>
                {initialData && ( // Tampilkan tombol hapus hanya saat mengedit
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                        Delete
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={onSubmitSuccess}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Task"}
                </Button>
            </div>
        </div>
      </form>
    </Form>
  );
}
