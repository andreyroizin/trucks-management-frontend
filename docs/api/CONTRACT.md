# VervoerManager – API Contract & Common DTOs

## Response Envelope

All API responses (except login, which matches `LoginResponse`) use this wrapper:

```json
{
  "isSuccess": true,
  "statusCode": 200,
  "data": { ... },
  "errors": null
}
```

**On error:**
```json
{
  "isSuccess": false,
  "statusCode": 400,
  "data": null,
  "errors": ["Error message 1", "Error message 2"]
}
```

**TypeScript (frontend):**
```typescript
type ApiResponse<T> = {
  isSuccess: boolean;
  statusCode: number;
  data: T;
  errors: string[] | null;
};
```

---

## Login Response (no envelope)

`POST /login` returns a plain success/error object:

```json
{
  "isSuccess": true,
  "statusCode": 200,
  "data": { "token": "eyJhbGciOiJIUzI1NiIs..." },
  "errors": null
}
```

---

## Pagination

**Query params:** `pageNumber` (1-based), `pageSize` (default 100–1000 depending on endpoint)

**Response shape** (varies slightly by endpoint):

```json
{
  "totalCount": 150,
  "totalPages": 3,
  "pageNumber": 1,
  "pageSize": 50,
  "data": [ ... ]
}
```

Or (e.g. `/clients`):
```json
{
  "totalClients": 150,
  "totalPages": 3,
  "pageNumber": 1,
  "pageSize": 50,
  "data": [ ... ]
}
```

**Frontend:** Check each hook for the exact shape (e.g. `ClientsData`, `CarsResponse`).

---

## Common DTOs (shapes)

### Paginated list
```typescript
{
  totalCount?: number;   // or totalClients, totalUsers, etc.
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  data: T[];             // or Items, etc.
}
```

### IDs (GUIDs)
All entity IDs are UUIDs (e.g. `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`).

### Company
```typescript
{ id: string; name: string; address?: string; ... }
```

### Client
```typescript
{ id: string; name: string; company: Company; ... }
```

### Driver (summary)
```typescript
{ driverId: string; firstName: string; lastName: string; ... }
```

### Ride
```typescript
{ id: string; plannedDate: string; clientId: string; truckId?: string; ... }
```

---

## Binary Responses

- **File download** (e.g. `/car-files/{id}`, `/driver-files/{id}`): Returns `Blob`. Set `responseType: 'blob'`.
- **File upload**: `multipart/form-data`. Backend returns `ApiResponse<...>` with file metadata.

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (validation, invalid data) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not found |

---

## Headers

**Request:**
- `Authorization: Bearer <token>` – Required for protected endpoints
- `Accept-Language: en|nl|bg` – Locale for localized responses
- `Content-Type: application/json` – For JSON bodies
