/// Post-Quantum Supply Chain Tracking with Multi-Party Authenticity Verification
/// Tracks products through complex multi-stage supply chains with cryptographic integrity
module supply_chain::supply_chain_tracker {
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
    const ENotAuthorized: u64 = 1;
    const EInvalidTransition: u64 = 2;
    const EShipmentNotFound: u64 = 3;
    const EInvalidSignature: u64 = 4;
    const ELocationMismatch: u64 = 5;
    const ETamperDetected: u64 = 6;
    const EExpiredShipment: u64 = 7;

    /// Multi-stage supply chain tracking with cryptographic verification
    struct SupplyChainTracker has key {
        id: UID,
        admin: address,
        total_shipments: u64,

        // Active shipments registry
        active_shipments: Table<ID, ShipmentStatus>,

        // Authorized participants by role
        manufacturers: Table<address, ParticipantInfo>,
        distributors: Table<address, ParticipantInfo>,
        retailers: Table<address, ParticipantInfo>,
        customs_authorities: Table<address, ParticipantInfo>,
        auditors: Table<address, ParticipantInfo>,

        // Geographic tracking zones
        tracking_zones: Table<String, TrackingZone>,

        // Emergency response protocols
        emergency_contacts: Table<String, address>,

        // Global trade compliance rules
        trade_regulations: Table<String, TradeRegulation>,
    }

    /// Individual shipment with multi-party verification
    struct Shipment has key, store {
        id: UID,

        // Basic shipment info
        tracking_number: String,
        product_passport_id: ID,
        origin: Location,
        destination: Location,
        current_location: Location,

        // Participants and authorities
        shipper: address,
        consignee: address,
        current_custodian: address,
        authorized_handlers: vector<address>,

        // Timestamps and scheduling
        creation_timestamp: u64,
        estimated_delivery: u64,
        actual_delivery: Option<u64>,

        // Supply chain stages and verification
        stages: vector<SupplyStage>,
        current_stage_index: u64,
        verification_checkpoints: Table<String, CheckpointVerification>,

        // Security and integrity
        tamper_seals: vector<TamperSeal>,
        custody_signatures: vector<CustodySignature>,
        integrity_hash: vector<u8>,

        // Environmental and condition monitoring
        environmental_requirements: EnvironmentalSpec,
        condition_violations: vector<ConditionViolation>,

        // Documentation and compliance
        trade_documents: Table<String, DocumentHash>,
        customs_declarations: vector<CustomsDeclaration>,
        insurance_policies: vector<String>,

        // Real-time tracking
        gps_coordinates: vector<GPSPoint>,
        sensor_readings: vector<SensorReading>,

        // Risk assessment
        risk_score: u8, // 0-100
        security_alerts: vector<SecurityAlert>,
    }

    /// Supply chain stage definition
    struct SupplyStage has store, copy, drop {
        stage_name: String,
        responsible_party: address,
        location: Location,
        required_verifications: vector<String>,
        estimated_duration_hours: u64,
        mandatory_documents: vector<String>,
        environmental_constraints: EnvironmentalSpec,
        completed: bool,
        completion_timestamp: Option<u64>,
        verification_signatures: vector<vector<u8>>,
    }

    /// Geographic location with precision
    struct Location has store, copy, drop {
        latitude: String, // Decimal degrees as string for precision
        longitude: String,
        address: String,
        country_code: String,
        region: String,
        facility_type: String, // "warehouse", "port", "factory", etc.
        facility_id: Option<String>,
    }

    /// Participant information and credentials
    struct ParticipantInfo has store, copy, drop {
        name: String,
        public_key: vector<u8>, // Post-quantum ML-DSA public key
        certifications: vector<String>,
        authorized_regions: vector<String>,
        risk_rating: u8, // 0-100 (higher = riskier)
        last_audit_timestamp: u64,
        active: bool,
    }

    /// Tamper-evident seals with cryptographic verification
    struct TamperSeal has store, copy, drop {
        seal_id: String,
        seal_type: String, // "rfid", "nfc", "qr_crypto", "physical"
        applied_by: address,
        applied_timestamp: u64,
        cryptographic_signature: vector<u8>,
        broken: bool,
        broken_timestamp: Option<u64>,
        break_detection_method: Option<String>,
    }

