import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCurrentStreak,
  formatDateInput,
  normalizeMoneyAmount,
  normalizeTodoInput,
  parseDateInput,
} from "../lib/domain.ts";
import { formatCoordinate, getWeatherLabel } from "../lib/weather.ts";
import {
  buildSparklinePath,
  getPriceChange,
  normalizeMarketAssetInput,
} from "../lib/market.ts";

test("normalizes a valid todo input", () => {
  const result = normalizeTodoInput({
    title: "  Pay rent  ",
    description: "  Before noon  ",
    dueDate: "2026-06-04",
    priority: "high",
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.value.title, "Pay rent");
    assert.equal(result.value.description, "Before noon");
    assert.equal(result.value.priority, "high");
    assert.equal(formatDateInput(result.value.dueDate as Date), "2026-06-04");
  }
});

test("rejects invalid todo titles and priority values", () => {
  assert.deepEqual(
    normalizeTodoInput({ title: " ", priority: "high" }),
    { ok: false, error: "Todo title must be at least 2 characters." },
  );

  assert.deepEqual(
    normalizeTodoInput({ title: "Valid title", priority: "urgent" }),
    { ok: false, error: "Choose a valid priority." },
  );
});

test("parses money amounts into cents and rejects invalid values", () => {
  assert.deepEqual(normalizeMoneyAmount("12.34"), { ok: true, value: 1234 });
  assert.deepEqual(
    normalizeMoneyAmount("-1"),
    { ok: false, error: "Amount must be greater than zero." },
  );
});

test("calculates current habit streak ending today", () => {
  const today = parseDateInput("2026-06-04") as Date;
  const checkIns = ["2026-06-02", "2026-06-03", "2026-06-04"].map(
    (value) => parseDateInput(value) as Date,
  );

  assert.equal(calculateCurrentStreak(checkIns, today), 3);
});

test("formats weather labels and coordinates", () => {
  assert.equal(getWeatherLabel(0), "Clear sky");
  assert.equal(getWeatherLabel(61, true), "小雨");
  assert.equal(getWeatherLabel(999), "Unknown weather");
  assert.equal(formatCoordinate(31.230416), "31.2304");
});

test("normalizes market asset input", () => {
  assert.deepEqual(
    normalizeMarketAssetInput({ symbol: " btc ", type: "crypto" }),
    { ok: true, value: { name: null, symbol: "BTC", type: "crypto" } },
  );
  assert.deepEqual(
    normalizeMarketAssetInput({ symbol: "bad symbol", type: "stock" }),
    { ok: false, error: "Use 1-12 letters or numbers for the symbol." },
  );
});

test("calculates market price change and sparkline path", () => {
  const points = [
    { date: "2026-06-01", price: 10 },
    { date: "2026-06-02", price: 12 },
    { date: "2026-06-03", price: 15 },
  ];

  assert.deepEqual(getPriceChange(points), { absolute: 5, percent: 50 });
  assert.match(buildSparklinePath(points), /^M 0\.00 72\.00 L 120\.00/);
});
