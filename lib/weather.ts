const weatherLabels = {
  0: { en: "Clear sky", zh: "晴朗" },
  1: { en: "Mostly clear", zh: "大致晴朗" },
  2: { en: "Partly cloudy", zh: "局部多云" },
  3: { en: "Cloudy", zh: "阴天" },
  45: { en: "Fog", zh: "有雾" },
  48: { en: "Rime fog", zh: "雾凇" },
  51: { en: "Light drizzle", zh: "小毛毛雨" },
  53: { en: "Drizzle", zh: "毛毛雨" },
  55: { en: "Dense drizzle", zh: "较强毛毛雨" },
  61: { en: "Light rain", zh: "小雨" },
  63: { en: "Rain", zh: "中雨" },
  65: { en: "Heavy rain", zh: "大雨" },
  71: { en: "Light snow", zh: "小雪" },
  73: { en: "Snow", zh: "中雪" },
  75: { en: "Heavy snow", zh: "大雪" },
  80: { en: "Light showers", zh: "小阵雨" },
  81: { en: "Showers", zh: "阵雨" },
  82: { en: "Heavy showers", zh: "强阵雨" },
  95: { en: "Thunderstorm", zh: "雷暴" },
  96: { en: "Thunderstorm with hail", zh: "雷暴伴冰雹" },
  99: { en: "Severe thunderstorm with hail", zh: "强雷暴伴冰雹" },
} as const;

export function getWeatherLabel(code: number, zh = false) {
  const label = weatherLabels[code as keyof typeof weatherLabels];

  if (!label) {
    return zh ? "未知天气" : "Unknown weather";
  }

  return zh ? label.zh : label.en;
}

export function formatCoordinate(value: number) {
  return value.toFixed(4);
}
