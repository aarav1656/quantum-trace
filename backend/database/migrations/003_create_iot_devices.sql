-- Migration: Create IoT devices and sensor data tables
-- Up
CREATE TABLE IF NOT EXISTS iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    firmware_version VARCHAR(100),
    location JSONB,
    owner_id UUID,
    product_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    configuration JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '[]',
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) NOT NULL,
    sensor_type VARCHAR(100) NOT NULL,
    value DECIMAL(15,6) NOT NULL,
    unit VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    quality_score DECIMAL(3,2) DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (device_id) REFERENCES iot_devices(device_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_iot_devices_device_id ON iot_devices(device_id);
CREATE INDEX idx_iot_devices_device_type ON iot_devices(device_type);
CREATE INDEX idx_iot_devices_owner_id ON iot_devices(owner_id);
CREATE INDEX idx_iot_devices_product_id ON iot_devices(product_id);
CREATE INDEX idx_iot_devices_status ON iot_devices(status);

CREATE INDEX idx_sensor_data_device_id ON sensor_data(device_id);
CREATE INDEX idx_sensor_data_sensor_type ON sensor_data(sensor_type);
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX idx_sensor_data_device_timestamp ON sensor_data(device_id, timestamp);

-- Down
-- DROP INDEX IF EXISTS idx_sensor_data_device_timestamp;
-- DROP INDEX IF EXISTS idx_sensor_data_timestamp;
-- DROP INDEX IF EXISTS idx_sensor_data_sensor_type;
-- DROP INDEX IF EXISTS idx_sensor_data_device_id;
-- DROP INDEX IF EXISTS idx_iot_devices_status;
-- DROP INDEX IF EXISTS idx_iot_devices_product_id;
-- DROP INDEX IF EXISTS idx_iot_devices_owner_id;
-- DROP INDEX IF EXISTS idx_iot_devices_device_type;
-- DROP INDEX IF EXISTS idx_iot_devices_device_id;
-- DROP TABLE IF EXISTS sensor_data;
-- DROP TABLE IF EXISTS iot_devices;