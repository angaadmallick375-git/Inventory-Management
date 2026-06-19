import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Package, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsApi } from '../services/api'
import { LoadingSpinner, EmptyState, Badge, ConfirmModal } from '../components/ui'

const EMPTY_FORM = {
  name: '', sku: '', description: '', category: '',
  price: '', cost_price: '', quantity_in_stock: 0, is_active: true,
}

function getStockClass(qty) {
  if (qty === 0)  return 'stock-danger'
  if (qty <= 10)  return 'stock-warning'
  return 'stock-ok'
}

// Reusable labelled field wrapper
const Field = ({ id, label, error, children }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    {children}
    {error && (
      <span className="field-error">
        <AlertCircle size={11} /> {error}
      </span>
    )}
  </div>
)

export default function Products() {
  const [products, setProducts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [editingId, setEditingId]       = useState(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors]   = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving]             = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await productsApi.list({ limit: 500 })
      setProducts(res.data)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  // ── Inline client-side validation ──────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!form.name.trim())       errs.name  = 'Product name is required'
    if (!form.sku.trim())        errs.sku   = 'SKU is required'
    if (!form.price || parseFloat(form.price) <= 0)
                                  errs.price = 'Price must be greater than 0'
    if (parseInt(form.quantity_in_stock) < 0)
                                  errs.quantity_in_stock = 'Quantity cannot be negative'
    return errs
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setForm({
      name: p.name, sku: p.sku, description: p.description || '',
      category: p.category || '', price: p.price,
      cost_price: p.cost_price || '',
      quantity_in_stock: p.quantity_in_stock ?? 0,
      is_active: p.is_active,
    })
    setFieldErrors({})
    setEditingId(p.id)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        price:             parseFloat(form.price),
        cost_price:        form.cost_price ? parseFloat(form.cost_price) : null,
        quantity_in_stock: parseInt(form.quantity_in_stock) || 0,
      }
      if (editingId) {
        await productsApi.update(editingId, payload)
        toast.success('Product updated!')
      } else {
        await productsApi.create(payload)
        toast.success('Product created!')
      }
      setShowModal(false)
      load()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string' && detail.toLowerCase().includes('sku')) {
        setFieldErrors({ sku: detail })
      } else {
        toast.error(detail || 'Error saving product')
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await productsApi.delete(deleteTarget)
      toast.success('Product deleted')
      setDeleteTarget(null)
      load()
    } catch { toast.error('Failed to delete product') }
  }



  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your product catalogue</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <Search size={16} />
            <input
              placeholder="Search by name, SKU or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="table-container">
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Add your first product to get started."
            action={
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} /> Add Product
              </button>
            }
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const qty = p.quantity_in_stock ?? 0
                return (
                  <tr key={p.id}>
                    <td className="cell-primary">{p.name}</td>
                    <td>
                      <code style={{
                        fontSize: 12, color: 'var(--accent-secondary)',
                        background: 'rgba(108,99,255,0.1)',
                        padding: '2px 8px', borderRadius: 4,
                      }}>
                        {p.sku}
                      </code>
                    </td>
                    <td>{p.category || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-success)' }}>
                      ${p.price.toFixed(2)}
                    </td>
                    <td>
                      <span className={getStockClass(qty)}>
                        {qty}
                        {qty === 0 && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.8 }}>(out)</span>}
                        {qty > 0 && qty <= 10 && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.8 }}>(low)</span>}
                      </span>
                    </td>
                    <td><Badge status={p.is_active} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => openEdit(p)} title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => setDeleteTarget(p.id)} title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Product' : 'New Product'}</h2>
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setShowModal(false)}
              >✕</button>
            </div>
            <form onSubmit={handleSave} noValidate>
              <div className="modal-body">
                <div className="form-grid">
                  <Field id="name" label="Product Name *" error={fieldErrors.name}>
                    <input
                      id="name"
                      className={fieldErrors.name ? 'input-error' : ''}
                      value={form.name}
                      onChange={e => { setForm({ ...form, name: e.target.value }); setFieldErrors(f => ({...f, name: ''})) }}
                      placeholder="e.g. Wireless Mouse"
                    />
                  </Field>

                  <Field id="sku" label="SKU *" error={fieldErrors.sku}>
                    <input
                      id="sku"
                      className={fieldErrors.sku ? 'input-error' : ''}
                      value={form.sku}
                      onChange={e => { setForm({ ...form, sku: e.target.value }); setFieldErrors(f => ({...f, sku: ''})) }}
                      placeholder="e.g. WM-001"
                      disabled={!!editingId}
                    />
                  </Field>

                  <Field id="qty" label="Quantity in Stock *" error={fieldErrors.quantity_in_stock}>
                    <input
                      id="qty"
                      type="number" min="0" step="1"
                      className={fieldErrors.quantity_in_stock ? 'input-error' : ''}
                      value={form.quantity_in_stock}
                      onChange={e => { setForm({ ...form, quantity_in_stock: e.target.value }); setFieldErrors(f => ({...f, quantity_in_stock: ''})) }}
                      placeholder="0"
                    />
                  </Field>

                  <Field id="price" label="Selling Price ($) *" error={fieldErrors.price}>
                    <input
                      id="price"
                      type="number" step="0.01" min="0.01"
                      className={fieldErrors.price ? 'input-error' : ''}
                      value={form.price}
                      onChange={e => { setForm({ ...form, price: e.target.value }); setFieldErrors(f => ({...f, price: ''})) }}
                      placeholder="0.00"
                    />
                  </Field>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input
                      id="category"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      placeholder="e.g. Electronics"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cost_price">Cost Price ($)</label>
                    <input
                      id="cost_price"
                      type="number" step="0.01" min="0"
                      value={form.cost_price}
                      onChange={e => setForm({ ...form, cost_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      value={form.is_active}
                      onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="desc">Description</label>
                    <textarea
                      id="desc"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Product description..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message="Are you sure you want to delete this product? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
