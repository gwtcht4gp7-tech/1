"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { normalizeMarketAssetInput } from "@/lib/market";
import { prisma } from "@/lib/prisma";

export type MarketActionState = {
  error?: string;
  success?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireUserId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function createMarketAssetAction(
  _previousState: MarketActionState,
  formData: FormData,
): Promise<MarketActionState> {
  const userId = await requireUserId();

  if (!userId) {
    return { error: "Please log in before adding market assets." };
  }

  const parsed = normalizeMarketAssetInput({
    name: readString(formData, "name"),
    symbol: readString(formData, "symbol"),
    type: readString(formData, "type"),
  });

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  try {
    await prisma.marketAsset.create({
      data: {
        ...parsed.value,
        userId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "This asset is already in your watchlist." };
    }

    throw error;
  }

  revalidatePath("/finance");
  return { success: "Asset added." };
}

export async function deleteMarketAssetAction(formData: FormData) {
  const userId = await requireUserId();
  const id = readString(formData, "id");

  if (!userId || !id) {
    return;
  }

  await prisma.marketAsset.deleteMany({
    where: { id, userId },
  });

  revalidatePath("/finance");
}
