-- Migration: Create products table
-- Up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manufacturer VARCHAR(255) NOT NULL,
    batch_number VARCHAR(255),
    manufacturing_date TIMESTAMP,
    expiry_date TIMESTAMP,
    category VARCHAR(100),
    sku VARCHAR(100),
    barcode VARCHAR(255),
    qr_code VARCHAR(255),
    weight DECIMAL(10,3),
    dimensions JSONB,
    origin_country VARCHAR(3),
    certifications JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Indexes
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_manufacturer ON products(manufacturer);
CREATE INDEX idx_products_batch_number ON products(batch_number);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Down
-- DROP INDEX IF EXISTS idx_products_created_at;
-- DROP INDEX IF EXISTS idx_products_status;
-- DROP INDEX IF EXISTS idx_products_category;
-- DROP INDEX IF EXISTS idx_products_batch_number;
-- DROP INDEX IF EXISTS idx_products_manufacturer;
-- DROP INDEX IF EXISTS idx_products_product_id;
-- DROP TABLE IF EXISTS products;