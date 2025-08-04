"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Task, User, Membership } from "@prisma/client";
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";

// Tipe data yang diperluas
type FullTask = Task & { assignee: User | null };
type FullMember = Membership & { user: User };

interface TaskBoardProps {
  initialTasks: FullTask[];
  members: FullMember[];
  projectId: string;
}

// Komponen Kartu Task yang bisa diseret (Draggable)
function SortableTaskCard({
  task,
  onClick,
}: {
  task: FullTask;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white dark:bg-gray-900 p-4 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <p className="font-semibold">{task.title}</p>
      {task.assignee && (
        <p className="text-xs text-gray-500 mt-1">
          Assigned to: {task.assignee.email}
        </p>
      )}
    </div>
  );
}

// Komponen Kolom Status
function TaskColumn({
  id, 
  title,
  tasks,
  onTaskClick,
}: {
  id: string; 
  title: string;
  tasks: FullTask[];
  onTaskClick: (task: FullTask) => void;
}) {
  const { setNodeRef } = useSortable({ id }); // Membuat kolom itu sendiri sebagai target
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef} 
      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex-1"
    >
      <h3 className="font-bold mb-4 text-lg">{title}</h3>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 min-h-[100px]"> 
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskBoard({ initialTasks, members, projectId }: TaskBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FullTask | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const taskColumns = useMemo(() => {
    const columns: { [key: string]: FullTask[] } = {
      todo: [],
      "in-progress": [],
      done: [],
    };
    tasks.forEach((task) => {
      if (columns[task.status]) {
        columns[task.status].push(task);
      }
    });
    return columns;
  }, [tasks]);

  // Logika untuk menangani event drag-end ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Tentukan status baru berdasarkan kolom tempat task diletakkan
    const overIsColumn = ['todo', 'in-progress', 'done'].includes(String(overId));
    let newStatus = activeTask.status;

    if (overIsColumn) {
      newStatus = String(overId);
    } else {
      // Cari kolom dari task yang berada di bawahnya
      for (const status in taskColumns) {
        if (taskColumns[status].some((task) => task.id === overId)) {
          newStatus = status;
          break;
        }
      }
    }

    if (newStatus === activeTask.status) return;

    // Update UI secara optimis
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === activeId ? { ...task, status: newStatus } : task
      )
    );

    // Panggil API untuk menyimpan perubahan di database
    fetch(`/api/projects/${projectId}/tasks/${active.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    }).catch(err => {
        // Jika gagal, kembalikan ke state semula (opsional)
        console.error("Failed to update task status:", err);
        setTasks(initialTasks); // atau tampilkan pesan error
    });
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    router.refresh();
  };

  const handleAddTaskClick = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleTaskClick = (task: FullTask) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleAddTaskClick}>Add New Task</Button>
          </div>
          <div className="flex gap-6 flex-col md:flex-row">
            <TaskColumn id="todo" title="To Do" tasks={taskColumns.todo} onTaskClick={handleTaskClick} />
            <TaskColumn id="in-progress" title="In Progress" tasks={taskColumns["in-progress"]} onTaskClick={handleTaskClick} />
            <TaskColumn id="done" title="Done" tasks={taskColumns.done} onTaskClick={handleTaskClick} />
          </div>
        </div>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
          </DialogHeader>
          <TaskForm projectId={projectId} members={members} initialData={editingTask} onSubmitSuccess={handleFormSubmit} />
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
