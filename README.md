# Viral Radio — Real Listener Monitoring

- Listener count starts at **0**.
- No random numbers and no demo/fake audience.
- A listener is counted only while the real radio player is playing and sending a heartbeat.
- Set `STREAM_URL` in `index.html` to your real radio stream URL.
- For Vercel production, configure Upstash/Vercel KV using `KV_REST_API_URL` and `KV_REST_API_TOKEN` so counts are shared across serverless instances.
- If Redis is not configured, the API uses an in-memory fallback and can undercount across multiple Vercel instances; it still never invents listeners.
