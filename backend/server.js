
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple in-memory data store so it's easy to run
let customers = [];
let invoices = [];
let invoiceCounter = 1;

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
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.post('/api/customers', (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  const newCustomer = {
    id: Date.now().toString(),
    name,
    email: email || '',
    phone: phone || '',
    address: address || '',
    createdAt: new Date().toISOString()
  };
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  customers[idx] = { ...customers[idx], ...req.body };
  res.json(customers[idx]);
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  customers.splice(idx, 1);
  invoices = invoices.filter(inv => inv.customerId !== id);
  res.json({ message: 'Customer deleted' });
});

// Invoices
app.get('/api/invoices', (req, res) => {
  const mapped = invoices.map(inv => {
    const customer = customers.find(c => c.id === inv.customerId);
    updateInvoiceStatus(inv);
    return {
      ...inv,
      customerName: customer ? customer.name : 'Unknown'
    };
  });
  res.json(mapped);
});

app.post('/api/invoices', (req, res) => {
  const { customerId, issueDate, dueDate, items, status } = req.body;

  if (!customerId) {
    return res.status(400).json({ message: 'Customer is required' });
  }

  const customer = customers.find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const total = calculateInvoiceTotal(items);
  const invoice = {
    id: Date.now().toString(),
    invoiceNumber: `INV-${invoiceCounter.toString().padStart(4, '0')}`,
    customerId,
    issueDate: issueDate || new Date().toISOString().slice(0, 10),
    dueDate: dueDate || new Date().toISOString().slice(0, 10),
    items: Array.isArray(items) ? items : [],
    total,
    status: status || 'UNPAID',
    createdAt: new Date().toISOString()
  };
  invoiceCounter += 1;
  updateInvoiceStatus(invoice);
  invoices.push(invoice);
  res.status(201).json(invoice);
});

app.patch('/api/invoices/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const invoice = invoices.find(inv => inv.id === id);
  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  if (!['PAID', 'UNPAID', 'OVERDUE'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  invoice.status = status;
  updateInvoiceStatus(invoice);
  res.json(invoice);
});

// Simple analytics
app.get('/api/analytics', (req, res) => {
  let totalPaid = 0;
  let totalUnpaid = 0;
  let totalOverdue = 0;

  const byMonth = {}; // { '2025-01': total, ... }

  invoices.forEach(inv => {
    updateInvoiceStatus(inv);
    if (inv.status === 'PAID') totalPaid += inv.total;
    if (inv.status === 'UNPAID') totalUnpaid += inv.total;
    if (inv.status === 'OVERDUE') totalOverdue += inv.total;

    const monthKey = inv.issueDate.slice(0, 7);
    if (!byMonth[monthKey]) byMonth[monthKey] = 0;
    byMonth[monthKey] += inv.total;
  });

  const monthlyData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  res.json({
    totals: {
      paid: totalPaid,
      unpaid: totalUnpaid,
      overdue: totalOverdue,
      invoicesCount: invoices.length,
      customersCount: customers.length
    },
    monthlyRevenue: monthlyData
  });
});

app.get('/', (req, res) => {
  res.send('Invoice & Customer Manager backend is running.');
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
