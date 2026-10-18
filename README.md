# MarketPlace — Multi-Seller Construction Materials B2B Marketplace

MarketPlace is a full-stack, enterprise-grade multi-seller B2B construction materials procurement platform. It enables contractors, builders, and procurement managers to discover verified bulk construction materials (cement, structural steel rebars, washed aggregates, kiln bricks, ceramic tiles, and industrial piping), compare live quotes from regional suppliers, and inspect inventory availability against minimum order quantities (MOQ).

Suppliers and distributors manage their listings through an authenticated **Seller Portal**, featuring catalogue management, live price and stock adjustments, active/inactive availability toggles, duplicate listing prevention, and optimistic concurrency locking.

---

## Key Highlights & Core Features

### 1. Buyer Marketplace & Discovery Engine
* **Material Discovery**: Browse materials across heavy construction categories: Cement & Concrete, Steel & Structural, Sand & Aggregates, Bricks & Blocks, Tiles & Flooring, and Pipes & Plumbing.
* **Server-Side Search & Filtering**: Database-level search across product name and manufacturer/brand, with real-time category filtering.
* **Database-Side Sorting & Pagination**: Sort by product name (A-Z / Z-A), lowest available price (Ascending / Descending), or brand name, backed by SQL `LIMIT`/`OFFSET` and aggregate grouping.
* **Lowest Available Price Calculation**: Dynamically computes the lowest available unit price across all eligible sellers in SQL.
* **Supplier Discovery Eligibility Rule**: Only approved sellers (`status = 'APPROVED'`) with active listings (`is_active = true`) and sufficient inventory to satisfy minimum order quantity (`stock_quantity >= min_order_quantity`) are included in buyer discovery and lowest price calculations.
* **Detailed Seller Comparison Modal**: Inspect all seller offerings for any material, comparing unit pricing, warehouse inventory, minimum order quantities (MOQ), supplier credibility ratings, and verification badges.
* **Responsive State Handling**: Polished visual handling for loading skeletons, empty search results, and products without active supplier quotes.

### 2. Seller Portal & Inventory Management
* **Demo Seller Identity Switcher**: Switch effortlessly between sample suppliers with different statuses (Approved, Pending, and Rejected).
* **Isolated Supplier Listings**: Enforces strict backend data isolation—sellers can view and manage only their own catalogue items.
* **Catalogue Onboarding**:
  * Link existing master catalogue products to the seller's inventory.
  * Create a brand-new material specification and immediately list it.
* **Inventory & Price Controls**: Update unit price, warehouse stock quantity, and minimum order quantity with server-side validation.
* **One-Click Listing Toggles**: Instantly deactivate or reactivate listings without deleting historical inventory records.
* **Duplicate Listing Prevention**: Enforces a database-level and application-level unique constraint on `(seller_id, product_id)` to prevent duplicate listings by the same seller.
* **Optimistic Locking Concurrency**: Uses JPA `@Version` on `SellerListing` to detect conflicting concurrent updates and return HTTP 409 Conflict with clear error feedback.
### 3. Market Admin Portal Dashboard & Real-Time Concurrency
* **Live Supplier Monitoring**: Real-time counter and telemetry tracking how many sellers are live (`status = 'APPROVED'`), pending review, or suspended.
* **Product & Category Oversight**: Real-time aggregation of total products listed by live sellers, master catalogue items, and active category distribution.
* **Concurrent Processing Engine**: High-performance parallel data aggregation using Java `CompletableFuture` across an asynchronous `ThreadPoolTaskExecutor` (`admin-worker-` pool), executing seller, listing, and category metrics concurrently with zero thread blocking.
* **Real-Time Push Synchronization (SSE)**: Native Server-Sent Events stream (`/api/v1/admin/dashboard/stream`) broadcasting instant metric updates whenever listings are created, updated, toggled, or when supplier approval statuses change.
* **Supplier Governance Controls**: One-click administrative approval, review, and suspension of supplier accounts with instantaneous marketplace-wide synchronization.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, EventSource (SSE) |
| **Backend** | Java 21, Spring Boot 3.3.4, Spring Data JPA, Hibernate ORM, Maven |
| **Database** | PostgreSQL 16 (Containerized via Docker Compose) |
| **Database Migrations** | Flyway Core & Flyway PostgreSQL |
| **Testing** | JUnit 5, Mockito, AssertJ, Spring MockMvc, Spring Boot Test |
| **Concurrency Control** | JPA `@Version` Optimistic Locking & `CompletableFuture` Parallel Thread Pool |
| **Real-Time Streaming** | Server-Sent Events (SSE) via `SseEmitter` |

