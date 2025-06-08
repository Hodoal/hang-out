const db = require('../db');

const createUser = (name, email, password, profilePicture = null, preferences = null, callback) => {
  const query = 'INSERT INTO users (name, email, password, profilePicture, preferences) VALUES (?, ?, ?, ?, ?)';
  db.run(query, [name, email, password, profilePicture, preferences], function (err) {
    if (err) return callback(err);
    callback(null, {
      id: this.lastID,
      name,
      email,
      profilePicture,
      preferences,
      hasCompletedPreferences: 0, // Default to 0 (false)
    });
  });
};

const findUserByEmail = (email, callback) => {
  db.get('SELECT * FROM users WHERE email = ?', [email], callback);
};

const findUserById = (id, callback) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], callback);
};

const updateUserProfile = ({ userId, name, email, profilePicture, preferences, hasCompletedPreferences }, callback) => {
  let query = 'UPDATE users SET ';
  const params = [];
  const fieldsToUpdate = [];

  if (name !== undefined) {
    fieldsToUpdate.push('name = ?');
    params.push(name);
  }
  if (email !== undefined) {
    fieldsToUpdate.push('email = ?');
    params.push(email);
  }
  if (profilePicture !== undefined) {
    fieldsToUpdate.push('profilePicture = ?');
    params.push(profilePicture);
  }
  if (preferences !== undefined) {
    fieldsToUpdate.push('preferences = ?');
    params.push(preferences);
  }
  if (hasCompletedPreferences !== undefined) {
    fieldsToUpdate.push('hasCompletedPreferences = ?');
    params.push(hasCompletedPreferences ? 1 : 0);
  }

  if (fieldsToUpdate.length === 0) {
    return callback(new Error('No fields to update'));
  }

  query += fieldsToUpdate.join(', ');
  query += ' WHERE id = ?';
  params.push(userId);

  db.run(query, params, function (err) {
    if (err) return callback(err);
    if (this.changes === 0) return callback(new Error('User not found or no changes made'));
    findUserById(userId, callback); // Return the updated user
  });
};

const updateUserPassword = (userId, newPassword, callback) => {
  const query = 'UPDATE users SET password = ? WHERE id = ?';
  db.run(query, [newPassword, userId], function (err) {
    if (err) return callback(err);
    if (this.changes === 0) return callback(new Error('User not found'));
    callback(null, { message: 'Password updated successfully' });
  });
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
  updateUserPassword,
};
