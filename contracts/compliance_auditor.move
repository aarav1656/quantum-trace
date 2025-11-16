/// Automated Compliance Auditor for Regulatory Requirements
/// Implements automated checking for FDA, EU, ISO and other regulatory frameworks
module supply_chain::compliance_auditor {
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
    const ERuleNotFound: u64 = 2;
    const EComplianceViolation: u64 = 3;
    const EInvalidCertificate: u64 = 4;
    const EExpiredRegulation: u64 = 5;
    const EInsufficientDocumentation: u64 = 6;
    const EConflictingRequirements: u64 = 7;
    const EAuditInProgress: u64 = 8;

    /// Central compliance auditing system
    struct ComplianceAuditor has key {
        id: UID,
        admin: address,
        total_audits_performed: u64,

        // Regulatory frameworks and requirements
        regulatory_frameworks: Table<String, RegulatoryFramework>, // framework_id -> framework
        compliance_rules: Table<String, ComplianceRule>, // rule_id -> rule
        rule_dependencies: Table<String, vector<String>>, // rule_id -> dependent_rule_ids

        // Authority certifications and credentials
        regulatory_authorities: Table<address, AuthorityInfo>,
        certified_auditors: Table<address, AuditorCredentials>,

        // Product category compliance matrices
        product_compliance_matrix: Table<String, vector<String>>, // product_type -> required_rule_ids
        industry_standards: Table<String, IndustryStandard>,

        // Geographic jurisdiction mappings
        jurisdiction_rules: Table<String, vector<String>>, // country_code -> applicable_rule_ids
        trade_agreements: Table<String, TradeAgreement>,

        // Real-time compliance monitoring
        active_monitors: Table<String, ComplianceMonitor>,
        violation_alerts: Table<String, vector<ViolationAlert>>,

        // AI/ML compliance prediction models
        ml_models: Table<String, MLComplianceModel>,
        prediction_cache: Table<String, PredictionResult>,

        // Audit trail and documentation
        audit_results: Table<String, AuditResult>, // audit_id -> result
        compliance_reports: Table<String, ComplianceReport>,
    }

    /// Regulatory framework definition
    struct RegulatoryFramework has store, copy, drop {
        framework_id: String,
        name: String, // "FDA_CFR", "EU_MDR", "ISO_9001", etc.
        issuing_authority: address,
        version: String,
        effective_date: u64,
        expiry_date: Option<u64>,
        jurisdiction: vector<String>, // Country codes
        applicable_industries: vector<String>,
        enforcement_level: u8, // 1-5 (1=guidance, 5=mandatory)
        last_updated: u64,
        change_summary: String,
    }

    /// Individual compliance rule
    struct ComplianceRule has store, copy, drop {
        rule_id: String,
        framework_id: String,
        rule_type: String, // "documentation", "testing", "certification", "process"
        title: String,
        description: String,
        requirements: vector<String>,

        // Technical specifications
        required_documents: vector<String>,
        required_tests: vector<String>,
        required_certifications: vector<String>,
        required_processes: vector<String>,

        // Validation criteria
        validation_methods: vector<String>,
        acceptance_criteria: vector<String>,
        measurement_units: Option<String>,
        threshold_values: Table<String, String>,

        // Temporal aspects
        compliance_window_days: Option<u32>,
        periodic_review_days: Option<u32>,
        grace_period_days: Option<u32>,

        // Risk and impact
        violation_severity: u8, // 1-5
        financial_penalty_range: Option<String>,
        market_access_impact: bool,
        safety_critical: bool,

        // Dependencies and conflicts
        prerequisite_rules: vector<String>,
        conflicting_rules: vector<String>,
        alternative_compliance_paths: vector<String>,
    }

    /// Regulatory authority information
    struct AuthorityInfo has store, copy, drop {
        name: String,
        country_code: String,
        public_key: vector<u8>, // For verifying official documents
        frameworks_managed: vector<String>,
        contact_information: String,
        digital_seal: vector<u8>,
        authority_level: u8, // 1-5 (1=regional, 5=international)
        last_verification: u64,
        trusted: bool,
    }

