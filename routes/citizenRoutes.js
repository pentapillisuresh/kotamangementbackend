const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  createCitizen,
  getAllCitizens,
  getCitizenById,
  updateCitizen,
  deleteCitizen,
  searchCitizens,
  testFileServing,
  checkFileExists
} = require("../controllers/citizenController");

// Configure multer for file uploads - FIXED PATH
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    console.log("📁 Upload destination:", uploadPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log("✅ Created uploads directory:", uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = "photo-" + uniqueSuffix + path.extname(file.originalname);
    console.log("📸 Generated filename:", filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log("📄 File upload attempt:", file.originalname, file.mimetype);
  
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB."
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

router.get("/test", (req, res) => {
  console.log("✅ GET /api/citizen/test route is working!");
  res.json({ success: true, message: "Test route working!" });
});

// Debug routes
router.get("/test-files", testFileServing);
router.get("/check-file/:filename", checkFileExists);

// Routes with multer error handling
router.post("/", upload.single("photo"), handleMulterError, createCitizen);
router.get("/", getAllCitizens);
router.get("/search", searchCitizens);
router.get("/:id", getCitizenById);
router.put("/:id", upload.single("photo"), handleMulterError, updateCitizen);
router.delete("/:id", deleteCitizen);

module.exports = router;