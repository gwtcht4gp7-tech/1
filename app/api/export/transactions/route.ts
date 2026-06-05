import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDateInput } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | number | null) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { date: "desc" },
  });
  const rows = [
    ["date", "type", "amount", "category", "note"],
    ...transactions.map((transaction) => [
      formatDateInput(transaction.date),
      transaction.type,
      (transaction.amount / 100).toFixed(2),
      transaction.category.name,
      transaction.note ?? "",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const date = formatDateInput(new Date());

  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="focusboard-transactions-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