---

## System Architecture & Layered Design

```
[ Frontend: React + TypeScript + Vite + Tailwind CSS ]
                      │  HTTP REST (JSON) + SSE (/admin/dashboard/stream)
                      │  Header: X-Seller-Id
                      ▼
[ Controllers Layer ]
  ├── AdminDashboardController      (/api/v1/admin/dashboard, /stream)
  ├── BuyerMarketplaceController    (/api/v1/products)
  ├── SellerListingController       (/api/v1/seller/listings)
  ├── CategoryController            (/api/v1/categories)
  └── SellerController              (/api/v1/sellers)
                      │
                      ▼
[ Business Services Layer ]
  ├── AdminDashboardService (Concurrent Aggregation & SSE Broadcast)
  ├── ProductService
  ├── ListingService (Ownership, Validation, Concurrency)
  ├── SellerService (Status Verification, Identity Header)
  └── CategoryService
                      │
                      ▼
[ Persistence & Repositories Layer ]
  ├── ProductRepository & ProductRepositoryCustomImpl (SQL Aggregation)
  ├── SellerListingRepository
  ├── SellerRepository
  └── CategoryRepository
                      │
                      ▼
[ PostgreSQL 16 Database ] (Managed by Flyway V1 & V2 Migrations)
```

---

## Database Design & Constraints

The relational schema is defined and initialized via Flyway migrations (`db/migration/V1__create_schema.sql` and `V2__insert_sample_data.sql`):

```
categories (1) ────< products (N)
                        │
                        │ (1)
                        │
                        ├──< seller_listings (N) >──── (1) sellers
```

### Table Specifications:
1. `categories`:
   * `id`: BIGSERIAL PRIMARY KEY
   * `name`: VARCHAR(100) NOT NULL UNIQUE
   * `description`: VARCHAR(255)
   * `icon`: VARCHAR(50)

