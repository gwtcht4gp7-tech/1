"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCoordinate, getWeatherLabel } from "@/lib/weather";

type WeatherData = {
  apparentTemperature: number;
  humidity: number;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
};

type LocationData = {
  accuracy: number;
  latitude: number;
  longitude: number;
};

type LoadState = "idle" | "loading" | "ready" | "error";

function getPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 1000 * 60 * 10,
      timeout: 10000,
    });
  });
}

async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");

  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather service is unavailable.");
  }

  const data = (await response.json()) as {
    current?: {
      apparent_temperature?: number;
      relative_humidity_2m?: number;
      temperature_2m?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
  };
  const current = data.current;

  if (
    !current ||
    typeof current.temperature_2m !== "number" ||
    typeof current.apparent_temperature !== "number" ||
    typeof current.relative_humidity_2m !== "number" ||
    typeof current.weather_code !== "number" ||
    typeof current.wind_speed_10m !== "number"
  ) {
    throw new Error("Weather response is incomplete.");
  }

  return {
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    temperature: current.temperature_2m,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
  };
}

export function LocalContextCard({ zh = false }: Readonly<{ zh?: boolean }>) {
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  async function refresh() {
    setStatus("loading");
    setError(null);

    if (!navigator.geolocation) {
      setStatus("error");
      setError(zh ? "当前设备不支持位置读取。" : "This device does not support location access.");
      return;
    }

    try {
      const position = await getPosition();
      const nextLocation = {
        accuracy: position.coords.accuracy,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const nextWeather = await fetchWeather(nextLocation.latitude, nextLocation.longitude);

      setLocation(nextLocation);
      setWeather(nextWeather);
      setStatus("ready");
    } catch (refreshError) {
      setStatus("error");
      setError(
        refreshError instanceof GeolocationPositionError
          ? zh
            ? "无法读取位置。请允许位置权限后重试。"
            : "Location is unavailable. Allow location access and try again."
          : zh
            ? "天气暂时无法读取，请稍后重试。"
            : "Weather is unavailable. Please try again later.",
      );
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            {zh ? "现实环境" : "Live context"}
          </p>
          <h2 className="mt-2 text-lg font-semibold">{zh ? "时间、位置和天气" : "Time, location, weather"}</h2>
        </div>
        <button
          className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === "loading"}
          onClick={refresh}
          type="button"
        >
          {status === "loading"
            ? zh
              ? "读取中..."
              : "Loading..."
            : status === "idle"
              ? zh
                ? "读取位置和天气"
                : "Load location and weather"
              : zh
                ? "刷新"
                : "Refresh"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">{zh ? "当前时间" : "Current time"}</p>
          <p className="mt-2 text-lg font-semibold">
            {now.toLocaleString(zh ? "zh-CN" : "en-US", {
              dateStyle: "medium",
              timeStyle: "medium",
            })}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{timeZone}</p>
        </div>

        <div className="rounded-md border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">{zh ? "当前位置" : "Current location"}</p>
          {location ? (
            <>
              <p className="mt-2 text-lg font-semibold">
                {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {zh ? `精度约 ${Math.round(location.accuracy)} 米` : `Accuracy about ${Math.round(location.accuracy)} m`}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">
              {status === "loading"
                ? zh
                  ? "正在请求位置权限。"
                  : "Requesting location access."
                : zh
                  ? "尚未读取位置。"
                  : "Location not loaded yet."}
            </p>
          )}
        </div>

        <div className="rounded-md border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">{zh ? "当前天气" : "Current weather"}</p>
          {weather ? (
            <>
              <p className="mt-2 text-lg font-semibold">
                {Math.round(weather.temperature)}°C · {getWeatherLabel(weather.weatherCode, zh)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {zh
                  ? `体感 ${Math.round(weather.apparentTemperature)}°C，湿度 ${weather.humidity}%`
                  : `Feels ${Math.round(weather.apparentTemperature)}°C, humidity ${weather.humidity}%`}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {zh ? `风速 ${Math.round(weather.windSpeed)} km/h` : `Wind ${Math.round(weather.windSpeed)} km/h`}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">
              {status === "loading"
                ? zh
                  ? "正在读取天气。"
                  : "Loading weather."
                : zh
                  ? "尚未读取天气。"
                  : "Weather not loaded yet."}
            </p>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