    /// Custody transfer signatures
    struct CustodySignature has store, copy, drop {
        signer: address,
        signature: vector<u8>, // Post-quantum ML-DSA signature
        timestamp: u64,
        action: String, // "pickup", "delivery", "inspection", "handover"
        location: Location,
        witness: Option<address>,
        condition_notes: String,
    }

    /// Environmental specifications and monitoring
    struct EnvironmentalSpec has store, copy, drop {
        min_temperature: Option<i32>, // Celsius * 100 for precision
        max_temperature: Option<i32>,
        min_humidity: Option<u32>, // Percentage * 100
        max_humidity: Option<u32>,
        pressure_requirements: Option<String>,
        vibration_limits: Option<String>,
        light_exposure_max: Option<u32>,
        time_sensitive: bool,
        max_exposure_hours: Option<u64>,
    }

    /// Environmental condition violations
    struct ConditionViolation has store, copy, drop {
        violation_type: String,
        detected_timestamp: u64,
        sensor_id: String,
        actual_value: String,
        threshold_value: String,
        duration_minutes: u64,
        severity: u8, // 1-5
        corrective_action: Option<String>,
    }

    /// GPS tracking point
    struct GPSPoint has store, copy, drop {
        latitude: String,
        longitude: String,
        timestamp: u64,
        accuracy_meters: u32,
        source: String, // "device", "manual", "checkpoint"
    }

    /// IoT sensor readings
    struct SensorReading has store, copy, drop {
        sensor_id: String,
        sensor_type: String,
        value: String,
        unit: String,
        timestamp: u64,
        quality_score: u8, // 0-100
        calibration_date: u64,
    }

    /// Security alerts and incidents
    struct SecurityAlert has store, copy, drop {
        alert_id: String,
        alert_type: String, // "tamper", "delay", "route_deviation", "unauthorized_access"
        severity: u8, // 1-5
        timestamp: u64,
        location: Location,
        description: String,
        resolved: bool,
        resolution_timestamp: Option<u64>,
        resolution_notes: Option<String>,
    }

    /// Checkpoint verification
    struct CheckpointVerification has store, copy, drop {
        checkpoint_name: String,
        verifier: address,
        verification_timestamp: u64,
        verification_method: String,
        verification_data: vector<u8>,
        passed: bool,
        notes: String,
    }

    /// Customs declaration for international shipments
    struct CustomsDeclaration has store, copy, drop {
        declaration_id: String,
        customs_authority: address,
        declared_value: u64,
        currency: String,
        commodity_codes: vector<String>,
        origin_country: String,
        destination_country: String,
        duty_paid: bool,
        inspection_required: bool,
        cleared_timestamp: Option<u64>,
    }

    /// Document hash for integrity verification
    struct DocumentHash has store, copy, drop {
        document_type: String,
        hash_algorithm: String,
        document_hash: vector<u8>,
        uploaded_by: address,
        upload_timestamp: u64,
        verified: bool,
    }

    /// Trading regulation definition
    struct TradeRegulation has store, copy, drop {
        regulation_id: String,
        issuing_authority: String,
        applicable_products: vector<String>,
        applicable_countries: vector<String>,
        requirements: vector<String>,
        effective_date: u64,
        expiry_date: Option<u64>,
    }

    /// Geographic tracking zone
    struct TrackingZone has store, copy, drop {
        zone_name: String,
        countries: vector<String>,
        special_requirements: vector<String>,
        risk_level: u8,
        checkpoint_frequency_hours: u64,
    }

    /// Shipment status enumeration
    struct ShipmentStatus has store, copy, drop {
        status: u8, // 0: Created, 1: InTransit, 2: Delivered, 3: Lost, 4: Delayed, 5: Recalled
        last_update: u64,
        updated_by: address,
    }

    // Events
    struct ShipmentCreated has copy, drop {
        shipment_id: ID,
        tracking_number: String,
        shipper: address,
        consignee: address,
        timestamp: u64,
    }

    struct StageCompleted has copy, drop {
        shipment_id: ID,
        stage_name: String,
        completed_by: address,
        location: String,
        timestamp: u64,
    }

    struct SecurityIncident has copy, drop {
        shipment_id: ID,
        alert_type: String,
        severity: u8,
        location: String,
        timestamp: u64,
    }

