"use client";

export default function ErrorPage({
  error,
  reset,
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h1 className="text-lg font-semibold text-red-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-red-800">{error.message || "Please try again."}</p>
      <button
        className="mt-4 h-10 rounded-md bg-red-700 px-4 text-sm font-semibold text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
