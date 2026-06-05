import type { TodoPriorityValue } from "@/lib/domain";

export type TodoFilter = "today" | "future" | "completed";

export type TodoFormValues = {
  id?: string;
  title: string;
  description?: string | null;
  dueDate?: string;
  priority: TodoPriorityValue;
};