2. `products`:
   * `id`: BIGSERIAL PRIMARY KEY
   * `name`: VARCHAR(255) NOT NULL
   * `brand`: VARCHAR(100) NOT NULL
   * `description`: TEXT
   * `unit`: VARCHAR(50) NOT NULL (e.g. `50kg Bag`, `Metric Ton`, `Cubic Meter`)
   * `category_id`: BIGINT NOT NULL (FK -> `categories(id)`)
   * `image_url`: VARCHAR(500)
   * `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

3. `sellers`:
   * `id`: BIGSERIAL PRIMARY KEY
   * `name`: VARCHAR(255) NOT NULL
   * `business_name`: VARCHAR(255) NOT NULL
   * `email`: VARCHAR(150) NOT NULL UNIQUE
   * `phone`: VARCHAR(50)
   * `status`: VARCHAR(20) NOT NULL (`CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED'))`)
   * `rating`: NUMERIC(3, 2) DEFAULT 4.50
   * `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

4. `seller_listings`:
   * `id`: BIGSERIAL PRIMARY KEY
   * `seller_id`: BIGINT NOT NULL (FK -> `sellers(id)` ON DELETE CASCADE)
   * `product_id`: BIGINT NOT NULL (FK -> `products(id)` ON DELETE CASCADE)
   * `price`: NUMERIC(12, 2) NOT NULL (`CHECK (price > 0)`)
   * `stock_quantity`: INTEGER NOT NULL (`CHECK (stock_quantity >= 0)`)
   * `min_order_quantity`: INTEGER NOT NULL (`CHECK (min_order_quantity > 0)`)
   * `is_active`: BOOLEAN NOT NULL DEFAULT true
   * `version`: BIGINT NOT NULL DEFAULT 0 (`@Version` for optimistic locking)
   * `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   * `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   * **Unique Constraint**: `CONSTRAINT uq_seller_product UNIQUE (seller_id, product_id)`

### Performance Indexes:
* `idx_products_category_id` on `products(category_id)`
* `idx_products_name` on `products(name)`
* `idx_products_brand` on `products(brand)`
* `idx_sellers_status` on `sellers(status)`
* `idx_seller_listings_seller` on `seller_listings(seller_id)`
* `idx_seller_listings_product` on `seller_listings(product_id)`
* `idx_seller_listings_discovery` on `seller_listings(product_id, is_active, stock_quantity, min_order_quantity, price)`

---

## Seed Data & Demo Identities

The database includes realistic sample data across 6 categories, 12 construction products, and 6 sample sellers:

### Sample Sellers & Testing Scenarios:

| ID | Business Name | Contact Person | Status | Purpose / Test Scenario |
|---|---|---|---|---|
| **1** | **Prime Builders Supply** | Vikram Mehta | `APPROVED` | Primary active seller with cement, rebar, sand, pipe listings. |
| **2** | **Apex Material Depot** | Sarah Jenkins | `APPROVED` | Offers lowest price on PPC Cement (₹365.00) and steel I-beams. |
| **3** | **SolidGround Aggregates** | Ramesh Patel | `APPROVED` | Demonstrates inactive listing exclusion (₹395.00 PPC cement is inactive). |
| **4** | **Heritage Masonry & Tile** | Elena Rostova | `APPROVED` | Demonstrates stock < MOQ exclusion (Aggregates: stock 8 < MOQ 20). |
| **5** | **Titan Steel & Iron** | David Chen | `PENDING` | Listing creation is rejected (HTTP 403 Forbidden). Excluded from discovery. |
| **6** | **Blacklisted Materials Ltd** | Marcus Vance | `REJECTED` | Listing operations forbidden (HTTP 403). Excluded from discovery. |

### Special Discovery Test Cases:
* **Product 1 (UltraTech PPC Cement)**: Multiple approved sellers; lowest price is ₹365.00 from Seller 2 (Seller 1 is ₹380.00, Seller 3 is inactive at ₹395.00).
* **Product 6 (Granite Aggregates 20mm)**: Seller 4 has stock (8) < MOQ (20); automatically excluded from discovery.
* **Product 12 (Fire-Resistant Refractory Bricks)**: Only listed by Seller 5 (PENDING) and Seller 6 (REJECTED); demonstrates zero eligible sellers and `lowestPrice: null` display.

---

## Prerequisites

* **Java JDK 21** or later (`java -version`)
* **Apache Maven 3.8+** (`mvn -version`)
* **Node.js 18+ & npm 9+** (`node -v`, `npm -v`)
* **Docker & Docker Compose** (`docker compose version`)

---

## Quickstart & Setup Commands

### Step 1: Start PostgreSQL via Docker Compose
From the repository root:
```bash
docker compose up -d
```
* PostgreSQL runs on container port `5432` mapped to host port `5433` (preventing conflicts with existing local PostgreSQL installations).
* Database: `marketplace_db` | User: `marketplace_user` | Password: `marketplace_secret_password`

### Step 2: Start the Spring Boot Backend
From the repository root:
```bash
cd backend
mvn clean spring-boot:run
```
* Backend starts at `http://localhost:8080`.
* Flyway will automatically run migrations `V1__create_schema.sql` and `V2__insert_sample_data.sql`.

### Step 3: Start the Frontend Application
In a new terminal, from the repository root:
```bash
cd frontend
npm install
npm run dev
```
* Access the web UI at `http://localhost:5173`.
* Vite proxies all `/api` requests directly to `http://localhost:8080`.

---

## Running Automated Tests

The automated test suite contains unit tests, web MVC layer tests, and full Spring Boot integration tests verifying search, filtering, pagination, ownership, duplicate prevention, and optimistic locking:

```bash
cd backend
mvn clean test
```

### Test Coverage Summary:
* `AdminDashboardIntegrationTest`: Verifies concurrent multi-threaded aggregation of live sellers, listed products, and categories, dynamic real-time status updates, and SSE streaming.
* `ListingServiceTest`: Verifies duplicate prevention, invalid price/MOQ/stock validation, seller ownership checks, listing activation toggles, and optimistic locking mismatch detection.
* `SellerServiceTest`: Verifies access restrictions on `PENDING` and `REJECTED` sellers, and `X-Seller-Id` validation.
* `ProductServiceTest`: Verifies SQL aggregation calculations, excluding unapproved sellers and insufficient stock from eligible offers.
* `SellerListingControllerTest`: Verifies HTTP 400 validation error payloads, HTTP 401 unauthorized, HTTP 403 forbidden, and HTTP 409 conflict handling.
* `BuyerMarketplaceControllerTest`: Verifies server-side search, filtering, and pagination endpoints.
* `MarketplaceIntegrationTest`: End-to-end integration test against the database checking discovery workflows, lowest price calculations, and seller security rules.

---

## API Endpoints Reference

### 1. Buyer Marketplace
* `GET /api/v1/products`
  * Query parameters: `categoryId` (optional), `query` (optional), `sortBy` (name, price, brand), `sortDirection` (asc, desc), `page` (default 0), `size` (default 12)
  * Returns paginated list of products with `lowestPrice` and `eligibleSellersCount`.