    /// Certified auditor credentials
    struct AuditorCredentials has store, copy, drop {
        auditor_name: String,
        certification_body: address,
        certifications: vector<String>, // List of certification IDs
        authorized_frameworks: vector<String>,
        authorized_regions: vector<String>,
        certification_expiry: u64,
        audit_count: u32,
        success_rate: u8, // 0-100%
        specializations: vector<String>,
        language_capabilities: vector<String>,
        active: bool,
    }

    /// Industry standard definition
    struct IndustryStandard has store, copy, drop {
        standard_id: String,
        name: String, // "GMP", "HACCP", "ISO_22000", etc.
        industry: String,
        version: String,
        issuing_organization: String,
        requirements_overview: String,
        certification_required: bool,
        annual_audit_required: bool,
        compatible_frameworks: vector<String>,
    }

    /// Trade agreement affecting compliance
    struct TradeAgreement has store, copy, drop {
        agreement_id: String,
        name: String, // "USMCA", "EU-MERCOSUR", etc.
        participating_countries: vector<String>,
        effective_date: u64,
        expiry_date: Option<u64>,
        mutual_recognition_rules: vector<String>,
        streamlined_procedures: vector<String>,
        common_standards: vector<String>,
    }

    /// Real-time compliance monitoring
    struct ComplianceMonitor has store, copy, drop {
        monitor_id: String,
        monitored_entities: vector<ID>, // Product passport IDs or shipment IDs
        monitoring_rules: vector<String>,
        check_frequency_hours: u32,
        alert_thresholds: Table<String, String>,
        auto_remediation: bool,
        escalation_contacts: vector<address>,
        active: bool,
        last_check: u64,
    }

    /// Compliance violation alert
    struct ViolationAlert has store, copy, drop {
        alert_id: String,
        entity_id: ID, // Product or shipment ID
        rule_id: String,
        violation_type: String,
        severity: u8, // 1-5
        detected_timestamp: u64,
        description: String,
        auto_detected: bool,
        evidence: vector<String>, // Document hashes or data references
        remediation_suggestions: vector<String>,
        acknowledged: bool,
        resolved: bool,
        resolution_timestamp: Option<u64>,
    }

    /// AI/ML compliance prediction model
    struct MLComplianceModel has store, copy, drop {
        model_id: String,
        model_type: String, // "risk_prediction", "violation_detection", "compliance_score"
        framework_id: String,
        training_data_size: u32,
        accuracy_percentage: u8,
        last_training: u64,
        prediction_confidence_threshold: u8,
        input_features: vector<String>,
        output_categories: vector<String>,
        model_hash: vector<u8>, // For integrity verification
    }

    /// Prediction result from ML models
    struct PredictionResult has store, copy, drop {
        prediction_id: String,
        model_id: String,
        entity_id: ID,
        prediction_timestamp: u64,
        risk_score: u8, // 0-100
        compliance_probability: u8, // 0-100
        predicted_violations: vector<String>,
        confidence_level: u8,
        recommendations: vector<String>,
        validity_period_hours: u32,
    }

    /// Comprehensive compliance audit execution
    struct ComplianceAudit has key, store {
        id: UID,
        audit_id: String,
        entity_id: ID, // Product passport or shipment ID
        entity_type: String, // "product", "shipment", "facility"

        // Audit scope and configuration
        auditor: address,
        framework_ids: vector<String>,
        rule_ids: vector<String>,
        audit_scope: String, // "full", "targeted", "follow_up"

        // Execution details
        start_timestamp: u64,
        end_timestamp: Option<u64>,
        status: u8, // 0: Scheduled, 1: In Progress, 2: Completed, 3: Failed

        // Documentation and evidence
        documents_reviewed: vector<DocumentReview>,
        tests_performed: vector<TestResult>,
        interviews_conducted: vector<InterviewRecord>,
        observations: vector<String>,

