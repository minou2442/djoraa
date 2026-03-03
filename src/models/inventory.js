const db = require('../utils/db');

// Inventory Item Model
const InventoryItemModel = {
  async findAll(clinicId, filters = {}) {
    let query = `
      SELECT i.*, 
             m.commercial_name, m.generic_name,
             c.name as category_name,
             s.name as supplier_name
      FROM inventory_items i
      LEFT JOIN medications m ON i.medication_id = m.id
      LEFT JOIN inventory_categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.clinic_id = $1
    `;
    const params = [clinicId];
    
    if (filters.category_id) {
      query += ` AND i.category_id = $${params.length + 1}`;
      params.push(filters.category_id);
    }
    if (filters.low_stock) {
      query += ` AND i.quantity <= i.min_quantity`;
    }
    if (filters.expiring_soon) {
      query += ` AND i.expiry_date <= CURRENT_DATE + INTERVAL '30 days'`;
    }
    if (filters.search) {
      query += ` AND (i.name ILIKE $${params.length + 1} OR i.barcode ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`);
    }
    
    query += ` ORDER BY i.name`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT i.*, 
              m.commercial_name, m.generic_name,
              c.name as category_name,
              s.name as supplier_name
       FROM inventory_items i
       LEFT JOIN medications m ON i.medication_id = m.id
       LEFT JOIN inventory_categories c ON i.category_id = c.id
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findByBarcode(barcode, clinicId) {
    const result = await db.query(
      `SELECT i.*, m.commercial_name, m.generic_name
       FROM inventory_items i
       LEFT JOIN medications m ON i.medication_id = m.id
       WHERE i.barcode = $1 AND (i.clinic_id = $2 OR i.clinic_id IS NULL)`,
      [barcode, clinicId]
    );
    return result.rows[0];
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO inventory_items (
        clinic_id, medication_id, name, name_ar, category_id, supplier_id,
        barcode, quantity, min_quantity, max_quantity, unit, unit_cost, unit_price,
        expiry_date, location, active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        data.clinic_id, data.medication_id, data.name, data.name_ar, data.category_id,
        data.supplier_id, data.barcode, data.quantity || 0, data.min_quantity || 10,
        data.max_quantity || 100, data.unit, data.unit_cost, data.unit_price,
        data.expiry_date, data.location, true
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await db.query(
      `UPDATE inventory_items SET 
        medication_id = $1, name = $2, name_ar = $3, category_id = $4, supplier_id = $5,
        barcode = $6, min_quantity = $7, max_quantity = $8, unit = $9, 
        unit_cost = $10, unit_price = $11, expiry_date = $12, location = $13
       WHERE id = $14 RETURNING *`,
      [
        data.medication_id, data.name, data.name_ar, data.category_id, data.supplier_id,
        data.barcode, data.min_quantity, data.max_quantity, data.unit,
        data.unit_cost, data.unit_price, data.expiry_date, data.location, id
      ]
    );
    return result.rows[0];
  },

  async updateQuantity(id, quantity, operation = 'set') {
    let query;
    if (operation === 'add') {
      query = `UPDATE inventory_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    } else if (operation === 'subtract') {
      query = `UPDATE inventory_items SET quantity = GREATEST(0, quantity - $1), updated_at = NOW() WHERE id = $2 RETURNING *`;
    } else {
      query = `UPDATE inventory_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    }
    const result = await db.query(query, [quantity, id]);
    return result.rows[0];
  },

  async getLowStock(clinicId) {
    const result = await db.query(
      `SELECT i.*, m.commercial_name
       FROM inventory_items i
       LEFT JOIN medications m ON i.medication_id = m.id
       WHERE i.clinic_id = $1 AND i.quantity <= i.min_quantity AND i.active = true
       ORDER BY (i.min_quantity - i.quantity) DESC`,
      [clinicId]
    );
    return result.rows;
  },

  async getExpiringSoon(clinicId, days = 30) {
    const result = await db.query(
      `SELECT i.*, m.commercial_name
       FROM inventory_items i
       LEFT JOIN medications m ON i.medication_id = m.id
       WHERE i.clinic_id = $1 
         AND i.expiry_date <= CURRENT_DATE + INTERVAL '${days} days'
         AND i.expiry_date >= CURRENT_DATE
         AND i.active = true
       ORDER BY i.expiry_date ASC`,
      [clinicId]
    );
    return result.rows;
  }
};

// Inventory Categories Model
const CategoryModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT c.*, COUNT(i.id) as item_count
       FROM inventory_categories c
       LEFT JOIN inventory_items i ON c.id = i.category_id
       WHERE c.clinic_id = $1 OR c.clinic_id IS NULL
       GROUP BY c.id
       ORDER BY c.name`,
      [clinicId]
    );
    return result.rows;
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO inventory_categories (clinic_id, name, name_ar, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.clinic_id, data.name, data.name_ar, data.description]
    );
    return result.rows[0];
  }
};

// Supplier Model
const SupplierModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT s.*, COUNT(DISTINCT i.id) as item_count
       FROM suppliers s
       LEFT JOIN inventory_items i ON s.id = i.supplier_id
       WHERE s.clinic_id = $1 OR s.clinic_id IS NULL
       GROUP BY s.id
       ORDER BY s.name`,
      [clinicId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(`SELECT * FROM suppliers WHERE id = $1`, [id]);
    return result.rows[0];
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO suppliers (clinic_id, name, name_ar, contact_person, phone, email, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.clinic_id, data.name, data.name_ar, data.contact_person, data.phone, data.email, data.address, data.notes]
    );
    return result.rows[0];
  }
};

