"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
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
import { CalendarIcon, X, Plus, Loader2, CheckCircle2, CornerLeftUp } from "lucide-react";
import { cn } from "@repo/design-system/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  getTask,
  updateTask,
  updateChecklistItem,
  deleteChecklistItem,
  createChecklistItem,
} from "../actions";
import { TasksTable } from "./tasks-table";

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
  eventId: string;
  isSubtask?: boolean;
  onCreateSubtask?: (parentTask: any) => void;
  onSubtaskClick?: (subtask: any) => void;
  onParentTaskClick?: (parentTask: any) => void;
  onSuccess?: () => void;
}

type SavingState = "idle" | "saving" | "saved" | "error";

const TYPE_LABELS = {
  PRE_EVENT: "Pre-Event",
  ON_EVENT: "On-Event",
  POST_EVENT: "Post-Event",
};

export function TaskEditDialog({
  open,
  onOpenChange,
  taskId,
  eventId,
  isSubtask = false,
  onCreateSubtask,
  onSubtaskClick,
  onParentTaskClick,
  onSuccess,
}: TaskEditDialogProps) {
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingState, setSavingState] = useState<SavingState>("idle");
  const [isClosing, setIsClosing] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [status, setStatus] = useState<"TO_DO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">("TO_DO");
  const [checklists, setChecklists] = useState<any[]>([]);
  const [originalChecklists, setOriginalChecklists] = useState<any[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  
  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load task data
  useEffect(() => {
    if (open && taskId) {
      loadTask();
    }
  }, [open, taskId]);

  // Auto-close when save completes after user tried to close
  useEffect(() => {
    if (isClosing && savingState === "saved") {
      setIsClosing(false);
      onOpenChange(false);
    }
  }, [isClosing, savingState, onOpenChange]);

  const loadTask = async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    const result = await getTask(taskId);
    
    if (result.data) {
      setTask(result.data);
      setTitle(result.data.title);
      setDescription(result.data.description || "");
      setDueDate(result.data.dueDate ? new Date(result.data.dueDate) : undefined);
      setPriority(result.data.priority);
      setStatus(result.data.status);
      setChecklists(result.data.checklists || []);
      setOriginalChecklists(result.data.checklists || []);
    } else if (result.error) {
      toast.error(result.error);
      onOpenChange(false);
    }
    
    setIsLoading(false);
  };

  // Auto-save functions
  const saveField = async (field: string, value: any) => {
    if (!taskId) return;
    
    setSavingState("saving");
    
    const result = await updateTask(taskId, { [field]: value });
    
    if (result.error) {
      setSavingState("error");
      toast.error(result.error);
    } else {
      setSavingState("saved");
      
      // Update local task state to reflect changes, preserving subtasks and other relations
      if (result.data && task) {
        const updatedTask = { 
          ...task, 
          ...result.data,
          subtasks: task.subtasks, // Preserve subtasks initially
          event: task.event, // Preserve event
        };
        
        // If priority or type changed, update all subtasks with the new value
        if ((field === "priority" || field === "type") && task.subtasks) {
          updatedTask.subtasks = task.subtasks.map((subtask: any) => ({
            ...subtask,
            ...(field === "priority" && { priority: value }),
            ...(field === "type" && { type: value }),
          }));
        }
        
        setTask(updatedTask);
      }
      
      onSuccess?.();
    }
    
    setTimeout(() => setSavingState("idle"), 2000);
  };

  const debouncedSave = useCallback((field: string, value: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setSavingState("saving");
    
    debounceTimerRef.current = setTimeout(() => {
      saveField(field, value);
    }, 500);
  }, [taskId]);

  // Checklist handlers
  const handleToggleChecklist = async (itemId: string, done: boolean) => {
    setSavingState("saving");
    
    const result = await updateChecklistItem(itemId, { done });
    
    if (result.error) {
      toast.error(result.error);
      setSavingState("error");
    } else {
      setChecklists(checklists.map(item => 
        item.id === itemId ? { ...item, done } : item
      ));
      setSavingState("saved");
      onSuccess?.();
    }
    
    setTimeout(() => setSavingState("idle"), 2000);
  };

  const handleUpdateChecklistTitle = async (itemId: string, title: string) => {
    if (!title.trim()) return;
    
    setSavingState("saving");
    
    const result = await updateChecklistItem(itemId, { title: title.trim() });
    
    if (result.error) {
      toast.error(result.error);
      setSavingState("error");
    } else {
      setChecklists(checklists.map(item => 
        item.id === itemId ? { ...item, title: title.trim() } : item
      ));
      setSavingState("saved");
      onSuccess?.();
    }
    
    setTimeout(() => setSavingState("idle"), 2000);
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    setSavingState("saving");
    
    const result = await deleteChecklistItem(itemId);
    
    if (result.error) {
      toast.error(result.error);
      setSavingState("error");
    } else {
      setChecklists(checklists.filter(item => item.id !== itemId));
      setSavingState("saved");
      onSuccess?.();
    }
    
    setTimeout(() => setSavingState("idle"), 2000);
  };

  const handleAddChecklistItem = async () => {
    if (!taskId || !newChecklistItem.trim()) return;
    
    setSavingState("saving");
    
    const result = await createChecklistItem(taskId, newChecklistItem.trim());
    
    if (result.error) {
      toast.error(result.error);
      setSavingState("error");
    } else if (result.data) {
      setChecklists([...checklists, result.data]);
      setNewChecklistItem("");
      setSavingState("saved");
      onSuccess?.();
    }
    
    setTimeout(() => setSavingState("idle"), 2000);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && savingState === "saving") {
      // Set closing state and wait for save to complete
      setIsClosing(true);
      return;
    }
    setIsClosing(false);
    onOpenChange(open);
  };

  const handleSubtaskClick = (subtask: any) => {
    // Open subtask for editing
    onSubtaskClick?.(subtask);
  };

  if (!open || !taskId) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isSubtask && task?.parentTask && (
                  <button
                    onClick={() => onParentTaskClick?.(task.parentTask)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <CornerLeftUp className="h-3.5 w-3.5" />
                    {task.parentTask.title}
                  </button>
                )}
                <DialogTitle className="text-xl">{title || "Loading..."}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-2">
                  {task && (
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[task.type as keyof typeof TYPE_LABELS]}
                    </Badge>
                  )}
                  {savingState === "saving" && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  )}
                  {savingState === "saved" && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                  {savingState === "error" && (
                    <span className="text-xs text-red-600">Save failed</span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-8 py-4">
              {/* Basic Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Details
                </h3>
                
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== task?.title) {
                        saveField("title", e.target.value.trim());
                      }
                    }}
                    disabled={isClosing}
                  />
                </div>

                {/* Priority and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(value: any) => {
                        setPriority(value);
                        saveField("priority", value);
                      }}
                      disabled={isClosing || isSubtask}
                    >
                      <SelectTrigger id="edit-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value: any) => {
                        setStatus(value);
                        saveField("status", value);
                      }}
                      disabled={isClosing}
                    >
                      <SelectTrigger id="edit-status">
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
                        disabled={isClosing}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          setDueDate(date);
                          saveField("dueDate", date ? date.toISOString() : null);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Task description..."
                    className="min-h-[100px]"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      debouncedSave("description", e.target.value || null);
                    }}
                    disabled={isClosing}
                  />
                </div>
              </div>

              {/* Subtasks Section - Only if not a subtask */}
              {!isSubtask && task?.subtasks && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Subtasks ({task.subtasks.length})
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCreateSubtask?.(task)}
                      disabled={isClosing}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add New Sub Task
                    </Button>
                  </div>
                  
                  <TasksTable
                    tasks={task.subtasks}
                    isLoading={false}
                    type={task.type}
                    onTaskClick={handleSubtaskClick}
                    clickable
                  />
                </div>
              )}

              {/* Checklist Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Checklist ({checklists.length})
                </h3>
                
                <div className="space-y-2">
                  {checklists.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <Checkbox
                        checked={item.done}
                        onCheckedChange={(checked) => 
                          handleToggleChecklist(item.id, checked as boolean)
                        }
                        disabled={isClosing}
                      />
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          setChecklists(checklists.map(i => 
                            i.id === item.id ? { ...i, title: e.target.value } : i
                          ));
                        }}
                        onBlur={(e) => {
                          const originalItem = originalChecklists.find(i => i.id === item.id);
                          if (e.target.value.trim() && originalItem && e.target.value !== originalItem.title) {
                            handleUpdateChecklistTitle(item.id, e.target.value);
                            // Update original checklists after successful save
                            setOriginalChecklists(checklists.map(i => 
                              i.id === item.id ? { ...i, title: e.target.value } : i
                            ));
                          }
                        }}
                        className={cn(
                          "flex-1",
                          item.done && "line-through text-muted-foreground"
                        )}
                        disabled={isClosing}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        disabled={isClosing}
                        className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                  
                  {/* Add new checklist item */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add new checklist item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      disabled={isClosing}
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={handleAddChecklistItem}
                      disabled={!newChecklistItem.trim() || isClosing}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
