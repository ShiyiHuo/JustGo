"use strict";
const mongoose = require('mongoose');
const constants = require('./game/constants');



module.exports = mongoose.model('Timer', timerSchema);
