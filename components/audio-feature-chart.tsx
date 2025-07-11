"use client"

import type React from "react"

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AudioFeatures {
  danceability: number
  energy: number
  speechiness: number
  acousticness: number
  instrumentalness: number
  liveness: number
  valence: number
  tempo: number
}

interface AudioFeatureChartProps {
  features: AudioFeatures
  enabledFeatures: Record<string, boolean>
  onFeatureChange: (feature: string, value: number) => void
}

const FEATURE_CONFIG = {
  danceability: { label: "Danceability", color: "hsl(var(--chart-1))", max: 1 },
  energy: { label: "Energy", color: "hsl(var(--chart-2))", max: 1 },
  valence: { label: "Valence", color: "hsl(var(--chart-3))", max: 1 },
  acousticness: { label: "Acousticness", color: "hsl(var(--chart-4))", max: 1 },
  instrumentalness: { label: "Instrumentalness", color: "hsl(var(--chart-5))", max: 1 },
  liveness: { label: "Liveness", color: "hsl(var(--chart-1))", max: 1 },
  speechiness: { label: "Speechiness", color: "hsl(var(--chart-2))", max: 1 },
  tempo: { label: "Tempo", color: "hsl(var(--chart-3))", max: 200 },
}

export function AudioFeatureChart({ features, enabledFeatures, onFeatureChange }: AudioFeatureChartProps) {
  // Validate features object
  if (!features || typeof features !== "object") {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">No audio features available</p>
      </div>
    )
  }

  const chartData = Object.entries(features)
    .filter(([key, value]) => FEATURE_CONFIG[key as keyof typeof FEATURE_CONFIG] && typeof value === "number")
    .map(([key, value]) => ({
      feature: FEATURE_CONFIG[key as keyof typeof FEATURE_CONFIG]?.label || key,
      value: key === "tempo" ? Math.min(value / 200, 1) : Math.min(Math.max(value, 0), 1), // Normalize and clamp values
      actualValue: value,
      enabled: enabledFeatures[key],
      key,
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">No valid audio features to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ChartContainer config={FEATURE_CONFIG} className="mx-auto aspect-square max-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <ChartTooltipContent
                      hideLabel
                      className="w-40"
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                            style={
                              {
                                "--color-bg": data.enabled ? "hsl(var(--chart-1))" : "hsl(var(--muted))",
                              } as React.CSSProperties
                            }
                          />
                          <span className="font-medium">
                            {data.feature}: {typeof data.actualValue === "number" ? data.actualValue.toFixed(3) : "N/A"}
                          </span>
                        </div>
                      )}
                    />
                  )
                }
                return null
              }}
            />
            <PolarGrid />
            <PolarAngleAxis dataKey="feature" />
            <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} />
            <Radar
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Feature Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(features)
          .filter(([key, value]) => FEATURE_CONFIG[key as keyof typeof FEATURE_CONFIG] && typeof value === "number")
          .map(([key, value]) => {
            const config = FEATURE_CONFIG[key as keyof typeof FEATURE_CONFIG]
            const isEnabled = enabledFeatures[key]

            return (
              <div
                key={key}
                className={`p-4 rounded-lg border ${
                  isEnabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">{config.label}</label>
                  <span className="text-sm text-gray-500">{value.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={config.max}
                  step={config.max === 1 ? 0.01 : 1}
                  value={value}
                  onChange={(e) => onFeatureChange(key, Number.parseFloat(e.target.value))}
                  disabled={!isEnabled}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                    isEnabled ? "bg-green-200 slider-thumb-green" : "bg-gray-200 cursor-not-allowed"
                  }`}
                />
              </div>
            )
          })}
      </div>
    </div>
  )
}
