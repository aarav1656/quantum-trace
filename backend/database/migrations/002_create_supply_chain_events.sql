-- Migration: Create supply chain events table
-- Up
CREATE TABLE IF NOT EXISTS supply_chain_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    location JSONB NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    previous_event_hash VARCHAR(255),
    data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    iota_transaction_id VARCHAR(255),
    iota_block_id VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_supply_chain_events_event_id ON supply_chain_events(event_id);
CREATE INDEX idx_supply_chain_events_product_id ON supply_chain_events(product_id);
CREATE INDEX idx_supply_chain_events_event_type ON supply_chain_events(event_type);
CREATE INDEX idx_supply_chain_events_actor ON supply_chain_events(actor);
CREATE INDEX idx_supply_chain_events_timestamp ON supply_chain_events(timestamp);
CREATE INDEX idx_supply_chain_events_verification_status ON supply_chain_events(verification_status);
CREATE INDEX idx_supply_chain_events_iota_transaction_id ON supply_chain_events(iota_transaction_id);

-- Down
-- DROP INDEX IF EXISTS idx_supply_chain_events_iota_transaction_id;
-- DROP INDEX IF EXISTS idx_supply_chain_events_verification_status;
-- DROP INDEX IF EXISTS idx_supply_chain_events_timestamp;
-- DROP INDEX IF EXISTS idx_supply_chain_events_actor;
-- DROP INDEX IF EXISTS idx_supply_chain_events_event_type;
-- DROP INDEX IF EXISTS idx_supply_chain_events_product_id;
-- DROP INDEX IF EXISTS idx_supply_chain_events_event_id;
-- DROP TABLE IF EXISTS supply_chain_events;