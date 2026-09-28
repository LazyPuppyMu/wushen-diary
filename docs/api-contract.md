# API Contract (Draft)

The browser owns diary storage. `POST /v1/organize` receives only entries the user selected and confirmed for this request. The API must process them in memory and must not persist their contents.

## Request

```json
{
  "entries": [
    { "id": "entry-1", "date": "2026-09-28", "content": "今天去散步了，心情轻松一些。" }
  ]
}
```

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

The model supplies `entry_id` and an exact `quote` only. The API finds the quote in the submitted content, calculates `start` and `end`, and rejects the result if the entry or quote cannot be found. The browser checks the returned range against its original local entry before showing a conclusion.

`GET /health` is available without AI configuration. Until the real provider and quote validator are implemented, `POST /v1/organize` returns `503`; it never returns pretend AI content.
