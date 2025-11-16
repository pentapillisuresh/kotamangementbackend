const Citizen = require("../models/Citizen");
const path = require("path");
const fs = require("fs");

// Create new citizen (ALLOW DUPLICATE AADHAR)
const createCitizen = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      fatherName,
      age,
      address,
      adharCardNumber,
      purpose,
      state
    } = req.body;

    console.log("📝 Creating citizen:", name);
    console.log("📸 File info:", req.file);
    console.log("ℹ️ Aadhar:", adharCardNumber, "(duplicates allowed)");

    // Handle photo upload - FIXED PATH HANDLING
    let photoData = null;
    if (req.file) {
      photoData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.filename, // Store only filename, not full path
        timestamp: new Date()
      };
      console.log("✅ Photo data saved:", photoData);
    }

    const citizen = new Citizen({
      name,
      phoneNumber,
      fatherName,
      age: parseInt(age),
      address,
      adharCardNumber,
      purpose,
      state,
      photo: photoData
    });

    await citizen.save();
    console.log("✅ Citizen saved successfully:", citizen._id);

    // Add full URL to response
    const citizenObj = citizen.toObject();
    if (citizenObj.photo && citizenObj.photo.filename) {
      citizenObj.photo.url = `http://localhost:5000/uploads/${citizenObj.photo.filename}`;
    }

    res.status(201).json({
      success: true,
      message: "Citizen registered successfully",
      data: citizenObj
    });
  } catch (error) {
    // Delete the uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
      console.log("🗑️ Deleted file due to error:", req.file.path);
    }
    console.error("❌ Error creating citizen:", error);
    res.status(500).json({
      success: false,
      message: "Error registering citizen",
      error: error.message
    });
  }
};

// Get all citizens
const getAllCitizens = async (req, res) => {
  try {
    console.log("📋 Fetching all citizens");
    const citizens = await Citizen.find().sort({ createdAt: -1 });
    
    // Transform data to include full image URLs
    const citizensWithImageUrls = citizens.map(citizen => {
      const citizenObj = citizen.toObject();
      if (citizenObj.photo && citizenObj.photo.filename) {
        citizenObj.photo.url = `http://localhost:5000/uploads/${citizenObj.photo.filename}`;
      }
      return citizenObj;
    });

    console.log(`✅ Found ${citizens.length} citizens`);
    res.status(200).json({
      success: true,
      count: citizens.length,
      data: citizensWithImageUrls
    });
  } catch (error) {
    console.error("❌ Error fetching citizens:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching citizens",
      error: error.message
    });
  }
};

// Get citizen by ID
const getCitizenById = async (req, res) => {
  try {
    console.log("👤 Fetching citizen by ID:", req.params.id);
    const citizen = await Citizen.findById(req.params.id);
    
    if (!citizen) {
      console.log("❌ Citizen not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Citizen not found"
      });
    }

    // Add full image URL
    const citizenObj = citizen.toObject();
    if (citizenObj.photo && citizenObj.photo.filename) {
      citizenObj.photo.url = `http://localhost:5000/uploads/${citizenObj.photo.filename}`;
    }

    console.log("✅ Citizen found:", citizen.name);
    res.status(200).json({
      success: true,
      data: citizenObj
    });
  } catch (error) {
    console.error("❌ Error fetching citizen:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching citizen",
      error: error.message
    });
  }
};

// Get citizens by Aadhar number (returns array for duplicates)
const getCitizensByAadhar = async (req, res) => {
  try {
    const { adharCardNumber } = req.params;
    console.log("🔍 Fetching citizens by Aadhar:", adharCardNumber);

    if (!adharCardNumber || !/^\d{12}$/.test(adharCardNumber)) {
      return res.status(400).json({
        success: false,
        message: "Valid 12-digit Aadhar card number is required"
      });
    }

    const citizens = await Citizen.find({ adharCardNumber }).sort({ createdAt: -1 });

    // Add full image URLs
    const citizensWithImageUrls = citizens.map(citizen => {
      const citizenObj = citizen.toObject();
      if (citizenObj.photo && citizenObj.photo.filename) {
        citizenObj.photo.url = `http://localhost:5000/uploads/${citizenObj.photo.filename}`;
      }
      return citizenObj;
    });

    console.log(`✅ Found ${citizens.length} records for Aadhar: ${adharCardNumber}`);
    res.status(200).json({
      success: true,
      count: citizens.length,
      adharCardNumber,
      data: citizensWithImageUrls
    });
  } catch (error) {
    console.error("❌ Error fetching citizens by Aadhar:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching citizens by Aadhar",
      error: error.message
    });
  }
};

// Update citizen
const updateCitizen = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log("✏️ Updating citizen:", id);
    console.log("📸 File info:", req.file);

    // Handle photo update if new file is uploaded
    if (req.file) {
      updateData.photo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.filename, // Store only filename
        timestamp: new Date()
      };

      // Delete old photo file if exists
      const oldCitizen = await Citizen.findById(id);
      if (oldCitizen && oldCitizen.photo && oldCitizen.photo.filename) {
        const oldPhotoPath = path.join(__dirname, "..", "uploads", oldCitizen.photo.filename);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
          console.log("🗑️ Deleted old photo:", oldPhotoPath);
        }
      }
    }

    const citizen = await Citizen.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!citizen) {
      // Delete the uploaded file if citizen not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
        console.log("🗑️ Deleted file - citizen not found:", req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Citizen not found"
      });
    }

    // Add full image URL to response
    const citizenObj = citizen.toObject();
    if (citizenObj.photo && citizenObj.photo.filename) {
      citizenObj.photo.url = `http://localhost:5000/uploads/${citizenObj.photo.filename}`;
    }

    console.log("✅ Citizen updated successfully:", id);
    res.status(200).json({
      success: true,
      message: "Citizen updated successfully",
      data: citizenObj
    });
  } catch (error) {
    // Delete the uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
      console.log("🗑️ Deleted file due to error:", req.file.path);
    }
    console.error("❌ Error updating citizen:", error);
    res.status(500).json({
      success: false,
      message: "Error updating citizen",
      error: error.message
    });
  }
};

