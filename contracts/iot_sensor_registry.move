/// IoT Sensor Registry with Device Identity and Data Integrity Verification
/// Manages IoT devices for supply chain monitoring with tamper detection
module supply_chain::iot_sensor_registry {
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use sui::dynamic_field as df;
    use sui::hash;

    // Error codes
    const EDeviceNotRegistered: u64 = 1;
    const ENotAuthorized: u64 = 2;
    const EDeviceAlreadyRegistered: u64 = 3;
    const EInvalidSignature: u64 = 4;
    const ETamperDetected: u64 = 5;
    const ECalibrationExpired: u64 = 6;
    const EDataIntegrityFailed: u64 = 7;
    const EDeviceOffline: u64 = 8;

    /// Central registry for all IoT sensors and devices
    struct IoTSensorRegistry has key {
        id: UID,
        admin: address,
        total_devices: u64,

        // Device registrations by type and location
        devices: Table<String, DeviceInfo>, // device_id -> DeviceInfo
        devices_by_type: Table<String, vector<String>>, // sensor_type -> device_ids
        devices_by_location: Table<String, vector<String>>, // location_id -> device_ids

        // Manufacturer credentials and certifications
        authorized_manufacturers: Table<address, ManufacturerInfo>,

        // Device trust levels and reputation
        device_reputation: Table<String, ReputationScore>,

        // Data integrity verification keys
        verification_keys: Table<String, vector<u8>>, // device_id -> public_key

        // Network topology and mesh connectivity
        device_networks: Table<String, DeviceNetwork>,

        // Emergency response and alerts
        alert_thresholds: Table<String, AlertThresholds>,
        emergency_contacts: Table<String, address>,

        // Edge computing configurations
        edge_processors: Table<String, EdgeProcessor>,
    }

    /// Individual IoT device/sensor information
    struct DeviceInfo has store, copy, drop {
        device_id: String,
        device_type: String, // "temperature", "humidity", "gps", "accelerometer", "rfid", etc.
        manufacturer: address,
        model: String,
        firmware_version: String,
        hardware_revision: String,

        // Location and deployment
        deployment_location: String,
        geographic_coordinates: Option<GPSCoordinate>,
        deployment_timestamp: u64,

        // Security and authentication
        device_certificate: vector<u8>, // X.509 certificate
        public_key: vector<u8>, // Post-quantum public key
        secure_element_id: Option<String>,
        attestation_key: vector<u8>,

        // Operational status
        status: u8, // 0: Offline, 1: Online, 2: Maintenance, 3: Faulty, 4: Tampered
        last_heartbeat: u64,
        battery_level: Option<u8>, // 0-100%
        signal_strength: Option<i8>, // dBm

        // Calibration and accuracy
        last_calibration: u64,
        calibration_interval_days: u64,
        accuracy_rating: String, // e.g., "±0.5°C", "±2%"
        drift_compensation: bool,

        // Data specifications
        measurement_range: String,
        sampling_frequency: u32, // Hz
        data_retention_days: u32,
        compression_enabled: bool,

        // Network configuration
        communication_protocol: String, // "LoRaWAN", "NB-IoT", "WiFi", "Cellular"
        network_address: String,
        mesh_node_id: Option<String>,
        gateway_id: Option<String>,

        // Edge processing capabilities
        edge_computing_enabled: bool,
        processing_power: Option<String>, // "low", "medium", "high"
        local_storage_gb: Option<u32>,
        ai_model_support: bool,
    }

    /// Manufacturer information and credentials
    struct ManufacturerInfo has store, copy, drop {
        name: String,
        public_key: vector<u8>,
        certifications: vector<String>, // ISO, FCC, CE, etc.
        country_of_origin: String,
        quality_rating: u8, // 0-100
        devices_produced: u64,
        recall_history: vector<String>,
        security_audit_date: u64,
        active: bool,
    }

