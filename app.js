const express = require("express");
const connectDB = require("./config/db");
const ngoRoutes = require("./routes/ngoRoutes");
const citizenRoutes = require("./routes/citizenRoutes"); // Add this line
const cors = require("cors");
const path = require("path");
const app = express();

// Connect to MongoDB
connectDB();

// Enable CORS for all origins
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// NGO routes
app.use("/api/ngo", ngoRoutes);

// Citizen routes - Add this line
app.use("/api/citizen", citizenRoutes);

// Welcome route
app.get("/api/", (req, res) => {
  console.log("GET /api/ called");
  res.send(`<!DOCTYPE html><html>...</html>`);
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));