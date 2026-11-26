"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Un momento…",
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-pole text-white hover:bg-pole-dark",
    secondary: "border border-ink bg-paper text-ink hover:bg-ground",
    quiet: "text-slate underline underline-offset-4 hover:text-pole",
  }[variant];
  const size = variant === "quiet" ? "px-1 py-1" : "px-4 py-2.5";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-md text-sm font-semibold disabled:opacity-60 ${size} ${styles} ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
