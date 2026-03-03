const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { requireRole } = require('../middleware/roles');

// Inventory Items
router.get('/items', inventoryController.getInventoryItems);
router.get('/items/low-stock', inventoryController.getLowStock);
router.get('/items/expiring', inventoryController.getExpiringSoon);
router.get('/items/barcode/:barcode', inventoryController.getByBarcode);
router.get('/items/:id', inventoryController.getInventoryItem);
router.post('/items', requireRole('admin', 'pharmacist'), inventoryController.createInventoryItem);
router.put('/items/:id', requireRole('admin', 'pharmacist'), inventoryController.updateInventoryItem);

// Categories
router.get('/categories', inventoryController.getCategories);
router.post('/categories', requireRole('admin'), inventoryController.createCategory);

// Suppliers
router.get('/suppliers', inventoryController.getSuppliers);
router.post('/suppliers', requireRole('admin'), inventoryController.createSupplier);

// Purchase Orders
router.get('/orders', inventoryController.getPurchaseOrders);
router.get('/orders/:id', inventoryController.getPurchaseOrder);
router.post('/orders', requireRole('admin', 'pharmacist'), inventoryController.createPurchaseOrder);
router.post('/orders/:id/receive', requireRole('admin', 'pharmacist'), inventoryController.receivePurchaseOrder);

// Stock Movements
router.get('/movements', inventoryController.getStockMovements);
router.post('/movements', requireRole('admin', 'pharmacist', 'doctor'), inventoryController.createStockMovement);

// Reports
router.get('/reports/stock-value', inventoryController.getStockValue);
router.get('/reports/movements', inventoryController.getMovementSummary);

module.exports = router;
