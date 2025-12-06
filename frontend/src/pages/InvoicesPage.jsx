
import { useEffect, useState } from 'react'
import api from '../api.js'

function emptyItem() {
  return { name: '', qty: 1, price: 0 }
}

export default function InvoicesPage() {
  const [customers, setCustomers] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customerId: '',
    issueDate: '',
    dueDate: '',
    items: [emptyItem()],
  })

  const loadData = async () => {
    try {
      const [cRes, iRes] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/invoices'),
      ])
      setCustomers(cRes.data)
      setInvoices(iRes.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load invoices or customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleItemChange = (index, field, value) => {
    setForm(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, items: newItems }
    })
  }

  const addItemRow = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, emptyItem()] }))
  }

  const removeItemRow = (index) => {
    setForm(prev => {
      const newItems = prev.items.filter((_, i) => i !== index)
      return { ...prev, items: newItems.length ? newItems : [emptyItem()] }
    })
  }

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => {
      const qty = Number(item.qty) || 0
      const price = Number(item.price) || 0
      return sum + qty * price
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        items: form.items.map(i => ({
          name: i.name,
          qty: Number(i.qty) || 0,
          price: Number(i.price) || 0,
        })),
      }
      const res = await api.post('/api/invoices', payload)
      setInvoices(prev => [...prev, res.data])
      setForm({
        customerId: '',
        issueDate: '',
        dueDate: '',
        items: [emptyItem()],
      })
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to create invoice')
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/api/invoices/${id}/status`, { status })
      setInvoices(prev =>
        prev.map(inv => (inv.id === id ? res.data : inv))
      )
    } catch (err) {
      console.error(err)
      setError('Failed to update status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">
          Invoices
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-4 space-y-3 xl:col-span-1"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Create Invoice
          </h2>
          {error && (
            <p className="text-xs text-red-600 mb-1">{error}</p>
          )}

          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.customerId}
            onChange={e =>
              setForm(prev => ({ ...prev, customerId: e.target.value }))
            }
            required
          >
            <option value="">Select customer *</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.issueDate}
                onChange={e =>
                  setForm(prev => ({ ...prev, issueDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Due Date
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.dueDate}
                onChange={e =>
                  setForm(prev => ({ ...prev, dueDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-600">
                Line Items
              </p>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-blue-600"
              >
                + Add item
              </button>
            </div>

            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center"
              >
                <input
                  className="col-span-5 border rounded-lg px-2 py-1 text-xs"
                  placeholder="Item name"
                  value={item.name}
                  onChange={e =>
                    handleItemChange(index, 'name', e.target.value)
                  }
                />
                <input
                  type="number"
                  min="1"
                  className="col-span-2 border rounded-lg px-2 py-1 text-xs"
                  placeholder="Qty"
                  value={item.qty}
                  onChange={e =>
                    handleItemChange(index, 'qty', e.target.value)
                  }
                />
                <input
                  type="number"
                  min="0"
                  className="col-span-3 border rounded-lg px-2 py-1 text-xs"
                  placeholder="Price"
                  value={item.price}
                  onChange={e =>
                    handleItemChange(index, 'price', e.target.value)
                  }
                />
                <div className="col-span-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    ₹{(Number(item.qty) || 0) * (Number(item.price) || 0)}
                  </span>
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 ml-1"
                      onClick={() => removeItemRow(index)}
                    >
                      x
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">Total</span>
            <span className="text-slate-900 font-semibold">
              ₹{calculateTotal()}
            </span>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm"
          >
            Save Invoice
          </button>
        </form>

        <div className="bg-white rounded-xl shadow-sm p-4 xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Invoice List
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-slate-500">
              No invoices yet. Create one using the form.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Invoice #</th>
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Issue</th>
                    <th className="py-2 pr-3">Due</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b">
                      <td className="py-2 pr-3">{inv.invoiceNumber}</td>
                      <td className="py-2 pr-3">{inv.customerName}</td>
                      <td className="py-2 pr-3">{inv.issueDate}</td>
                      <td className="py-2 pr-3">{inv.dueDate}</td>
                      <td className="py-2 pr-3">₹{inv.total}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={
                            'px-2 py-1 rounded-full text-xs ' +
                            (inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700'
                              : inv.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700')
                          }
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 space-x-2">
                        <button
                          className="text-xs text-emerald-600"
                          onClick={() => updateStatus(inv.id, 'PAID')}
                        >
                          Mark Paid
                        </button>
                        <button
                          className="text-xs text-amber-600"
                          onClick={() => updateStatus(inv.id, 'UNPAID')}
                        >
                          Mark Unpaid
                        </button>
                        <button
                          className="text-xs text-red-600"
                          onClick={() => updateStatus(inv.id, 'OVERDUE')}
                        >
                          Mark Overdue
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
