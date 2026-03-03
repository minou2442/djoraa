import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface SearchResult {
  entity_type: string;
  entity_id: number;
  title: string;
  subtitle: string;
  status: string;
  relevance_score: number;
}

interface SearchHistory {
  search_term: string;
  entity_type: string;
  result_count: number;
  created_at: string;
}

interface GlobalSearchProps {
  onResultClick?: (entityType: string, entityId: number) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onResultClick }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Load search history on mount
    loadHistory();
  }, []);

  useEffect(() => {
    // Debounced search
    if (query.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/search/history?limit=5');
      setHistory(res.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      setResults(res.data.results);
      setSuggestions(res.data.results.slice(0, 5));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleResultClick(results[selectedIndex]);
      } else if (query.length >= 2) {
        performSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result.entity_type, result.entity_id);
    } else {
      // Default navigation based on entity type
      const routes: Record<string, string> = {
        patient: `/patients/${result.entity_id}`,
        appointment: `/appointments?id=${result.entity_id}`,
        invoice: `/billing/invoices/${result.entity_id}`,
        prescription: `/prescriptions/${result.entity_id}`,
        laboratory: `/lab/${result.entity_id}`,
        radiology: `/radiology/${result.entity_id}`,
        inventory: `/inventory/items/${result.entity_id}`,
        employee: `/users/${result.entity_id}`
      };
      console.log('Navigate to:', routes[result.entity_type], result.entity_id);
    }
    setShowResults(false);
    setQuery('');
  };

  const handleHistoryClick = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  const clearHistory = async () => {
    try {
      await api.delete('/search/history');
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const getEntityIcon = (type: string) => {
    const icons: Record<string, string> = {
      patient: '👤',
      appointment: '📅',
      invoice: '📄',
      prescription: '💊',
      laboratory: '🔬',
      radiology: '☢️',
      inventory: '📦',
      employee: '👨‍⚕️'
    };
    return icons[type] || '📋';
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'badge-success',
      completed: 'badge-success',
      paid: 'badge-success',
      in_stock: 'badge-success',
      pending: 'badge-warning',
      partial: 'badge-warning',
      low_stock: 'badge-danger',
      inactive: 'badge-secondary',
      cancelled: 'badge-secondary'
    };
    return statusColors[status] || 'badge-default';
  };

  return (
    <div className="global-search">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder', 'Rechercher patients, factures, rendez-vous...')}
          className="search-input"
        />
        {loading && <span className="search-spinner">⏳</span>}
        {query && !loading && (
          <button 
            className="search-clear"
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
          >
            ✕
          </button>
        )}
      </div>

      {showResults && (
        <div className="search-results-dropdown">
          {query.length >= 2 ? (
            <>
              {results.length > 0 ? (
                <div className="results-list">
                  <div className="results-header">
                    {t('search.results', 'Résultats')} ({results.length})
                  </div>
                  {results.map((result, index) => (
                    <div
                      key={`${result.entity_type}-${result.entity_id}`}
                      className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span className="result-icon">{getEntityIcon(result.entity_type)}</span>
                      <div className="result-content">
                        <div className="result-title">{result.title}</div>
                        <div className="result-subtitle">{result.subtitle}</div>
                      </div>
                      <span className={`result-status badge ${getStatusBadge(result.status)}`}>
                        {t(`search.status.${result.status}`, result.status)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  {t('search.noResults', 'Aucun résultat trouvé')}
                </div>
              )}
            </>
          ) : (
            <>
              {history.length > 0 && (
                <div className="search-history">
                  <div className="history-header">
                    <span>{t('search.recent', 'Recientes')}</span>
                    <button onClick={clearHistory} className="clear-history">
                      {t('search.clearHistory', 'Effacer')}
                    </button>
                  </div>
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className="history-item"
                      onClick={() => handleHistoryClick(item.search_term)}
                    >
                      <span className="history-icon">🕐</span>
                      <span className="history-term">{item.search_term}</span>
                      <span className="history-count">{item.result_count} {t('search.results', 'résultats')}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="search-tips">
                <div className="tips-header">{t('search.tips', 'Conseils de recherche')}</div>
                <div className="tip">• {t('search.tip1', 'Entrez un nom, numéro national, ou téléphone')}</div>
                <div className="tip">• {t('search.tip2', 'Recherchez par ID de facture ou rendez-vous')}</div>
                <div className="tip">• {t('search.tip3', 'Utilisez les filtres pour affiner')}</div>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .global-search {
          position: relative;
          width: 400px;
          max-width: 100%;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          font-size: 14px;
          color: #718096;
        }

        .search-input {
          width: 100%;
          padding: 10px 40px 10px 36px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f7fafc;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #2c5282;
          background: white;
          box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
        }

        .search-spinner {
          position: absolute;
          right: 12px;
          font-size: 14px;
        }

        .search-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #718096;
          cursor: pointer;
          padding: 4px;
        }

        .search-results-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          max-height: 500px;
          overflow-y: auto;
        }

        .results-header, .history-header, .tips-header {
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .clear-history {
          background: none;
          border: none;
          color: #3182ce;
          font-size: 12px;
          cursor: pointer;
        }

        .result-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid #f7fafc;
        }

        .result-item:hover, .result-item.selected {
          background: #f7fafc;
        }

        .result-icon {
          font-size: 20px;
          margin-right: 12px;
        }

        .result-content {
          flex: 1;
        }

        .result-title {
          font-weight: 600;
          color: #2d3748;
          font-size: 14px;
        }

        .result-subtitle {
          color: #718096;
          font-size: 12px;
          margin-top: 2px;
        }

        .result-status {
          margin-left: 12px;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-success { background: #c6f6d5; color: #22543d; }
        .badge-warning { background: #fefcbf; color: #744210; }
        .badge-danger { background: #fed7d7; color: #c53030; }
        .badge-secondary { background: #e2e8f0; color: #4a5568; }

        .history-item {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .history-item:hover {
          background: #f7fafc;
        }

        .history-icon {
          margin-right: 12px;
          color: #718096;
        }

        .history-term {
          flex: 1;
          color: #2d3748;
        }

        .history-count {
          font-size: 12px;
          color: #718096;
        }

        .search-tips {
          padding: 12px 16px;
          background: #f7fafc;
        }

        .tip {
          font-size: 12px;
          color: #718096;
          padding: 4px 0;
        }

        .no-results {
          padding: 24px;
          text-align: center;
          color: #718096;
        }

        @media (max-width: 768px) {
          .global-search {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalSearch;
