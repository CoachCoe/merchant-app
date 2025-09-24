import React, { useState } from 'react';
import { Product, CreateProductRequest } from '../../models/Product';
import { Category, CreateCategoryRequest } from '../../models/Category';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product form state
  const [productForm, setProductForm] = useState<CreateProductRequest>({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: ''
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category form state
  const [categoryForm, setCategoryForm] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    sortOrder: 0
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?limit=100');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.data.products);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.data.categories);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });

      const data = await response.json();
      if (response.ok) {
        await fetchProducts();
        setProductForm({ name: '', description: '', price: 0, image: '', category: '' });
        setEditingProduct(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });

      const data = await response.json();
      if (response.ok) {
        await fetchCategories();
        setCategoryForm({ name: '', description: '', sortOrder: 0 });
        setEditingCategory(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchProducts();
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchCategories();
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  React.useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else {
      fetchCategories();
    }
  }, [activeTab]);

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'products' ? '#667eea' : 'transparent',
            color: activeTab === 'products' ? 'white' : '#666',
            cursor: 'pointer',
            fontWeight: '500',
            borderBottom: activeTab === 'products' ? '2px solid #667eea' : '2px solid transparent'
          }}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'categories' ? '#667eea' : 'transparent',
            color: activeTab === 'categories' ? 'white' : '#666',
            cursor: 'pointer',
            fontWeight: '500',
            borderBottom: activeTab === 'categories' ? '2px solid #667eea' : '2px solid transparent'
          }}
        >
          Categories
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
            {/* Product List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Products ({products.length})</h2>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({ name: '', description: '', price: 0, image: '', category: '' });
                  }}
                  className="btn btn-primary"
                >
                  Add Product
                </button>
              </div>

              {loading && products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                  <p>Loading products...</p>
                </div>
              ) : (
                <div className="card">
                  <div className="card-body" style={{ padding: 0 }}>
                    {products.map((product) => (
                      <div key={product.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '15px 20px',
                        borderBottom: '1px solid #e9ecef'
                      }}>
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginRight: '15px'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {product.category} • {formatPrice(product.price)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setProductForm({
                                name: product.name,
                                description: product.description,
                                price: product.price,
                                image: product.image,
                                category: product.category
                              });
                            }}
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '14px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '14px' }}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Form */}
            <div>
              <div className="card">
                <div className="card-header">
                  <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleProductSubmit}>
                    <div className="form-group">
                      <label className="form-label">Product Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={productForm.description}
                        onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Price (in cents) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={productForm.price}
                        onChange={(e) => setProductForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        required
                        min="0"
                      />
                      <small style={{ color: '#666' }}>
                        Example: 1999 = $19.99
                      </small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        value={productForm.image}
                        onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-control"
                        value={productForm.category}
                        onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ width: '100%' }}
                    >
                      {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                    </button>

                    {editingProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({ name: '', description: '', price: 0, image: '', category: '' });
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', marginTop: '10px' }}
                      >
                        Cancel
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
            {/* Category List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Categories ({categories.length})</h2>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '', sortOrder: 0 });
                  }}
                  className="btn btn-primary"
                >
                  Add Category
                </button>
              </div>

              {loading && categories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                  <p>Loading categories...</p>
                </div>
              ) : (
                <div className="card">
                  <div className="card-body" style={{ padding: 0 }}>
                    {categories.map((category) => (
                      <div key={category.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '15px 20px',
                        borderBottom: '1px solid #e9ecef'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                            {category.name}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {category.description || 'No description'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryForm({
                                name: category.name,
                                description: category.description || '',
                                sortOrder: category.sortOrder
                              });
                            }}
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '14px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '14px' }}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category Form */}
            <div>
              <div className="card">
                <div className="card-header">
                  <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleCategorySubmit}>
                    <div className="form-group">
                      <label className="form-label">Category Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Sort Order</label>
                      <input
                        type="number"
                        className="form-control"
                        value={categoryForm.sortOrder}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                        min="0"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ width: '100%' }}
                    >
                      {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                    </button>

                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryForm({ name: '', description: '', sortOrder: 0 });
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', marginTop: '10px' }}
                      >
                        Cancel
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
