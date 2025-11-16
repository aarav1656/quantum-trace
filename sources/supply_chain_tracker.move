module supply_chain_tracker::supply_chain_tracker {
    use std::string::{Self, String};
    use std::vector;
    use iota::table::{Self, Table};
    use iota::event;
    use iota::object::{Self, UID, ID};
    use iota::tx_context::{Self, TxContext};
    use iota::transfer;
    use iota::clock::{Self, Clock};

    // ===================== Error Codes =====================
    const E_PRODUCT_NOT_FOUND: u64 = 1;
    const E_UNAUTHORIZED: u64 = 2;
    const E_INVALID_STATUS: u64 = 3;
    const E_BATCH_NOT_FOUND: u64 = 4;
    const E_INVALID_QUANTITY: u64 = 5;

    // ===================== Product Structure =====================
    public struct Product has key, store {
        id: UID,
        product_id: String,
        name: String,
        description: String,
        category: String,
        origin: String,
        metadata: String,
        created_at: u64,
        last_updated: u64,
        is_active: bool,
        verification_level: u8
    }

    // ===================== Tracking Event =====================
    public struct TrackingEvent has store, drop {
        event_id: u64,
        product_id: String,
        event_type: String,
        location: String,
        description: String,
        metadata: String,
        signatures: vector<u8>,
        timestamp: u64,
        verifier: address
    }

    // ===================== Product Batch =====================
    public struct ProductBatch has key, store {
        id: UID,
        batch_id: String,
        description: String,
        quantity: u64,
        unit: String,
        metadata: String,
        created_at: u64,
        is_active: bool
    }

    // ===================== Product Registry =====================
    public struct ProductRegistry has key {
        id: UID,
        products: Table<String, address>, // product_id -> Product object address
        tracking_events: Table<String, vector<TrackingEvent>>, // product_id -> events
        admin: address,
        total_products: u64,
        total_events: u64
    }

    // ===================== Batch Registry =====================
    public struct BatchRegistry has key {
        id: UID,
        batches: Table<String, address>, // batch_id -> Batch object address
        admin: address,
        total_batches: u64
    }

    // ===================== Events =====================
    public struct ProductCreated has copy, drop {
        product_id: String,
        name: String,
        creator: address,
        timestamp: u64
    }

    public struct ProductTracked has copy, drop {
        product_id: String,
        event_type: String,
        location: String,
        verifier: address,
        timestamp: u64
    }

    public struct BatchCreated has copy, drop {
        batch_id: String,
        quantity: u64,
        creator: address,
        timestamp: u64
    }

    // ===================== Public Functions =====================

    /// Create a new product
    public fun create_product(
        registry: &mut ProductRegistry,
        name: String,
        description: String,
        category: String,
        origin: String,
        metadata: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): String {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Generate product ID (simplified - in production use proper ID generation)
        let product_id = generate_product_id(sender, current_time);

        let product = Product {
            id: object::new(ctx),
            product_id,
            name,
            description,
            category,
            origin,
            metadata,
            created_at: current_time,
            last_updated: current_time,
            is_active: true,
            verification_level: 1
        };

        let product_address = object::uid_to_address(&product.id);
        table::add(&mut registry.products, product_id, product_address);
        registry.total_products = registry.total_products + 1;

        // Initialize tracking events for this product
        table::add(&mut registry.tracking_events, product_id, vector::empty<TrackingEvent>());

        // Emit event
        event::emit(ProductCreated {
            product_id,
            name,
            creator: sender,
            timestamp: current_time
        });

        transfer::transfer(product, sender);
        product_id
    }

    /// Track a product event
    public fun track_product(
        registry: &mut ProductRegistry,
        product_id: String,
        event_type: String,
        location: String,
        description: String,
        metadata: String,
        signatures: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Verify product exists
        assert!(table::contains(&registry.products, product_id), E_PRODUCT_NOT_FOUND);

        let tracking_event = TrackingEvent {
            event_id: registry.total_events + 1,
            product_id,
            event_type,
            location,
            description,
            metadata,
            signatures,
            timestamp: current_time,
            verifier: sender
        };

        // Add event to product's tracking history
        let events = table::borrow_mut(&mut registry.tracking_events, product_id);
        vector::push_back(events, tracking_event);

        registry.total_events = registry.total_events + 1;

        // Emit event
        event::emit(ProductTracked {
            product_id,
            event_type,
            location,
            verifier: sender,
            timestamp: current_time
        });
    }

    /// Create a product batch
    public fun create_batch(
        registry: &mut BatchRegistry,
        batch_id: String,
        description: String,
        quantity: u64,
        unit: String,
        metadata: String,
        clock: &Clock,
        ctx: &mut TxContext
    ): String {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        assert!(quantity > 0, E_INVALID_QUANTITY);

        let batch = ProductBatch {
            id: object::new(ctx),
            batch_id,
            description,
            quantity,
            unit,
            metadata,
            created_at: current_time,
            is_active: true
        };

        let batch_address = object::uid_to_address(&batch.id);
        table::add(&mut registry.batches, batch_id, batch_address);
        registry.total_batches = registry.total_batches + 1;

        // Emit event
        event::emit(BatchCreated {
            batch_id,
            quantity,
            creator: sender,
            timestamp: current_time
        });

        transfer::transfer(batch, sender);
        batch_id
    }

    // ===================== Helper Functions =====================

    /// Generate product ID (simplified implementation)
    fun generate_product_id(creator: address, timestamp: u64): String {
        // In production, use proper ID generation with cryptographic randomness
        string::utf8(b"PROD_001") // Simplified for demo
    }

    // ===================== View Functions =====================

    public fun get_product_count(registry: &ProductRegistry): u64 {
        registry.total_products
    }

    public fun get_event_count(registry: &ProductRegistry): u64 {
        registry.total_events
    }

    public fun get_batch_count(registry: &BatchRegistry): u64 {
        registry.total_batches
    }

    public fun product_exists(registry: &ProductRegistry, product_id: String): bool {
        table::contains(&registry.products, product_id)
    }

    public fun batch_exists(registry: &BatchRegistry, batch_id: String): bool {
        table::contains(&registry.batches, batch_id)
    }

    // ===================== Module Initialization =====================
    fun init(ctx: &mut TxContext) {
        let product_registry = ProductRegistry {
            id: object::new(ctx),
            products: table::new(ctx),
            tracking_events: table::new(ctx),
            admin: tx_context::sender(ctx),
            total_products: 0,
            total_events: 0
        };

        let batch_registry = BatchRegistry {
            id: object::new(ctx),
            batches: table::new(ctx),
            admin: tx_context::sender(ctx),
            total_batches: 0
        };

        transfer::share_object(product_registry);
        transfer::share_object(batch_registry);
    }

    // ===================== Test Functions =====================
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let product_registry = ProductRegistry {
            id: object::new(ctx),
            products: table::new(ctx),
            tracking_events: table::new(ctx),
            admin: tx_context::sender(ctx),
            total_products: 0,
            total_events: 0
        };

        let batch_registry = BatchRegistry {
            id: object::new(ctx),
            batches: table::new(ctx),
            admin: tx_context::sender(ctx),
            total_batches: 0
        };

        transfer::share_object(product_registry);
        transfer::share_object(batch_registry);
    }
}