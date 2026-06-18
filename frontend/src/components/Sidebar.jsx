import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Warehouse, BarChart3, Menu, X
} from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/products',  icon: Package,         label: 'Products'   },
  { to: '/customers', icon: Users,           label: 'Customers'  },
  { to: '/orders',    icon: ShoppingCart,    label: 'Orders'     },
  { to: '/inventory', icon: Warehouse,       label: 'Inventory'  },
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [location])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const sidebarContent = (
    <>
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">
            <BarChart3 size={20} color="#fff" />
          </div>
          <div className="logo-text">
            <span className="logo-name">InventoryOS</span>
            <span className="logo-sub">Management Suite</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Navigation</span>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>InventoryOS v1.0.0</p>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <div className="logo-icon" style={{ width: 30, height: 30 }}>
            <BarChart3 size={16} color="#fff" />
          </div>
          InventoryOS
        </div>
        <button
          className="hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        {sidebarContent}
      </aside>
    </>
  )
}
