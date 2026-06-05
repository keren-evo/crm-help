const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer config for screenshots
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Routes
// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// List tickets
app.get('/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({ orderBy: { date_submitted: 'desc' } });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket
app.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { ticket_id: req.params.id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create ticket
app.post('/tickets', async (req, res) => {
  try {
    const data = req.body || {};
    // Basic required fields validation
    const required = ['full_name', 'email', 'department', 'company_affiliation', 'category', 'priority', 'issue_title', 'issue_description'];
    for (const f of required) {
      if (!data[f]) return res.status(400).json({ error: `${f} is required` });
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticket_id: randomUUID(),
        full_name: data.full_name,
        email: data.email,
        department: data.department,
        company_affiliation: data.company_affiliation,
        category: data.category,
        priority: data.priority,
        issue_title: data.issue_title,
        issue_description: data.issue_description,
        error_link: data.error_link || null,
        status: data.status || undefined,
        assigned_to: data.assigned_to || null,
        internal_notes: data.internal_notes || null,
        public_resolution_notes: data.public_resolution_notes || null,
        escalated_to_it: data.escalated_to_it || false,
        solved_without_it: data.solved_without_it || false,
        date_resolved: data.date_resolved ? new Date(data.date_resolved) : null,
      },
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Upload screenshot for ticket
app.post('/tickets/:id/screenshot', upload.single('file'), async (req, res) => {
  try {
    const id = req.params.id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'file is required' });

    const updated = await prisma.ticket.update({
      where: { ticket_id: id },
      data: { screenshot_file: file.filename },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload screenshot' });
  }
});

// Serve uploads
app.use('/uploads', express.static(UPLOAD_DIR));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
