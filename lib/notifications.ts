export type DeadlineProject = {
  id: string;
  name: string;
  sections?: {
    estimatedCompletionDate?: string;
    softOpening?: boolean;
  };
  phase?: string;
};

export type DeadlineNotification = {
  id: string;
  kind: "deadline";
  title: string;
  message: string;
  timestamp: string;
  projectId: string;
  tone: "amber";
};

/** Returns active projects whose deadline is today or within the next three days. */
export function getApproachingDeadlineNotifications(
  projects: DeadlineProject[],
  now = new Date(),
): DeadlineNotification[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfWindow = new Date(startOfToday);
  endOfWindow.setDate(endOfWindow.getDate() + 3);

  return projects
    .filter((project) => !project.sections?.softOpening && project.phase !== "Selesai")
    .flatMap((project) => {
      const deadline = project.sections?.estimatedCompletionDate;
      if (!deadline) return [];

      const deadlineDate = new Date(`${deadline}T00:00:00`);
      if (Number.isNaN(deadlineDate.getTime()) || deadlineDate < startOfToday || deadlineDate > endOfWindow) return [];

      const daysRemaining = Math.round((deadlineDate.getTime() - startOfToday.getTime()) / 86400000);
      const message = daysRemaining === 0
        ? "Deadline project hari ini"
        : `Deadline project dalam ${daysRemaining} hari`;

      return [{
        id: `deadline-${project.id}-${deadline}`,
        kind: "deadline" as const,
        title: `${project.name} mendekati deadline`,
        message,
        timestamp: deadlineDate.toISOString(),
        projectId: project.id,
        tone: "amber" as const,
      }];
    });
}
