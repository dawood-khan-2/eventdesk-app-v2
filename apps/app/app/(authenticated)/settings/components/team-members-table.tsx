"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeTeamMember } from "../actions";

type TeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
};

type TeamMembersTableProps = {
  members: TeamMember[];
};

export function TeamMembersTable({ members }: TeamMembersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const handleDelete = (userId: string) => {
    startTransition(async () => {
      const result = await removeTeamMember(userId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Team member removed successfully");
      setDeletingMember(null);
    });
  };

  const confirmDelete = (member: TeamMember) => {
    setDeletingMember(member);
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No team members yet. Invite members to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmDelete(member)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingMember?.name} from the organization? 
              They will lose access to all organization resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMember && handleDelete(deletingMember.userId)}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