        // Results and findings
        compliant_rules: vector<String>,
        violated_rules: vector<ViolationFinding>,
        conditional_compliance: vector<ConditionalCompliance>,
        overall_score: u8, // 0-100

        // Recommendations and actions
        corrective_actions: vector<CorrectiveAction>,
        preventive_measures: vector<String>,
        follow_up_required: bool,
        next_audit_recommended: u64,

        // Verification and approval
        auditor_signature: vector<u8>,
        authority_approval: Option<AuthorityApproval>,
        certificate_issued: bool,
        certificate_id: Option<String>,
    }

    /// Document review record
    struct DocumentReview has store, copy, drop {
        document_type: String,
        document_id: String,
        document_hash: vector<u8>,
        reviewer: address,
        review_timestamp: u64,
        completeness_score: u8, // 0-100
        accuracy_verified: bool,
        deficiencies_found: vector<String>,
        compliance_status: String, // "compliant", "non_compliant", "needs_update"
    }

    /// Test result record
    struct TestResult has store, copy, drop {
        test_type: String,
        test_id: String,
        test_method: String,
        test_timestamp: u64,
        test_location: String,
        test_operator: address,
        results: Table<String, String>, // Parameter -> Value
        pass_criteria: Table<String, String>,
        passed: bool,
        margin_of_error: Option<String>,
        calibration_status: String,
    }

    /// Interview record for human factors
    struct InterviewRecord has store, copy, drop {
        interviewee_role: String,
        interview_timestamp: u64,
        interviewer: address,
        topics_covered: vector<String>,
        responses_summary: String,
        concerns_raised: vector<String>,
        training_needs_identified: vector<String>,
        follow_up_required: bool,
    }

    /// Violation finding details
    struct ViolationFinding has store, copy, drop {
        rule_id: String,
        violation_type: String,
        severity: u8,
        description: String,
        evidence: vector<String>,
        root_cause_analysis: String,
        immediate_risk: bool,
        estimated_remediation_time: u32, // Hours
        estimated_cost: Option<String>,
        regulatory_implications: String,
    }

    /// Conditional compliance requirement
    struct ConditionalCompliance has store, copy, drop {
        rule_id: String,
        condition_description: String,
        required_actions: vector<String>,
        completion_deadline: u64,
        monitoring_required: bool,
        escalation_trigger: String,
    }

    /// Corrective action plan
    struct CorrectiveAction has store, copy, drop {
        action_id: String,
        rule_id: String,
        action_type: String, // "immediate", "short_term", "long_term"
        description: String,
        responsible_party: address,
        target_completion: u64,
        resources_required: vector<String>,
        success_criteria: String,
        verification_method: String,
        status: u8, // 0: Open, 1: In Progress, 2: Completed, 3: Overdue
    }

    /// Authority approval for audit results
    struct AuthorityApproval has store, copy, drop {
        approving_authority: address,
        approval_timestamp: u64,
        approval_reference: String,
        conditions: vector<String>,
        validity_period: u64,
        digital_signature: vector<u8>,
        public_announcement: bool,
    }

    /// Audit result summary
    struct AuditResult has store, copy, drop {
        audit_id: String,
        entity_id: ID,
        completion_timestamp: u64,
        overall_compliance: bool,
        compliance_score: u8,
        critical_violations: u32,
        major_violations: u32,
        minor_violations: u32,
        certificate_issued: bool,
        valid_until: Option<u64>,
        next_audit_due: u64,
    }

    /// Compliance report for stakeholders
    struct ComplianceReport has store, copy, drop {
        report_id: String,
        report_type: String, // "audit_summary", "trend_analysis", "gap_assessment"
        entity_ids: vector<ID>,
        reporting_period: String,
        generated_by: address,
        generation_timestamp: u64,
        executive_summary: String,
        key_findings: vector<String>,
        recommendations: vector<String>,
        risk_assessment: String,
        improvement_metrics: Table<String, String>,
        distribution_list: vector<address>,
    }

