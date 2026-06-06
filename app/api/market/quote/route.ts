import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchMarketQuote, normalizeMarketAssetInput } from "@/lib/market";

function getSafeErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Market data is unavailable. Please try again later.";
  }

  if (error.message === "fetch failed" || error.message.includes("Connect Timeout")) {
    return "Market data provider is unreachable. Check your network and try again.";
  }

  return error.message;
}

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
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 502 });
  }
}
