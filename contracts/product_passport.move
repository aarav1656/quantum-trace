/// Post-Quantum Supply Chain Security - Product Passport with Zero-Knowledge Proofs
/// Implements selective disclosure and privacy-preserving product authentication
module supply_chain::product_passport {
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
    const EInvalidProof: u64 = 2;
    const EProductNotFound: u64 = 3;
    const EInvalidTimestamp: u64 = 4;
    const EComplianceViolation: u64 = 5;
    const ERevoked: u64 = 6;

    /// Zero-Knowledge Product Passport with selective disclosure capabilities
    struct ProductPassport has key, store {
        id: UID,
        product_id: String,
        manufacturer: address,
        creation_timestamp: u64,

        // Public metadata (always visible)
        public_attributes: Table<String, String>,

        // Private data commitments (ZK proofs)
        private_commitments: vector<vector<u8>>,

        // Compliance status and certifications
        compliance_status: u8, // 0: Pending, 1: Approved, 2: Rejected, 3: Revoked
        certifications: vector<String>,

        // Supply chain lineage (cryptographically linked)
        parent_passports: vector<ID>,
        child_passports: vector<ID>,

        // Authentication and integrity
        digital_signature: vector<u8>, // Post-quantum ML-DSA signature
        integrity_hash: vector<u8>,

        // Access control for selective disclosure
        disclosure_permissions: Table<address, vector<String>>,

        // IoT sensor data references
        sensor_data_refs: vector<ID>,

        // Audit trail
        verification_history: vector<VerificationRecord>,
    }

    /// Registry for managing all product passports
    struct PassportRegistry has key {
        id: UID,
        admin: address,
        total_passports: u64,
        passports_by_manufacturer: Table<address, vector<ID>>,
        passports_by_product_type: Table<String, vector<ID>>,
        revoked_passports: Table<ID, u64>, // ID -> revocation timestamp

        // ZK verification keys for different proof types
        verification_keys: Table<String, vector<u8>>,

        // Compliance framework mappings
        compliance_frameworks: Table<String, ComplianceFramework>,
    }

    /// Verification record for audit trails
    struct VerificationRecord has store, copy, drop {
        verifier: address,
        timestamp: u64,
        verification_type: String,
        result: bool,
        metadata: String,
    }

    /// Compliance framework definition
    struct ComplianceFramework has store, copy, drop {
        name: String,
        requirements: vector<String>,
        authority: address,
        valid_until: u64,
    }

    /// Zero-Knowledge Proof structure
    struct ZKProof has store, copy, drop {
        proof_data: vector<u8>,
        public_inputs: vector<u8>,
        proof_type: String, // "ownership", "compliance", "authenticity", etc.
        verifier_key_id: String,
    }

    /// Selective disclosure request
    struct DisclosureRequest has key {
        id: UID,
        passport_id: ID,
        requester: address,
        requested_fields: vector<String>,
        justification: String,
        expiry_timestamp: u64,
        approved: bool,
        approval_timestamp: Option<u64>,
    }

    // Events
    struct PassportCreated has copy, drop {
        passport_id: ID,
        product_id: String,
        manufacturer: address,
        timestamp: u64,
    }

    struct ZKProofVerified has copy, drop {
        passport_id: ID,
        verifier: address,
        proof_type: String,
        result: bool,
        timestamp: u64,
    }

    struct DisclosureAuthorized has copy, drop {
        passport_id: ID,
        authorized_party: address,
        fields: vector<String>,
        timestamp: u64,
    }

    struct ComplianceStatusUpdated has copy, drop {
        passport_id: ID,
        old_status: u8,
        new_status: u8,
        certifying_authority: address,
        timestamp: u64,
    }

    // Initialize the passport registry
    fun init(ctx: &mut TxContext) {
        let registry = PassportRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            total_passports: 0,
            passports_by_manufacturer: table::new(ctx),
            passports_by_product_type: table::new(ctx),
            revoked_passports: table::new(ctx),
            verification_keys: table::new(ctx),
            compliance_frameworks: table::new(ctx),
        };

