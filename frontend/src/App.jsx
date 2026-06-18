import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1c28',
            color: '#f0f0ff',
            border: '1px solid rgba(108,99,255,0.25)',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10d9a0', secondary: '#16161f' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#16161f' } },
        }}
      />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/products"  element={<Products />}  />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders"    element={<Orders />}    />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
