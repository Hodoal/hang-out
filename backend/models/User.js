const db = require('../db');

const createUser = (name, email, password, callback) => {
  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.run(query, [name, email, password], function (err) {
    if (err) return callback(err);
    callback(null, { id: this.lastID, name, email, hasCompletedPreferences: false });
  });
};

const findUserByEmail = (email, callback) => {
  db.get('SELECT * FROM users WHERE email = ?', [email], callback);
};

module.exports = { createUser, findUserByEmail };
