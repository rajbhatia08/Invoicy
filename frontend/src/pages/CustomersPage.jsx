
import { useEffect, useState } from 'react'
import api from '../api.js'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [editingId, setEditingId] = useState(null)

  const loadCustomers = async () => {
    try {
      const res = await api.get('/api/customers')
      setCustomers(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        const res = await api.put(`/api/customers/${editingId}`, form)
        setCustomers(prev =>
          prev.map(c => (c._id === editingId ? res.data : c))
        )
      } else {
        const res = await api.post('/api/customers', form)
        setCustomers(prev => [...prev, res.data])
      }
      setForm({ name: '', email: '', phone: '', address: '' })
      setEditingId(null)
    } catch (err) {
      console.error(err)
      setError('Failed to save customer')
    }
  }

  const handleEdit = (customer) => {
    setEditingId(customer._id)
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return
    try {
      await api.delete(`/api/customers/${id}`)
      setCustomers(prev => prev.filter(c => c._id !== id))
    } catch (err) {
      console.error(err)
      setError('Failed to delete customer')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">
          Customers
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-4 space-y-3"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            {editingId ? 'Edit Customer' : 'Add Customer'}
          </h2>
          {error && (
            <p className="text-xs text-red-600 mb-1">{error}</p>
          )}
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Phone"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Address"
            rows={3}
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                onClick={() => {
                  setEditingId(null)
                  setForm({ name: '', email: '', phone: '', address: '' })
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Customer List
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : customers.length === 0 ? (
            <p className="text-sm text-slate-500">
              No customers yet. Add one from the form.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c._id} className="border-b">
                      <td className="py-2 pr-4">{c.name}</td>
                      <td className="py-2 pr-4">{c.email}</td>
                      <td className="py-2 pr-4">{c.phone}</td>
                      <td className="py-2 pr-4 space-x-2">
                        <button
                          className="text-blue-600 text-xs"
                          onClick={() => handleEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 text-xs"
                          onClick={() => handleDelete(c._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
