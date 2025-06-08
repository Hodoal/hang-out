const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes); // Changed path to /api/auth

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
