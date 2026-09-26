# FinDebate Arena — Backend Engineering Contract & Enterprise Directives
## Phase 2: Node.js, Express, TypeScript & MongoDB Architecture

---

## 1. Architectural Philosophy & Layered Separation of Concerns
All backend code must adhere strictly to the **Controller-Service-Model (CSM)** enterprise layered design pattern:

```text
Incoming HTTP / WebSocket Request
        │
        ▼
   [Middlewares] (Helmet, RateLimiter, CORS, CookieParser, AuthGuard)
        │
        ▼
   [Routing Layer] (Pure route-to-controller mapping & schema validation)
        │
        ▼
   [Controller Layer] (HTTP boundary: parses req, calls service, returns ApiResponse)
        │
        ▼
   [Service Layer] (Pure business logic, orchestration, and domain rules)
        │
        ▼
   [Model / Data Layer] (Mongoose Schemas, validation rules, indexing)
        │
        ▼
   [MongoDB Database] (Local Compass / Production Atlas)
```

Layer Constraints:
Controllers MUST NEVER touch Mongoose models directly. Controllers only parse request inputs, invoke the relevant Service method, and serialize the returned entity using ApiResponse.

Services MUST NEVER touch req or res objects. Services must be pure TypeScript classes or functions that receive domain primitives and return raw data or throw custom ApiError instances.

No Raw Try-Catch Blocks in Controllers. All controller handlers must be wrapped with the asyncHandler utility. Unhandled rejections bubble up automatically to the centralized errorHandler middleware.

2. Core Tech Stack & Dependencies
Runtime & Language: Node.js (v20+ LTS / v22+) with TypeScript (strict: true).

Web Framework: Express.js (@types/express).

Database & ODM: MongoDB with Mongoose (mongoose@^8.0.0).

Security Primitives:

helmet: Secure HTTP headers (HSTS, CSP, X-Frame-Options).

express-rate-limit: Brute-force and DDoS throttling per IP/fingerprint.

cors: Strict origin whitelisting with credentials: true.

cookie-parser: Secure HTTP-only cookie parsing.

argon2: Memory-hard, GPU-resistant password hashing.

jsonwebtoken: Access token signing and verification.

Validation: zod or joi for strict request payload validation.

3. Directory Blueprint (backend/)
Plaintext
backend/
├── src/
│   ├── config/
│   │   ├── db.ts                      # MongoDB connection, connection pooling, graceful shutdown
│   │   └── env.ts                     # Environment variable validation using Zod
│   ├── constants/
│   │   └── index.ts                   # Token expiration times, status codes, user roles
│   ├── controllers/
│   │   ├── auth.controller.ts         # register, login, refresh, logout, getMe
│   │   └── debate.controller.ts       # ticker metadata, debate history, quant triggering
│   ├── middlewares/
│   │   ├── auth.middleware.ts         # verifyAccessToken, requireRole
│   │   ├── error.middleware.ts        # Centralized global error handling & formatting
│   │   ├── rateLimiter.middleware.ts  # Route-specific rate limiters (strict for auth, relaxed for reads)
│   │   └── validate.middleware.ts     # Zod schema validation middleware
│   ├── models/
│   │   ├── user.model.ts              # User schema (id, email, password, oauth, preferences)
│   │   └── token.model.ts             # RefreshToken schema (tokenHash, familyId, isRevoked, expiresAt)
│   ├── routes/
│   │   ├── v1/
│   │   │   ├── auth.routes.ts         # /api/v1/auth/*
│   │   │   ├── debate.routes.ts       # /api/v1/debate/*
│   │   │   └── index.ts               # Aggregates and mounts all v1 sub-routers
│   │   └── index.ts                   # Master router with API versioning
│   ├── services/
│   │   ├── auth.service.ts            # Registration, credential verification, token minting
│   │   ├── token.service.ts           # Refresh token rotation, revocation, family breach detection
│   │   └── user.service.ts            # User CRUD and profile lookup
│   ├── utils/
│   │   ├── apiError.ts                # Custom Operational Error class extending Error
│   │   ├── apiResponse.ts             # Standardized JSend/JSON response wrapper
│   │   ├── asyncHandler.ts            # Higher-order function eliminating controller try/catch
│   │   └── logger.ts                  # Structured logging
│   ├── app.ts                         # Express application setup, security middleware mounting
│   └── server.ts                      # Server entry point, DB bootstrapping, process signals
├── .env.example
├── package.json
└── tsconfig.json