// Batch Model
const BatchModel = {
  async findByItem(itemId) {
    const result = await db.query(
      `SELECT * FROM inventory_batches WHERE item_id = $1 ORDER BY expiry_date ASC`,
      [itemId]
    );
    return result.rows;
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO inventory_batches (item_id, batch_number, quantity, unit_cost, expiry_date, received_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.item_id, data.batch_number, data.quantity, data.unit_cost, data.expiry_date, data.received_date]
    );
    return result.rows[0];
  },

  async updateQuantity(id, quantity) {
    const result = await db.query(
      `UPDATE inventory_batches SET quantity = quantity + $1 WHERE id = $2 RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  }
};

// Purchase Order Model
const PurchaseOrderModel = {
  async findAll(clinicId, filters = {}) {
    let query = `
      SELECT po.*, s.name as supplier_name, u.username as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.clinic_id = $1
    `;
    const params = [clinicId];
    
    if (filters.status) {
      query += ` AND po.status = $${params.length + 1}`;
      params.push(filters.status);
    }
    
    query += ` ORDER BY po.created_at DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      `SELECT po.*, s.name as supplier_name, u.username as created_by_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       LEFT JOIN users u ON po.created_by = u.id
       WHERE po.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async getItems(orderId) {
    const result = await db.query(
      `SELECT poi.*, i.name as item_name, i.unit
       FROM purchase_order_items poi
       JOIN inventory_items i ON poi.item_id = i.id
       WHERE poi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  },

  async create(data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      const orderResult = await client.query(
        `INSERT INTO purchase_orders (clinic_id, supplier_id, status, notes, expected_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [data.clinic_id, data.supplier_id, 'pending', data.notes, data.expected_date, data.created_by]
      );
      const order = orderResult.rows[0];
      
      for (const item of data.items) {
        await client.query(
          `INSERT INTO purchase_order_items (order_id, item_id, quantity, unit_cost, received_quantity)
           VALUES ($2, $3, $4, $5, 0)`,
          [order.id, item.item_id, item.quantity, item.unit_cost]
        );
      }
      
      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateStatus(id, status, receivedItems = []) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(
        `UPDATE purchase_orders SET status = $1, received_at = NOW() WHERE id = $2`,
        [status, id]
      );
      
      // Update inventory quantities and create batches
      for (const item of receivedItems) {
        await client.query(
          `UPDATE inventory_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2`,
          [item.received_quantity, item.item_id]
        );
        
        await client.query(
          `INSERT INTO inventory_batches (item_id, batch_number, quantity, unit_cost, expiry_date, received_date)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [item.item_id, item.batch_number, item.received_quantity, item.unit_cost, item.expiry_date]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

// Stock Movement Model
const StockMovementModel = {
  async findAll(clinicId, filters = {}) {
    let query = `
      SELECT sm.*, i.name as item_name, u.username as done_by_name
      FROM stock_movements sm
      JOIN inventory_items i ON sm.item_id = i.id
      LEFT JOIN users u ON sm.done_by = u.id
      WHERE i.clinic_id = $1
    `;
    const params = [clinicId];
    
    if (filters.item_id) {
      query += ` AND sm.item_id = $${params.length + 1}`;
      params.push(filters.item_id);
    }
    if (filters.movement_type) {
      query += ` AND sm.movement_type = $${params.length + 1}`;
      params.push(filters.movement_type);
    }
    
    query += ` ORDER BY sm.created_at DESC LIMIT 200`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  async create(data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Update quantity
      let quantityChange = data.quantity;
      if (data.movement_type === 'out' || data.movement_type === 'dispensed' || data.movement_type === 'expired') {
        quantityChange = -data.quantity;
      }
      
      await client.query(
        `UPDATE inventory_items SET quantity = GREATEST(0, quantity + $1), updated_at = NOW() WHERE id = $2`,
        [quantityChange, data.item_id]
      );
      
      // Record movement
      const result = await client.query(
        `INSERT INTO stock_movements (clinic_id, item_id, movement_type, quantity, reference, notes, done_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [data.clinic_id, data.item_id, data.movement_type, data.quantity, data.reference, data.notes, data.done_by]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

// Inventory Reports
const InventoryReports = {
  async getStockValue(clinicId) {
    const result = await db.query(
      `SELECT 
        SUM(quantity * unit_cost) as total_cost_value,
        SUM(quantity * unit_price) as total_s COUNT(*) as total_items,
ale_value,
               SUM(CASE WHEN quantity <= min_quantity THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 ELSE 0 END) as expiring_soon_count
       FROM inventory_items
       WHERE clinic_id = $1 AND active = true`,
      [clinicId]
    );
    return result.rows[0];
  },

  async getMovementSummary(clinicId, dateFrom, dateTo) {
    const result = await db.query(
      `SELECT 
        movement_type,
        SUM(quantity) as total_quantity,
        COUNT(*) as movement_count
       FROM stock_movements sm
       JOIN inventory_items i ON sm.item_id = i.id
       WHERE i.clinic_id = $1 AND sm.created_at BETWEEN $2 AND $3
       GROUP BY movement_type`,
      [clinicId, dateFrom, dateTo]
    );
    return result.rows;
  }
};

module.exports = {
  InventoryItemModel,
  CategoryModel,
  SupplierModel,
  BatchModel,
  PurchaseOrderModel,
  StockMovementModel,
  InventoryReports
};
