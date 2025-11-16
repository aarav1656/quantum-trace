module supply_chain_tracker::product_passport {
    use std::string::{Self, String};
    use iota::object::{Self, UID};
    use iota::tx_context::{Self, TxContext};
    use iota::transfer;
    use iota::table::{Self, Table};

    // ===================== Product Passport Structure =====================
    public struct ProductPassport has key, store {
        id: UID,
        product_id: u64,
        manufacturer: address,
        created_at: u64,
        compliance_status: bool,
        current_owner: address
    }

    public struct TransferRecord has store, drop, copy {
        from: address,
        to: address,
        timestamp: u64
    }

    // ===================== Registry Structure =====================
    public struct PassportRegistry has key {
        id: UID,
        passports: Table<u64, address>, // product_id -> passport address
        admin: address,
        passport_count: u64
    }

    // ===================== Error Constants =====================
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_NOT_OWNER: u64 = 4;

    // ===================== Core Functions =====================
    public fun create_passport(
        registry: &mut PassportRegistry,
        product_id: u64,
        manufacturer: address,
        timestamp: u64,
        ctx: &mut TxContext
    ) {
        let passport = ProductPassport {
            id: object::new(ctx),
            product_id,
            manufacturer,
            created_at: timestamp,
            compliance_status: true,
            current_owner: manufacturer
        };

        let passport_address = object::uid_to_address(&passport.id);
        table::add(&mut registry.passports, product_id, passport_address);
        registry.passport_count = registry.passport_count + 1;

        transfer::transfer(passport, manufacturer);
    }

    // ===================== Module Initialization =====================
    fun init(ctx: &mut TxContext) {
        let registry = PassportRegistry {
            id: object::new(ctx),
            passports: table::new(ctx),
            admin: tx_context::sender(ctx),
            passport_count: 0
        };

        transfer::share_object(registry);
    }

    public fun transfer_passport(
        passport: &mut ProductPassport,
        recipient: address,
        sender: address
    ) {
        assert!(passport.current_owner == sender, E_NOT_OWNER);
        passport.current_owner = recipient;
    }

    public fun update_compliance_status(
        passport: &mut ProductPassport,
        status: bool,
        admin: address,
        sender: address
    ) {
        assert!(sender == admin, E_NOT_AUTHORIZED);
        passport.compliance_status = status;
    }

    // ===================== View Functions =====================
    public fun get_passport_info(passport: &ProductPassport): (u64, address, u64, bool) {
        (passport.product_id, passport.manufacturer, passport.created_at, passport.compliance_status)
    }

    public fun get_current_owner(passport: &ProductPassport): address {
        passport.current_owner
    }

    public fun get_passport_count(registry: &PassportRegistry): u64 {
        registry.passport_count
    }

    // ===================== Zero-Knowledge Proof Verification (Simplified) =====================
    public fun verify_basic_proof(proof_value: u64, expected_range: u64): bool {
        // Simplified proof verification - demonstrates concept
        // In production would use proper cryptographic verification
        proof_value > 0 && proof_value <= expected_range
    }

    public fun create_transfer_record(
        from: address,
        to: address,
        timestamp: u64
    ): TransferRecord {
        TransferRecord {
            from,
            to,
            timestamp
        }
    }

    // ===================== Supply Chain Verification =====================
    public fun validate_supply_chain_step(
        passport: &ProductPassport,
        current_step: u64,
        validator: address
    ): bool {
        // Simplified supply chain validation
        passport.current_owner == validator && current_step > 0
    }

    public fun calculate_trust_score(
        passport: &ProductPassport,
        verification_count: u64
    ): u64 {
        // Calculate trust score based on verification history
        let base_score = if (passport.compliance_status) { 50 } else { 0 };
        let verification_bonus = verification_count * 10;
        base_score + verification_bonus
    }
}