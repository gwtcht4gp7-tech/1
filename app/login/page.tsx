import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
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
        <h1 className="mt-8 text-3xl font-semibold">Log in</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Use your local account to continue.
        </p>
        <AuthForm action={loginAction} buttonLabel="Log in" mode="login" />
        <p className="mt-6 text-sm text-zinc-600">
          No account?{" "}
          <Link className="font-medium text-teal-700 hover:text-teal-800" href="/register">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
