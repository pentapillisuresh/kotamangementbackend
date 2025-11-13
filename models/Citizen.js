const mongoose = require("mongoose");

const citizenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  adharCardNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\d{12}$/, "Aadhar card number must be 12 digits"]
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    filename: String,
    originalName: String,
    path: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
citizenSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Citizen", citizenSchema);