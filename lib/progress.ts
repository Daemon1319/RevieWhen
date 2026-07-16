import type { Subtopic, Topic } from "@/lib/types";

/** Leaf progress: 100 if done, else 0. */
export function subtopicProgress(subtopic: Pick<Subtopic, "is_done">): number {
  return subtopic.is_done ? 100 : 0;
}

/** Equal-weight average of subtopics; empty → 0. */
export function topicProgress(subtopics: Pick<Subtopic, "is_done">[]): number {
  if (subtopics.length === 0) return 0;
  const sum = subtopics.reduce((acc, s) => acc + subtopicProgress(s), 0);
  return Math.round(sum / subtopics.length);
}

/** Equal-weight average of topic percents; empty → 0. */
export function subjectProgress(topicPercents: number[]): number {
  if (topicPercents.length === 0) return 0;
  const sum = topicPercents.reduce((acc, p) => acc + p, 0);
  return Math.round(sum / topicPercents.length);
}

export function progressForTopics(
  topics: Pick<Topic, "id">[],
  subtopicsByTopicId: Map<string, Pick<Subtopic, "is_done">[]>,
): { byTopicId: Map<string, number>; subject: number } {
  const byTopicId = new Map<string, number>();
  const percents: number[] = [];

  for (const topic of topics) {
    const subs = subtopicsByTopicId.get(topic.id) ?? [];
    const p = topicProgress(subs);
    byTopicId.set(topic.id, p);
    percents.push(p);
  }

  return { byTopicId, subject: subjectProgress(percents) };
}

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  }
  if (m > 0) {
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }
  return `${s}s`;
}
