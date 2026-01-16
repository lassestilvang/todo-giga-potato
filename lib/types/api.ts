import { Task, List, Label } from '@prisma/client';

// Base entity types with relations
export type TaskWithRelations = Task & {
  list: List;
  labels: Label[];
  subtasks: Task[];
  attachments: any[];
  reminders: any[];
  history: any[];
};

export type ListWithRelations = List & {
  tasks: Task[];
};

export type LabelWithRelations = Label & {
  tasks: Task[];
};

// API Response types
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type SearchResponse = PaginatedResponse<TaskWithRelations & { score: number }> & {
  query: string;
};

// Error response type
export type ErrorResponse = {
  error: string;
  details?: any;
};

// Task API request types
export type CreateTaskRequest = {
  name: string;
  description?: string;
  date?: string;
  deadline?: string;
  estimates?: number;
  actualTime?: number;
  priority?: number;
  isRecurring?: boolean;
  recurringPattern?: string;
  listId: string;
  userId: string;
  labels?: string[];
};

export type UpdateTaskRequest = Partial<CreateTaskRequest> & {
  completedAt?: string;
};

// List API request types
export type CreateListRequest = {
  name: string;
  emoji?: string;
  color?: string;
  isDefault?: boolean;
  isFavorite?: boolean;
  userId: string;
};

export type UpdateListRequest = Partial<CreateListRequest>;

// Label API request types
export type CreateLabelRequest = {
  name: string;
  color: string;
  userId: string;
};

export type UpdateLabelRequest = Partial<CreateLabelRequest>;

// Search API query parameters
export type SearchQueryParams = {
  q: string;
  page?: number;
  limit?: number;
  listId?: string;
  completed?: boolean;
  priority?: number;
};

// Tasks API query parameters
export type TasksQueryParams = Omit<SearchQueryParams, 'q'> & {
  search?: string;
  date?: string;
};
