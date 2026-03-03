const SearchModel = require('../models/search');
const { logAction } = require('../utils/auditService');

// Main search endpoint
const search = async (req, res) => {
  try {
    const { q: query, entity_type, limit, date_from, date_to, status, doctor_id } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const options = {
      limit: parseInt(limit) || 20,
      entity_type,
      date_from,
      date_to,
      status,
      doctor_id: doctor_id ? parseInt(doctor_id) : null
    };

    const results = await SearchModel.search(
      req.clinicId,
      req.userId,
      req.userRole,
      query.trim(),
      options
    );

    // Save to search history (async, don't wait)
    SearchModel.saveSearchHistory(
      req.userId,
      req.clinicId,
      query.trim(),
      entity_type || 'all',
      results.length,
      req.ip
    ).catch(err => console.error('Failed to save search history:', err));

    // Log the search action
    await logAction(req, 'SEARCH', 'search', null, { query, entity_type, result_count: results.length });

    res.json({
      query,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Autocomplete/suggestions
const getSuggestions = async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.json([]);
    }

    const suggestions = await SearchModel.getSuggestions(
      req.clinicId,
      req.userRole,
      query.trim(),
      5
    );

    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

// Get quick preview
const getPreview = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
      return res.status(400).json({ error: 'Entity type and ID required' });
    }

    const preview = await SearchModel.getPreview(
      req.clinicId,
      entityType,
      parseInt(entityId),
      req.userRole
    );

    if (!preview) {
      return res.status(404).json({ error: 'Preview not found or access denied' });
    }

    // Log the preview access
    await logAction(req, 'VIEW', `search_preview_${entityType}`, entityId, null);

    res.json(preview);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Failed to get preview' });
  }
};

// Get search history
const getHistory = async (req, res) => {
  try {
    const { limit } = req.query;
    const history = await SearchModel.getSearchHistory(req.userId, parseInt(limit) || 10);
    res.json(history);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get search history' });
  }
};

// Clear search history
const clearHistory = async (req, res) => {
  try {
    await SearchModel.clearSearchHistory(req.userId);
    res.json({ message: 'Search history cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
};

// Get frequent searches
const getFrequent = async (req, res) => {
  try {
    const frequent = await SearchModel.getFrequentSearches(req.userId, 5);
    res.json(frequent);
  } catch (error) {
    console.error('Frequent searches error:', error);
    res.status(500).json({ error: 'Failed to get frequent searches' });
  }
};

// Advanced search with multiple filters
const advancedSearch = async (req, res) => {
  try {
    const { 
      query,
      entity_type,
      date_from,
      date_to,
      status,
      doctor_id,
      gender,
      age_from,
      age_to,
      payment_status,
      insurance_company,
      category,
      limit = 20
    } = req.body;

    if (!query && !entity_type && !date_from && !date_to) {
      return res.status(400).json({ error: 'At least one search parameter required' });
    }

    const options = {
      limit: parseInt(limit) || 20,
      entity_type,
      date_from,
      date_to,
      status,
      doctor_id: doctor_id ? parseInt(doctor_id) : null,
      gender,
      age_from: age_from ? parseInt(age_from) : null,
      age_to: age_to ? parseInt(age_to) : null,
      payment_status,
      insurance_company,
      category
    };

    // Use general search with filters
    const searchQuery = query || '';
    const results = await SearchModel.search(
      req.clinicId,
      req.userId,
      req.userRole,
      searchQuery,
      options
    );

    // Apply additional filters that can't be done in SQL
    let filteredResults = results;
    
    if (gender) {
      // Would need to join with patients to filter by gender
    }

    res.json({
      query,
      filters: { entity_type, date_from, date_to, status },
      count: filteredResults.length,
      results: filteredResults
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Advanced search failed' });
  }
};

module.exports = {
  search,
  getSuggestions,
  getPreview,
  getHistory,
  clearHistory,
  getFrequent,
  advancedSearch
};
