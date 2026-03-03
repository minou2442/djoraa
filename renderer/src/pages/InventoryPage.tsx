import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import '../styles/global.css';

interface InventoryItem {
  id: number;
  name: string;
  code: string;
  barcode?: string;
  category_id: number;
  category_name?: string;
  supplier_id?: number;
  supplier_name?: string;
  unit: string;
  min_stock: number;
  current_stock: number;
  purchase_price: number;
  sale_price: number;
  expiry_date?: string;
  location?: string;
  notes?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
}

interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier_name?: string;
  status: string;
  total: number;
  order_date: string;
  expected_date?: string;
  items: any[];
}

type TabType = 'items' | 'orders' | 'suppliers' | 'alerts' | 'reports';

const InventoryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [expiring, setExpiring] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | ''>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    category_id: '',
    supplier_id: '',
    unit: 'piece',
    min_stock: 0,
    current_stock: 0,
    purchase_price: 0,
    sale_price: 0,
    expiry_date: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, categoriesRes, suppliersRes, lowStockRes, expiringRes] = await Promise.all([
        api.get('/inventory/items'),
        api.get('/inventory/categories'),
        api.get('/inventory/suppliers'),
        api.get('/inventory/items/low-stock'),
        api.get('/inventory/items/expiring?days=30')
      ]);
      setItems(itemsRes.data);
      setCategories(categoriesRes.data);
      setSuppliers(suppliersRes.data);
      setLowStock(lowStockRes.data);
      setExpiring(expiringRes.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id as string) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id as string) : null,
        min_stock: parseFloat(formData.min_stock as any),
        current_stock: parseFloat(formData.current_stock as any),
        purchase_price: parseFloat(formData.purchase_price as any),
        sale_price: parseFloat(formData.sale_price as any)
      };

      if (editingItem) {
        await api.put(`/inventory/items/${editingItem.id}`, data);
      } else {
        await api.post('/inventory/items', data);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      barcode: item.barcode || '',
      category_id: item.category_id.toString(),
      supplier_id: item.supplier_id?.toString() || '',
      unit: item.unit,
      min_stock: item.min_stock,
      current_stock: item.current_stock,
      purchase_price: item.purchase_price,
      sale_price: item.sale_price,
      expiry_date: item.expiry_date?.split('T')[0] || '',
      location: item.location || '',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || item.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBarcodeScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = (e.target as HTMLInputElement).value;
      try {
        const res = await api.get(`/inventory/items/barcode/${barcode}`);
        handleEdit(res.data);
      } catch (error) {
        console.log('Item not found, ready to create new');
      }
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= 0) return 'out';
    if (item.current_stock <= item.min_stock) return 'low';
    return 'ok';
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'items', label: t('inventory.items', 'Articles') },
    { key: 'orders', label: t('inventory.orders', 'Bons de commande') },
    { key: 'suppliers', label: t('inventory.suppliers', 'Fournisseurs') },
    { key: 'alerts', label: t('inventory.alerts', 'Alertes') },
    { key: 'reports', label: t('inventory.reports', 'Rapports') }
  ];

  return (
    <div className="page-container" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="page-header">
        <h1>{t('inventory.title', 'Inventaire & Pharmacie')}</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder={t('inventory.searchBarcode', 'Rechercher par code/barre...')}
            onKeyDown={handleBarcodeScan}
            className="search-input"
          />
          <button className="btn btn-primary" onClick={() => {
            setEditingItem(null);
            setFormData({
              name: '', code: '', barcode: '', category_id: '', supplier_id: '',
              unit: 'piece', min_stock: 0, current_stock: 0, purchase_price: 0,
              sale_price: 0, expiry_date: '', location: '', notes: ''
            });
            setShowModal(true);
          }}>
            + {t('inventory.addItem', 'Ajouter article')}
          </button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === 'alerts' && (lowStock.length + expiring.length > 0) && (
              <span className="badge">{lowStock.length + expiring.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">{t('common.loading', 'Chargement...')}</div>
      ) : (
        <>
          {activeTab === 'items' && (
            <div className="tab-content">
              <div className="filters">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value) : '')}
                  className="filter-select"
                >
                  <option value="">{t('inventory.allCategories', 'Toutes catégories')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={t('inventory.search', 'Rechercher...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('inventory.code', 'Code')}</th>
                    <th>{t('inventory.name', 'Nom')}</th>
                    <th>{t('inventory.category', 'Catégorie')}</th>
                    <th>{t('inventory.stock', 'Stock')}</th>
                    <th>{t('inventory.minStock', 'Min')}</th>
                    <th>{t('inventory.price', 'Prix')}</th>
                    <th>{t('inventory.expiry', 'Expiration')}</th>
                    <th>{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const status = getStockStatus(item);
                    return (
                      <tr key={item.id} className={`stock-${status}`}>
                        <td>{item.code}</td>
                        <td>{item.name}</td>
                        <td>{item.category_name || '-'}</td>
                        <td>
                          <span className={`stock-badge ${status}`}>
                            {item.current_stock} {item.unit}
                          </span>
                        </td>
                        <td>{item.min_stock}</td>
                        <td>{item.sale_price.toFixed(2)} DA</td>
                        <td>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</td>
                        <td>
                          <button className="btn-icon" onClick={() => handleEdit(item)}>
                            ✏️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>{t('inventory.purchaseOrders', 'Bons de commande')}</h2>
                <button className="btn btn-primary">
                  + {t('inventory.newOrder', 'Nouvelle commande')}
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('inventory.orderNumber', 'N° Commande')}</th>
                    <th>{t('inventory.supplier', 'Fournisseur')}</th>
                    <th>{t('inventory.date', 'Date')}</th>
                    <th>{t('inventory.total', 'Total')}</th>
                    <th>{t('inventory.status', 'Statut')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="empty-state">
                      {t('inventory.noOrders', 'Aucune commande')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>{t('inventory.suppliersList', 'Liste des fournisseurs')}</h2>
                <button className="btn btn-primary">
                  + {t('inventory.addSupplier', 'Ajouter fournisseur')}
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('inventory.supplierName', 'Nom')}</th>
                    <th>{t('inventory.contact', 'Contact')}</th>
                    <th>{t('inventory.phone', 'Téléphone')}</th>
                    <th>{t('inventory.email', 'Email')}</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(supplier => (
                    <tr key={supplier.id}>
                      <td>{supplier.name}</td>
                      <td>{supplier.contact || '-'}</td>
                      <td>{supplier.phone || '-'}</td>
                      <td>{supplier.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="tab-content">
              <div className="alerts-grid">
                <div className="alert-section">
                  <h3>🔴 {t('inventory.lowStock', 'Stock bas')}</h3>
                  {lowStock.length === 0 ? (
                    <p className="empty-message">{t('inventory.noLowStock', 'Aucun article en stock bas')}</p>
                  ) : (
                    <ul className="alert-list">
                      {lowStock.map(item => (
                        <li key={item.id} className="alert-item low">
                          <span className="item-name">{item.name}</span>
                          <span className="item-stock">{item.current_stock}/{item.min_stock}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="alert-section">
                  <h3>🟠 {t('inventory.expiringSoon', 'Expire bientôt')}</h3>
                  {expiring.length === 0 ? (
                    <p className="empty-message">{t('inventory.noExpiring', 'Aucun article expire bientôt')}</p>
                  ) : (
                    <ul className="alert-list">
                      {expiring.map(item => (
                        <li key={item.id} className="alert-item expiring">
                          <span className="item-name">{item.name}</span>
                          <span className="item-date">{new Date(item.expiry_date!).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="tab-content">
              <div className="reports-grid">
                <div className="report-card">
                  <h3>{t('inventory.totalItems', 'Total articles')}</h3>
                  <p className="report-value">{items.length}</p>
                </div>
                <div className="report-card">
                  <h3>{t('inventory.totalValue', 'Valeur du stock')}</h3>
                  <p className="report-value">
                    {items.reduce((sum, item) => sum + (item.current_stock * item.purchase_price), 0).toFixed(2)} DA
                  </p>
                </div>
                <div className="report-card warning">
                  <h3>{t('inventory.lowStockItems', 'Articles stock bas')}</h3>
                  <p className="report-value">{lowStock.length}</p>
                </div>
                <div className="report-card danger">
                  <h3>{t('inventory.expiringItems', 'Articles expire')}</h3>
                  <p className="report-value">{expiring.length}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? t('inventory.editItem', 'Modifier article') : t('inventory.addItem', 'Ajouter article')}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{t('inventory.name', 'Nom')} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('inventory.code', 'Code')} *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('inventory.barcode', 'Code-barre')}</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('inventory.category', 'Catégorie')}</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('inventory.supplier', 'Fournisseur')}</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  >
                    <option value="">Sélectionner...</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('inventory.unit', 'Unité')}</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="piece">Pièce</option>
                    <option value="box">Boîte</option>
                    <option value="tablet">Comprimé</option>
                    <option value="ampoule">Ampoule</option>
                    <option value="bottle">Flacon</option>
                    <option value="tube">Tube</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('inventory.currentStock', 'Stock actuel')}</label>
                  <input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>{t('inventory.minStock', 'Stock minimum')}</label>
                  <input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('inventory.purchasePrice', 'Prix achat')}</label>
                  <input
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>{t('inventory.salePrice', 'Prix vente')}</label>
                  <input
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('inventory.expiryDate', 'Date expiration')}</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('inventory.location', 'Emplacement')}</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('inventory.notes', 'Notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {t('common.cancel', 'Annuler')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('common.save', 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