4. Error Handling & Standardized Response Utilities
1. src/utils/asyncHandler.ts
TypeScript
import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

2. src/utils/apiError.ts
TypeScript
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: any[];

  constructor(statusCode: number, message: string, errors: any[] = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string, errors?: any[]) { return new ApiError(400, msg, errors); }
  static unauthorized(msg = 'Unauthorized access') { return new ApiError(401, msg); }
  static forbidden(msg = 'Forbidden operation') { return new ApiError(403, msg); }
  static notFound(msg = 'Resource not found') { return new ApiError(404, msg); }
  static conflict(msg = 'Resource conflict detected') { return new ApiError(409, msg); }
  static internal(msg = 'Internal server error') { return new ApiError(500, msg, [], false); }
}

3. src/utils/apiResponse.ts
TypeScript
export class ApiResponse<T = any> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: T;

  constructor(statusCode: number, data: T, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

4. src/middlewares/error.middleware.ts
Must intercept all instances of ApiError.

If an unhandled error occurs, mask the internal error message in production mode (NODE_ENV === 'production') to avoid leaking stack traces or database errors to the client.

Return a uniform JSON format:
{
  "success": false,
  "statusCode": 401,
  "message": "Session expired or invalid refresh token",
  "errors": []
}

5. Security & Infrastructure Middleware Setup
In src/app.ts, middlewares must mount in this strict sequential order:
helmet(): Sets secure response headers.
cors():
origin: Explicit client URL.
credentials: true: Essential for browsers.
express.json({ limit: '16kb' }): Parses incoming JSON.
express.urlencoded({ extended: true, limit: '16kb' }): Parses URL-encoded data.
cookieParser(): Reads incoming cookie payloads.
Rate Limiting (express-rate-limit):
General API limiter: 100 requests per 15 minutes.
Auth limiter: 10 requests per 15 minutes for /api/v1/auth/login and /api/v1/auth/register.
Versioned Route Mounting: /api/v1 prefix.
Catch-All 404 Handler: For unregistered routes.
Global errorHandler Middleware: Positioned dead last in the Express stack.

6. Database Connection Engine (src/config/db.ts)
Connection URI defaults to local MongoDB Compass instance: mongodb://localhost:27017/findebate.
Enable Mongoose auto-indexing in development, disable in production.
Graceful Shutdown: Intercept SIGINT and SIGTERM signals.

7. Authentication & Token Lifecycle Engine
1. Dual-Token Architecture
Access Token: 15-minute lifespan. HttpOnly, SameSite: 'Lax', Secure: process.env.NODE_ENV === 'production'.
Refresh Token with Rotation (RTR): 64-byte random string, stored encrypted in DB. HttpOnly, Path: '/api/v1/auth/refresh'. 7-day lifespan.

2. Token Family & Theft Detection Flow
If the token is found and isRevoked: true, revoke all tokens sharing that familyId and return 401 Unauthorized.
If valid: Mark revoked, mint new refresh token and access token.

8. Mongoose Data Models
1. User Schema (src/models/user.model.ts)
email, passwordHash, fullName, role, isActive, authProvider, oauthId, timestamps.
2. RefreshToken Schema (src/models/token.model.ts)
userId, tokenHash, familyId, isRevoked, expiresAt.
TTL index on expiresAt.
