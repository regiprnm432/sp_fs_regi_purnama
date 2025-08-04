"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User, Membership, Project } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FullMember = Membership & { user: User };

interface SettingsClientProps {
  project: Project;
  members: FullMember[];
}

export function SettingsClient({ project, members }: SettingsClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fungsi untuk mencari user saat diketik
  const handleSearch = async (search: string) => {
    if (search.length < 2) {
      setUsers([]);
      return;
    }
    const response = await fetch(`/api/users?email=${search}`);
    const data = await response.json();
    setUsers(data);
  };

  // Fungsi untuk mengundang member
  const handleInvite = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    await fetch(`/api/projects/${project.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id }),
    });
    router.refresh();
    setSelectedUser(null);
    setIsLoading(false);
  };

  // Fungsi untuk menghapus project
  const handleDeleteProject = async () => {
    setIsLoading(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  };

  // Fungsi untuk menangani export data ---
  const handleExport = () => {
    // Buka URL API di tab baru, browser akan otomatis mengunduh file
    window.open(`/api/projects/${project.id}/export`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Bagian Invite Member */}
      <div>
        <h3 className="text-lg font-medium">Invite Members</h3>
        <p className="text-sm text-muted-foreground">
          Add new members to collaborate on this project.
        </p>
        <div className="mt-4 flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-[250px] justify-between">
                {selectedUser ? selectedUser.email : "Select user..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search user by email..." onValueChange={handleSearch} />
                <CommandList>
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.email}
                        onSelect={() => {
                          setSelectedUser(user);
                          setOpen(false);
                        }}
                      >
                        {user.email}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button onClick={handleInvite} disabled={!selectedUser || isLoading}>
            {isLoading ? "Inviting..." : "Invite"}
          </Button>
        </div>
      </div>

      {/* Bagian Daftar Member */}
      <div>
        <h3 className="text-lg font-medium">Project Members</h3>
        <div className="mt-4 space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
              <span>{member.user.email}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- Bagian Data Management --- */}
      <div className="rounded-lg border p-4">
        <h3 className="text-lg font-medium">Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Export all project data including tasks and members to a JSON file.
        </p>
        <Button variant="outline" className="mt-4" onClick={handleExport}>
          Export Project Data
        </Button>
      </div>

      {/* Bagian Danger Zone */}
      <div className="rounded-lg border border-destructive p-4">
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Deleting a project is a permanent action and cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-4">Delete Project</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                project and all of its associated tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProject} disabled={isLoading}>
                {isLoading ? "Deleting..." : "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
