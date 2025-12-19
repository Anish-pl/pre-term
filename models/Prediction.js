const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  risk: String,
  probability: Number
});

module.exports = mongoose.model("Prediction", predictionSchema);
