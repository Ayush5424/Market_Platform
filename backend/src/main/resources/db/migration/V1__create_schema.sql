-- Schema initialization for Construction Materials MarketPlace

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    icon VARCHAR(50)
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    category_id BIGINT NOT NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE sellers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    rating NUMERIC(3, 2) DEFAULT 4.50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_seller_status CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED'))
);

CREATE TABLE seller_listings (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    min_order_quantity INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_listings_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    CONSTRAINT fk_listings_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_seller_product UNIQUE (seller_id, product_id),
    CONSTRAINT chk_listing_price CHECK (price > 0),
    CONSTRAINT chk_listing_stock CHECK (stock_quantity >= 0),
    CONSTRAINT chk_listing_moq CHECK (min_order_quantity > 0)
);

-- Performance Indexes
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_sellers_status ON sellers(status);
CREATE INDEX idx_seller_listings_seller ON seller_listings(seller_id);
CREATE INDEX idx_seller_listings_product ON seller_listings(product_id);
CREATE INDEX idx_seller_listings_discovery ON seller_listings(product_id, is_active, stock_quantity, min_order_quantity, price);
