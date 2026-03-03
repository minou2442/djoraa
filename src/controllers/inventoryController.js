const {
  InventoryItemModel,
  CategoryModel,
  SupplierModel,
  BatchModel,
  PurchaseOrderModel,
  StockMovementModel,
  InventoryReports
} = require('../models/inventory');
const { logAction } = require('../utils/auditService');

// Inventory Items
const getInventoryItems = async (req, res) => {
  try {
    const items = await InventoryItemModel.findAll(req.clinicId, req.query);
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

const getInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

const createInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItemModel.create({
      ...req.body,
      clinic_id: req.clinicId
    });
    await logAction(req, 'CREATE', 'inventory_item', item.id, item);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItemModel.update(req.params.id, req.body);
    await logAction(req, 'UPDATE', 'inventory_item', item.id, item);
    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

const getLowStock = async (req, res) => {
  try {
    const items = await InventoryItemModel.getLowStock(req.clinicId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching low stock:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
};

const getExpiringSoon = async (req, res) => {
  try {
    const { days } = req.query;
    const items = await InventoryItemModel.getExpiringSoon(req.clinicId, parseInt(days) || 30);
    res.json(items);
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
};

const getByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const item = await InventoryItemModel.findByBarcode(barcode, req.clinicId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching by barcode:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

// Categories
const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.findAll(req.clinicId);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const category = await CategoryModel.create({
      ...req.body,
      clinic_id: req.clinicId
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Suppliers
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await SupplierModel.findAll(req.clinicId);
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

const createSupplier = async (req, res) => {
  try {
    const supplier = await SupplierModel.create({
      ...req.body,
      clinic_id: req.clinicId
    });
    await logAction(req, 'CREATE', 'supplier', supplier.id, supplier);
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

// Purchase Orders
const getPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrderModel.findAll(req.clinicId, req.query);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const getPurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrderModel.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const items = await PurchaseOrderModel.getItems(req.params.id);
    res.json({ ...order, items });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrderModel.create({
      ...req.body,
      clinic_id: req.clinicId,
      created_by: req.userId
    });
    await logAction(req, 'CREATE', 'purchase_order', order.id, order);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

const receivePurchaseOrder = async (req, res) => {
  try {
    const { status, items } = req.body;
    await PurchaseOrderModel.updateStatus(req.params.id, status, items);
    await logAction(req, 'UPDATE', 'purchase_order', req.params.id, { status, action: 'receive' });
    res.json({ message: 'Order received successfully' });
  } catch (error) {
    console.error('Error receiving order:', error);
    res.status(500).json({ error: 'Failed to receive order' });
  }
};

// Stock Movements
const getStockMovements = async (req, res) => {
  try {
    const movements = await StockMovementModel.findAll(req.clinicId, req.query);
    res.json(movements);
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ error: 'Failed to fetch movements' });
  }
};

const createStockMovement = async (req, res) => {
  try {
    const movement = await StockMovementModel.create({
      ...req.body,
      clinic_id: req.clinicId,
      done_by: req.userId
    });
    await logAction(req, 'CREATE', 'stock_movement', movement.id, movement);
    res.status(201).json(movement);
  } catch (error) {
    console.error('Error creating movement:', error);
    res.status(500).json({ error: 'Failed to create movement' });
  }
};

// Reports
const getStockValue = async (req, res) => {
  try {
    const report = await InventoryReports.getStockValue(req.clinicId);
    res.json(report);
  } catch (error) {
    console.error('Error fetching stock value:', error);
    res.status(500).json({ error: 'Failed to fetch stock value' });
  }
};

const getMovementSummary = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const summary = await InventoryReports.getMovementSummary(req.clinicId, date_from, date_to);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching movement summary:', error);
    res.status(500).json({ error: 'Failed to fetch movement summary' });
  }
};

module.exports = {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  getLowStock,
  getExpiringSoon,
  getByBarcode,
  getCategories,
  createCategory,
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  getStockMovements,
  createStockMovement,
  getStockValue,
  getMovementSummary
};
