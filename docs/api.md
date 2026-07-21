# API Reference

Base URL: `https://subscription-manager.daruks.com/api/v1`

All endpoints that require authentication must include the following header:

```
Authorization: Bearer <token>
```

---

## Table of Contents

- [Authentication](#authentication)
  - [Register](#post-apiv1authregister)
  - [Login](#post-apiv1authlogin)
  - [Refresh token](#post-apiv1authrefresh)
  - [Get current user](#get-apiv1authme)
  - [Change password](#put-apiv1authpassword)
  - [Update profile](#put-apiv1authprofile)
- [Subscriptions](#subscriptions)
  - [Create](#post-apiv1subscriptions)
  - [List](#get-apiv1subscriptionslist)
  - [Upcoming payments](#get-apiv1subscriptionsupcoming)
  - [Update](#put-apiv1subscriptionsid)
  - [Delete](#delete-apiv1subscriptionsid)
  - [Toggle status](#patch-apiv1subscriptionsidstatus)
- [Payment Methods](#payment-methods)
  - [List](#get-apiv1payment-methods)
  - [Create](#post-apiv1payment-methods)
  - [Update](#put-apiv1payment-methodsid)
  - [Delete](#delete-apiv1payment-methodsid)
- [Settings](#settings)
  - [Get settings](#get-apiv1settings)
  - [Update settings](#put-apiv1settings)
- [Upload](#upload)
  - [Upload icon](#post-apiv1uploadicon)
  - [Serve uploaded file](#get-uploadsfilename)
- [Data Models](#data-models)
- [Error Codes](#error-codes)

---

## Authentication

### POST /api/v1/auth/register

Register a new user.

**Auth required:** No

**Request body:**
```json
{
  "username": "string",        // required, 3-32 chars: letters, digits, ".", "_", "-" (trimmed)
  "password": "string",        // required, min 8 characters
  "time_zone": "Asia/Tokyo"    // required, IANA time-zone identifier
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
| `400 Bad Request` | Username/password validation fails, or `time_zone` is not a valid IANA identifier |
| `409 Conflict` | Username already exists |

---

### POST /api/v1/auth/login

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

### POST /api/v1/auth/refresh

Issue a new JWT token without re-entering credentials. The existing (still-valid) token must be sent in the `Authorization` header.

**Auth required:** Yes

**Request body:** *(empty)*

**Response `200 OK`:**
```json
{
  "token": "eyJ..."
}
```

**Errors:**
| Status | Reason |
|---|---|
| `401 Unauthorized` | Token missing, malformed, expired, or issued before the user's last password change |

---

### GET /api/v1/auth/me

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

### PUT /api/v1/auth/password

Change the authenticated user's password.

**Auth required:** Yes

**Request body:**
```json
{
  "current_password": "string",  // required
  "new_password": "string"       // required, min 8 characters
}
```

**Response `200 OK`:** *(empty body)*

> Changing the password invalidates **all previously issued tokens** (including the one used for this request). Prompt the user to log in again afterwards.

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | New password shorter than 8 characters |
| `401 Unauthorized` | Current password is incorrect |

---

### PUT /api/v1/auth/profile

Update the authenticated user's username.

**Auth required:** Yes

**Request body:**
```json
{
  "username": "string"  // required, 3-32 chars: letters, digits, ".", "_", "-" (trimmed)
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
| `400 Bad Request` | Username fails the format rules above |
| `404 Not Found` | User not found |
| `409 Conflict` | Username already taken |

---

## Subscriptions

### POST /api/v1/subscriptions

Create a new subscription.

**Auth required:** Yes

**Request body:**
```json
{
  "service_name": "string",        // required
  "plan_name": "string",           // optional
  "amount": 9.99,                  // required, number ≥ 0 (0 = free plan)
  "currency": "USD",               // required, e.g. "USD" | "JPY"
  "billing_cycle": "monthly",      // required, "monthly" | "yearly" | "weekly"
  "payment_method": "string",      // required
  "payment_details": {},           // optional, any JSON object
  "icon_url": "/uploads/xxx.png",  // optional
  "next_payment_date": "2026-04-15"  // required, YYYY-MM-DD calendar date
}
```

**Response `201 Created`:** *(returns the created [Subscription](#subscription) object)*

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | Validation failed (empty required field, unknown `billing_cycle`, negative `amount`, or invalid `next_payment_date`) |
| `401 Unauthorized` | Missing or invalid token |
| `500 Internal Server Error` | Database error |

---

### GET /api/v1/subscriptions/list

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

### GET /api/v1/subscriptions/upcoming

Get active subscriptions with a payment due within the next 3 days.

**Auth required:** Yes

**Response `200 OK`:** *(array of [Subscription](#subscription) objects, ordered by `next_payment_date` ascending)*

---

### PUT /api/v1/subscriptions/{id}

Update an existing subscription. All fields are optional; only provided fields are updated.

For the nullable fields `plan_name`, `payment_details`, `icon_url`, and `memo`, sending an explicit `null` clears the stored value, while omitting the field leaves it unchanged.

**Auth required:** Yes

**Path parameter:** `id` — subscription ID (integer)

**Request body:**
```json
{
  "service_name": "string",
  "plan_name": "string | null",
  "amount": 9.99,
  "currency": "USD",
  "billing_cycle": "monthly",
  "payment_method": "string",
  "payment_details": {},
  "icon_url": "/uploads/xxx.png",
  "memo": "string | null",
  "next_payment_date": "2026-05-15"
}
```

**Response `200 OK`:** *(returns the updated [Subscription](#subscription) object)*

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | Validation failed (empty required field, unknown `billing_cycle`, negative `amount`, or invalid `next_payment_date`) |
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Subscription not found or not owned by user |

---

### DELETE /api/v1/subscriptions/{id}

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

### PATCH /api/v1/subscriptions/{id}/status

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

## Payment Methods

### GET /api/v1/payment-methods

Get all payment methods for the authenticated user.

**Auth required:** Yes

**Response `200 OK`:** *(array of PaymentMethod objects, or `[]`)*

---

### POST /api/v1/payment-methods

Create a new payment method.

**Auth required:** Yes

**Request body:**
```json
{
  "type": "credit_card",
  "label": "My Visa",
  "icon_name": "card",
  "icon_uri": null,
  "color": "#3B82F6",
  "last4": "1234",
  "card_brand": "Visa",
  "memo": null
}
```

**Response `201 Created`:** *(returns the created PaymentMethod object)*

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | `label` is empty |
| `401 Unauthorized` | Missing or invalid token |
| `409 Conflict` | A payment method with the same label already exists |

---

### PUT /api/v1/payment-methods/{id}

Update a payment method. All fields optional.

For the nullable fields `icon_name`, `icon_uri`, `last4`, `card_brand`, and `memo`, sending an explicit `null` clears the stored value, while omitting the field leaves it unchanged.

**Auth required:** Yes

**Response `200 OK`:** *(empty body)*

**Errors:**
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Payment method not found or not owned by user |

---

### DELETE /api/v1/payment-methods/{id}

Delete a payment method. Fails if any subscription still references the method — reassign or delete those subscriptions first.

**Auth required:** Yes

**Response `200 OK`:** *(empty body)*

**Errors:**
| Status | Reason |
|---|---|
| `401 Unauthorized` | Missing or invalid token |
| `404 Not Found` | Payment method not found or not owned by user |
| `409 Conflict` | One or more subscriptions still use this payment method |

---

## Settings

### GET /api/v1/settings

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
  "time_zone": "Asia/Tokyo",
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
| `time_zone` | `"Asia/Tokyo"` |

---

### PUT /api/v1/settings

Update user settings. All fields are optional.

**Auth required:** Yes

**Request body:**
```json
{
  "language": "ja",              // optional, "en" | "ja"
  "currency": "JPY",             // optional, "JPY" | "USD" | "EUR" | "GBP"
  "push_notifications": false,   // optional
  "theme": "dark",               // optional, "system" | "light" | "dark"
  "time_zone": "Europe/London"   // optional, IANA time-zone identifier
}
```

**Response `200 OK`:** *(returns the updated [UserSettings](#usersettings) object)*

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | Invalid `theme`, `language`, `currency`, or IANA `time_zone` value |
| `401 Unauthorized` | Missing or invalid token |

---

## Upload

### POST /api/v1/upload/icon

Upload a service icon image.

**Auth required:** Yes

**Content-Type:** `multipart/form-data`

**Form field:** any field with a file attached (PNG, JPG, etc.)

**Response `201 Created`:**
```json
{
  "url": "/uploads/pending/550e8400-e29b-41d4-a716-446655440000.png"
}
```

Use the returned temporary `url` as the `icon_url` field when creating or
updating a subscription. The successful subscription response contains the
permanent icon URL. Unattached temporary uploads expire after 24 hours.

**Errors:**
| Status | Reason |
|---|---|
| `400 Bad Request` | No file field found in the request |
| `401 Unauthorized` | Missing or invalid token |
| `413 Payload Too Large` | File or per-user quota exceeded |
| `415 Unsupported Media Type` | Unsupported extension or invalid image signature |
| `429 Too Many Requests` | Upload rate limit exceeded |
| `507 Insufficient Storage` | Service-wide upload quota exceeded |

---

### DELETE /api/v1/upload/icon

Delete an unattached temporary upload after a cancelled or failed mutation.

**Auth required:** Yes

**Request body:**
```json
{
  "url": "/uploads/pending/550e8400-e29b-41d4-a716-446655440000.png"
}
```

**Response:** `204 No Content`

Only a temporary upload owned by the authenticated user can be deleted.
An already attached temporary upload returns `409 Conflict` and is retained.

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
  "next_payment_date": "string (YYYY-MM-DD calendar date)",
  "billing_anchor_day": "integer (1-31, read-only schedule anchor)",
  "status": "\"active\" | \"inactive\"",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

`billing_anchor_day` preserves the intended monthly or yearly billing day after a short month. For example, a value of `31` produces February's last valid day and returns to the 31st in March. Clients do not send this field; changing `next_payment_date` resets it automatically.

### UserSettings

```json
{
  "user_id": "string (UUID)",
  "language": "\"en\" | \"ja\"",
  "currency": "string",
  "push_notifications": "boolean",
  "theme": "\"system\" | \"light\" | \"dark\"",
  "time_zone": "string (IANA identifier)",
  "updated_at": "string (ISO 8601)"
}
```

---

## Error Codes

| Status Code                 | Meaning                                  |
|-----------------------------|------------------------------------------|
| `400 Bad Request`           | Invalid request body or parameters       |
| `401 Unauthorized`          | Missing, expired, or invalid JWT token   |
| `404 Not Found`             | Resource not found                       |
| `409 Conflict`              | Duplicate resource (e.g. username taken) |
| `500 Internal Server Error` | Unexpected server-side error             |
