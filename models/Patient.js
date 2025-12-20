const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  age: Number,
  bmi: Number,
  bloodPressure: Number,
  glucose: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Patient", patientSchema);
