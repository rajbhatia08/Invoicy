
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()


const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI
mongoose
  .connect(MONGO_URI, { })
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
  })

app.use(cors());
app.use(express.json());

const { Schema, model } = mongoose

const customerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String,
  },
  { timestamps: true }
)

const invoiceItemSchema = new Schema(
  {
    name: String,
    qty: Number,
    price: Number,
    amount: Number,
  },
  { _id: false }
)

const invoiceSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    invoiceNumber: { type: String, required: true },
    issueDate: { type: String, required: true }, // YYYY-MM-DD
    dueDate: { type: String, required: true },
    items: [invoiceItemSchema],
    total: Number,
    status: {
      type: String,
      enum: ['PAID', 'UNPAID', 'OVERDUE'],
      default: 'UNPAID',
    },
  },
  { timestamps: true }
)

const Customer = model('Customer', customerSchema)
const Invoice = model('Invoice', invoiceSchema)

let invoiceCounter = 1


// Helpers
function calculateInvoiceTotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    return sum + qty * price;
  }, 0);
}

function updateInvoiceStatus(invoice) {
  const now = new Date();
  const due = new Date(invoice.dueDate);
  if (invoice.status === 'PAID') return;
  if (due < now) {
    invoice.status = 'OVERDUE';
  } else {
    invoice.status = 'UNPAID';
  }
}

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 }).lean()
    res.json(customers)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch customers' })
  }
})

app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body
    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const customer = await Customer.create({
      name,
      email: email || '',
      phone: phone || '',
      address: address || '',
    })

    res.status(201).json(customer)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create customer' })
  }
})

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updated = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
    }).lean()
    if (!updated) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update customer' })
  }
})

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await Customer.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    await Invoice.deleteMany({ customer: id })
    res.json({ message: 'Customer deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete customer' })
  }
})


// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .populate('customer', 'name')
      .lean()

    const mapped = invoices.map((inv) => {
      updateInvoiceStatus(inv)
      return {
        ...inv,
        customerName: inv.customer?.name || 'Unknown',
      }
    })

    res.json(mapped)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch invoices' })
  }
})

app.post('/api/invoices', async (req, res) => {
  try {
    const { customerId, issueDate, dueDate, items, status } = req.body

    if (!customerId) {
      return res.status(400).json({ message: 'Customer is required' })
    }

    const customer = await Customer.findById(customerId)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    const normalizedItems = Array.isArray(items)
      ? items.map((i) => ({
          name: i.name,
          qty: Number(i.qty) || 0,
          price: Number(i.price) || 0,
          amount: (Number(i.qty) || 0) * (Number(i.price) || 0),
        }))
      : []

    const total = calculateInvoiceTotal(normalizedItems)

    const invoice = await Invoice.create({
      customer: customerId,
      invoiceNumber: `INV-${invoiceCounter.toString().padStart(4, '0')}`,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      items: normalizedItems,
      total,
      status: status || 'UNPAID',
    })

    invoiceCounter += 1
    const populated = await invoice.populate('customer', 'name')
    updateInvoiceStatus(populated)

    res.status(201).json({
      ...populated.toObject(),
      customerName: populated.customer?.name || 'Unknown',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to create invoice' })
  }
})

app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['PAID', 'UNPAID', 'OVERDUE'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const invoice = await Invoice.findById(id).populate('customer', 'name')
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }

    invoice.status = status
    updateInvoiceStatus(invoice)
    await invoice.save()

    res.json({
      ...invoice.toObject(),
      customerName: invoice.customer?.name || 'Unknown',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update status' })
  }
})


// Simple analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const invoices = await Invoice.find().lean()

    let totalPaid = 0
    let totalUnpaid = 0
    let totalOverdue = 0
    const byMonth = {}

    invoices.forEach((inv) => {
      updateInvoiceStatus(inv)
      if (inv.status === 'PAID') totalPaid += inv.total
      if (inv.status === 'UNPAID') totalUnpaid += inv.total
      if (inv.status === 'OVERDUE') totalOverdue += inv.total

      const monthKey = (inv.issueDate || '').slice(0, 7)
      if (!byMonth[monthKey]) byMonth[monthKey] = 0
      byMonth[monthKey] += inv.total
    })

    const monthlyData = Object.entries(byMonth)
      .filter(([m]) => m)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }))

    const customersCount = await Customer.countDocuments()
    const invoicesCount = invoices.length

    res.json({
      totals: {
        paid: totalPaid,
        unpaid: totalUnpaid,
        overdue: totalOverdue,
        invoicesCount,
        customersCount,
      },
      monthlyRevenue: monthlyData,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to load analytics' })
  }
})


app.get('/', (req, res) => {
  res.send('Invoice & Customer Manager backend is running.');
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