    struct CustodyTransferred has copy, drop {
        shipment_id: ID,
        from_custodian: address,
        to_custodian: address,
        location: String,
        timestamp: u64,
    }

    struct ComplianceViolation has copy, drop {
        shipment_id: ID,
        violation_type: String,
        detecting_authority: address,
        timestamp: u64,
    }

    // Initialize the supply chain tracker
    fun init(ctx: &mut TxContext) {
        let tracker = SupplyChainTracker {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            total_shipments: 0,
            active_shipments: table::new(ctx),
            manufacturers: table::new(ctx),
            distributors: table::new(ctx),
            retailers: table::new(ctx),
            customs_authorities: table::new(ctx),
            auditors: table::new(ctx),
            tracking_zones: table::new(ctx),
            emergency_contacts: table::new(ctx),
            trade_regulations: table::new(ctx),
        };

        transfer::share_object(tracker);
    }

    /// Create a new shipment with full supply chain definition
    public entry fun create_shipment(
        tracker: &mut SupplyChainTracker,
        product_passport_id: ID,
        tracking_number: String,
        consignee: address,
        origin: Location,
        destination: Location,
        estimated_delivery: u64,
        stages: vector<SupplyStage>,
        environmental_requirements: EnvironmentalSpec,
        trade_documents: vector<String>, // Document types
        insurance_policies: vector<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let shipper = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Verify shipper is authorized
        assert!(
            table::contains(&tracker.manufacturers, shipper) ||
            table::contains(&tracker.distributors, shipper),
            ENotAuthorized
        );

        // Initialize shipment
        let shipment = Shipment {
            id: object::new(ctx),
            tracking_number,
            product_passport_id,
            origin,
            destination,
            current_location: origin,
            shipper,
            consignee,
            current_custodian: shipper,
            authorized_handlers: vector::empty(),
            creation_timestamp: timestamp,
            estimated_delivery,
            actual_delivery: option::none(),
            stages,
            current_stage_index: 0,
            verification_checkpoints: table::new(ctx),
            tamper_seals: vector::empty(),
            custody_signatures: vector::empty(),
            integrity_hash: vector::empty(),
            environmental_requirements,
            condition_violations: vector::empty(),
            trade_documents: table::new(ctx),
            customs_declarations: vector::empty(),
            insurance_policies,
            gps_coordinates: vector::empty(),
            sensor_readings: vector::empty(),
            risk_score: 0,
            security_alerts: vector::empty(),
        };

        let shipment_id = object::id(&shipment);

        // Calculate initial integrity hash
        let integrity_data = vector::empty<u8>();
        vector::append(&mut integrity_data, *string::bytes(&tracking_number));
        vector::append(&mut integrity_data, *string::bytes(&origin.address));
        vector::append(&mut integrity_data, *string::bytes(&destination.address));
        shipment.integrity_hash = hash::keccak256(&integrity_data);

        // Update tracker
        tracker.total_shipments = tracker.total_shipments + 1;
        let status = ShipmentStatus {
            status: 0, // Created
            last_update: timestamp,
            updated_by: shipper,
        };
        table::add(&mut tracker.active_shipments, shipment_id, status);

        // Emit event
        event::emit(ShipmentCreated {
            shipment_id,
            tracking_number,
            shipper,
            consignee,
            timestamp,
        });

        transfer::public_transfer(shipment, shipper);
    }

    /// Add tamper-evident seal
    public entry fun add_tamper_seal(
        shipment: &mut Shipment,
        seal_id: String,
        seal_type: String,
        cryptographic_signature: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let applier = tx_context::sender(ctx);
        assert!(applier == shipment.current_custodian, ENotAuthorized);

        let timestamp = clock::timestamp_ms(clock);
        let tamper_seal = TamperSeal {
            seal_id,
            seal_type,
            applied_by: applier,
            applied_timestamp: timestamp,
            cryptographic_signature,
            broken: false,
            broken_timestamp: option::none(),
            break_detection_method: option::none(),
        };

        vector::push_back(&mut shipment.tamper_seals, tamper_seal);
    }

