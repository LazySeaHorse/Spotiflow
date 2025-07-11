# Spotiflow: Find Songs with the Same Vibe

This project started out with an idea: build an app to find songs with the same vibe. The plan was to query audio features from Spotify and suggest tracks with similar features. You'd have all the features visualized in cute charts and stuff.

**But sadly, Spotify's audio features API is only accessible to Spotify-vetted apps with a paid API key. So, RIP.**

It was coded using [v0.dev](https://v0.dev) so I didn't waste too much time. As of now, searching for tracks works. It'll throw an error when it queries audio features.

I'm leaving the source code here so:
- **a.** Anyone with a paid API key can use it
- **b.** If I myself get verified by Spotify or whatever, I can make it a fully functional app

But for now, RIP.

---

## How to Use

You'll need to use [ngrok](https://ngrok.com/) to route redirects to localhost through HTTPS.

### Steps:

1. **Install and configure ngrok**
   - [ngrok download & docs](https://ngrok.com/download)
2. **Install dependencies**
   - `npm install`  
     (You might have to use `--legacy-peer-deps` if you run into dependency issues)
3. **Start the development server**
   - `npm run dev`
4. **Start ngrok to tunnel port 3000**
   - `ngrok http 3000`
5. **Open the app through ngrok's HTTPS URL**
6. **Follow on-screen instructions**

---

## Status
- Searching for tracks works
- Querying audio features will throw an error (API limitation)

[![gjhynctfgnhcfbg.png](https://i.postimg.cc/N0z0HZRJ/gjhynctfgnhcfbg.png)](https://postimg.cc/B82sWYYH)

If you have a paid Spotify API key or get your app verified, you can make this a fully functional app!

---

## License
MIT
