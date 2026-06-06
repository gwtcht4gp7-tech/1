"use client";

import { useEffect, useState } from "react";
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
  confirmLabel = "Confirm",
  message,
  pendingLabel = "Deleting...",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  confirmLabel?: string;
  message: string;
  pendingLabel?: string;
}>) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) {
      return;
    }

    const timer = window.setTimeout(() => setArmed(false), 4000);

    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <button
      aria-label={armed ? confirmLabel : message}
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!armed) {
          event.preventDefault();
          setArmed(true);
        }
      }}
      type="submit"
    >
      {pending ? pendingLabel : armed ? confirmLabel : children}
    </button>
  );
}