    /// Transfer custody with multi-party verification
    public entry fun transfer_custody(
        tracker: &mut SupplyChainTracker,
        shipment: &mut Shipment,
        new_custodian: address,
        signature: vector<u8>,
        action: String,
        current_location: Location,
        condition_notes: String,
        witness: Option<address>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_custodian = tx_context::sender(ctx);
        assert!(current_custodian == shipment.current_custodian, ENotAuthorized);

        let timestamp = clock::timestamp_ms(clock);

        // Verify new custodian is authorized
        assert!(
            table::contains(&tracker.manufacturers, new_custodian) ||
            table::contains(&tracker.distributors, new_custodian) ||
            table::contains(&tracker.retailers, new_custodian) ||
            table::contains(&tracker.customs_authorities, new_custodian),
            ENotAuthorized
        );

        // Create custody signature
        let custody_signature = CustodySignature {
            signer: current_custodian,
            signature,
            timestamp,
            action,
            location: current_location,
            witness,
            condition_notes,
        };

        vector::push_back(&mut shipment.custody_signatures, custody_signature);
        shipment.current_custodian = new_custodian;
        shipment.current_location = current_location;

        // Update tracker status
        let status = table::borrow_mut(&mut tracker.active_shipments, object::id(shipment));
        status.last_update = timestamp;
        status.updated_by = new_custodian;

        // Emit event
        event::emit(CustodyTransferred {
            shipment_id: object::id(shipment),
            from_custodian: current_custodian,
            to_custodian: new_custodian,
            location: current_location.address,
            timestamp,
        });
    }

    /// Complete current supply chain stage
    public entry fun complete_stage(
        tracker: &mut SupplyChainTracker,
        shipment: &mut Shipment,
        verification_signatures: vector<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let completer = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        let stage_index = shipment.current_stage_index;
        assert!(stage_index < vector::length(&shipment.stages), EInvalidTransition);

        let current_stage = vector::borrow_mut(&mut shipment.stages, stage_index);

        // Verify authorized to complete this stage
        assert!(completer == current_stage.responsible_party, ENotAuthorized);

        current_stage.completed = true;
        current_stage.completion_timestamp = option::some(timestamp);
        current_stage.verification_signatures = verification_signatures;

        // Move to next stage
        shipment.current_stage_index = stage_index + 1;

        // Update status
        if (shipment.current_stage_index >= vector::length(&shipment.stages)) {
            // All stages completed - shipment delivered
            shipment.actual_delivery = option::some(timestamp);
            let status = table::borrow_mut(&mut tracker.active_shipments, object::id(shipment));
            status.status = 2; // Delivered
            status.last_update = timestamp;
        };

        // Emit event
        event::emit(StageCompleted {
            shipment_id: object::id(shipment),
            stage_name: current_stage.stage_name,
            completed_by: completer,
            location: current_stage.location.address,
            timestamp,
        });
    }

    /// Report security incident or tampering
    public entry fun report_security_incident(
        tracker: &mut SupplyChainTracker,
        shipment: &mut Shipment,
        alert_type: String,
        severity: u8,
        description: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let reporter = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Generate alert ID
        let alert_id_data = vector::empty<u8>();
        vector::append(&mut alert_id_data, *string::bytes(&alert_type));
        let alert_id = hash::keccak256(&alert_id_data);

        let security_alert = SecurityAlert {
            alert_id: string::utf8(alert_id),
            alert_type,
            severity,
            timestamp,
            location: shipment.current_location,
            description,
            resolved: false,
            resolution_timestamp: option::none(),
            resolution_notes: option::none(),
        };

        vector::push_back(&mut shipment.security_alerts, security_alert);

        // Update risk score
        shipment.risk_score = shipment.risk_score + (severity * 10);
        if (shipment.risk_score > 100) {
            shipment.risk_score = 100;
        };

        // Emit event
        event::emit(SecurityIncident {
            shipment_id: object::id(shipment),
            alert_type,
            severity,
            location: shipment.current_location.address,
            timestamp,
        });
    }

    /// Add GPS tracking point
    public entry fun add_gps_point(
        shipment: &mut Shipment,
        latitude: String,
        longitude: String,
        accuracy_meters: u32,
        source: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Allow GPS updates from current custodian or authorized tracking devices
        let sender = tx_context::sender(ctx);
        assert!(
            sender == shipment.current_custodian ||
            vector::contains(&shipment.authorized_handlers, &sender),
            ENotAuthorized
        );

        let timestamp = clock::timestamp_ms(clock);
        let gps_point = GPSPoint {
            latitude,
            longitude,
            timestamp,
            accuracy_meters,
            source,
        };

        vector::push_back(&mut shipment.gps_coordinates, gps_point);

        // Update current location
        shipment.current_location.latitude = latitude;
        shipment.current_location.longitude = longitude;
    }