// Delete citizen
const deleteCitizen = async (req, res) => {
  try {
    console.log("🗑️ Deleting citizen:", req.params.id);
    const citizen = await Citizen.findByIdAndDelete(req.params.id);

    if (!citizen) {
      console.log("❌ Citizen not found for deletion:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Citizen not found"
      });
    }

    // Delete associated photo file
    if (citizen.photo && citizen.photo.filename) {
      const photoPath = path.join(__dirname, "..", "uploads", citizen.photo.filename);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
        console.log("🗑️ Deleted photo file:", photoPath);
      }
    }

    console.log("✅ Citizen deleted successfully:", req.params.id);
    res.status(200).json({
      success: true,
      message: "Citizen deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting citizen:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting citizen",
      error: error.message
    });
  }
};

// Search citizens by various fields
const searchCitizens = async (req, res) => {
  try {
    const { name, adharCardNumber, phoneNumber, state } = req.query;
    console.log("🔍 Searching citizens with query:", req.query);

    const query = {};

    if (name) query.name = { $regex: name, $options: "i" };
    if (adharCardNumber) query.adharCardNumber = adharCardNumber;
    if (phoneNumber) query.phoneNumber = phoneNumber;
    if (state) query.state = { $regex: state, $options: "i" };

    const citizens = await Citizen.find(query).sort({ createdAt: -1 });

    // Add full image URLs to search results
    const citizensWithImageUrls = citizens.map(citizen => {
      const citizenObj = citizen.toObject();
      if (citizenObj.photo && citizenObj.photo.filename) {
        citizenObj.photo.url = `http://localhost:5000/uploads/${citizenObj.photo.filename}`;
      }
      return citizenObj;
    });

    console.log(`✅ Search found ${citizens.length} citizens`);
    res.status(200).json({
      success: true,
      count: citizens.length,
      data: citizensWithImageUrls
    });
  } catch (error) {
    console.error("❌ Error searching citizens:", error);
    res.status(500).json({
      success: false,
      message: "Error searching citizens",
      error: error.message
    });
  }
};

// Get citizen visit history by Aadhar
const getVisitHistory = async (req, res) => {
  try {
    const { adharCardNumber } = req.params;
    console.log("📊 Fetching visit history for Aadhar:", adharCardNumber);

    if (!adharCardNumber || !/^\d{12}$/.test(adharCardNumber)) {
      return res.status(400).json({
        success: false,
        message: "Valid 12-digit Aadhar card number is required"
      });
    }

    const visits = await Citizen.find({ adharCardNumber })
      .select('name purpose createdAt updatedAt')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${visits.length} visits for Aadhar: ${adharCardNumber}`);
    res.status(200).json({
      success: true,
      count: visits.length,
      adharCardNumber,
      data: visits
    });
  } catch (error) {
    console.error("❌ Error fetching visit history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching visit history",
      error: error.message
    });
  }
};

// Test endpoint to verify file serving
const testFileServing = async (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, "..", "uploads");
    console.log("🔍 Checking uploads directory:", uploadsPath);
    
    // Check if directory exists
    if (!fs.existsSync(uploadsPath)) {
      console.log("❌ Uploads directory not found:", uploadsPath);
      return res.status(404).json({ 
        error: 'Uploads directory not found',
        path: uploadsPath 
      });
    }
    
    const files = fs.readdirSync(uploadsPath);
    
    // Get file details
    const fileDetails = files.map(file => {
      const filePath = path.join(uploadsPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        url: `http://localhost:5000/uploads/${file}`
      };
    });
    
    console.log(`✅ Found ${files.length} files in uploads directory`);
    res.status(200).json({ 
      message: 'Uploads directory contents',
      directory: uploadsPath,
      fileCount: files.length,
      files: fileDetails 
    });
  } catch (error) {
    console.error("❌ Error reading uploads directory:", error);
    res.status(500).json({ 
      error: 'Cannot read uploads directory',
      message: error.message,
      path: path.join(__dirname, "..", "uploads")
    });
  }
};

// Check if a specific file exists
const checkFileExists = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "..", "uploads", filename);
    
    console.log("🔍 Checking file existence:", filename);
    const exists = fs.existsSync(filePath);
    
    console.log(`✅ File ${filename} exists:`, exists);
    res.status(200).json({
      filename,
      exists,
      path: filePath,
      url: `http://localhost:5000/uploads/${filename}`
    });
  } catch (error) {
    console.error("❌ Error checking file:", error);
    res.status(500).json({
      error: 'Error checking file',
      message: error.message
    });
  }
};

module.exports = {
  createCitizen,
  getAllCitizens,
  getCitizenById,
  getCitizensByAadhar,
  updateCitizen,
  deleteCitizen,
  searchCitizens,
  getVisitHistory,
  testFileServing,
  checkFileExists
};