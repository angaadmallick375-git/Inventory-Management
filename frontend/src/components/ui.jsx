export function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function Badge({ status }) {
  const map = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    processing: 'badge-processing',
    shipped: 'badge-shipped',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled',
    true: 'badge-active',
    false: 'badge-inactive',
    active: 'badge-active',
    inactive: 'badge-inactive',
    low: 'badge-low',
    ok: 'badge-ok',
  }
  const cls = map[String(status)] || 'badge-pending'
  const label =
    status === true ? 'Active' :
    status === false ? 'Inactive' :
    String(status).charAt(0).toUpperCase() + String(status).slice(1)

  return <span className={`badge ${cls}`}>{label}</span>
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Confirm Action</h2>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}