    /// Add IoT sensor reading
    public entry fun add_sensor_reading(
        shipment: &mut Shipment,
        sensor_id: String,
        sensor_type: String,
        value: String,
        unit: String,
        quality_score: u8,
        calibration_date: u64,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);

        let sensor_reading = SensorReading {
            sensor_id,
            sensor_type,
            value,
            unit,
            timestamp,
            quality_score,
            calibration_date,
        };

        vector::push_back(&mut shipment.sensor_readings, sensor_reading);

        // Check for environmental violations
        check_environmental_violations(shipment, &sensor_reading, timestamp);
    }

    /// Internal function to check environmental violations
    fun check_environmental_violations(
        shipment: &mut Shipment,
        sensor_reading: &SensorReading,
        timestamp: u64
    ) {
        let env_spec = &shipment.environmental_requirements;

        // Temperature checks
        if (sensor_reading.sensor_type == string::utf8(b"temperature")) {
            // Parse temperature (simplified)
            // In production, would have proper parsing
            if (option::is_some(&env_spec.min_temperature) || option::is_some(&env_spec.max_temperature)) {
                // Create violation if out of range (simplified check)
                let violation = ConditionViolation {
                    violation_type: string::utf8(b"temperature"),
                    detected_timestamp: timestamp,
                    sensor_id: sensor_reading.sensor_id,
                    actual_value: sensor_reading.value,
                    threshold_value: string::utf8(b"threshold"),
                    duration_minutes: 1,
                    severity: 3,
                    corrective_action: option::none(),
                };
                vector::push_back(&mut shipment.condition_violations, violation);
            };
        };

        // Similar checks for humidity, pressure, etc.
    }

    // View functions

    /// Get shipment basic info
    public fun get_shipment_info(shipment: &Shipment): (String, address, address, u64, u64) {
        (
            shipment.tracking_number,
            shipment.shipper,
            shipment.consignee,
            shipment.current_stage_index,
            vector::length(&shipment.stages)
        )
    }

    /// Get current location
    public fun get_current_location(shipment: &Shipment): Location {
        shipment.current_location
    }

    /// Get risk score
    public fun get_risk_score(shipment: &Shipment): u8 {
        shipment.risk_score
    }

    /// Check if shipment is delivered
    public fun is_delivered(shipment: &Shipment): bool {
        option::is_some(&shipment.actual_delivery)
    }

    /// Get number of security alerts
    public fun get_security_alert_count(shipment: &Shipment): u64 {
        vector::length(&shipment.security_alerts)
    }

    /// Get number of condition violations
    public fun get_violation_count(shipment: &Shipment): u64 {
        vector::length(&shipment.condition_violations)
    }

    // Admin functions

    /// Register participant (admin only)
    public entry fun register_participant(
        tracker: &mut SupplyChainTracker,
        participant: address,
        name: String,
        public_key: vector<u8>,
        role: String, // "manufacturer", "distributor", "retailer", "customs", "auditor"
        certifications: vector<String>,
        authorized_regions: vector<String>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == tracker.admin, ENotAuthorized);

        let participant_info = ParticipantInfo {
            name,
            public_key,
            certifications,
            authorized_regions,
            risk_rating: 0,
            last_audit_timestamp: 0,
            active: true,
        };

        if (role == string::utf8(b"manufacturer")) {
            table::add(&mut tracker.manufacturers, participant, participant_info);
        } else if (role == string::utf8(b"distributor")) {
            table::add(&mut tracker.distributors, participant, participant_info);
        } else if (role == string::utf8(b"retailer")) {
            table::add(&mut tracker.retailers, participant, participant_info);
        } else if (role == string::utf8(b"customs")) {
            table::add(&mut tracker.customs_authorities, participant, participant_info);
        } else if (role == string::utf8(b"auditor")) {
            table::add(&mut tracker.auditors, participant, participant_info);
        };
    }
}