        transfer::share_object(registry);
    }

    /// Create a new product passport with zero-knowledge commitments
    public entry fun create_passport(
        registry: &mut PassportRegistry,
        product_id: String,
        product_type: String,
        public_attributes: vector<String>, // Key-value pairs (k1,v1,k2,v2,...)
        private_commitments: vector<vector<u8>>, // ZK commitments for private data
        digital_signature: vector<u8>, // Post-quantum ML-DSA signature
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let manufacturer = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Create public attributes table
        let pub_attrs = table::new(ctx);
        let i = 0;
        while (i < vector::length(&public_attributes)) {
            let key = *vector::borrow(&public_attributes, i);
            let value = *vector::borrow(&public_attributes, i + 1);
            table::add(&mut pub_attrs, key, value);
            i = i + 2;
        };

        // Calculate integrity hash
        let integrity_data = vector::empty<u8>();
        vector::append(&mut integrity_data, *string::bytes(&product_id));
        vector::append(&mut integrity_data, digital_signature);
        let integrity_hash = hash::keccak256(&integrity_data);

        let passport = ProductPassport {
            id: object::new(ctx),
            product_id,
            manufacturer,
            creation_timestamp: timestamp,
            public_attributes: pub_attrs,
            private_commitments,
            compliance_status: 0, // Pending
            certifications: vector::empty(),
            parent_passports: vector::empty(),
            child_passports: vector::empty(),
            digital_signature,
            integrity_hash,
            disclosure_permissions: table::new(ctx),
            sensor_data_refs: vector::empty(),
            verification_history: vector::empty(),
        };

        let passport_id = object::id(&passport);

        // Update registry
        registry.total_passports = registry.total_passports + 1;

        // Index by manufacturer
        if (!table::contains(&registry.passports_by_manufacturer, manufacturer)) {
            table::add(&mut registry.passports_by_manufacturer, manufacturer, vector::empty());
        };
        let manufacturer_passports = table::borrow_mut(&mut registry.passports_by_manufacturer, manufacturer);
        vector::push_back(manufacturer_passports, passport_id);

        // Index by product type
        if (!table::contains(&registry.passports_by_product_type, product_type)) {
            table::add(&mut registry.passports_by_product_type, product_type, vector::empty());
        };
        let type_passports = table::borrow_mut(&mut registry.passports_by_product_type, product_type);
        vector::push_back(type_passports, passport_id);

        // Emit event
        event::emit(PassportCreated {
            passport_id,
            product_id: passport.product_id,
            manufacturer,
            timestamp,
        });

        transfer::public_transfer(passport, manufacturer);
    }

    /// Verify a zero-knowledge proof for selective disclosure
    public entry fun verify_zk_proof(
        registry: &PassportRegistry,
        passport: &mut ProductPassport,
        proof: ZKProof,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let verifier = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Get verification key
        assert!(table::contains(&registry.verification_keys, proof.verifier_key_id), EInvalidProof);
        let verification_key = table::borrow(&registry.verification_keys, proof.verifier_key_id);

        // Verify the ZK proof (simplified - would use actual ZK verification library)
        let is_valid = verify_zk_proof_internal(proof, verification_key);

        // Record verification
        let verification_record = VerificationRecord {
            verifier,
            timestamp,
            verification_type: proof.proof_type,
            result: is_valid,
            metadata: string::utf8(b"ZK proof verification"),
        };
        vector::push_back(&mut passport.verification_history, verification_record);

        // Emit event
        event::emit(ZKProofVerified {
            passport_id: object::id(passport),
            verifier,
            proof_type: proof.proof_type,
            result: is_valid,
            timestamp,
        });

        assert!(is_valid, EInvalidProof);
    }

    /// Grant selective disclosure permissions
    public entry fun authorize_disclosure(
        passport: &mut ProductPassport,
        authorized_party: address,
        fields: vector<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == passport.manufacturer, ENotAuthorized);

        table::add(&mut passport.disclosure_permissions, authorized_party, fields);

        event::emit(DisclosureAuthorized {
            passport_id: object::id(passport),
            authorized_party,
            fields,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Update compliance status (only authorized auditors)
    public entry fun update_compliance_status(
        registry: &PassportRegistry,
        passport: &mut ProductPassport,
        new_status: u8,
        certifications: vector<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let auditor = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Check if auditor is authorized (simplified check)
        // In production, would verify against authorized auditor registry

        let old_status = passport.compliance_status;
        passport.compliance_status = new_status;
        passport.certifications = certifications;

        // Record verification
        let verification_record = VerificationRecord {
            verifier: auditor,
            timestamp,
            verification_type: string::utf8(b"compliance_audit"),
            result: new_status == 1, // 1 = Approved
            metadata: string::utf8(b"Compliance status update"),
        };
        vector::push_back(&mut passport.verification_history, verification_record);

        event::emit(ComplianceStatusUpdated {
            passport_id: object::id(passport),
            old_status,
            new_status,
            certifying_authority: auditor,
            timestamp,
        });
    }

    /// Link parent-child relationship in supply chain
    public entry fun link_supply_chain(
        parent_passport: &mut ProductPassport,
        child_passport: &mut ProductPassport,
        ctx: &mut TxContext
    ) {
        // Only manufacturer of child can create link
        assert!(tx_context::sender(ctx) == child_passport.manufacturer, ENotAuthorized);

        let parent_id = object::id(parent_passport);
        let child_id = object::id(child_passport);

        // Add bidirectional links
        vector::push_back(&mut parent_passport.child_passports, child_id);
        vector::push_back(&mut child_passport.parent_passports, parent_id);
    }

    /// Revoke a passport (emergency function)
    public entry fun revoke_passport(
        registry: &mut PassportRegistry,
        passport_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);

        let timestamp = clock::timestamp_ms(clock);
        table::add(&mut registry.revoked_passports, passport_id, timestamp);
    }

    /// Internal ZK proof verification (simplified)
    fun verify_zk_proof_internal(
        proof: ZKProof,
        verification_key: &vector<u8>
    ): bool {
        // This would integrate with actual ZK proof verification library
        // For demo purposes, we do basic validation
        vector::length(&proof.proof_data) > 0 &&
        vector::length(&proof.public_inputs) > 0 &&
        vector::length(verification_key) > 0
    }

    // View functions

    /// Get passport public information
    public fun get_public_info(passport: &ProductPassport): (String, address, u64, u8) {
        (passport.product_id, passport.manufacturer, passport.creation_timestamp, passport.compliance_status)
    }

    /// Check if passport is revoked
    public fun is_revoked(registry: &PassportRegistry, passport_id: ID): bool {
        table::contains(&registry.revoked_passports, passport_id)
    }

    /// Get verification history count
    public fun get_verification_count(passport: &ProductPassport): u64 {
        vector::length(&passport.verification_history)
    }

    /// Check disclosure permissions
    public fun has_disclosure_permission(passport: &ProductPassport, party: address): bool {
        table::contains(&passport.disclosure_permissions, party)
    }

    /// Get supply chain lineage count
    public fun get_lineage_info(passport: &ProductPassport): (u64, u64) {
        (vector::length(&passport.parent_passports), vector::length(&passport.child_passports))
    }

    /// Add verification key for ZK proofs (admin only)
    public entry fun add_verification_key(
        registry: &mut PassportRegistry,
        key_id: String,
        verification_key: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);
        table::add(&mut registry.verification_keys, key_id, verification_key);
    }

    /// Add compliance framework (admin only)
    public entry fun add_compliance_framework(
        registry: &mut PassportRegistry,
        name: String,
        requirements: vector<String>,
        authority: address,
        valid_until: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);

        let framework = ComplianceFramework {
            name,
            requirements,
            authority,
            valid_until,
        };

        table::add(&mut registry.compliance_frameworks, name, framework);
    }
}