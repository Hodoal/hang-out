const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user'); // Import user routes

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // Ensure express.json() is used for parsing request bodies

// Mount auth and user routes
app.use('/api/auth', authRoutes); // Mount auth routes under /api/auth
app.use('/api/user', userRoutes); // Mount user routes under /api/user

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
