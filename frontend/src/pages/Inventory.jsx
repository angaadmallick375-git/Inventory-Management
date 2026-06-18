import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Warehouse, AlertTriangle, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { inventoryApi, productsApi } from '../services/api'
import { LoadingSpinner, EmptyState, Badge, ConfirmModal } from '../components/ui'

const EMPTY_FORM = { product_id: '', quantity_in_stock: 0, reorder_level: 10, reorder_quantity: 50, location: '' }
const EMPTY_TXN  = { transaction_type: 'in', quantity: 1, reason: '', reference_id: '' }

export default function Inventory() {
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTxnModal, setShowTxnModal]     = useState(false)
  const [showTxnList, setShowTxnList]       = useState(false)
  const [selectedInv, setSelectedInv]       = useState(null)
  const [transactions, setTransactions]     = useState([])
  const [form, setForm]   = useState(EMPTY_FORM)
  const [txnForm, setTxnForm] = useState(EMPTY_TXN)
  const [saving, setSaving]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [invRes, prodRes] = await Promise.all([
        inventoryApi.list({ limit: 500 }),
        productsApi.list({ limit: 500 }),
      ])
      setInventory(invRes.data)
      setProducts(prodRes.data)
    } catch { toast.error('Failed to load inventory') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const productName = (id) => products.find(p => p.id === id)?.name || `Product #${id}`
  const productSku  = (id) => products.find(p => p.id === id)?.sku  || '—'

  // Products that don't yet have inventory records
  const unlinkedProducts = products.filter(
    p => !inventory.find(i => i.product_id === p.id)
  )

  const filtered = inventory.filter(i => {
    const name = productName(i.product_id).toLowerCase()
    const sku  = productSku(i.product_id).toLowerCase()
    return name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase())
  })

  /* ---- Create inventory record ---- */
  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await inventoryApi.create({
        ...form,
        product_id:        parseInt(form.product_id),
        quantity_in_stock: parseInt(form.quantity_in_stock),
        reorder_level:     parseInt(form.reorder_level),
        reorder_quantity:  parseInt(form.reorder_quantity),
      })
      toast.success('Inventory record created!')
      setShowCreateModal(false)
      setForm(EMPTY_FORM)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error creating inventory')
    } finally { setSaving(false) }
  }

  /* ---- Add stock transaction ---- */
  const openTxn = (inv) => { setSelectedInv(inv); setTxnForm(EMPTY_TXN); setShowTxnModal(true) }
  const handleTxn = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await inventoryApi.addTransaction(selectedInv.id, {
        ...txnForm,
        quantity: parseInt(txnForm.quantity),
      })
      toast.success('Stock updated!')
      setShowTxnModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error updating stock')
    } finally { setSaving(false) }
  }

  /* ---- View transaction history ---- */
  const openHistory = async (inv) => {
    setSelectedInv(inv)
    try {
      const res = await inventoryApi.getTransactions(inv.id)
      setTransactions(res.data)
      setShowTxnList(true)
    } catch { toast.error('Failed to load transactions') }
  }

  const stockStatus = (inv) =>
    inv.quantity_in_stock <= inv.reorder_level ? 'low' : 'ok'

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Track stock levels and manage restocking</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowCreateModal(true) }}>
          <Plus size={16} /> Add Inventory Record
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <Search size={16} />
            <input
              placeholder="Search product name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {filtered.filter(i => stockStatus(i) === 'low').length} low-stock &nbsp;·&nbsp; {filtered.length} total
          </span>
        </div>
      </div>

      <div className="table-container">
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState
            icon={Warehouse}
            title="No inventory records"
            description="Create an inventory record for a product to start tracking stock."
            action={<button className="btn btn-primary" onClick={() => setShowCreateModal(true)}><Plus size={16} /> Add Record</button>}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>In Stock</th>
                <th>Reorder Level</th>
                <th>Reorder Qty</th>
                <th>Location</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const status = stockStatus(inv)
                const pct = Math.min(100, inv.reorder_level > 0
                  ? (inv.quantity_in_stock / inv.reorder_level) * 100
                  : 100)
                return (
                  <tr key={inv.id}>
                    <td className="cell-primary">{productName(inv.product_id)}</td>
                    <td>
                      <code style={{ fontSize: 12, color: 'var(--accent-secondary)', background: 'rgba(108,99,255,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                        {productSku(inv.product_id)}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: status === 'low' ? '#ef4444' : 'var(--accent-success)', fontSize: 15 }}>
                        {inv.quantity_in_stock}
                      </div>
                      <div className="progress-bar-bg" style={{ width: 80 }}>
                        <div className="progress-bar-fill" style={{
                          width: `${pct}%`,
                          background: pct < 50 ? '#ef4444' : pct < 100 ? '#f59e0b' : '#10d9a0'
                        }} />
                      </div>
                    </td>
                    <td>{inv.reorder_level}</td>
                    <td>{inv.reorder_quantity}</td>
                    <td>{inv.location || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <Badge status={status} />
                      {status === 'low' && (
                        <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 2 }}>
                          Reorder {inv.reorder_quantity} units
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm btn-icon" onClick={() => openTxn(inv)} title="Update stock">
                          <RefreshCw size={13} />
                        </button>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openHistory(inv)} title="View history">
                          <Pencil size={13} />
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

      {/* Create Inventory Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Inventory Record</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Product *</label>
                    <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                      <option value="">Select product...</option>
                      {unlinkedProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                    {unlinkedProducts.length === 0 && (
                      <span style={{ fontSize: 12, color: 'var(--accent-warning)' }}>All products already have inventory records.</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Initial Stock</label>
                    <input type="number" min="0" value={form.quantity_in_stock}
                      onChange={e => setForm({ ...form, quantity_in_stock: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Reorder Level</label>
                    <input type="number" min="0" value={form.reorder_level}
                      onChange={e => setForm({ ...form, reorder_level: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Reorder Quantity</label>
                    <input type="number" min="1" value={form.reorder_quantity}
                      onChange={e => setForm({ ...form, reorder_quantity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Warehouse Location</label>
                    <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Shelf A-3" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || unlinkedProducts.length === 0}>
                  {saving ? 'Creating...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTxnModal && selectedInv && (
        <div className="modal-overlay" onClick={() => setShowTxnModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Stock — {productName(selectedInv.product_id)}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowTxnModal(false)}>✕</button>
            </div>
            <form onSubmit={handleTxn}>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  {[
                    { type: 'in', label: 'Stock In', icon: ArrowDownCircle, color: 'var(--accent-success)' },
                    { type: 'out', label: 'Stock Out', icon: ArrowUpCircle, color: '#ef4444' },
                    { type: 'adjustment', label: 'Adjust', icon: RefreshCw, color: '#f59e0b' },
                  ].map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTxnForm({ ...txnForm, transaction_type: type })}
                      style={{
                        flex: 1, padding: '12px 8px', borderRadius: 10,
                        border: `2px solid ${txnForm.transaction_type === type ? color : 'var(--border)'}`,
                        background: txnForm.transaction_type === type ? `${color}15` : 'var(--bg-secondary)',
                        color: txnForm.transaction_type === type ? color : 'var(--text-muted)',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      {txnForm.transaction_type === 'adjustment' ? 'Set Quantity To' : 'Quantity'}
                    </label>
                    <input type="number" min="1" required value={txnForm.quantity}
                      onChange={e => setTxnForm({ ...txnForm, quantity: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Reference (optional)</label>
                    <input value={txnForm.reference_id}
                      onChange={e => setTxnForm({ ...txnForm, reference_id: e.target.value })}
                      placeholder="e.g. PO-123" />
                  </div>
                  <div className="form-group full-width">
                    <label>Reason</label>
                    <input value={txnForm.reason}
                      onChange={e => setTxnForm({ ...txnForm, reason: e.target.value })}
                      placeholder="e.g. Supplier delivery" />
                  </div>
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Current stock: <strong style={{ color: 'var(--text-primary)' }}>{selectedInv.quantity_in_stock}</strong>
                  {txnForm.transaction_type !== 'adjustment' && (
                    <> → <strong style={{ color: 'var(--accent-success)' }}>
                      {txnForm.transaction_type === 'in'
                        ? selectedInv.quantity_in_stock + parseInt(txnForm.quantity || 0)
                        : Math.max(0, selectedInv.quantity_in_stock - parseInt(txnForm.quantity || 0))
                      }
                    </strong></>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTxnModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTxnList && selectedInv && (
        <div className="modal-overlay" onClick={() => setShowTxnList(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>History — {productName(selectedInv.product_id)}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowTxnList(false)}>✕</button>
            </div>
            <div className="modal-body">
              {transactions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No transactions yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {transactions.map(t => (
                    <div key={t.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'var(--bg-secondary)',
                      borderRadius: 8, border: '1px solid var(--border)'
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color:
                          t.transaction_type === 'in' ? 'var(--accent-success)' :
                          t.transaction_type === 'out' ? '#ef4444' : '#f59e0b'
                        }}>
                          {t.transaction_type === 'in' ? '▲' : t.transaction_type === 'out' ? '▼' : '⟳'} {t.transaction_type.toUpperCase()} · {t.quantity} units
                        </div>
                        {t.reason && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.reason}</div>}
                        {t.reference_id && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ref: {t.reference_id}</div>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
