"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, ArrowLeft } from "lucide-react"

interface SpotifyAuthProps {
  config: { clientId: string; redirectUri: string }
  onBack: () => void
}

export function SpotifyAuth({ config, onBack }: SpotifyAuthProps) {
  const generateCodeChallenge = async (codeVerifier: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest("SHA-256", data)
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }

  const generateRandomString = (length: number) => {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    const values = crypto.getRandomValues(new Uint8Array(length))
    return values.reduce((acc, x) => acc + possible[x % possible.length], "")
  }

  const handleLogin = async () => {
    const codeVerifier = generateRandomString(64)
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateRandomString(16)

    sessionStorage.setItem("spotify_code_verifier", codeVerifier)
    sessionStorage.setItem("spotify_auth_state", state)
    sessionStorage.setItem("spotify_config", JSON.stringify(config))

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      scope: "user-read-private user-read-email user-library-read user-top-read playlist-read-private",
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      redirect_uri: config.redirectUri,
      state: state,
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="absolute top-4 left-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex justify-center mb-4">
            <div className="bg-green-500 p-3 rounded-full">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">Connect to Spotify</CardTitle>
          <CardDescription>Sign in with your Spotify account to analyze your music</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin} className="w-full bg-green-500 hover:bg-green-600 text-white" size="lg">
            <Music className="h-5 w-5 mr-2" />
            Connect with Spotify
          </Button>
          <p className="text-xs text-gray-500 text-center mt-4">
            We'll only access your basic profile information. No data is stored permanently.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