    // Events
    struct AuditScheduled has copy, drop {
        audit_id: String,
        entity_id: ID,
        auditor: address,
        scheduled_date: u64,
        frameworks: vector<String>,
    }

    struct ViolationDetected has copy, drop {
        entity_id: ID,
        rule_id: String,
        severity: u8,
        auto_detected: bool,
        timestamp: u64,
    }

    struct ComplianceCertified has copy, drop {
        entity_id: ID,
        certificate_id: String,
        frameworks: vector<String>,
        valid_until: u64,
        timestamp: u64,
    }

    struct RegulatoryUpdate has copy, drop {
        framework_id: String,
        update_type: String,
        effective_date: u64,
        impact_assessment: String,
        timestamp: u64,
    }

    // Initialize the compliance auditor
    fun init(ctx: &mut TxContext) {
        let auditor = ComplianceAuditor {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            total_audits_performed: 0,
            regulatory_frameworks: table::new(ctx),
            compliance_rules: table::new(ctx),
            rule_dependencies: table::new(ctx),
            regulatory_authorities: table::new(ctx),
            certified_auditors: table::new(ctx),
            product_compliance_matrix: table::new(ctx),
            industry_standards: table::new(ctx),
            jurisdiction_rules: table::new(ctx),
            trade_agreements: table::new(ctx),
            active_monitors: table::new(ctx),
            violation_alerts: table::new(ctx),
            ml_models: table::new(ctx),
            prediction_cache: table::new(ctx),
            audit_results: table::new(ctx),
            compliance_reports: table::new(ctx),
        };

        transfer::share_object(auditor);
    }

    /// Register a new regulatory framework
    public entry fun register_regulatory_framework(
        auditor: &mut ComplianceAuditor,
        framework_id: String,
        name: String,
        version: String,
        effective_date: u64,
        expiry_date: Option<u64>,
        jurisdiction: vector<String>,
        applicable_industries: vector<String>,
        enforcement_level: u8,
        change_summary: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let authority = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Verify authority is registered
        assert!(table::contains(&auditor.regulatory_authorities, authority), ENotAuthorized);

        let framework = RegulatoryFramework {
            framework_id,
            name,
            issuing_authority: authority,
            version,
            effective_date,
            expiry_date,
            jurisdiction,
            applicable_industries,
            enforcement_level,
            last_updated: timestamp,
            change_summary,
        };

        table::add(&mut auditor.regulatory_frameworks, framework_id, framework);

        event::emit(RegulatoryUpdate {
            framework_id,
            update_type: string::utf8(b"new_framework"),
            effective_date,
            impact_assessment: change_summary,
            timestamp,
        });
    }

    /// Add compliance rule to framework
    public entry fun add_compliance_rule(
        auditor: &mut ComplianceAuditor,
        rule_id: String,
        framework_id: String,
        rule_type: String,
        title: String,
        description: String,
        requirements: vector<String>,
        required_documents: vector<String>,
        required_tests: vector<String>,
        validation_methods: vector<String>,
        acceptance_criteria: vector<String>,
        violation_severity: u8,
        safety_critical: bool,
        ctx: &mut TxContext
    ) {
        let authority = tx_context::sender(ctx);

        // Verify framework exists and authority is authorized
        assert!(table::contains(&auditor.regulatory_frameworks, framework_id), ERuleNotFound);
        let framework = table::borrow(&auditor.regulatory_frameworks, framework_id);
        assert!(framework.issuing_authority == authority, ENotAuthorized);

        let rule = ComplianceRule {
            rule_id,
            framework_id,
            rule_type,
            title,
            description,
            requirements,
            required_documents,
            required_tests,
            required_certifications: vector::empty(),
            required_processes: vector::empty(),
            validation_methods,
            acceptance_criteria,
            measurement_units: option::none(),
            threshold_values: table::new(ctx),
            compliance_window_days: option::none(),
            periodic_review_days: option::none(),
            grace_period_days: option::none(),
            violation_severity,
            financial_penalty_range: option::none(),
            market_access_impact: false,
            safety_critical,
            prerequisite_rules: vector::empty(),
            conflicting_rules: vector::empty(),
            alternative_compliance_paths: vector::empty(),
        };

        table::add(&mut auditor.compliance_rules, rule_id, rule);
    }

