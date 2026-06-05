import { logoutAction } from "@/app/actions/auth";

export function LogoutForm({ zh = false }: Readonly<{ zh?: boolean }>) {
  return (
    <form action={logoutAction}>
      <button
        className="h-10 w-full rounded-md border border-zinc-300 px-4 text-left text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-100 sm:w-auto"
        type="submit"
      >
        {zh ? "退出登录" : "Sign out"}
      </button>
    </form>
  );
}
