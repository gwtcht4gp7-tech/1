import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDateInput } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [todos, habits, habitCheckIns, transactions, categories, marketAssets] = await Promise.all([
    prisma.todo.findMany({ where: { userId: user.id } }),
    prisma.habit.findMany({ where: { userId: user.id } }),
    prisma.habitCheckIn.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      include: { category: true },
    }),
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.marketAsset.findMany({ where: { userId: user.id } }),
  ]);
  const date = formatDateInput(new Date());

  return new NextResponse(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        todos,
        habits,
        habitCheckIns,
        transactions,
        categories,
        marketAssets,
      },
      null,
      2,
    ),
    {
      headers: {
        "Content-Disposition": `attachment; filename="focusboard-${date}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