* `GET /api/v1/products/{id}`
  * Returns detailed product information and all seller offerings with availability status.
* `GET /api/v1/categories`
  * Returns all construction material categories.
* `GET /api/v1/sellers`
  * Returns all sellers for the demo identity selector.

### 2. Seller Portal (Requires `X-Seller-Id` header)
* `GET /api/v1/seller/listings`
  * Returns paginated listings owned by the authenticated seller.
* `POST /api/v1/seller/listings`
  * Creates a listing for an existing product or registers a new product and listing simultaneously.
  * Rejects duplicate listings (`409 Conflict`), unapproved sellers (`403 Forbidden`), and invalid prices/quantities (`400 Bad Request`).
* `PUT /api/v1/seller/listings/{id}`
  * Updates unit price, stock, and MOQ.
  * Verifies seller ownership (`403 Forbidden` if unauthorized) and checks optimistic lock version (`409 Conflict` on concurrent updates).
* `PATCH /api/v1/seller/listings/{id}/status?active={true|false}`
  * Deactivates or reactivates a listing.
* `DELETE /api/v1/seller/listings/{id}`
  * Deletes a seller listing.

### 3. Market Admin Portal (Real-Time & Concurrency)
* `GET /api/v1/admin/dashboard`
  * Returns live marketplace overview metrics (live sellers, active listings, categories, inventory valuation), per-seller metrics, and category distributions aggregated concurrently via `CompletableFuture`.
* `GET /api/v1/admin/dashboard/stream`
  * Native Server-Sent Events (SSE) stream (`text/event-stream`) streaming real-time metric updates to connected admin dashboards whenever listings or supplier statuses change.
* `POST /api/v1/admin/dashboard/sync`
  * Triggers an immediate concurrent recalculation and broadcasts synced metrics to all active admin clients.
* `PUT /api/v1/admin/sellers/{id}/status?status={APPROVED|PENDING|REJECTED}`
  * Updates supplier verification status and broadcasts real-time updates across the platform.

---

## Business Assumptions & Design Decisions

1. **Product vs. Listing Separation**:
   In construction materials procurement, standard commodities (e.g. Ambuja OPC 53 Grade Cement 50kg bag) are manufactured according to strict national standards (ASTM / BIS). Creating a centralized master `Product` catalogue decoupled from individual `SellerListing` instances allows multiple suppliers to quote on the exact same material specifications, enabling fair price discovery for contractors.
2. **Eligibility Calculation in SQL**:
   Rather than fetching entire listing tables into Java memory, `ProductRepositoryCustomImpl` utilizes SQL aggregate expressions (`MIN(CASE WHEN ... THEN l.price END)`) with `GROUP BY` and `ORDER BY NULLS LAST`. This ensures scalable query times as catalogue sizes expand.
3. **Demo Identity Model**:
   Since production OAuth2 / JWT authentication is outside the assignment scope, identity is transmitted via the `X-Seller-Id` HTTP header. The backend treats this header as the caller's identity and strictly validates that the seller exists and is approved, never trusting IDs inside request bodies.
4. **Optimistic Locking**:
   Construction warehouse stock and spot pricing change rapidly during market shifts. Using JPA `@Version` guarantees that two concurrent operations cannot silently overwrite each other's updates without raising an HTTP 409 Conflict.
5. **Real-Time Synchronization & Concurrency**:
   Decoupling parallel metric aggregation using Java `CompletableFuture` across dedicated asynchronous worker threads from the Server-Sent Events (SSE) broadcast loop allows connected market administrators to receive instant live telemetry on suppliers, inventory, and categories with zero thread blocking and sub-50ms sync latencies.

---

## Scaling to Millions of Products and Listings

If this marketplace scaled to millions of SKUs and tens of millions of supplier listings:
1. **Search & Discovery**:
   * Migrate full-text search from PostgreSQL `ILIKE` to an **Elasticsearch / OpenSearch** cluster with ngram analyzers for fuzzy typo tolerance and instant facet aggregations.
2. **Read-Heavy Caching**:
   * Maintain precomputed lowest prices in a **Redis** cache or materialized view, invalidating only when a seller alters price or stock levels via CDC (Change Data Capture) with Debezium.
3. **Database Sharding & Partitioning**:
   * Horizontally partition `seller_listings` by `product_id` hash or regional geographic zones.
4. **Asynchronous Stock Reservations**:
   * Transition order placements and stock decrements to an event-driven architecture using Apache Kafka with distributed saga patterns.
