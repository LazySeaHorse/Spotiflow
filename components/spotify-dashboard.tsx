"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Play, ExternalLink, LogOut, Loader2 } from "lucide-react"
import { AudioFeatureChart } from "@/components/audio-feature-chart"
import { useDebounce } from "@/hooks/use-debounce"

interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

interface SpotifyConfig {
  clientId: string
  redirectUri: string
}

interface Track {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string; width: number; height: number }[]
  }
  preview_url: string | null
  external_urls: { spotify: string }
}

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

interface SpotifyDashboardProps {
  tokens: SpotifyTokens
  config: SpotifyConfig
  onLogout: () => void
}

const AUDIO_FEATURES = [
  { key: "danceability", label: "Danceability", max: 1 },
  { key: "energy", label: "Energy", max: 1 },
  { key: "valence", label: "Valence", max: 1 },
  { key: "acousticness", label: "Acousticness", max: 1 },
  { key: "instrumentalness", label: "Instrumentalness", max: 1 },
  { key: "liveness", label: "Liveness", max: 1 },
  { key: "speechiness", label: "Speechiness", max: 1 },
  { key: "tempo", label: "Tempo", max: 200 },
] as const

export function SpotifyDashboard({ tokens, config, onLogout }: SpotifyDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null)
  const [adjustedFeatures, setAdjustedFeatures] = useState<AudioFeatures | null>(null)
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({})
  const [recommendations, setRecommendations] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [user, setUser] = useState<{ display_name: string } | null>(null)

  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const debouncedFeatures = useDebounce(adjustedFeatures, 500)

  const spotifyApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      try {
        const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
            ...options.headers,
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error(`Spotify API error: ${response.status}`, errorData)

          if (response.status === 403) {
            throw new Error(`Access denied. Please check your Spotify app permissions and scopes.`)
          }

          throw new Error(`Spotify API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`)
        }

        return response.json()
      } catch (error) {
        console.error("Spotify API call failed:", error)
        throw error
      }
    },
    [tokens.access_token],
  )

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await spotifyApi("/me")
        setUser(userData)
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }
    fetchUser()
  }, [spotifyApi])

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      searchTracks(debouncedSearchQuery)
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchQuery])

  useEffect(() => {
    if (selectedTrack && debouncedFeatures) {
      fetchRecommendations()
    }
  }, [selectedTrack, debouncedFeatures, enabledFeatures])

  const searchTracks = async (query: string) => {
    setSearchLoading(true)
    try {
      const data = await spotifyApi(`/search?q=${encodeURIComponent(query)}&type=track&limit=10`)
      setSearchResults(data.tracks.items)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  const selectTrack = async (track: Track) => {
    setSelectedTrack(track)
    setLoading(true)

    try {
      console.log("Fetching audio features for track:", track.id)
      const features = await spotifyApi(`/audio-features/${track.id}`)
      console.log("Audio features received:", features)

      if (features && typeof features === "object" && features.danceability !== undefined) {
        setAudioFeatures(features)
        setAdjustedFeatures(features)

        // Enable all features by default
        const enabled = AUDIO_FEATURES.reduce(
          (acc, feature) => {
            acc[feature.key] = true
            return acc
          },
          {} as Record<string, boolean>,
        )
        setEnabledFeatures(enabled)
      } else {
        console.error("Invalid audio features response:", features)
        throw new Error("Invalid audio features data received")
      }
    } catch (error) {
      console.error("Failed to fetch audio features:", error)
      // Show user-friendly error
      alert(`Failed to fetch audio features: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    if (!selectedTrack || !adjustedFeatures) return

    try {
      console.log("Fetching recommendations for track:", selectedTrack.id)
      const params = new URLSearchParams({
        seed_tracks: selectedTrack.id,
        limit: "20",
      })

      // Add target parameters for enabled features
      AUDIO_FEATURES.forEach((feature) => {
        if (enabledFeatures[feature.key] && adjustedFeatures[feature.key] !== undefined) {
          params.append(`target_${feature.key}`, adjustedFeatures[feature.key].toString())
        }
      })

      console.log("Recommendation params:", params.toString())
      const data = await spotifyApi(`/recommendations?${params.toString()}`)
      console.log("Recommendations received:", data)

      if (data && data.tracks && Array.isArray(data.tracks)) {
        setRecommendations(data.tracks)
      } else {
        console.error("Invalid recommendations response:", data)
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error)
      // Don't show alert for recommendations as it's less critical
    }
  }

  const handleFeatureChange = (feature: string, value: number) => {
    if (adjustedFeatures) {
      setAdjustedFeatures({
        ...adjustedFeatures,
        [feature]: value,
      })
    }
  }

  const toggleFeature = (feature: string, enabled: boolean) => {
    setEnabledFeatures((prev) => ({
      ...prev,
      [feature]: enabled,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-green-500 p-2 rounded-full">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Spotify Audio Analyzer</h1>
                {user && <p className="text-sm text-gray-500">Welcome, {user.display_name}</p>}
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Search Tracks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search for a track..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-96">
                  {searchLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((track) => (
                        <div
                          key={track.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTrack?.id === track.id ? "bg-green-50 border-green-200" : "hover:bg-gray-50"
                          }`}
                          onClick={() => selectTrack(track)}
                        >
                          <div className="flex items-center space-x-3">
                            {track.album.images[0] && (
                              <img
                                src={track.album.images[0].url || "/placeholder.svg"}
                                alt={track.album.name}
                                className="w-12 h-12 rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{track.name}</p>
                              <p className="text-sm text-gray-500 truncate">
                                {track.artists.map((a) => a.name).join(", ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-2">
            {selectedTrack ? (
              <div className="space-y-6">
                {/* Selected Track Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                      {selectedTrack.album.images[0] && (
                        <img
                          src={selectedTrack.album.images[0].url || "/placeholder.svg"}
                          alt={selectedTrack.album.name}
                          className="w-16 h-16 rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h2 className="text-xl font-bold">{selectedTrack.name}</h2>
                        <p className="text-gray-600">{selectedTrack.artists.map((a) => a.name).join(", ")}</p>
                        <p className="text-sm text-gray-500">{selectedTrack.album.name}</p>
                      </div>
                      <div className="flex space-x-2">
                        {selectedTrack.preview_url && (
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <a href={selectedTrack.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Spotify
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Toggles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendation Parameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {AUDIO_FEATURES.map((feature) => (
                        <div key={feature.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={feature.key}
                            checked={enabledFeatures[feature.key] || false}
                            onCheckedChange={(checked) => toggleFeature(feature.key, checked as boolean)}
                          />
                          <label
                            htmlFor={feature.key}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {feature.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Audio Features Chart */}
                {loading ? (
                  <Card>
                    <CardContent className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </CardContent>
                  </Card>
                ) : audioFeatures && adjustedFeatures ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Audio Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AudioFeatureChart
                        features={adjustedFeatures}
                        enabledFeatures={enabledFeatures}
                        onFeatureChange={handleFeatureChange}
                      />
                    </CardContent>
                  </Card>
                ) : null}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.slice(0, 10).map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                          >
                            {track.album.images[0] && (
                              <img
                                src={track.album.images[0].url || "/placeholder.svg"}
                                alt={track.album.name}
                                className="w-12 h-12 rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{track.name}</p>
                              <p className="text-sm text-gray-500 truncate">
                                {track.artists.map((a) => a.name).join(", ")}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              {track.preview_url && (
                                <Button size="sm" variant="ghost">
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" asChild>
                                <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Search for a track to get started</h3>
                  <p className="text-gray-500 text-center">
                    Use the search bar to find a track and analyze its audio features
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
