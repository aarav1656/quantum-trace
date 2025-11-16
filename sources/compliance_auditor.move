module supply_chain_tracker::compliance_auditor {
    use std::string::{Self, String};
    use std::vector;
    use iota::table::{Self, Table};
    use iota::event;
    use iota::object::{Self, UID, ID};
    use iota::tx_context::{Self, TxContext};
    use iota::transfer;
    use iota::clock::{Self, Clock};
    use supply_chain_tracker::supply_chain_tracker::{Self, ProductRegistry};

    // ===================== Error Codes =====================
    const E_UNAUTHORIZED: u64 = 1;
    const E_INVALID_SCORE: u64 = 2;
    const E_REPORT_NOT_FOUND: u64 = 3;
    const E_AUTHORITY_NOT_FOUND: u64 = 4;

    // ===================== Compliance Report =====================
    public struct ComplianceReport has key, store {
        id: UID,
        report_id: String,
        target_entity: String, // Product ID or entity identifier
        target_type: String, // "product", "batch", "facility"
        auditor: address,
        authority: String, // "FDA", "EU", "ISO", etc.
        audit_type: String,
        findings: vector<String>,
        recommendations: vector<String>,
        compliance_score: u64, // 0-100
        is_compliant: bool,
        audit_timestamp: u64,
        expiry_timestamp: u64
    }

    // ===================== Regulatory Authority =====================
    public struct RegulatoryAuthority has key, store {
        id: UID,
        authority_id: String,
        name: String,
        jurisdiction: String,
        authorized_auditors: Table<address, bool>,
        certification_types: vector<String>,
        is_active: bool,
        registered_at: u64
    }

    // ===================== Compliance Registry =====================
    public struct ComplianceRegistry has key {
        id: UID,
        reports: Table<String, address>, // report_id -> ComplianceReport address
        authorities: Table<String, address>, // authority_id -> RegulatoryAuthority address
        product_compliance: Table<String, vector<String>>, // product_id -> report_ids
        admin: address,
        total_reports: u64
    }

    // ===================== Events =====================
    public struct ComplianceReportCreated has copy, drop {
        report_id: String,
        target_entity: String,
        auditor: address,
        authority: String,
        compliance_score: u64,
        is_compliant: bool,
        timestamp: u64
    }

    public struct AuthorityRegistered has copy, drop {
        authority_id: String,
        name: String,
        jurisdiction: String,
        timestamp: u64
    }

    public struct AuditorAuthorized has copy, drop {
        authority_id: String,
        auditor: address,
        timestamp: u64
    }

    // ===================== Public Functions =====================

    /// Register a regulatory authority
    public fun register_authority(
        registry: &mut ComplianceRegistry,
        authority_id: String,
        name: String,
        jurisdiction: String,
        certification_types: vector<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == registry.admin, E_UNAUTHORIZED);

        let current_time = clock::timestamp_ms(clock);

        let authority = RegulatoryAuthority {
            id: object::new(ctx),
            authority_id,
            name,
            jurisdiction,
            authorized_auditors: table::new(ctx),
            certification_types,
            is_active: true,
            registered_at: current_time
        };

        let authority_address = object::uid_to_address(&authority.id);
        table::add(&mut registry.authorities, authority_id, authority_address);

        // Emit event
        event::emit(AuthorityRegistered {
            authority_id,
            name,
            jurisdiction,
            timestamp: current_time
        });

        transfer::share_object(authority);
    }

    /// Authorize an auditor for a regulatory authority
    public fun authorize_auditor(
        authority: &mut RegulatoryAuthority,
        auditor: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // In production, implement proper authority management

        table::add(&mut authority.authorized_auditors, auditor, true);

        // Emit event
        event::emit(AuditorAuthorized {
            authority_id: authority.authority_id,
            auditor,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    /// Perform compliance audit
    public fun perform_audit(
        registry: &mut ComplianceRegistry,
        product_registry: &ProductRegistry,
        target_entity: String,
        authority: String,
        audit_type: String,
        findings: vector<String>,
        recommendations: vector<String>,
        compliance_score: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate compliance score
        assert!(compliance_score <= 100, E_INVALID_SCORE);

        // Generate report ID
        let report_id = generate_report_id(sender, current_time);

        let is_compliant = compliance_score >= 70; // 70% threshold for compliance

        let report = ComplianceReport {
            id: object::new(ctx),
            report_id,
            target_entity,
            target_type: string::utf8(b"product"),
            auditor: sender,
            authority,
            audit_type,
            findings,
            recommendations,
            compliance_score,
            is_compliant,
            audit_timestamp: current_time,
            expiry_timestamp: current_time + (365 * 24 * 60 * 60 * 1000) // 1 year validity
        };

        let report_address = object::uid_to_address(&report.id);
        table::add(&mut registry.reports, report_id, report_address);
        registry.total_reports = registry.total_reports + 1;

        // Add to product compliance history
        if (!table::contains(&registry.product_compliance, target_entity)) {
            table::add(&mut registry.product_compliance, target_entity, vector::empty<String>());
        };

        let product_reports = table::borrow_mut(&mut registry.product_compliance, target_entity);
        vector::push_back(product_reports, report_id);

        // Emit event
        event::emit(ComplianceReportCreated {
            report_id,
            target_entity,
            auditor: sender,
            authority,
            compliance_score,
            is_compliant,
            timestamp: current_time
        });

        transfer::transfer(report, sender);
    }

    /// Check if entity is compliant
    public fun is_entity_compliant(
        registry: &ComplianceRegistry,
        entity_id: String,
        authority: String
    ): bool {
        if (!table::contains(&registry.product_compliance, entity_id)) {
            return false
        };

        let report_ids = table::borrow(&registry.product_compliance, entity_id);
        let report_count = vector::length(report_ids);

        // Check latest report for the specific authority
        let mut i = 0;
        while (i < report_count) {
            let report_id = vector::borrow(report_ids, i);
            if (table::contains(&registry.reports, *report_id)) {
                // In a real implementation, we'd check the authority field
                return true // Simplified for demo
            };
            i = i + 1;
        };

        false
    }

    // ===================== Helper Functions =====================

    /// Generate report ID (simplified implementation)
    fun generate_report_id(auditor: address, timestamp: u64): String {
        // In production, use proper ID generation with cryptographic randomness
        string::utf8(b"RPT_001") // Simplified for demo
    }

    // ===================== View Functions =====================

    public fun get_report_count(registry: &ComplianceRegistry): u64 {
        registry.total_reports
    }

    public fun get_authority_count(registry: &ComplianceRegistry): u64 {
        table::length(&registry.authorities)
    }

    public fun report_exists(registry: &ComplianceRegistry, report_id: String): bool {
        table::contains(&registry.reports, report_id)
    }

    public fun authority_exists(registry: &ComplianceRegistry, authority_id: String): bool {
        table::contains(&registry.authorities, authority_id)
    }

    // ===================== Module Initialization =====================
    fun init(ctx: &mut TxContext) {
        let registry = ComplianceRegistry {
            id: object::new(ctx),
            reports: table::new(ctx),
            authorities: table::new(ctx),
            product_compliance: table::new(ctx),
            admin: tx_context::sender(ctx),
            total_reports: 0
        };

        transfer::share_object(registry);
    }

    // ===================== Test Functions =====================
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let registry = ComplianceRegistry {
            id: object::new(ctx),
            reports: table::new(ctx),
            authorities: table::new(ctx),
            product_compliance: table::new(ctx),
            admin: tx_context::sender(ctx),
            total_reports: 0
        };

        transfer::share_object(registry);
    }
}