const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');

// Persistent JSON file fallback path
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const fallbackFile = path.join(dataDir, 'company_documents.json');

const readFallbackDocs = () => {
  try {
    if (fs.existsSync(fallbackFile)) {
      const content = fs.readFileSync(fallbackFile, 'utf8');
      return JSON.parse(content || '{}');
    }
  } catch (err) {
    console.warn('Fallback read warning:', err.message);
  }
  return {};
};

const writeFallbackDoc = (category, doc) => {
  try {
    const existing = readFallbackDocs();
    existing[category] = doc;
    fs.writeFileSync(fallbackFile, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    console.error('Fallback write error:', err.message);
  }
};

const deleteFallbackDoc = (category) => {
  try {
    const existing = readFallbackDocs();
    delete existing[category];
    fs.writeFileSync(fallbackFile, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    console.error('Fallback delete error:', err.message);
  }
};

const defaultTitles = {
  LEAVE_POLICY: 'Official Company Leave Policy',
  HOLIDAY_CALENDAR: 'Annual Holiday Calendar 2026',
  UAN_ACTIVATION: 'EPFO UAN Activation Guide & Declaration',
};

// 1. Get All Company Policies & Compliance Documents (for Candidates & Admin)
router.get('/all', async (req, res) => {
  let docsMap = {
    LEAVE_POLICY: null,
    HOLIDAY_CALENDAR: null,
    UAN_ACTIVATION: null,
  };

  try {
    const documents = await prisma.companyDocument.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    documents.forEach((d) => {
      if (d.category) {
        docsMap[d.category] = d;
      }
    });

    return res.status(200).json({
      success: true,
      data: docsMap,
      list: documents,
    });
  } catch (dbErr) {
    console.warn('Prisma query failed, serving from persistent file storage:', dbErr.message);
    const fallback = readFallbackDocs();
    docsMap = {
      LEAVE_POLICY: fallback.LEAVE_POLICY || null,
      HOLIDAY_CALENDAR: fallback.HOLIDAY_CALENDAR || null,
      UAN_ACTIVATION: fallback.UAN_ACTIVATION || null,
    };

    return res.status(200).json({
      success: true,
      data: docsMap,
      list: Object.values(fallback),
    });
  }
});

// 2. Upload / Replace Company Document (Actual PDF File Upload via Base64)
router.post('/upload', async (req, res) => {
  try {
    const { category, title, description, fileName, fileSize, fileBase64, uploadedBy } = req.body;

    if (!category || !fileName || !fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'category, fileName, and fileBase64 are required.',
      });
    }

    const validCategories = ['LEAVE_POLICY', 'HOLIDAY_CALENDAR', 'UAN_ACTIVATION'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    const docPayload = {
      id: `${category.toLowerCase()}_${Date.now()}`,
      category,
      title: title || defaultTitles[category],
      description: description || '',
      fileName,
      fileSize: fileSize || '1.0 MB',
      fileBase64,
      fileUrl: '',
      uploadedBy: uploadedBy || 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Always update fallback file for double safety
    writeFallbackDoc(category, docPayload);

    // Also attempt DB upsert
    try {
      const updatedDoc = await prisma.companyDocument.upsert({
        where: { category },
        update: {
          title: docPayload.title,
          description: docPayload.description,
          fileName,
          fileSize: docPayload.fileSize,
          fileBase64,
          uploadedBy: docPayload.uploadedBy,
          updatedAt: new Date(),
        },
        create: {
          category,
          title: docPayload.title,
          description: docPayload.description,
          fileName,
          fileSize: docPayload.fileSize,
          fileBase64,
          uploadedBy: docPayload.uploadedBy,
        },
      });

      return res.status(200).json({
        success: true,
        message: `${updatedDoc.title} uploaded successfully!`,
        data: updatedDoc,
      });
    } catch (dbErr) {
      console.warn('Prisma DB upsert failed, stored in file storage:', dbErr.message);
      return res.status(200).json({
        success: true,
        message: `${docPayload.title} uploaded successfully!`,
        data: docPayload,
      });
    }
  } catch (error) {
    console.error('Error uploading company document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload document.',
    });
  }
});

// 3. Delete / Remove a Company Document
router.delete('/:category', async (req, res) => {
  try {
    const { category } = req.params;

    deleteFallbackDoc(category);

    try {
      await prisma.companyDocument.delete({
        where: { category },
      });
    } catch (dbErr) {
      console.warn('Prisma delete notice:', dbErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting company document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete document.',
    });
  }
});

module.exports = router;
