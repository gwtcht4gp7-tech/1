"use client";

import { useState } from "react";

async function downloadFile(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Export failed. Please try again.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? "focusboard-export";
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

export function ExportButtons({ zh = false }: Readonly<{ zh?: boolean }>) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(url: string, label: string) {
    setMessage(null);
    setError(null);

    try {
      await downloadFile(url);
      setMessage(zh ? `${label}导出成功。` : `${label} exported successfully.`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : zh ? "导出失败。" : "Export failed.");
    }
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {message}
        </p>
      ) : null}
      <button
        className="h-10 rounded-md border border-zinc-300 px-3 text-left text-sm font-medium"
        onClick={() => handleExport("/api/export/all", "JSON")}
        type="button"
      >
        {zh ? "导出全部数据为 JSON" : "Export all data as JSON"}
      </button>
      <button
        className="h-10 rounded-md border border-zinc-300 px-3 text-left text-sm font-medium"
        onClick={() => handleExport("/api/export/transactions", zh ? "交易 CSV" : "Transactions CSV")}
        type="button"
      >
        {zh ? "导出交易记录为 CSV" : "Export transactions as CSV"}
      </button>
    </div>
  );
}