    /// Execute comprehensive compliance audit
    public entry fun execute_compliance_audit(
        auditor: &mut ComplianceAuditor,
        entity_id: ID,
        entity_type: String,
        framework_ids: vector<String>,
        audit_scope: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let auditor_address = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Verify auditor is certified
        assert!(table::contains(&auditor.certified_auditors, auditor_address), ENotAuthorized);

        // Generate audit ID
        let audit_id_data = vector::empty<u8>();
        vector::append(&mut audit_id_data, *string::bytes(&entity_type));
        let audit_id = string::utf8(hash::keccak256(&audit_id_data));

        // Collect applicable rules
        let applicable_rules = vector::empty<String>();
        let i = 0;
        while (i < vector::length(&framework_ids)) {
            let framework_id = vector::borrow(&framework_ids, i);
            // In production, would collect all rules for this framework
            i = i + 1;
        };

        let audit = ComplianceAudit {
            id: object::new(ctx),
            audit_id,
            entity_id,
            entity_type,
            auditor: auditor_address,
            framework_ids,
            rule_ids: applicable_rules,
            audit_scope,
            start_timestamp: timestamp,
            end_timestamp: option::none(),
            status: 1, // In Progress
            documents_reviewed: vector::empty(),
            tests_performed: vector::empty(),
            interviews_conducted: vector::empty(),
            observations: vector::empty(),
            compliant_rules: vector::empty(),
            violated_rules: vector::empty(),
            conditional_compliance: vector::empty(),
            overall_score: 0,
            corrective_actions: vector::empty(),
            preventive_measures: vector::empty(),
            follow_up_required: false,
            next_audit_recommended: timestamp + (365 * 24 * 60 * 60 * 1000), // 1 year
            auditor_signature: vector::empty(),
            authority_approval: option::none(),
            certificate_issued: false,
            certificate_id: option::none(),
        };

        auditor.total_audits_performed = auditor.total_audits_performed + 1;

        event::emit(AuditScheduled {
            audit_id,
            entity_id,
            auditor: auditor_address,
            scheduled_date: timestamp,
            frameworks: framework_ids,
        });

        transfer::public_transfer(audit, auditor_address);
    }

    /// Complete audit with findings and recommendations
    public entry fun complete_audit(
        auditor_system: &mut ComplianceAuditor,
        audit: &mut ComplianceAudit,
        compliant_rules: vector<String>,
        violated_rules: vector<String>, // Simplified - would be ViolationFinding structs
        overall_score: u8,
        auditor_signature: vector<u8>,
        certificate_required: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == audit.auditor, ENotAuthorized);
        assert!(audit.status == 1, EAuditInProgress); // Must be in progress

        let timestamp = clock::timestamp_ms(clock);

        audit.end_timestamp = option::some(timestamp);
        audit.status = 2; // Completed
        audit.compliant_rules = compliant_rules;
        audit.overall_score = overall_score;
        audit.auditor_signature = auditor_signature;

        // Store simplified violation findings
        let i = 0;
        while (i < vector::length(&violated_rules)) {
            let rule_id = *vector::borrow(&violated_rules, i);
            let violation = ViolationFinding {
                rule_id,
                violation_type: string::utf8(b"non_compliance"),
                severity: 3, // Default medium severity
                description: string::utf8(b"Rule violation detected during audit"),
                evidence: vector::empty(),
                root_cause_analysis: string::utf8(b"To be determined"),
                immediate_risk: false,
                estimated_remediation_time: 168, // 1 week default
                estimated_cost: option::none(),
                regulatory_implications: string::utf8(b"May affect compliance status"),
            };
            vector::push_back(&mut audit.violated_rules, violation);
            i = i + 1;
        };

