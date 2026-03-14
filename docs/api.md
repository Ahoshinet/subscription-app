# API Reference

Base URL: `http://localhost:3000`

All endpoints that require authentication must include the following header:

```
Authorization: Bearer <token>
```

---

## Table of Contents

- [Authentication](#authentication)
  - [Register](#post-apiauthregister)
  - [Login](#post-apiauthlogin)
  - [Get current user](#get-apiauthme)
  - [Change password](#put-apiauthpassword)
  - [Update profile](#put-apiauthprofile)
- [Subscriptions](#subscriptions)
  - [Create](#post-apisubscriptions)
  - [List](#get-apisubscriptionslist)
  - [Upcoming payments](#get-apisubscriptionsupcoming)
  - [Update](#put-apisubscriptionsid)
  - [Delete](#delete-apisubscriptionsid)
  - [Toggle status](#patch-apisubscriptionsidstatus)
- [Settings](#settings)
  - [Get settings](#get-apisettings)
  - [Update settings](#put-apisettings)
- [Upload](#upload)
  - [Upload icon](#post-apiuploadicon)
  - [Serve uploaded file](#get-uploadsfilename)
- [Data Models](#data-models)
- [Error Codes](#error-codes)

---

## Authentication

### POST /api/auth/register

Register a new user.

**Auth required:** No

**Request body:**
```json
{
  "username": "string",   // required, must not be empty
  "password": "string"    // required, min 6 characters
}
```

**Response `201 Created`:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "alice",
    "created_at": "2026-03-15T00:00:00Z",
    "updated_at": "2026-03-15T00:00:00Z"
  }
}
```

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | Empty username or password shorter than 6 characters |
| `409 Conflict` | Username already exists |

---

### POST /api/auth/login

Login and receive a JWT token (valid for 30 days).

**Auth required:** No

**Request body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "alice",
    "created_at": "2026-03-15T00:00:00Z",
    "updated_at": "2026-03-15T00:00:00Z"
  }
}
```

**Errors:**
| Status | Reason |
|---|---|
| `401 Unauthorized` | Invalid username or password |

---

### GET /api/auth/me

Get the currently authenticated user's information.

**Auth required:** Yes

**Response `200 OK`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "alice",
  "created_at": "2026-03-15T00:00:00Z",
  "updated_at": "2026-03-15T00:00:00Z"
}
```

**Errors:**
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | User no longer exists |

---

### PUT /api/auth/password

Change the authenticated user's password.

**Auth required:** Yes

**Request body:**
```json
{
  "current_password": "string",  // required
  "new_password": "string"       // required, min 6 characters
}
```

**Response `200 OK`:** *(empty body)*

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | New password shorter than 6 characters |
| `401 Unauthorized` | Current password is incorrect |

---

### PUT /api/auth/profile

Update the authenticated user's username.

**Auth required:** Yes

**Request body:**
```json
{
  "username": "string"  // required, must not be empty
}
```

**Response `200 OK`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "new_username",
  "created_at": "2026-03-15T00:00:00Z",
  "updated_at": "2026-03-15T12:00:00Z"
}
```

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | Empty username |
| `404 Not Found` | User not found |
| `409 Conflict` | Username already taken |

---

## Subscriptions

### POST /api/subscriptions

Create a new subscription.

**Auth required:** Yes

**Request body:**
```json
{
  "service_name": "string",        // required
  "plan_name": "string",           // optional
  "amount": 9.99,                  // required, number
  "currency": "USD",               // required, e.g. "USD" | "JPY"
  "billing_cycle": "monthly",      // required, "monthly" | "yearly" | "weekly"
  "payment_method": "string",      // required
  "payment_details": {},           // optional, any JSON object
  "icon_url": "/uploads/xxx.png",  // optional
  "next_payment_date": "2026-04-15T00:00:00Z"  // required, ISO 8601
}
```

**Response `201 Created`:** *(returns the created [Subscription](#subscription) object)*

**Errors:**
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid token |
| `500 Internal Server Error` | Database error |

---

### GET /api/subscriptions/list

Get all subscriptions for the authenticated user.

**Auth required:** Yes

**Response `200 OK`:** *(array of [Subscription](#subscription) objects)*
```json
[
  {
    "id": 1,
    "service_name": "Netflix",
    ...
  }
]
```

---

### GET /api/subscriptions/upcoming

Get active subscriptions with a payment due within the next 3 days.

**Auth required:** Yes

**Response `200 OK`:** *(array of [Subscription](#subscription) objects, ordered by `next_payment_date` ascending)*

---

### PUT /api/subscriptions/{id}

Update an existing subscription. All fields are optional; only provided fields are updated.

**Auth required:** Yes

**Path parameter:** `id` — subscription ID (integer)

**Request body:**
```json
{
  "service_name": "string",
  "plan_name": "string",
  "amount": 9.99,
  "currency": "USD",
  "billing_cycle": "monthly",
  "payment_method": "string",
  "payment_details": {},
  "icon_url": "/uploads/xxx.png",
  "next_payment_date": "2026-05-15T00:00:00Z"
}
```

**Response `200 OK`:** *(returns the updated [Subscription](#subscription) object)*

**Errors:**
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Subscription not found or not owned by user |

---

### DELETE /api/subscriptions/{id}

Delete a subscription.

**Auth required:** Yes

**Path parameter:** `id` — subscription ID (integer)

**Response `200 OK`:** *(empty body)*

**Errors:**
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Subscription not found or not owned by user |

---

### PATCH /api/subscriptions/{id}/status

Toggle the status of a subscription (`active` / `inactive`).

**Auth required:** Yes

**Path parameter:** `id` — subscription ID (integer)

**Request body:**
```json
{
  "status": "active"   // "active" | "inactive"
}
```

**Response `200 OK`:** *(returns the updated [Subscription](#subscription) object)*

**Errors:**
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Subscription not found or not owned by user |

---

## Settings

### GET /api/settings

Get user settings. Returns default values if no settings have been saved yet.

**Auth required:** Yes

**Response `200 OK`:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "language": "en",
  "currency": "USD",
  "push_notifications": true,
  "theme": "system",
  "updated_at": "2026-03-15T00:00:00Z"
}
```

**Defaults:**
| Field | Default |
|---|---|
| `language` | `"en"` |
| `currency` | `"USD"` |
| `push_notifications` | `true` |
| `theme` | `"system"` |

---

### PUT /api/settings

Update user settings. All fields are optional.

**Auth required:** Yes

**Request body:**
```json
{
  "language": "ja",              // optional, "en" | "ja"
  "currency": "JPY",             // optional
  "push_notifications": false,   // optional
  "theme": "dark"                // optional, "system" | "light" | "dark"
}
```

**Response `200 OK`:** *(returns the updated [UserSettings](#usersettings) object)*

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | Invalid `theme` or `language` value |
| `401 Unauthorized` | Missing or invalid token |

---

## Upload

### POST /api/upload/icon

Upload a service icon image. The file is stored on the server with a unique UUID-based filename.

**Auth required:** Yes

**Content-Type:** `multipart/form-data`

**Form field:** any field with a file attached (PNG, JPG, etc.)

**Response `201 Created`:**
```json
{
  "url": "/uploads/550e8400-e29b-41d4-a716-446655440000.png"
}
```

Use the returned `url` as the `icon_url` field when creating or updating a subscription.

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | No file field found in the request |
| `401 Unauthorized` | Missing or invalid token |

---

### GET /uploads/{filename}

Serve an uploaded file. No authentication required.

**Auth required:** No

**Example:** `GET /uploads/550e8400-e29b-41d4-a716-446655440000.png`

---

## Data Models

### User

```json
{
  "id": "string (UUID)",
  "username": "string",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

> `password_hash` is never included in API responses.

### AuthResponse

```json
{
  "token": "string (JWT)",
  "user": User
}
```

### Subscription

```json
{
  "id": "integer",
  "user_id": "string (UUID)",
  "service_name": "string",
  "plan_name": "string | null",
  "amount": "number",
  "currency": "string",
  "billing_cycle": "string",
  "payment_method": "string",
  "payment_details": "string (JSON) | null",
  "icon_url": "string | null",
  "next_payment_date": "string (ISO 8601)",
  "status": "\"active\" | \"inactive\"",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

### UserSettings

```json
{
  "user_id": "string (UUID)",
  "language": "\"en\" | \"ja\"",
  "currency": "string",
  "push_notifications": "boolean",
  "theme": "\"system\" | \"light\" | \"dark\"",
  "updated_at": "string (ISO 8601)"
}
```

---

## Error Codes

| Status Code | Meaning |
|---|---|
| `400 Bad Request` | Invalid request body or parameters |
| `401 Unauthorized` | Missing, expired, or invalid JWT token |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Duplicate resource (e.g. username taken) |
| `500 Internal Server Error` | Unexpected server-side error |
