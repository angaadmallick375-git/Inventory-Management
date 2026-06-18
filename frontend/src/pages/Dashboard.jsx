import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, Users, ShoppingCart, Warehouse,
  TrendingUp, AlertTriangle, ArrowRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { productsApi, customersApi, ordersApi } from '../services/api'
import { LoadingSpinner, Badge } from '../components/ui'

const STATUS_COLORS = {
  pending: '#f59e0b', confirmed: '#38bdf8',
  processing: '#a78bfa', shipped: '#10d9a0',
  delivered: '#10d9a0', cancelled: '#ef4444',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [orderStatusData, setOrderStatusData] = useState([])
  const [customerMap, setCustomerMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [products, customers, orders, ordersAll, custList] = await Promise.all([
          productsApi.count(),
          customersApi.count(),
          ordersApi.count(),
          ordersApi.list({ limit: 10 }),
          customersApi.list({ limit: 500 }),
        ])
        // Low stock = products where quantity_in_stock <= 10
        const allProds = await productsApi.list({ limit: 500 })
        const lowStockItems = allProds.data
          .filter(p => p.quantity_in_stock <= 10)
          .map(p => ({
            product_id: p.id,
            product_name: p.name,
            sku: p.sku,
            quantity_in_stock: p.quantity_in_stock,
            reorder_level: 10,
          }))

        setStats({
          products: products.data.count,
          customers: customers.data.count,
          orders: orders.data.count,
          lowStock: lowStockItems.length,
        })
        // Build id → name map for recent orders widget
        const cmap = {}
        custList.data.forEach(c => { cmap[c.id] = c.name })
        setCustomerMap(cmap)
        setLowStock(lowStockItems.slice(0, 5))
        const recent = ordersAll.data
        setRecentOrders(recent.slice(0, 6))

        // Aggregate order statuses for pie chart
        const statusCount = {}
        recent.forEach(o => {
          statusCount[o.status] = (statusCount[o.status] || 0) + 1
        })
        setOrderStatusData(
          Object.entries(statusCount).map(([name, value]) => ({ name, value }))
        )
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />

  const statCards = [
    {
      label: 'Total Products', value: stats?.products ?? 0,
      icon: Package, color: 'rgba(108,99,255,0.15)', iconColor: '#a78bfa',
    },
    {
      label: 'Customers', value: stats?.customers ?? 0,
      icon: Users, color: 'rgba(56,189,248,0.15)', iconColor: '#38bdf8',
    },
    {
      label: 'Total Orders', value: stats?.orders ?? 0,
      icon: ShoppingCart, color: 'rgba(16,217,160,0.15)', iconColor: '#10d9a0',
    },
    {
      label: 'Low Stock Alerts', value: stats?.lowStock ?? 0,
      icon: AlertTriangle, color: 'rgba(239,68,68,0.15)', iconColor: '#ef4444',
    },
  ]

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back — here's what's happening today.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className="stat-card" style={{ '--stat-color': color }}>
            <div className="stat-icon" style={{ background: color }}>
              <Icon size={22} color={iconColor} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{value.toLocaleString()}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Order Status Breakdown</div>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {orderStatusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] || '#6c63ff'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#16161f', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, color: '#f0f0ff' }}
                />
                <Legend
                  formatter={(val) => (
                    <span style={{ color: '#9090b8', fontSize: 12, textTransform: 'capitalize' }}>{val}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No order data</div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-title">Inventory Overview — Low Stock Items</div>
          {lowStock.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lowStock} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,99,255,0.08)" />
                <XAxis dataKey="sku" tick={{ fill: '#9090b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9090b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#16161f', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, color: '#f0f0ff' }}
                />
                <Bar dataKey="quantity_in_stock" name="In Stock" fill="#6c63ff" radius={[4,4,0,0]} />
                <Bar dataKey="reorder_level" name="Reorder Level" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              ✅ All stock levels are healthy
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Orders</h3>
            <Link to="/orders" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No orders yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentOrders.map(order => (
                <div key={order.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--bg-secondary)',
                  borderRadius: 8, border: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {customerMap[order.customer_id] || `Customer #${order.customer_id}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge status={order.status} />
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      ${order.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#ef4444" /> Low Stock Alerts
            </h3>
            <Link to="/inventory" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p style={{ color: 'var(--accent-success)', fontSize: 13 }}>✅ All items sufficiently stocked!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lowStock.map(item => {
                const pct = Math.min(100, (item.quantity_in_stock / item.reorder_level) * 100)
                return (
                  <div key={item.product_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.product_name}</span>
                      <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                        {item.quantity_in_stock} / {item.reorder_level}
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${pct}%`, background: pct < 50 ? '#ef4444' : '#f59e0b' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
