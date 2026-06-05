"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
  pendingLabel = "Saving...",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}>) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function ConfirmSubmitButton({
  children,
  className,
  message,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  message: string;
}>) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? "Deleting..." : children}
    </button>
  );
}
