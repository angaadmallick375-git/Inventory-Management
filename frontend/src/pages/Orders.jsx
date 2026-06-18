import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, ShoppingCart, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { ordersApi, customersApi, productsApi } from '../services/api'
import { LoadingSpinner, EmptyState, Badge, ConfirmModal } from '../components/ui'

const ORDER_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customer_id: '', notes: '', shipping_address: '',
    items: [{ product_id: '', quantity: 1, unit_price: '' }],
  })

  const load = async () => {
    setLoading(true)
    try {
      const [ordRes, custRes, prodRes] = await Promise.all([
        ordersApi.list({ limit: 500 }),
        customersApi.list({ limit: 500 }),
        productsApi.list({ limit: 500 }),
      ])
      setOrders(ordRes.data)
      setCustomers(custRes.data)
      setProducts(prodRes.data)
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = orders.filter(o => {
    const searchLower = search.toLowerCase()
    const matchSearch = o.order_number.toLowerCase().includes(searchLower)
      || customerName(o.customer_id).toLowerCase().includes(searchLower)
    const matchStatus = filterStatus ? o.status === filterStatus : true
    return matchSearch && matchStatus
  })

  const openCreate = () => {
    setForm({ customer_id: '', notes: '', shipping_address: '',
      items: [{ product_id: '', quantity: 1, unit_price: '' }] })
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (o) => {
    setForm({ customer_id: o.customer_id, notes: o.notes || '',
      shipping_address: o.shipping_address || '', status: o.status,
      items: o.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price }))
    })
    setEditingId(o.id)
    setShowModal(true)
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1, unit_price: '' }] }))
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  const updateItem = (idx, field, val) => setForm(f => {
    const items = [...f.items]
    items[idx] = { ...items[idx], [field]: val }
    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(val))
      if (prod) items[idx].unit_price = prod.price
    }
    return { ...f, items }
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await ordersApi.update(editingId, { status: form.status, notes: form.notes, shipping_address: form.shipping_address })
        toast.success('Order updated!')
      } else {
        const payload = {
          customer_id: parseInt(form.customer_id),
          notes: form.notes,
          shipping_address: form.shipping_address,
          items: form.items.map(i => ({
            product_id: parseInt(i.product_id),
            quantity: parseInt(i.quantity),
            unit_price: parseFloat(i.unit_price),
          })),
        }
        await ordersApi.create(payload)
        toast.success('Order placed!')
      }
      setShowModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error saving order')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await ordersApi.delete(deleteTarget)
      toast.success('Order deleted')
      setDeleteTarget(null)
      load()
    } catch { toast.error('Failed to delete order') }
  }

  const customerName = (id) => customers.find(c => c.id === id)?.name || `#${id}`
  const productName = (id) => products.find(p => p.id === id)?.name || `#${id}`

  const total = form.items.reduce((s, i) => s + (parseFloat(i.quantity || 0) * parseFloat(i.unit_price || 0)), 0)

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Track and manage all customer orders</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New Order
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <Search size={16} />
            <input placeholder="Search by order number or customer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} orders</span>
      </div>

      <div className="table-container">
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No orders found" description="Place your first order to get started."
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Order</button>} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td className="cell-primary">{o.order_number}</td>
                  <td>{customerName(o.customer_id)}</td>
                  <td>{o.items?.length ?? 0} item{o.items?.length !== 1 ? 's' : ''}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-success)' }}>${o.total_amount.toFixed(2)}</td>
                  <td><Badge status={o.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setViewOrder(o); setShowViewModal(true) }} title="View">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(o)} title="Update status">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteTarget(o.id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Update Order Status' : 'New Order'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {editingId ? (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Order Status</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Shipping Address</label>
                      <input value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} placeholder="Shipping address" />
                    </div>
                    <div className="form-group full-width">
                      <label>Notes</label>
                      <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Order notes..." />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="form-grid" style={{ marginBottom: 20 }}>
                      <div className="form-group">
                        <label>Customer *</label>
                        <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                          <option value="">Select customer...</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Shipping Address</label>
                        <input value={form.shipping_address} onChange={e => setForm({ ...form, shipping_address: e.target.value })} placeholder="Delivery address" />
                      </div>
                      <div className="form-group full-width">
                        <label>Notes</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Special instructions..." style={{ minHeight: 60 }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.8px', color: 'var(--text-muted)' }}>Order Items</label>
                      <button type="button" className="btn btn-success btn-sm" onClick={addItem}><Plus size={12} /> Add Item</button>
                    </div>

                    {form.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 36px', gap: 10, marginBottom: 10 }}>
                        <select required value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                          <option value="">Select product...</option>
                          {products.filter(p => p.is_active).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) — {p.quantity_in_stock > 0 ? `${p.quantity_in_stock} in stock` : '⚠ Out of stock'}
                            </option>
                          ))}
                        </select>
                        <input type="number" min="1" required value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} placeholder="Qty" />
                        <input type="number" step="0.01" min="0.01" required value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} placeholder="Price" />
                        <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>✕</button>
                      </div>
                    ))}

                    <div style={{ textAlign: 'right', marginTop: 12, fontSize: 16, fontWeight: 700, color: 'var(--accent-success)' }}>
                      Total: ${total.toFixed(2)}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Order' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && viewOrder && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{viewOrder.order_number}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowViewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  ['Customer', customerName(viewOrder.customer_id)],
                  ['Status', <Badge status={viewOrder.status} />],
                  ['Total', `$${viewOrder.total_amount.toFixed(2)}`],
                  ['Date', new Date(viewOrder.created_at).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
                {viewOrder.shipping_address && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Shipping Address</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{viewOrder.shipping_address}</div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>Items</div>
              {viewOrder.items?.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--bg-secondary)',
                  borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{productName(item.product_id)}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>×{item.quantity} @ ${item.unit_price.toFixed(2)} = <strong style={{ color: 'var(--accent-success)' }}>${item.subtotal.toFixed(2)}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message="Delete this order? Inventory quantities will NOT be automatically restored."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
