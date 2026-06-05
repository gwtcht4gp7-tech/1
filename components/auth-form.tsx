"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthFormState } from "@/app/actions/auth";

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  buttonLabel: string;
  mode: "login" | "register";
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Please wait..." : label}
    </button>
  );
}

export function AuthForm({ action, buttonLabel, mode }: AuthFormProps) {
  const [state, formAction] = useActionState(action, {});
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="mt-8 grid gap-5" noValidate>
      {state.error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      {isRegister ? (
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Name
          <input
            autoComplete="name"
            className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            name="name"
            type="text"
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Email
        <input
          autoComplete="email"
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          name="email"
          required
          type="email"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Password
        <input
          autoComplete={isRegister ? "new-password" : "current-password"}
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>

      <SubmitButton label={buttonLabel} />
    </form>
  );
}