        // Create audit result summary
        let audit_result = AuditResult {
            audit_id: audit.audit_id,
            entity_id: audit.entity_id,
            completion_timestamp: timestamp,
            overall_compliance: overall_score >= 80, // 80% threshold
            compliance_score: overall_score,
            critical_violations: 0, // Would calculate from violation findings
            major_violations: vector::length(&violated_rules) as u32,
            minor_violations: 0,
            certificate_issued: certificate_required && overall_score >= 80,
            valid_until: if (certificate_required && overall_score >= 80) {
                option::some(timestamp + (365 * 24 * 60 * 60 * 1000)) // 1 year
            } else {
                option::none()
            },
            next_audit_due: timestamp + (365 * 24 * 60 * 60 * 1000),
        };

        table::add(&mut auditor_system.audit_results, audit.audit_id, audit_result);

        // Issue certificate if compliant
        if (certificate_required && overall_score >= 80) {
            audit.certificate_issued = true;
            let certificate_id = string::utf8(hash::keccak256(&auditor_signature));
            audit.certificate_id = option::some(certificate_id);

            event::emit(ComplianceCertified {
                entity_id: audit.entity_id,
                certificate_id,
                frameworks: audit.framework_ids,
                valid_until: timestamp + (365 * 24 * 60 * 60 * 1000),
                timestamp,
            });
        };

