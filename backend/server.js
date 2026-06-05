const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (/image|pdf/.test(file.mimetype)) cb(null, true);
    else cb(null, false);
  },
});

// Zod schema for ticket creation
const createTicketSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  department: z.string().min(1),
  company_affiliation: z.string().min(1),
  category: z.string().min(1),
  priority: z.enum(['Low', 'Medium', 'High']),
  issue_title: z.string().min(1),
  issue_description: z.string().min(1),
  error_link: z.string().url().optional(),
  assigned_to: z.string().optional(),
  internal_notes: z.string().optional(),
  public_resolution_notes: z.string().optional(),
  escalated_to_it: z.boolean().optional(),
  solved_without_it: z.boolean().optional(),
  date_resolved: z.string().optional(),
});

// Auth middleware (basic JWT scaffold)
const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me';
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth header' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Atomic ticket ID generator using Counter model
async function generateTicketId() {
  const year = new Date().getFullYear();
  const counter = await prisma.counter.update({
    where: { name: 'ticket' },
    data: { value: { increment: 1 } },
  });
  return `CRM-${year}-${String(counter.value).padStart(4, '0')}`;
}

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Create ticket
app.post('/api/tickets', upload.single('file'), async (req, res) => {
  try {
    const parsed = createTicketSchema.parse(req.body);
    const ticket_id = await generateTicketId();

    const ticketData = {
      ticket_id,
      full_name: parsed.full_name,
      email: parsed.email,
      department: parsed.department,
      company_affiliation: parsed.company_affiliation,
      category: parsed.category,
      priority: parsed.priority,
      issue_title: parsed.issue_title,
      issue_description: parsed.issue_description,
      error_link: parsed.error_link || null,
      assigned_to: parsed.assigned_to || null,
      internal_notes: parsed.internal_notes || null,
      public_resolution_notes: parsed.public_resolution_notes || null,
      escalated_to_it: parsed.escalated_to_it || false,
      solved_without_it: parsed.solved_without_it || false,
      date_resolved: parsed.date_resolved ? new Date(parsed.date_resolved) : null,
      screenshot_file: req.file ? req.file.filename : null,
    };

    const ticket = await prisma.ticket.create({ data: ticketData });

    // TODO: send notification email or webhook

    res.status(201).json(ticket);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get tickets for a user (requires auth)
app.get('/api/my-tickets', authMiddleware, async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(400).json({ error: 'User email not present in token' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(100, parseInt(req.query.perPage) || 25);

    const tickets = await prisma.ticket.findMany({
      where: { email },
      select: {
        ticket_id: true,
        category: true,
        priority: true,
        status: true,
        date_submitted: true,
        last_updated: true,
        public_resolution_notes: true,
      },
      orderBy: { date_submitted: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user tickets' });
  }
});

// Admin dashboard metrics (requires auth and admin role)
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const total = await prisma.ticket.count();
    const resolved = await prisma.ticket.count({ where: { status: 'Resolved' } });
    const high = await prisma.ticket.count({ where: { priority: 'High' } });

    res.json({ total, resolved, high });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Get single ticket
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { ticket_id: req.params.id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Upload screenshot for ticket
app.post('/api/tickets/:id/screenshot', upload.single('file'), async (req, res) => {
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

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
