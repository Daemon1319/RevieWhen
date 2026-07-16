import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className={ui.pageHeader}>
        <h1 className={ui.pageTitle}>{title}</h1>
        {description ? <p className={ui.pageDesc}>{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
