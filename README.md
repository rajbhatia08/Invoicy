
# Invoicy: Invoice & Customer Manager

This is a full-stack project built with **React, Tailwind CSS, Node.js and Express**.

It lets a small business:

- Store basic customer details
- Create invoices with multiple line items
- Track invoice status: **UNPAID / PAID / OVERDUE**
- See a simple dashboard with:
  - Number of customers
  - Number of invoices
  - Paid vs pending totals
  - Monthly revenue chart

The backend uses a simple in-memory data store so it is easy to run without any database setup.  

---

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Chart.js
- Backend: Node.js, Express, CORS
- Data: In-memory JS arrays 

---

## How to Run

### 1. Backend

```bash
cd backend
npm install
npm start
```

The backend runs on **http://localhost:5000**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **http://localhost:5173**.

Make sure the backend is running first so the API calls work.

---

## Folder Structure

```bash
invoice-customer-manager/
  backend/
    server.js
    package.json
  frontend/
    index.html
    vite.config.js
    tailwind.config.js
    postcss.config.js
    package.json
    src/
      main.jsx
      App.jsx
      api.js
      pages/
        DashboardPage.jsx
        CustomersPage.jsx
        InvoicesPage.jsx
      index.css
```

---

## Notes

- This project is intentionally kept clean and simple.
- The code style is straightforward so it looks like a student-built project, not a huge production codebase.
- You can show this as:

> "Invoice & Customer Manager – built a small business tool to manage customers and invoices with a dashboard showing revenue analytics (React, Tailwind, Node, Express)."
