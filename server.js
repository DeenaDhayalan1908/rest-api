// Notes REST API: Node.js + Express
// Storage: a JSON file (data/notes.json), so notes survive restarts. No database needed.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'notes.json');

app.use(express.json()); // parse JSON request bodies

// ---------- Storage helpers ----------
function readNotes() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; } // first run or empty file
}
function writeNotes(notes) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
}
function nextId(notes) {
  return notes.length ? Math.max(...notes.map(n => n.id)) + 1 : 1;
}

// Returns an error message if the body is invalid, otherwise null
function validate(body, requireAll) {
  const { title, content } = body || {};
  if (requireAll && (!title || !content)) return 'Both "title" and "content" are required.';
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) return '"title" must be a non-empty string.';
  if (content !== undefined && (typeof content !== 'string' || !content.trim())) return '"content" must be a non-empty string.';
  if (!requireAll && title === undefined && content === undefined) return 'Send "title" and/or "content" to update.';
  return null;
}

// ---------- Routes ----------

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Notes API is running', endpoints: 'GET/POST /notes, GET/PUT/DELETE /notes/:id' });
});

// CREATE: add a note
app.post('/notes', (req, res) => {
  const error = validate(req.body, true);
  if (error) return res.status(400).json({ error });

  const notes = readNotes();
  const note = {
    id: nextId(notes),
    title: req.body.title.trim(),
    content: req.body.content.trim(),
    createdAt: new Date().toISOString()
  };
  notes.push(note);
  writeNotes(notes);
  res.status(201).json(note);
});

// READ: list all notes (optional search: GET /notes?search=word)
app.get('/notes', (req, res) => {
  let notes = readNotes();
  const q = (req.query.search || '').toLowerCase();
  if (q) notes = notes.filter(n => (n.title + ' ' + n.content).toLowerCase().includes(q));
  res.json(notes);
});

// READ: get one note
app.get('/notes/:id', (req, res) => {
  const note = readNotes().find(n => n.id === Number(req.params.id));
  if (!note) return res.status(404).json({ error: 'Note not found.' });
  res.json(note);
});

// UPDATE: change title and/or content
app.put('/notes/:id', (req, res) => {
  const error = validate(req.body, false);
  if (error) return res.status(400).json({ error });

  const notes = readNotes();
  const note = notes.find(n => n.id === Number(req.params.id));
  if (!note) return res.status(404).json({ error: 'Note not found.' });

  if (req.body.title !== undefined) note.title = req.body.title.trim();
  if (req.body.content !== undefined) note.content = req.body.content.trim();
  note.updatedAt = new Date().toISOString();
  writeNotes(notes);
  res.json(note);
});

// DELETE: remove a note
app.delete('/notes/:id', (req, res) => {
  const notes = readNotes();
  const index = notes.findIndex(n => n.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Note not found.' });

  const [removed] = notes.splice(index, 1);
  writeNotes(notes);
  res.json({ message: 'Note deleted.', note: removed });
});

// Unknown routes and malformed JSON
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => console.log(`Notes API running at http://localhost:${PORT}`));
