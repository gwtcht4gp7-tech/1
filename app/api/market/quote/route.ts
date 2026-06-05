import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchMarketQuote, normalizeMarketAssetInput } from "@/lib/market";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = normalizeMarketAssetInput({
    symbol: url.searchParams.get("symbol") ?? "",
    type: url.searchParams.get("type") ?? "",
  });

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const quote = await fetchMarketQuote(parsed.value.type, parsed.value.symbol);
    return NextResponse.json(quote);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Market data is unavailable.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
