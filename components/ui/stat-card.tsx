import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

type StatCardProps = {
  label: string;
  value: ReactNode;
  href?: string;
  linkLabel?: string;
  valueClassName?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  href,
  linkLabel,
  valueClassName,
  className,
}: StatCardProps) {
  return (
    <div className={cn(ui.card, ui.cardPad, className)}>
      <p className={ui.sectionLabel}>{label}</p>
      <p className={cn(ui.statValue, valueClassName)}>{value}</p>
      {href && linkLabel ? (
        <Link href={href} className={cn(ui.link, "mt-3 inline-flex")}>
          {linkLabel}
          <span aria-hidden className="ml-0.5">
            →
          </span>
        </Link>
      ) : null}
    </div>
  );
}
