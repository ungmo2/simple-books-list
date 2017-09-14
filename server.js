// ======================================================================
// SET UP Dependency
const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');

const app = express();
const dbPath = path.join(__dirname, '/data/books.json');

// ======================================================================
// CONFIGURATION
// handlebars
app.engine('handlebars', exphbs({ defaultLayout: false }));
app.set('view engine', 'handlebars');
// Static File Service
app.use(express.static('public'));
// Body Parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// ======================================================================
// ROUTES

// index
app.get('/', (req, res) => res.render('index'));

// GET books
app.get('/books', (req, res) => {
  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) throw err;

    const { books } = JSON.parse(data);
    res.json(books);
  });
});

// CREATE book
app.post('/books', (req, res) => {
  const result = {};
  const { title } = req.body;

  // Check request body
  if (!title) {
    result.success = false;
    result.message = 'invalid request';
    res.json(result);
    return;
  }

  // Load users & Check duplication
  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) throw err;

    const json = JSON.parse(data);

    // Add data
    json.books.push(req.body);

    // Create user
    fs.writeFile(dbPath, JSON.stringify(json, null, 2), 'utf8', err => {
      if (err) throw err;

      result.success = true;
      res.json(result);
    });
  });
});

// Update book
app.put('/books/:id', (req, res) => {
  const result = {};
  const id = req.params.id * 1;

  // Check id & request body
  if (!id || !req.body) {
    result.success = false;
    result.message = 'invalid request';
    res.json(result);
    return;
  }

  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) throw err;

    const json = JSON.parse(data);

    // 갱신 대상 없음
    if (!json.books.some(book => book.id === id)) {
      result.success = false;
      result.message = '갱신 대상 없음';
      res.json(result);
      return;
    }

    // Update data
    json.books = json.books.map(book => {
      if (book.id === id) book = req.body;
      return book;
    });

    // Update JSON File
    fs.writeFile(dbPath, JSON.stringify(json, null, 2), 'utf8', err => {
      if (err) throw err;

      result.success = true;
      res.json(result);
    });
  });
});

// DELETE book
app.delete('/books/:id', (req, res) => {
  const result = {};
  const id = req.params.id * 1;

  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) throw err;

    const json = JSON.parse(data);

    // 삭제 대상 없음
    if (!json.books.some(book => book.id === id)) {
      result.success = false;
      result.message = '삭제 대상 없음';
      res.json(result);
      return;
    }

    // DELETE data
    json.books = json.books.filter(book => book.id !== id);

    // DELETE JSON File
    fs.writeFile(dbPath, JSON.stringify(json, null, 2), 'utf8', err => {
      result.success = true;
      res.json(result);
    });
  });
});

app.listen(3000, () => console.log('app listening on http://localhost:3000'));
