const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelMoodApp')
  .then(() => console.log('Conexión a MongoDB establecida'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// Modelos
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  hasCompletedPreferences: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const preferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moods: [{ type: String }],
  placeTypes: [{ type: String }],
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Preference = mongoose.model('Preference', preferenceSchema);

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: 'No se proporcionó token de autenticación' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Rutas
// Registro de usuario
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo usuario
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Crear token
    const token = jwt.sign({ userId: savedUser._id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        hasCompletedPreferences: savedUser.hasCompletedPreferences,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Login de usuario
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Buscar preferencias si existen
    const preferences = await Preference.findOne({ userId: user._id });

    // Crear token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasCompletedPreferences: user.hasCompletedPreferences,
        preferences: preferences || null,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Guardar preferencias de usuario
app.post('/api/users/:userId/preferences', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { moods, placeTypes } = req.body;

    // Verificar que el ID de la ruta coincida con el token
    if (userId !== req.userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Buscar si ya existen preferencias
    let preferences = await Preference.findOne({ userId });

    if (preferences) {
      // Actualizar preferencias existentes
      preferences.moods = moods;
      preferences.placeTypes = placeTypes;
      preferences.updatedAt = Date.now();
      await preferences.save();
    } else {
      // Crear nuevas preferencias
      preferences = new Preference({
        userId,
        moods,
        placeTypes,
      });
      await preferences.save();
    }

    // Actualizar estado de preferencias completadas
    user.hasCompletedPreferences = true;
    await user.save();

    res.json({
      message: 'Preferencias guardadas correctamente',
      preferences,
    });
  } catch (error) {
    console.error('Error al guardar preferencias:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener recomendaciones según estado de ánimo
app.get('/api/recommendations', verifyToken, async (req, res) => {
  try {
    const { mood } = req.query;

    if (!mood) {
      return res
        .status(400)
        .json({ message: 'Se requiere especificar un estado de ánimo' });
    }

    // Obtener preferencias del usuario
    const preferences = await Preference.findOne({ userId: req.userId });

    if (!preferences) {
      return res
        .status(404)
        .json({ message: 'No se encontraron preferencias para este usuario' });
    }

    // Ejemplo: Aquí implementarías tu lógica para obtener recomendaciones
    // basadas en el estado de ánimo actual y las preferencias guardadas

    // Esta es una implementación de ejemplo - en una app real conectarías con una API de lugares
    // o tendrías tu propia base de datos de lugares
    const recommendedPlaces = generateRecommendations(
      mood,
      preferences.placeTypes
    );

    res.json({
      mood,
      recommendations: recommendedPlaces,
    });
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Función para generar recomendaciones de ejemplo
// En una aplicación real, esto se conectaría a una API como Google Places
function generateRecommendations(mood, placeTypes) {
  // Datos de ejemplo - en una app real estos vendrían de una base de datos o API externa
  const placesByType = {
    restaurants: [
      {
        id: 'r1',
        name: 'Restaurante Gourmet',
        rating: 4.5,
        type: 'restaurants',
        recommendedFor: ['relaxed', 'romantic', 'foodie'],
      },
      {
        id: 'r2',
        name: 'Food Truck Park',
        rating: 4.2,
        type: 'restaurants',
        recommendedFor: ['adventurous', 'party', 'foodie'],
      },
    ],
    museums: [
      {
        id: 'm1',
        name: 'Museo de Arte Contemporáneo',
        rating: 4.7,
        type: 'museums',
        recommendedFor: ['cultural', 'relaxed'],
      },
      {
        id: 'm2',
        name: 'Museo Interactivo',
        rating: 4.3,
        type: 'museums',
        recommendedFor: ['adventurous', 'cultural'],
      },
    ],
    parks: [
      {
        id: 'p1',
        name: 'Parque Central',
        rating: 4.4,
        type: 'parks',
        recommendedFor: ['relaxed', 'romantic', 'nature'],
      },
      {
        id: 'p2',
        name: 'Parque de Aventuras',
        rating: 4.6,
        type: 'parks',
        recommendedFor: ['adventurous', 'nature'],
      },
    ],
    bars: [
      {
        id: 'b1',
        name: 'Bar Lounge',
        rating: 4.2,
        type: 'bars',
        recommendedFor: ['romantic', 'relaxed'],
      },
      {
        id: 'b2',
        name: 'Bar de Cócteles',
        rating: 4.5,
        type: 'bars',
        recommendedFor: ['party', 'romantic'],
      },
    ],
    beaches: [
      {
        id: 'be1',
        name: 'Playa Tranquila',
        rating: 4.8,
        type: 'beaches',
        recommendedFor: ['relaxed', 'romantic', 'nature'],
      },
      {
        id: 'be2',
        name: 'Playa para Surf',
        rating: 4.7,
        type: 'beaches',
        recommendedFor: ['adventurous', 'party', 'nature'],
      },
    ],
    historical: [
      {
        id: 'h1',
        name: 'Centro Histórico',
        rating: 4.6,
        type: 'historical',
        recommendedFor: ['cultural', 'relaxed'],
      },
      {
        id: 'h2',
        name: 'Ruinas Antiguas',
        rating: 4.5,
        type: 'historical',
        recommendedFor: ['cultural', 'adventurous'],
      },
    ],
    shopping: [
      {
        id: 's1',
        name: 'Centro Comercial',
        rating: 4.0,
        type: 'shopping',
        recommendedFor: ['shopping', 'relaxed'],
      },
      {
        id: 's2',
        name: 'Mercado Local',
        rating: 4.4,
        type: 'shopping',
        recommendedFor: ['shopping', 'cultural', 'foodie'],
      },
    ],
    entertainment: [
      {
        id: 'e1',
        name: 'Teatro',
        rating: 4.3,
        type: 'entertainment',
        recommendedFor: ['cultural', 'romantic'],
      },
      {
        id: 'e2',
        name: 'Club Nocturno',
        rating: 4.1,
        type: 'entertainment',
        recommendedFor: ['party'],
      },
    ],
  };

  // Filtrar lugares según las preferencias de tipos del usuario
  let allPlaces = [];
  placeTypes.forEach((type) => {
    if (placesByType[type]) {
      allPlaces = [...allPlaces, ...placesByType[type]];
    }
  });

  // Filtrar por estado de ánimo actual
  const moodPlaces = allPlaces.filter((place) =>
    place.recommendedFor.includes(mood)
  );

  // Ordenar por relevancia (rating)
  return moodPlaces.sort((a, b) => b.rating - a.rating);
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
