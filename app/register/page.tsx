import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-zinc-950">
      <section className="mx-auto w-full max-w-md">
        <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href="/">
          Back home
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Create account</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Create a local account. Third-party login is intentionally not connected yet.
        </p>
        <AuthForm action={registerAction} buttonLabel="Create account" mode="register" />
        <p className="mt-6 text-sm text-zinc-600">
          Already have an account?{" "}
          <Link className="font-medium text-teal-700 hover:text-teal-800" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
