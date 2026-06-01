"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@repo/design-system/components/ui/sheet";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@repo/design-system/components/ui/radio-group";
import { CalendarIcon, X, Plus } from "lucide-react";
import { createTask, getOrganizationMembers } from "../actions";
import { getUserRole } from "../../../lib/get-user-role";
import { toast } from "sonner";
import { useTransition, useState, useEffect } from "react";
import { cn } from "@repo/design-system/lib/utils";
import { format } from "date-fns";

interface TaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess: () => void;
  parentTaskId?: string;
  inheritedPriority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  inheritedType?: "PRE_EVENT" | "ON_EVENT" | "POST_EVENT";
}

interface ChecklistItem {
  id: string;
  title: string;
}

export function TaskSheet({ open, onOpenChange, eventId, onSuccess, parentTaskId, inheritedPriority, inheritedType }: TaskSheetProps) {
  const [isPending, startTransition] = useTransition();
  const isSubtask = !!parentTaskId;
  const [fieldErrors, setFieldErrors] = useState({ title: false });
  
  // Form state
  const [type, setType] = useState<"PRE_EVENT" | "ON_EVENT" | "POST_EVENT">("PRE_EVENT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [status, setStatus] = useState<"TO_DO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">("TO_DO");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [members, setMembers] = useState<Array<{ id: string; name: string; email: string; isCurrentUser: boolean }>>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Load user role and organization members
  useEffect(() => {
    async function loadData() {
      const [role, membersResult] = await Promise.all([
        getUserRole(),
        getOrganizationMembers(),
      ]);
      
      setUserRole(role);
      
      if (membersResult.data) {
        setMembers(membersResult.data);
      }
    }
    loadData();
  }, []);

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (open) {
      setType(inheritedType || "PRE_EVENT");
      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setPriority(inheritedPriority || "MEDIUM");
      setStatus("TO_DO");
      
      // For org:member, auto-assign to themselves
      if (userRole === "org:member" && members.length > 0) {
        const currentUser = members.find(m => m.isCurrentUser);
        if (currentUser) {
          setAssigneeId(currentUser.id);
        }
      } else {
        setAssigneeId("");
      }
      
      setChecklistItems([]);
    }
  }, [open, inheritedPriority, inheritedType, userRole, members]);

  const handleAddChecklistItem = () => {
    setChecklistItems([...checklistItems, { id: crypto.randomUUID(), title: "" }]);
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  const handleChecklistItemChange = (id: string, value: string) => {
    setChecklistItems(checklistItems.map(item => 
      item.id === id ? { ...item, title: value } : item
    ));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset field errors
    setFieldErrors({ title: false });
    
    // Validation
    if (!title.trim()) {
      setFieldErrors({ title: true });
      toast.error("Task title is required");
      return;
    }

    // Filter out empty checklist items
    const validChecklistItems = checklistItems
      .filter(item => item.title.trim())
      .map(item => ({ title: item.title.trim() }));

    startTransition(async () => {
      const data = {
        eventId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        priority,
        status,
        type,
        parentTaskId,
        assigneeId: assigneeId === "unassigned" ? undefined : assigneeId || undefined,
        checklistItems: validChecklistItems.length > 0 ? validChecklistItems : undefined,
      };

      const result = await createTask(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Task created successfully");
        onSuccess();
        onOpenChange(false);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isSubtask ? "Create New Sub Task" : "Create New Task"}</SheetTitle>
          <SheetDescription>
            {isSubtask 
              ? "Add a subtask. Type and priority are inherited from the parent task."
              : "Add a task with optional checklist items for this event."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-6 py-6 px-6">
          {/* Task Type - Radio Buttons */}
          <div className="space-y-3">
            <Label>Task Type *</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(value) => setType(value as typeof type)} 
              className="flex flex-col sm:flex-row sm:gap-6"
              disabled={!!inheritedType}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PRE_EVENT" id="pre-event" />
                <Label htmlFor="pre-event" className="font-normal cursor-pointer">
                  Pre-Event
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ON_EVENT" id="on-event" />
                <Label htmlFor="on-event" className="font-normal cursor-pointer">
                  On-Event
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="POST_EVENT" id="post-event" />
                <Label htmlFor="post-event" className="font-normal cursor-pointer">
                  Post-Event
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              aria-invalid={fieldErrors.title}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Task description..."
              className="min-h-[100px] max-h-80"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Priority and Status in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select 
                value={priority} 
                onValueChange={(value) => setPriority(value as typeof priority)}
                disabled={isSubtask}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              {isSubtask && (
                <p className="text-xs text-muted-foreground">Inherited from parent task</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO_DO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Assign To</Label>
            <Select 
              value={assigneeId || "unassigned"} 
              onValueChange={setAssigneeId}
              disabled={userRole === "org:member"}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userRole === "org:member" && (
              <p className="text-xs text-muted-foreground">Tasks are automatically assigned to you</p>
            )}
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Checklist Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddChecklistItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Item
              </Button>
            </div>
            
            {checklistItems.length > 0 && (
              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Checklist item"
                      value={item.title}
                      onChange={(e) => handleChecklistItemChange(item.id, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SheetFooter className="sticky bottom-0 flex-col gap-2 bg-background border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
