import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12 text-zinc-950">
      <section className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold">
              Welcome{user.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-2 text-sm text-zinc-600">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Account status</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Local authentication is active. Data export and PWA support will be added in later stages.
          </p>
        </div>
      </section>
    </main>
  );
}
