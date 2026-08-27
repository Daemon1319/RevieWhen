"use client";

import { useEffect, useState } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function Greeting() {
  const [greeting, setGreeting] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
    setDate(getFormattedDate());
  }, []);

  // Avoid layout shift: render invisible placeholder during SSR
  if (!greeting) {
    return (
      <>
        <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
          &nbsp;
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          &nbsp;
        </h1>
      </>
    );
  }

  return (
    <>
      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
        {date}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {greeting}
      </h1>
    </>
  );
}
