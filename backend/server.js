const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Auth helpers
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}
async function hashPassword(plain) { return await bcrypt.hash(plain, 10); }
async function comparePassword(plain, hash) { return await bcrypt.compare(plain, hash); }

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth header' });
  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Routes
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, password: hashed, name } });
  const token = signToken(user);
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await comparePassword(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

app.get('/tickets', authMiddleware, async (req, res) => {
  const tickets = await prisma.ticket.findMany({ include: { attachments: true, requester: true } });
  res.json(tickets);
});

app.post('/tickets', authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      requester: { connect: { id: Number(req.user.id) } },
    },
  });
  res.json(ticket);
});

app.post('/tickets/:id/attachments', authMiddleware, upload.single('file'), async (req, res) => {
  const ticketId = Number(req.params.id);
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const attachment = await prisma.attachment.create({
    data: {
      filename: req.file.originalname,
      path: req.file.filename,
      ticket: { connect: { id: ticketId } },
    },
  });
  res.json(attachment);
});

// Static file serve for uploaded files (optional)
app.use('/uploads', express.static(UPLOAD_DIR));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