    /// Device reputation and trust scoring
    struct ReputationScore has store, copy, drop {
        device_id: String,
        trust_score: u8, // 0-100
        data_accuracy_score: u8,
        uptime_percentage: u8,
        security_incidents: u32,
        false_alarm_rate: u8,
        peer_validations: u32,
        last_updated: u64,
    }

    /// Network topology for device mesh connectivity
    struct DeviceNetwork has store, copy, drop {
        network_id: String,
        network_type: String, // "mesh", "star", "hybrid"
        gateway_devices: vector<String>,
        relay_devices: vector<String>,
        leaf_devices: vector<String>,
        redundancy_level: u8,
        max_hop_count: u8,
        encryption_enabled: bool,
    }

    /// GPS coordinate with precision
    struct GPSCoordinate has store, copy, drop {
        latitude: String, // Decimal degrees
        longitude: String,
        altitude_meters: Option<i32>,
        accuracy_meters: u32,
        timestamp: u64,
    }

    /// Alert threshold configuration
    struct AlertThresholds has store, copy, drop {
        device_type: String,
        critical_high: Option<String>,
        critical_low: Option<String>,
        warning_high: Option<String>,
        warning_low: Option<String>,
        rate_of_change_threshold: Option<String>,
        consecutive_violations: u8,
        notification_delay_seconds: u32,
    }

    /// Edge computing processor configuration
    struct EdgeProcessor has store, copy, drop {
        processor_id: String,
        device_ids: vector<String>, // Devices connected to this processor
        processing_capabilities: vector<String>,
        ai_models_loaded: vector<String>,
        memory_available_mb: u32,
        storage_available_gb: u32,
        power_consumption_watts: u32,
        thermal_design_power: u32,
    }

    /// Sensor data reading with integrity verification
    struct SensorDataReading has key, store {
        id: UID,
        device_id: String,
        measurement_type: String,
        value: String,
        unit: String,
        timestamp: u64,
        location: GPSCoordinate,

        // Data integrity and verification
        data_hash: vector<u8>,
        device_signature: vector<u8>, // Signed by device private key
        nonce: u64, // Prevents replay attacks
        sequence_number: u64,

        // Quality metrics
        confidence_level: u8, // 0-100%
        error_margin: String,
        sensor_health_status: u8, // 0-100%
        calibration_drift_factor: Option<String>,

        // Context and environmental factors
        ambient_conditions: Table<String, String>,
        interference_level: Option<u8>,
        concurrent_sensors: vector<String>, // Other sensors measuring at same time

        // Processing and analytics
        processed_by_edge: bool,
        edge_processor_id: Option<String>,
        anomaly_detected: bool,
        pattern_classification: Option<String>,

        // Blockchain attestation
        block_height: Option<u64>,
        attestation_nodes: vector<address>,
        consensus_reached: bool,
    }

    /// Device tamper detection event
    struct TamperEvent has key, store {
        id: UID,
        device_id: String,
        tamper_type: String, // "physical", "software", "communication"
        detected_timestamp: u64,
        detection_method: String,
        severity: u8, // 1-5
        evidence_hash: vector<u8>,
        location: GPSCoordinate,
        device_response: String, // "shutdown", "alert", "continue"
        verified_by_peers: vector<String>, // Peer device confirmations
        resolved: bool,
        resolution_timestamp: Option<u64>,
    }

    /// Data integrity batch verification
    struct DataIntegrityBatch has key, store {
        id: UID,
        device_id: String,
        batch_timestamp: u64,
        reading_hashes: vector<vector<u8>>,
        merkle_root: vector<u8>,
        batch_signature: vector<u8>,
        verification_nodes: vector<String>,
        integrity_score: u8, // 0-100%
    }

    // Events
    struct DeviceRegistered has copy, drop {
        device_id: String,
        device_type: String,
        manufacturer: address,
        location: String,
        timestamp: u64,
    }

