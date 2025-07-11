"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, Settings, ExternalLink } from "lucide-react"

interface ConfigScreenProps {
  onSave: (config: { clientId: string; redirectUri: string }) => void
}

export function ConfigScreen({ onSave }: ConfigScreenProps) {
  const [clientId, setClientId] = useState("")
  const [redirectUri, setRedirectUri] = useState("")

  useEffect(() => {
    // Set default redirect URI after component mounts
    setRedirectUri(window.location.origin)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (clientId.trim() && redirectUri.trim()) {
      onSave({ clientId: clientId.trim(), redirectUri: redirectUri.trim() })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-500 p-3 rounded-full">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Spotify Audio Feature Analyzer</CardTitle>
          <CardDescription>Configure your Spotify app credentials to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              You'll need to create a Spotify app and configure it first.
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center ml-1 text-green-600 hover:text-green-700"
              >
                Open Spotify Dashboard <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm">Setup Instructions:</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside text-gray-600">
              <li>Create a new app in your Spotify Developer Dashboard</li>
              <li>
                Add <code className="bg-white px-1 rounded">{redirectUri}</code> to your app's Redirect URIs
              </li>
              <li>Copy your Client ID and paste it below</li>
              <li>Make sure your redirect URI matches exactly</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Spotify Client ID</Label>
              <Input
                id="clientId"
                type="text"
                placeholder="Enter your Spotify Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirectUri">Redirect URI</Label>
              <Input
                id="redirectUri"
                type="url"
                placeholder="https://your-app-domain.com"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                This must match exactly with what you configured in your Spotify app
              </p>
            </div>

            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600">
              Continue to Authentication
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
