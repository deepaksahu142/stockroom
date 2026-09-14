import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch products");
    }
    setLoading(false);
  };

  useEffect(() => {
    // Inline initial fetch to avoid referencing external deps
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get("/products/");
        setProducts(res.data);
        setError("");
      } catch (err) {
        setError("Failed to fetch products");
      }
      setLoading(false);
    };
    run();
  }, []);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Derived list with filter and sorting
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply filter
    const q = filter.trim().toLowerCase();
    if (q) {
      filtered = products.filter(
        (p) =>
          String(p.id).includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric fields
      if (
        sortField === "id" ||
        sortField === "price" ||
        sortField === "quantity"
      ) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        // Handle string fields
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, filter, sortField, sortDirection]);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Reset form
  const resetForm = () => {
    setForm({ id: "", name: "", description: "", price: "", quantity: "" });
    setEditId(null);
  };

  // Create or update product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (editId) {
        await api.put(`/products/${editId}`, {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("Product updated successfully");
      } else {
        await api.post("/products/", {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("Product created successfully");
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Operation failed");
    }
    setLoading(false);
  };

  // Edit product
  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
    });
    setEditId(product.id);
    setMessage("");
    setError("");
  };

  // Delete product
  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await api.delete(`/products/${id}`);
      setMessage("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      setError("Delete failed");
    }
    setLoading(false);
  };

  const currency = (n) =>
    typeof n === "number" ? n.toFixed(2) : Number(n || 0).toFixed(2);

  const totalUnits = products.reduce(
    (total, product) => total + Number(product.quantity || 0),
    0,
  );
  const inventoryValue = products.reduce(
    (total, product) =>
      total + Number(product.price || 0) * Number(product.quantity || 0),
    0,
  );
  const lowStockCount = products.filter(
    (product) => Number(product.quantity || 0) < 10,
  ).length;

  return (
    <div className="app-bg">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">SI</span>
          <div>
            <h1>Stockroom</h1>
            <span className="brand-subtitle">Inventory control center</span>
          </div>
        </div>
        <div className="top-actions">
          <button
            className="btn btn-light"
            onClick={fetchProducts}
            disabled={loading}
          >
            <span className="button-icon">↻</span> Refresh data
          </button>
        </div>
      </header>

      <div className="container">
        <section className="page-intro">
          <div>
            <p className="eyebrow">Operations / Overview</p>
            <h2>Product inventory</h2>
            <p className="intro-copy">
              Keep your catalog accurate, your stock visible, and every
              replenishment on time.
            </p>
          </div>
          <div className="sync-status">
            <span className="status-dot" /> Live inventory
          </div>
        </section>

        <section className="metrics" aria-label="Inventory summary">
          <div className="metric-card">
            <span className="metric-label">Catalog items</span>
            <strong>{products.length}</strong>
            <span className="metric-note">Active products</span>
          </div>
          <div className="metric-card metric-accent">
            <span className="metric-label">Units on hand</span>
            <strong>{totalUnits}</strong>
            <span className="metric-note">Across all products</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Stock value</span>
            <strong>${currency(inventoryValue)}</strong>
            <span className="metric-note">Current inventory</span>
          </div>
          <div
            className={`metric-card ${lowStockCount ? "metric-warning" : ""}`}
          >
            <span className="metric-label">Low stock</span>
            <strong>{lowStockCount}</strong>
            <span className="metric-note">
              {lowStockCount ? "Needs attention" : "All levels healthy"}
            </span>
          </div>
        </section>

        <div className="toolbar">
          <div>
            <h3>Catalog</h3>
            <span className="toolbar-note">
              {filteredProducts.length} of {products.length} products shown
            </span>
          </div>
          <div className="search">
            <input
              type="text"
              aria-label="Search products"
              placeholder="Search products..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="content-grid">
          <div className="card form-card">
            <div className="section-heading">
              <div>
                <span className="section-kicker">Catalog entry</span>
                <h2>{editId ? "Edit product" : "Add a product"}</h2>
              </div>
              <span className="form-index">{editId ? "EDIT" : "NEW"}</span>
            </div>
            <form onSubmit={handleSubmit} className="product-form">
              <label>
                Product ID
                <input
                  type="number"
                  name="id"
                  placeholder="e.g. 1042"
                  value={form.id}
                  onChange={handleChange}
                  required
                  disabled={!!editId}
                />
              </label>
              <label>
                Product name
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Wireless keyboard"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="field-wide">
                Description
                <input
                  type="text"
                  name="description"
                  placeholder="Short product description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Unit price
                <input
                  type="number"
                  name="price"
                  placeholder="0.00"
                  value={form.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                />
              </label>
              <label>
                Units in stock
                <input
                  type="number"
                  name="quantity"
                  placeholder="0"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </label>
              <div className="form-actions">
                <button className="btn" type="submit" disabled={loading}>
                  {editId ? "Save changes" : "Add to catalog"}
                </button>
                {editId && (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMessage("");
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {message && <div className="success-msg">{message}</div>}
            {error && <div className="error-msg">{error}</div>}
          </div>

          <div className="card list-card">
            {loading ? (
              <div className="loader">Loading inventory...</div>
            ) : (
              <div className="scroll-x">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th
                        className={`sortable ${sortField === "id" ? `sort-${sortDirection}` : ""}`}
                        onClick={() => handleSort("id")}
                      >
                        ID
                      </th>
                      <th
                        className={`sortable ${sortField === "name" ? `sort-${sortDirection}` : ""}`}
                        onClick={() => handleSort("name")}
                      >
                        Name
                      </th>
                      <th>Description</th>
                      <th
                        className={`sortable ${sortField === "price" ? `sort-${sortDirection}` : ""}`}
                        onClick={() => handleSort("price")}
                      >
                        Price
                      </th>
                      <th
                        className={`sortable ${sortField === "quantity" ? `sort-${sortDirection}` : ""}`}
                        onClick={() => handleSort("quantity")}
                      >
                        Quantity
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td className="name-cell">{p.name}</td>
                        <td className="desc-cell" title={p.description}>
                          {p.description}
                        </td>
                        <td className="price-cell">${currency(p.price)}</td>
                        <td>
                          <span className="qty-badge">{p.quantity}</span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="btn btn-edit"
                              onClick={() => handleEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-delete"
                              onClick={() => handleDelete(p.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty">
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
