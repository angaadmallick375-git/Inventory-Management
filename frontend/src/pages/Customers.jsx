import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Users, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { customersApi } from '../services/api'
import { LoadingSpinner, EmptyState, Badge, ConfirmModal } from '../components/ui'

const EMPTY_FORM = {
  name: '', email: '', phone: '', address: '',
  city: '', country: '', is_active: true,
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving]       = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await customersApi.list({ limit: 500 })
      setCustomers(res.data)
    } catch { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setForm(EMPTY_FORM); setFieldErrors({}); setEditingId(null); setShowModal(true) }
  const openEdit = (c) => {
    setForm({
      name: c.name, email: c.email, phone: c.phone || '',
      address: c.address || '', city: c.city || '',
      country: c.country || '', is_active: c.is_active,
    })
    setFieldErrors({})
    setEditingId(c.id)
    setShowModal(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) errs.email = 'Enter a valid email address'
    return errs
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSaving(true)
    try {
      if (editingId) {
        await customersApi.update(editingId, form)
        toast.success('Customer updated!')
      } else {
        await customersApi.create(form)
        toast.success('Customer created!')
      }
      setShowModal(false)
      load()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string' && detail.toLowerCase().includes('email')) {
        setFieldErrors({ email: detail })
      } else {
        toast.error(detail || 'Error saving customer')
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await customersApi.delete(deleteTarget)
      toast.success('Customer deleted')
      setDeleteTarget(null)
      load()
    } catch { toast.error('Failed to delete customer') }
  }

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage your customer database</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <Search size={16} />
            <input
              placeholder="Search by name, email or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="table-container">
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Add your first customer to get started."
            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Customer</button>}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Country</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="cell-primary">{c.name}</td>
                  <td style={{ color: 'var(--accent-info)' }}>{c.email}</td>
                  <td>{c.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{c.city || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{c.country || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td><Badge status={c.is_active} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteTarget(c.id)} title="Delete">
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Customer' : 'New Customer'}</h2>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} noValidate>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="c-name">Full Name *</label>
                    <input
                      id="c-name"
                      className={fieldErrors.name ? 'input-error' : ''}
                      value={form.name}
                      onChange={e => { setForm({ ...form, name: e.target.value }); setFieldErrors(f => ({...f, name: ''})) }}
                      placeholder="e.g. John Doe"
                    />
                    {fieldErrors.name && <span className="field-error"><AlertCircle size={11} /> {fieldErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-email">Email *</label>
                    <input
                      id="c-email"
                      type="email"
                      className={fieldErrors.email ? 'input-error' : ''}
                      value={form.email}
                      onChange={e => { setForm({ ...form, email: e.target.value }); setFieldErrors(f => ({...f, email: ''})) }}
                      placeholder="john@example.com"
                    />
                    {fieldErrors.email && <span className="field-error"><AlertCircle size={11} /> {fieldErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-phone">Phone</label>
                    <input id="c-phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-status">Status</label>
                    <select id="c-status" value={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-city">City</label>
                    <input id="c-city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="New York" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-country">Country</label>
                    <input id="c-country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="United States" />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="c-addr">Address</label>
                    <textarea id="c-addr" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full shipping address..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message="Delete this customer? Their order history will also be removed."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
