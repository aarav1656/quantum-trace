module supply_chain_tracker::iot_sensor_registry {
    use std::string::{Self, String};
    use std::vector;
    use iota::table::{Self, Table};
    use iota::event;
    use iota::object::{Self, UID, ID};
    use iota::tx_context::{Self, TxContext};
    use iota::transfer;
    use iota::clock::{Self, Clock};

    // ===================== Error Codes =====================
    const E_DEVICE_NOT_FOUND: u64 = 1;
    const E_UNAUTHORIZED: u64 = 2;
    const E_DEVICE_INACTIVE: u64 = 3;
    const E_INVALID_READING: u64 = 4;
    const E_ATTESTATION_FAILED: u64 = 5;

    // ===================== IoT Device Structure =====================
    public struct IoTDevice has key, store {
        id: UID,
        device_id: String,
        name: String,
        device_type: String,
        location: String,
        public_key: vector<u8>,
        metadata: String,
        owner: address,
        is_active: bool,
        security_level: u8,
        last_attestation: u64,
        registered_at: u64
    }

    // ===================== Sensor Reading =====================
    public struct SensorReading has store, drop {
        reading_id: u64,
        device_id: String,
        sensor_type: String,
        value: String, // JSON string for complex data
        unit: String,
        timestamp: u64,
        signature: vector<u8>, // Device signature
        is_verified: bool
    }

    // ===================== Device Attestation =====================
    public struct DeviceAttestation has store, drop {
        attestation_id: u64,
        device_id: String,
        attestation_type: String, // "hardware", "firmware", "configuration"
        attestation_data: vector<u8>,
        timestamp: u64,
        verifier: address,
        is_valid: bool
    }

    // ===================== IoT Device Registry =====================
    public struct IoTDeviceRegistry has key {
        id: UID,
        devices: Table<String, address>, // device_id -> Device object address
        readings: Table<String, vector<SensorReading>>, // device_id -> readings
        admin: address,
        total_devices: u64,
        total_readings: u64
    }

    // ===================== Events =====================
    public struct DeviceRegistered has copy, drop {
        device_id: String,
        name: String,
        owner: address,
        timestamp: u64
    }

    public struct ReadingRecorded has copy, drop {
        device_id: String,
        sensor_type: String,
        value: String,
        timestamp: u64,
        is_verified: bool
    }

    public struct DeviceAttested has copy, drop {
        device_id: String,
        attestation_type: String,
        verifier: address,
        is_valid: bool,
        timestamp: u64
    }

    // ===================== Public Functions =====================

    /// Register a new IoT device
    public fun register_device(
        registry: &mut IoTDeviceRegistry,
        device_id: String,
        name: String,
        device_type: String,
        location: String,
        public_key: vector<u8>,
        metadata: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): String {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        let device = IoTDevice {
            id: object::new(ctx),
            device_id,
            name,
            device_type,
            location,
            public_key,
            metadata,
            owner: sender,
            is_active: true,
            security_level: 1,
            last_attestation: current_time,
            registered_at: current_time
        };

        let device_address = object::uid_to_address(&device.id);
        table::add(&mut registry.devices, device_id, device_address);
        registry.total_devices = registry.total_devices + 1;

        // Initialize readings for this device
        table::add(&mut registry.readings, device_id, vector::empty<SensorReading>());

        // Emit event
        event::emit(DeviceRegistered {
            device_id,
            name,
            owner: sender,
            timestamp: current_time
        });

        transfer::transfer(device, sender);
        device_id
    }

    /// Record sensor reading
    public fun record_reading(
        registry: &mut IoTDeviceRegistry,
        device_id: String,
        sensor_type: String,
        value: String,
        unit: String,
        signature: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Verify device exists
        assert!(table::contains(&registry.devices, device_id), E_DEVICE_NOT_FOUND);

        // In production, verify signature against device public key
        let is_verified = verify_device_signature(&signature, &value);

        let reading = SensorReading {
            reading_id: registry.total_readings + 1,
            device_id,
            sensor_type,
            value,
            unit,
            timestamp: current_time,
            signature,
            is_verified
        };

        // Add reading to device's history
        let readings = table::borrow_mut(&mut registry.readings, device_id);
        vector::push_back(readings, reading);

        registry.total_readings = registry.total_readings + 1;

        // Emit event
        event::emit(ReadingRecorded {
            device_id,
            sensor_type,
            value,
            timestamp: current_time,
            is_verified
        });
    }

    /// Attest device security
    public fun attest_device(
        registry: &mut IoTDeviceRegistry,
        device_id: String,
        attestation_type: String,
        attestation_data: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Verify device exists
        assert!(table::contains(&registry.devices, device_id), E_DEVICE_NOT_FOUND);

        // In production, perform proper attestation verification
        let is_valid = verify_attestation(&attestation_data);

        let attestation = DeviceAttestation {
            attestation_id: registry.total_readings + 1, // Reuse counter for simplicity
            device_id,
            attestation_type,
            attestation_data,
            timestamp: current_time,
            verifier: sender,
            is_valid
        };

        // Emit event
        event::emit(DeviceAttested {
            device_id,
            attestation_type,
            verifier: sender,
            is_valid,
            timestamp: current_time
        });
    }

    // ===================== Helper Functions =====================

    /// Verify device signature (simplified)
    fun verify_device_signature(signature: &vector<u8>, data: &String): bool {
        // Simplified verification - in production use proper cryptographic verification
        vector::length(signature) > 0 && string::length(data) > 0
    }

    /// Verify device attestation (simplified)
    fun verify_attestation(attestation_data: &vector<u8>): bool {
        // Simplified verification - in production use proper attestation verification
        vector::length(attestation_data) > 0
    }

    // ===================== View Functions =====================

    public fun get_device_count(registry: &IoTDeviceRegistry): u64 {
        registry.total_devices
    }

    public fun get_reading_count(registry: &IoTDeviceRegistry): u64 {
        registry.total_readings
    }

    public fun device_exists(registry: &IoTDeviceRegistry, device_id: String): bool {
        table::contains(&registry.devices, device_id)
    }

    // ===================== Module Initialization =====================
    fun init(ctx: &mut TxContext) {
        let registry = IoTDeviceRegistry {
            id: object::new(ctx),
            devices: table::new(ctx),
            readings: table::new(ctx),
            admin: tx_context::sender(ctx),
            total_devices: 0,
            total_readings: 0
        };

        transfer::share_object(registry);
    }

    // ===================== Test Functions =====================
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let registry = IoTDeviceRegistry {
            id: object::new(ctx),
            devices: table::new(ctx),
            readings: table::new(ctx),
            admin: tx_context::sender(ctx),
            total_devices: 0,
            total_readings: 0
        };

        transfer::share_object(registry);
    }
}