        // Emit violations if any
        if (!vector::is_empty(&violated_rules)) {
            let j = 0;
            while (j < vector::length(&violated_rules)) {
                let rule_id = *vector::borrow(&violated_rules, j);
                event::emit(ViolationDetected {
                    entity_id: audit.entity_id,
                    rule_id,
                    severity: 3,
                    auto_detected: false,
                    timestamp,
                });
                j = j + 1;
            };
        };
    }

    /// Automated compliance check using ML prediction
    public entry fun automated_compliance_check(
        auditor: &mut ComplianceAuditor,
        entity_id: ID,
        model_id: String,
        input_data: vector<String>, // Encoded input features
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);

        // Verify ML model exists
        assert!(table::contains(&auditor.ml_models, model_id), ERuleNotFound);
        let model = table::borrow(&auditor.ml_models, model_id);

        // Generate prediction (simplified)
        let prediction_id = string::utf8(hash::keccak256(&input_data[0])); // Simplified

        let prediction = PredictionResult {
            prediction_id,
            model_id,
            entity_id,
            prediction_timestamp: timestamp,
            risk_score: 75, // Would use actual ML model
            compliance_probability: 85,
            predicted_violations: vector::empty(),
            confidence_level: 90,
            recommendations: vector::empty(),
            validity_period_hours: 24,
        };

        table::add(&mut auditor.prediction_cache, prediction_id, prediction);

        // Trigger alerts if risk is high
        if (prediction.risk_score > 80) {
            let alert = ViolationAlert {
                alert_id: prediction_id,
                entity_id,
                rule_id: string::utf8(b"ML_PREDICTION"),
                violation_type: string::utf8(b"high_risk_prediction"),
                severity: 4,
                detected_timestamp: timestamp,
                description: string::utf8(b"ML model predicts high compliance risk"),
                auto_detected: true,
                evidence: input_data,
                remediation_suggestions: vector::empty(),
                acknowledged: false,
                resolved: false,
                resolution_timestamp: option::none(),
            };

            if (!table::contains(&auditor.violation_alerts, prediction_id)) {
                table::add(&mut auditor.violation_alerts, prediction_id, vector::empty());
            };
            let alerts = table::borrow_mut(&mut auditor.violation_alerts, prediction_id);
            vector::push_back(alerts, alert);

            event::emit(ViolationDetected {
                entity_id,
                rule_id: string::utf8(b"ML_PREDICTION"),
                severity: 4,
                auto_detected: true,
                timestamp,
            });
        };
    }

    /// Setup real-time compliance monitoring
    public entry fun setup_compliance_monitor(
        auditor: &mut ComplianceAuditor,
        monitor_id: String,
        monitored_entities: vector<ID>,
        monitoring_rules: vector<String>,
        check_frequency_hours: u32,
        auto_remediation: bool,
        escalation_contacts: vector<address>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == auditor.admin, ENotAuthorized);

        let timestamp = clock::timestamp_ms(clock);

        let monitor = ComplianceMonitor {
            monitor_id,
            monitored_entities,
            monitoring_rules,
            check_frequency_hours,
            alert_thresholds: table::new(ctx),
            auto_remediation,
            escalation_contacts,
            active: true,
            last_check: timestamp,
        };

        table::add(&mut auditor.active_monitors, monitor_id, monitor);
    }

    // View functions

    /// Get compliance score for entity
    public fun get_compliance_score(auditor: &ComplianceAuditor, audit_id: String): (bool, u8, u32) {
        if (table::contains(&auditor.audit_results, audit_id)) {
            let result = table::borrow(&auditor.audit_results, audit_id);
            (result.overall_compliance, result.compliance_score, result.major_violations)
        } else {
            (false, 0, 0)
        }
    }

    /// Check if framework is active
    public fun is_framework_active(auditor: &ComplianceAuditor, framework_id: String, current_timestamp: u64): bool {
        if (table::contains(&auditor.regulatory_frameworks, framework_id)) {
            let framework = table::borrow(&auditor.regulatory_frameworks, framework_id);
            if (option::is_some(&framework.expiry_date)) {
                let expiry = *option::borrow(&framework.expiry_date);
                current_timestamp <= expiry && current_timestamp >= framework.effective_date
            } else {
                current_timestamp >= framework.effective_date
            }
        } else {
            false
        }
    }

    /// Get prediction result
    public fun get_prediction_result(auditor: &ComplianceAuditor, prediction_id: String): (u8, u8, u8) {
        if (table::contains(&auditor.prediction_cache, prediction_id)) {
            let prediction = table::borrow(&auditor.prediction_cache, prediction_id);
            (prediction.risk_score, prediction.compliance_probability, prediction.confidence_level)
        } else {
            (0, 0, 0)
        }
    }

    // Admin functions

    /// Register regulatory authority
    public entry fun register_authority(
        auditor: &mut ComplianceAuditor,
        authority: address,
        name: String,
        country_code: String,
        public_key: vector<u8>,
        frameworks_managed: vector<String>,
        contact_information: String,
        digital_seal: vector<u8>,
        authority_level: u8,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == auditor.admin, ENotAuthorized);

        let authority_info = AuthorityInfo {
            name,
            country_code,
            public_key,
            frameworks_managed,
            contact_information,
            digital_seal,
            authority_level,
            last_verification: 0,
            trusted: true,
        };

        table::add(&mut auditor.regulatory_authorities, authority, authority_info);
    }

    /// Certify auditor
    public entry fun certify_auditor(
        auditor_system: &mut ComplianceAuditor,
        auditor_address: address,
        auditor_name: String,
        certifications: vector<String>,
        authorized_frameworks: vector<String>,
        authorized_regions: vector<String>,
        certification_expiry: u64,
        specializations: vector<String>,
        language_capabilities: vector<String>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == auditor_system.admin, ENotAuthorized);

        let credentials = AuditorCredentials {
            auditor_name,
            certification_body: tx_context::sender(ctx),
            certifications,
            authorized_frameworks,
            authorized_regions,
            certification_expiry,
            audit_count: 0,
            success_rate: 100,
            specializations,
            language_capabilities,
            active: true,
        };

        table::add(&mut auditor_system.certified_auditors, auditor_address, credentials);
    }
}