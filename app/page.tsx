"use client"

import { useState, useEffect } from "react"
import { SpotifyAuth } from "@/components/spotify-auth"
import { SpotifyDashboard } from "@/components/spotify-dashboard"
import { ConfigScreen } from "@/components/config-screen"

interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

interface SpotifyConfig {
  clientId: string
  redirectUri: string
}

export default function Home() {
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null)
  const [config, setConfig] = useState<SpotifyConfig | null>(null)
  const [showConfig, setShowConfig] = useState(true)

  useEffect(() => {
    // Check if we're returning from Spotify auth
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    const state = urlParams.get("state")

    if (code && state) {
      handleAuthCallback(code, state)
    }
  }, [])

  const handleAuthCallback = async (code: string, state: string) => {
    const storedState = sessionStorage.getItem("spotify_auth_state")
    const codeVerifier = sessionStorage.getItem("spotify_code_verifier")
    const storedConfig = sessionStorage.getItem("spotify_config")

    if (state !== storedState || !codeVerifier || !storedConfig) {
      console.error("Invalid auth state")
      return
    }

    const config = JSON.parse(storedConfig)

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: config.redirectUri,
          client_id: config.clientId,
          code_verifier: codeVerifier,
        }),
      })

      if (response.ok) {
        const tokenData = await response.json()
        const tokens = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + tokenData.expires_in * 1000,
        }

        setTokens(tokens)
        setConfig(config)
        setShowConfig(false)

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)

        // Clean up session storage
        sessionStorage.removeItem("spotify_auth_state")
        sessionStorage.removeItem("spotify_code_verifier")
        sessionStorage.removeItem("spotify_config")
      }
    } catch (error) {
      console.error("Token exchange failed:", error)
    }
  }

  const handleConfigSave = (newConfig: SpotifyConfig) => {
    setConfig(newConfig)
    setShowConfig(false)
  }

  const handleLogout = () => {
    setTokens(null)
    setConfig(null)
    setShowConfig(true)
  }

  if (showConfig || !config) {
    return <ConfigScreen onSave={handleConfigSave} />
  }

  if (!tokens) {
    return <SpotifyAuth config={config} onBack={() => setShowConfig(true)} />
  }

  return <SpotifyDashboard tokens={tokens} config={config} onLogout={handleLogout} />
}
