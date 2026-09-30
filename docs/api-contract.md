# API Contract (Draft)

The browser owns diary storage. `POST /v1/organize` receives only entries the user selected and confirmed for this request. The API must process them in memory and must not persist their contents.

## Request

```json
{
  "consent": true,
  "entries": [
    { "id": "entry-1", "date": "2026-09-28", "content": "今天去散步了，心情轻松一些。" }
  ]
}
```

`consent` is required and must be `true`. The browser sends it only after the user explicitly confirms this selected set. `entries` must contain 1–20 selected snapshots; each `id` is 1–100 characters, `date` is a valid `YYYY-MM-DD` date, and `content` is 1–10,000 characters containing at least one non-whitespace character. Validation does not trim or rewrite diary text. Missing or false consent and invalid fields are rejected with the current FastAPI `422` validation response.

## Response

```json
{
  "items": [
    {
      "category": "joy",
      "type": "fact",
      "text": "散步后感到轻松。",
      "confidence": "high",
      "evidence": [
        { "entry_id": "entry-1", "quote": "心情轻松一些。", "start": 7, "end": 14 }
      ]
    }
  ]
}
```

Allowed categories: `joy`, `fulfillment`, `reflection`, `improvement`, `gratitude`, `weight`, `murmur`. Conclusion `type` is `fact` or `inference`; confidence is `high`, `medium`, `low`, or `insufficient`.

The model supplies `entry_id` and an exact `quote` only. The API finds the quote in the submitted content, calculates `start` and `end`, and rejects the result if the entry or quote cannot be found. The browser checks the returned range against its original local entry before showing a conclusion. AI JSON or upstream failures return an error response and never become placeholder conclusions.

`GET /health` is available without AI configuration. `POST /v1/organize` returns `503` when `DASHSCOPE_API_KEY` is missing, `504` when the provider times out, and `502` for an unusable provider response or invalid evidence. It never returns pretend AI content.
