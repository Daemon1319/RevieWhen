export type ErrorLogStatus = "open" | "reviewed" | "resolved";

export type Subject = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Topic = {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Subtopic = {
  id: string;
  user_id: string;
  topic_id: string;
  name: string;
  is_done: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ErrorLog = {
  id: string;
  user_id: string;
  subject_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
  title: string;
  notes: string | null;
  status: ErrorLogStatus;
  remind_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudySession = {
  id: string;
  user_id: string;
  subject_id: string | null;
  topic_id: string | null;
  started_at: string;
  ended_at: string;
  duration_sec: number;
  note: string | null;
  created_at: string;
};

export type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_done: boolean;
  due_at: string | null;
  subject_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ScoreLog = {
  id: string;
  user_id: string;
  quiz_name: string;
  score: number;
  total_items: number;
  notes: string | null;
  taken_at: string;
  created_at: string;
  updated_at: string;
};

export type ScoreLogSubject = {
  score_log_id: string;
  subject_id: string;
  user_id: string;
};

export type ScoreLogWithSubjects = ScoreLog & {
  subject_ids: string[];
};
