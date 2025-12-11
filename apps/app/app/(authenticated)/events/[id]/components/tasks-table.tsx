"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { cn } from "@repo/design-system/lib/utils";
import { format } from "date-fns";
import { CheckSquare } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TO_DO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  type: "PRE_EVENT" | "ON_EVENT" | "POST_EVENT";
  checklists: Array<{
    id: string;
    title: string;
    done: boolean;
  }>;
}

interface TasksTableProps {
  tasks: Task[];
  isLoading: boolean;
  type: "PRE_EVENT" | "ON_EVENT" | "POST_EVENT";
  onTaskClick?: (task: Task) => void;
  clickable?: boolean;
}

const PRIORITY_STYLES = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const STATUS_STYLES = {
  TO_DO: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const STATUS_LABELS = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const TYPE_LABELS = {
  PRE_EVENT: "Pre-Event",
  ON_EVENT: "On-Event",
  POST_EVENT: "Post-Event",
};

function getChecklistStats(checklists: Task["checklists"]) {
  const total = checklists.length;
  const completed = checklists.filter((c) => c.done).length;
  return { completed, total };
}

export function TasksTable({ tasks, isLoading, type, onTaskClick, clickable = false }: TasksTableProps) {
  if (isLoading) {
    return (
      <>
        {/* Mobile Loading */}
        <div className="flex flex-col gap-3 md:hidden">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Loading */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No {TYPE_LABELS[type]} tasks yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks will appear here once created
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="flex flex-col gap-3 md:hidden">
        {tasks.map((task) => {
          const { completed, total } = getChecklistStats(task.checklists);
          return (
            <Card 
              key={task.id}
              className={cn(
                clickable && "cursor-pointer transition-colors hover:bg-accent"
              )}
              onClick={() => clickable && onTaskClick?.(task)}
            >
              <CardContent className="p-4">
                <div className="mb-3">
                  <h3 className="font-medium mb-1">{task.title}</h3>
                  {total > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Checklists: {completed}/{total}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 items-center text-sm">
                  {task.dueDate && (
                    <span className="text-muted-foreground">
                      📅 {format(new Date(task.dueDate), "PP")}
                    </span>
                  )}
                  <Badge className={cn("border-0", PRIORITY_STYLES[task.priority])}>
                    {PRIORITY_LABELS[task.priority]}
                  </Badge>
                  <Badge className={cn("border-0", STATUS_STYLES[task.status])}>
                    {STATUS_LABELS[task.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead className="w-[25%]">Due Date</TableHead>
              <TableHead className="w-[15%]">Priority</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const { completed, total } = getChecklistStats(task.checklists);
              return (
                <TableRow 
                  key={task.id}
                  className={cn(
                    clickable && "cursor-pointer hover:bg-accent/50"
                  )}
                  onClick={() => clickable && onTaskClick?.(task)}
                >
                  <TableCell className="w-[40%]">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {total > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Checklists: {completed}/{total}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-[25%]">
                    {task.dueDate ? format(new Date(task.dueDate), "PP") : "-"}
                  </TableCell>
                  <TableCell className="w-[15%]">
                    <Badge className={cn("border-0", PRIORITY_STYLES[task.priority])}>
                      {PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[20%]">
                    <Badge className={cn("border-0", STATUS_STYLES[task.status])}>
                      {STATUS_LABELS[task.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
