
import { Routes, Route, NavLink } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage.jsx'
import CustomersPage from './pages/CustomersPage.jsx'
import InvoicesPage from './pages/InvoicesPage.jsx'

function App() {
  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-64 bg-slate-900 text-slate-50 flex flex-col">
        <div className="px-6 py-4 text-xl font-semibold border-b border-slate-800">
          Invoicy
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg ${
                isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg ${
                isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
              }`
            }
          >
            Customers
          </NavLink>
          <NavLink
            to="/invoices"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg ${
                isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
              }`
            }
          >
            Invoices
          </NavLink>
        </nav>
        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
          Built with React, Tailwind & Node
        </div>
      </aside>

      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
