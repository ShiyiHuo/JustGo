const mongoose = require('mongoose');

// define user schema and model it
const userSchema = new mongoose.Schema({
    username: {type: String, index: {unique: true}},
    password: String,
    wins: Number,
    losses: Number
});

module.exports = mongoose.model('User', userSchema);