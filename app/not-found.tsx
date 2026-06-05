import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-600">
        The page you are looking for does not exist.
      </p>
      <Link
        className="mt-4 inline-flex h-10 items-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white"
        href="/"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