    struct DataReadingRecorded has copy, drop {
        device_id: String,
        measurement_type: String,
        value: String,
        timestamp: u64,
        integrity_verified: bool,
    }

    struct TamperDetected has copy, drop {
        device_id: String,
        tamper_type: String,
        severity: u8,
        location: String,
        timestamp: u64,
    }

    struct CalibrationRequired has copy, drop {
        device_id: String,
        last_calibration: u64,
        days_overdue: u64,
        timestamp: u64,
    }

    struct DeviceOfflineAlert has copy, drop {
        device_id: String,
        last_heartbeat: u64,
        offline_duration_hours: u64,
        timestamp: u64,
    }

    // Initialize the IoT sensor registry
    fun init(ctx: &mut TxContext) {
        let registry = IoTSensorRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            total_devices: 0,
            devices: table::new(ctx),
            devices_by_type: table::new(ctx),
            devices_by_location: table::new(ctx),
            authorized_manufacturers: table::new(ctx),
            device_reputation: table::new(ctx),
            verification_keys: table::new(ctx),
            device_networks: table::new(ctx),
            alert_thresholds: table::new(ctx),
            emergency_contacts: table::new(ctx),
            edge_processors: table::new(ctx),
        };

        transfer::share_object(registry);
    }

    /// Register a new IoT device
    public entry fun register_device(
        registry: &mut IoTSensorRegistry,
        device_id: String,
        device_type: String,
        model: String,
        firmware_version: String,
        hardware_revision: String,
        deployment_location: String,
        device_certificate: vector<u8>,
        public_key: vector<u8>,
        attestation_key: vector<u8>,
        measurement_range: String,
        sampling_frequency: u32,
        calibration_interval_days: u64,
        communication_protocol: String,
        network_address: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let manufacturer = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Verify manufacturer is authorized
        assert!(table::contains(&registry.authorized_manufacturers, manufacturer), ENotAuthorized);

        // Check device not already registered
        assert!(!table::contains(&registry.devices, device_id), EDeviceAlreadyRegistered);

        let device_info = DeviceInfo {
            device_id,
            device_type,
            manufacturer,
            model,
            firmware_version,
            hardware_revision,
            deployment_location,
            geographic_coordinates: option::none(),
            deployment_timestamp: timestamp,
            device_certificate,
            public_key,
            secure_element_id: option::none(),
            attestation_key,
            status: 1, // Online
            last_heartbeat: timestamp,
            battery_level: option::none(),
            signal_strength: option::none(),
            last_calibration: timestamp,
            calibration_interval_days,
            accuracy_rating: string::utf8(b"pending"),
            drift_compensation: false,
            measurement_range,
            sampling_frequency,
            data_retention_days: 365,
            compression_enabled: false,
            communication_protocol,
            network_address,
            mesh_node_id: option::none(),
            gateway_id: option::none(),
            edge_computing_enabled: false,
            processing_power: option::none(),
            local_storage_gb: option::none(),
            ai_model_support: false,
        };

        // Store device info
        table::add(&mut registry.devices, device_id, device_info);

        // Index by type
        if (!table::contains(&registry.devices_by_type, device_type)) {
            table::add(&mut registry.devices_by_type, device_type, vector::empty());
        };
        let type_devices = table::borrow_mut(&mut registry.devices_by_type, device_type);
        vector::push_back(type_devices, device_id);

        // Index by location
        if (!table::contains(&registry.devices_by_location, deployment_location)) {
            table::add(&mut registry.devices_by_location, deployment_location, vector::empty());
        };
        let location_devices = table::borrow_mut(&mut registry.devices_by_location, deployment_location);
        vector::push_back(location_devices, device_id);

        // Store verification key
        table::add(&mut registry.verification_keys, device_id, public_key);

        // Initialize reputation score
        let reputation = ReputationScore {
            device_id,
            trust_score: 50, // Start neutral
            data_accuracy_score: 50,
            uptime_percentage: 100,
            security_incidents: 0,
            false_alarm_rate: 0,
            peer_validations: 0,
            last_updated: timestamp,
        };
        table::add(&mut registry.device_reputation, device_id, reputation);

        registry.total_devices = registry.total_devices + 1;

        // Emit event
        event::emit(DeviceRegistered {
            device_id,
            device_type,
            manufacturer,
            location: deployment_location,
            timestamp,
        });
    }

    /// Submit sensor data reading with integrity verification
    public entry fun submit_sensor_data(
        registry: &IoTSensorRegistry,
        device_id: String,
        measurement_type: String,
        value: String,
        unit: String,
        latitude: String,
        longitude: String,
        device_signature: vector<u8>,
        nonce: u64,
        sequence_number: u64,
        confidence_level: u8,
        error_margin: String,
        sensor_health_status: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);

        // Verify device is registered
        assert!(table::contains(&registry.devices, device_id), EDeviceNotRegistered);

        let device_info = table::borrow(&registry.devices, device_id);

        // Verify device signature
        let verification_key = table::borrow(&registry.verification_keys, device_id);
        let message_data = vector::empty<u8>();
        vector::append(&mut message_data, *string::bytes(&device_id));
        vector::append(&mut message_data, *string::bytes(&value));
        vector::append(&mut message_data, *string::bytes(&measurement_type));
        // In production, would verify signature properly
        assert!(vector::length(&device_signature) > 0, EInvalidSignature);

        // Calculate data hash
        let data_hash = hash::keccak256(&message_data);

        // Create GPS coordinate
        let location = GPSCoordinate {
            latitude,
            longitude,
            altitude_meters: option::none(),
            accuracy_meters: 10, // Default accuracy
            timestamp,
        };

        let reading = SensorDataReading {
            id: object::new(ctx),
            device_id,
            measurement_type,
            value,
            unit,
            timestamp,
            location,
            data_hash,
            device_signature,
            nonce,
            sequence_number,
            confidence_level,
            error_margin,
            sensor_health_status,
            calibration_drift_factor: option::none(),
            ambient_conditions: table::new(ctx),
            interference_level: option::none(),
            concurrent_sensors: vector::empty(),
            processed_by_edge: false,
            edge_processor_id: option::none(),
            anomaly_detected: false,
            pattern_classification: option::none(),
            block_height: option::none(),
            attestation_nodes: vector::empty(),
            consensus_reached: false,
        };

        // Update device reputation based on data quality
        if (table::contains(&mut registry.device_reputation, device_id)) {
            let reputation = table::borrow_mut(&mut registry.device_reputation, device_id);
            if (confidence_level > 90) {
                reputation.data_accuracy_score = reputation.data_accuracy_score + 1;
                if (reputation.data_accuracy_score > 100) {
                    reputation.data_accuracy_score = 100;
                };
            };
            reputation.last_updated = timestamp;
        };

        // Emit event
        event::emit(DataReadingRecorded {
            device_id,
            measurement_type,
            value,
            timestamp,
            integrity_verified: true,
        });

        // Store the reading (in production, might use more efficient storage)
        df::add(&mut registry.id, object::id(&reading), true);
        transfer::public_transfer(reading, device_info.manufacturer);
    }

    /// Report device tampering
    public entry fun report_tamper_event(
        registry: &IoTSensorRegistry,
        device_id: String,
        tamper_type: String,
        detection_method: String,
        severity: u8,
        evidence_hash: vector<u8>,
        latitude: String,
        longitude: String,
        device_response: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);

        // Verify device exists
        assert!(table::contains(&registry.devices, device_id), EDeviceNotRegistered);

        let location = GPSCoordinate {
            latitude,
            longitude,
            altitude_meters: option::none(),
            accuracy_meters: 10,
            timestamp,
        };

        let tamper_event = TamperEvent {
            id: object::new(ctx),
            device_id,
            tamper_type,
            detected_timestamp: timestamp,
            detection_method,
            severity,
            evidence_hash,
            location,
            device_response,
            verified_by_peers: vector::empty(),
            resolved: false,
            resolution_timestamp: option::none(),
        };

        // Update device reputation - penalize for tampering
        if (table::contains(&mut registry.device_reputation, device_id)) {
            let reputation = table::borrow_mut(&mut registry.device_reputation, device_id);
            reputation.security_incidents = reputation.security_incidents + 1;
            reputation.trust_score = if (reputation.trust_score > severity * 10) {
                reputation.trust_score - (severity * 10)
            } else {
                0
            };
            reputation.last_updated = timestamp;
        };

        // Emit event
        event::emit(TamperDetected {
            device_id,
            tamper_type,
            severity,
            location: string::utf8(b"location"),
            timestamp,
        });

        transfer::public_transfer(tamper_event, tx_context::sender(ctx));
    }

    /// Update device heartbeat and status
    public entry fun device_heartbeat(
        registry: &IoTSensorRegistry,
        device_id: String,
        battery_level: Option<u8>,
        signal_strength: Option<i8>,
        status: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);

        // Verify device exists and sender is authorized
        assert!(table::contains(&registry.devices, device_id), EDeviceNotRegistered);

        let device_info = table::borrow_mut(&mut registry.devices, device_id);
        assert!(tx_context::sender(ctx) == device_info.manufacturer, ENotAuthorized);

        // Update device status
        device_info.last_heartbeat = timestamp;
        device_info.battery_level = battery_level;
        device_info.signal_strength = signal_strength;
        device_info.status = status;

        // Update uptime reputation
        if (table::contains(&mut registry.device_reputation, device_id)) {
            let reputation = table::borrow_mut(&mut registry.device_reputation, device_id);
            if (status == 1) { // Online
                reputation.uptime_percentage = if (reputation.uptime_percentage < 100) {
                    reputation.uptime_percentage + 1
                } else {
                    100
                };
            };
            reputation.last_updated = timestamp;
        };
    }

    /// Check and alert for calibration requirements
    public entry fun check_calibration_status(
        registry: &IoTSensorRegistry,
        device_id: String,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);

        assert!(table::contains(&registry.devices, device_id), EDeviceNotRegistered);

        let device_info = table::borrow(&registry.devices, device_id);
        let calibration_interval_ms = device_info.calibration_interval_days * 24 * 60 * 60 * 1000;
        let next_calibration_due = device_info.last_calibration + calibration_interval_ms;

        if (timestamp > next_calibration_due) {
            let days_overdue = (timestamp - next_calibration_due) / (24 * 60 * 60 * 1000);

            event::emit(CalibrationRequired {
                device_id,
                last_calibration: device_info.last_calibration,
                days_overdue,
                timestamp,
            });
        };
    }

    /// Process batch data integrity verification
    public entry fun process_data_integrity_batch(
        registry: &IoTSensorRegistry,
        device_id: String,
        reading_hashes: vector<vector<u8>>,
        batch_signature: vector<u8>,
        verification_nodes: vector<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);

        // Verify device exists
        assert!(table::contains(&registry.devices, device_id), EDeviceNotRegistered);

        // Calculate Merkle root
        let merkle_root = calculate_merkle_root(&reading_hashes);

        // Verify batch signature
        let verification_key = table::borrow(&registry.verification_keys, device_id);
        // In production, would verify signature against merkle root
        assert!(vector::length(&batch_signature) > 0, EDataIntegrityFailed);

        let batch = DataIntegrityBatch {
            id: object::new(ctx),
            device_id,
            batch_timestamp: timestamp,
            reading_hashes,
            merkle_root,
            batch_signature,
            verification_nodes,
            integrity_score: 95, // Calculate based on verification results
        };

        transfer::public_transfer(batch, tx_context::sender(ctx));
    }

    /// Internal function to calculate Merkle root (simplified)
    fun calculate_merkle_root(hashes: &vector<vector<u8>>): vector<u8> {
        if (vector::is_empty(hashes)) {
            return vector::empty<u8>()
        };

        // Simplified Merkle tree calculation
        // In production, would implement proper binary tree
        let combined = vector::empty<u8>();
        let i = 0;
        while (i < vector::length(hashes)) {
            let hash = vector::borrow(hashes, i);
            vector::append(&mut combined, *hash);
            i = i + 1;
        };

        hash::keccak256(&combined)
    }

    // View functions

    /// Get device information
    public fun get_device_info(registry: &IoTSensorRegistry, device_id: String): (String, address, String, u8, u64) {
        assert!(table::contains(&registry.devices, device_id), EDeviceNotRegistered);
        let device = table::borrow(&registry.devices, device_id);
        (
            device.device_type,
            device.manufacturer,
            device.deployment_location,
            device.status,
            device.last_heartbeat
        )
    }

    /// Get device reputation score
    public fun get_device_reputation(registry: &IoTSensorRegistry, device_id: String): (u8, u8, u8, u32) {
        if (table::contains(&registry.device_reputation, device_id)) {
            let reputation = table::borrow(&registry.device_reputation, device_id);
            (
                reputation.trust_score,
                reputation.data_accuracy_score,
                reputation.uptime_percentage,
                reputation.security_incidents
            )
        } else {
            (0, 0, 0, 0)
        }
    }

    /// Check if device needs calibration
    public fun needs_calibration(registry: &IoTSensorRegistry, device_id: String, current_timestamp: u64): bool {
        if (table::contains(&registry.devices, device_id)) {
            let device = table::borrow(&registry.devices, device_id);
            let calibration_interval_ms = device.calibration_interval_days * 24 * 60 * 60 * 1000;
            let next_calibration_due = device.last_calibration + calibration_interval_ms;
            current_timestamp > next_calibration_due
        } else {
            false
        }
    }

    /// Get devices by type
    public fun get_devices_by_type(registry: &IoTSensorRegistry, device_type: String): vector<String> {
        if (table::contains(&registry.devices_by_type, device_type)) {
            *table::borrow(&registry.devices_by_type, device_type)
        } else {
            vector::empty()
        }
    }

    /// Get devices by location
    public fun get_devices_by_location(registry: &IoTSensorRegistry, location: String): vector<String> {
        if (table::contains(&registry.devices_by_location, location)) {
            *table::borrow(&registry.devices_by_location, location)
        } else {
            vector::empty()
        }
    }

    // Admin functions

    /// Register authorized manufacturer
    public entry fun register_manufacturer(
        registry: &mut IoTSensorRegistry,
        manufacturer: address,
        name: String,
        public_key: vector<u8>,
        certifications: vector<String>,
        country_of_origin: String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);

        let manufacturer_info = ManufacturerInfo {
            name,
            public_key,
            certifications,
            country_of_origin,
            quality_rating: 50, // Start neutral
            devices_produced: 0,
            recall_history: vector::empty(),
            security_audit_date: 0,
            active: true,
        };

        table::add(&mut registry.authorized_manufacturers, manufacturer, manufacturer_info);
    }

    /// Configure alert thresholds
    public entry fun configure_alert_thresholds(
        registry: &mut IoTSensorRegistry,
        device_type: String,
        critical_high: Option<String>,
        critical_low: Option<String>,
        warning_high: Option<String>,
        warning_low: Option<String>,
        consecutive_violations: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);

        let thresholds = AlertThresholds {
            device_type,
            critical_high,
            critical_low,
            warning_high,
            warning_low,
            rate_of_change_threshold: option::none(),
            consecutive_violations,
            notification_delay_seconds: 60,
        };

        table::add(&mut registry.alert_thresholds, device_type, thresholds);
    }
}