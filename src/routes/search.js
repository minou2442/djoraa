const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { requireRole } = require('../middleware/roles');

// All search endpoints require authentication
// Role-based filtering is done in the controller based on user role

// Main search - searches across all entities
router.get('/', searchController.search);

// Autocomplete suggestions
router.get('/suggestions', searchController.getSuggestions);

// Get quick preview of an entity
router.get('/preview/:entityType/:entityId', searchController.getPreview);

// Search history
router.get('/history', searchController.getHistory);
router.delete('/history', searchController.clearHistory);

// Frequent searches
router.get('/frequent', searchController.getFrequent);

// Advanced search with filters
router.post('/advanced', searchController.advancedSearch);

module.exports = router;
