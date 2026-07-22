# API Documentation – CCTRS

> 📅 **Last updated:** 2026-07-17  
> 📌 **Base URL (local default):** `http://localhost:8080`  
> 🔐 **Auth:** Most endpoints require `Authorization: Bearer <jwt>` header.

**Response convention:** Many routes return an `ApiResponse<T>` wrapper (`message`, `data`, `success`, etc.), though a few (like proof start) return raw objects.

---

## 📋 Error Handling

All error responses follow this standard format:

```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed: proof image is required",
  "path": "/api/activities/1/proof"
}
..
