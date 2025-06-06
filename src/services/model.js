const mongoose = require('mongoose');

// Modelo de Usuario
const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  hasCompletedPreferences: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Modelo de Preferencias
const preferenceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  moods: [{ 
    type: String 
  }],
  placeTypes: [{ 
    type: String 
  }],
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Modelo para lugares recomendados (para futura expansión)
const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  address: String,
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  recommendedFor: [{
    type: String
  }],
  images: [{
    url: String,
    caption: String
  }],
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Modelo para las visitas de usuario (para futura expansión)
const visitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  placeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  mood: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  visitDate: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
const Preference = mongoose.model('Preference', preferenceSchema);
const Place = mongoose.model('Place', placeSchema);
const Visit = mongoose.model('Visit', visitSchema);

module.exports = {
  User,
  Preference,
  Place,
  Visit
};