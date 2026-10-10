const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Helper: Auto-generate next Asset ID ──────────────────────────────────
// Format: AST-LAP-0001, AST-BAG-0002, etc.
const generateAssetId = async (assetType) => {
  const prefix = assetType
    ? `AST-${assetType.slice(0, 3).toUpperCase()}`
    : 'AST-OTH';

  const existing = await prisma.asset.findMany({
    where: { assetId: { startsWith: prefix } },
    select: { assetId: true },
    orderBy: { createdAt: 'desc' },
  });

  let maxNum = 0;
  existing.forEach((a) => {
    const match = a.assetId.match(/-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });

  const nextNum = String(maxNum + 1).padStart(4, '0');
  return `${prefix}-${nextNum}`;
};

// ══════════════════════════════════════════════════════════════════════════
//  ASSET INVENTORY ROUTES
// ══════════════════════════════════════════════════════════════════════════

// GET /api/assets/all — List all assets with assignment count
router.get('/all', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        assignments: {
          where: { status: 'Issued' },
          include: {
            candidate: {
              select: { fullName: true, onboardingId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, assets });
  } catch (err) {
    console.error('GET /assets/all error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch assets' });
  }
});

// GET /api/assets/:id — Single asset details
router.get('/:id', async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        assignments: {
          include: {
            candidate: {
              select: { fullName: true, onboardingId: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, asset });
  } catch (err) {
    console.error('GET /assets/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch asset' });
  }
});

// POST /api/assets/create — Register a new asset
router.post('/create', async (req, res) => {
  try {
    const {
      assetId: providedAssetId,
      assetName,
      assetType,
      assetCategory,
      brand,
      model,
      modelNumber,
      serialNumber,
      processor,
      ram,
      storage,
      assetTag,
      condition,
      purchaseDate,
      warrantyExpiry,
      notes,
    } = req.body;

    if (!assetName || !assetType) {
      return res.status(400).json({ success: false, message: 'Asset name and type are required' });
    }

    const assetId = providedAssetId || await generateAssetId(assetType);

    const asset = await prisma.asset.create({
      data: {
        assetId,
        assetName,
        assetType,
        assetCategory: assetCategory || 'IT Equipment',
        brand: brand || '',
        model: model || '',
        modelNumber: modelNumber || '',
        serialNumber: serialNumber || '',
        processor: processor || '',
        ram: ram || '',
        storage: storage || '',
        assetTag: assetTag || '',
        condition: condition || 'Good',
        status: 'Available',
        purchaseDate: purchaseDate || null,
        warrantyExpiry: warrantyExpiry || null,
        notes: notes || null,
      },
    });

    res.status(201).json({ success: true, message: 'Asset registered successfully', asset });
  } catch (err) {
    console.error('POST /assets/create error:', err);
    res.status(500).json({ success: false, message: 'Failed to create asset' });
  }
});

// PUT /api/assets/:id — Update asset details
router.put('/:id', async (req, res) => {
  try {
    const {
      assetName,
      assetType,
      assetCategory,
      brand,
      model,
      modelNumber,
      serialNumber,
      processor,
      ram,
      storage,
      assetTag,
      condition,
      status,
      purchaseDate,
      warrantyExpiry,
      notes,
    } = req.body;

    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        ...(assetName && { assetName }),
        ...(assetType && { assetType }),
        ...(assetCategory && { assetCategory }),
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(modelNumber !== undefined && { modelNumber }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(processor !== undefined && { processor }),
        ...(ram !== undefined && { ram }),
        ...(storage !== undefined && { storage }),
        ...(assetTag !== undefined && { assetTag }),
        ...(condition && { condition }),
        ...(status && { status }),
        ...(purchaseDate !== undefined && { purchaseDate }),
        ...(warrantyExpiry !== undefined && { warrantyExpiry }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json({ success: true, message: 'Asset updated successfully', asset });
  } catch (err) {
    console.error('PUT /assets/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id — Delete an asset (only if not currently assigned)
router.delete('/:id', async (req, res) => {
  try {
    const activeAssignment = await prisma.assetAssignment.findFirst({
      where: { assetId: req.params.id, status: 'Issued' },
    });

    if (activeAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an asset that is currently assigned. Return it first.',
      });
    }

    await prisma.asset.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (err) {
    console.error('DELETE /assets/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete asset' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  ASSET ASSIGNMENT ROUTES
// ══════════════════════════════════════════════════════════════════════════

// GET /api/assets/assignments/all — All assignments with candidate + asset info
router.get('/assignments/all', async (req, res) => {
  try {
    const assignments = await prisma.assetAssignment.findMany({
      include: {
        asset: {
          select: { assetId: true, assetName: true, assetType: true, serialNumber: true, assetTag: true, condition: true },
        },
        candidate: {
          select: { fullName: true, onboardingId: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, assignments });
  } catch (err) {
    console.error('GET /assignments/all error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
});

// GET /api/assets/candidate/:candidateId — Assets assigned to a specific candidate
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const assignments = await prisma.assetAssignment.findMany({
      where: { candidateId: req.params.candidateId },
      include: {
        asset: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, assignments });
  } catch (err) {
    console.error('GET /candidate/:candidateId error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch candidate assets' });
  }
});

// POST /api/assets/direct-assign — Create and assign multiple assets in one step
router.post('/direct-assign', async (req, res) => {
  try {
    const { candidateId, assignedDate, assignedBy, items } = req.body;
    
    if (!candidateId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const candidate = await prisma.onboardingCandidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const results = [];
    
    for (const item of items) {
      // 1. Generate Asset ID
      const assetId = await generateAssetId(item.assetType);
      
      // 2. Create Asset
      const asset = await prisma.asset.create({
        data: {
          assetId: item.assetId || assetId, // use provided assetId or generated
          assetName: item.assetName || `${item.assetType} - ${item.model || 'Standard'}`,
          assetType: item.assetType,
          assetCategory: item.assetCategory || 'IT Equipment',
          brand: item.brand || '',
          model: item.model || '',
          modelNumber: item.modelNumber || '',
          serialNumber: item.serialNumber || '',
          processor: item.processor || '',
          ram: item.ram || '',
          storage: item.storage || '',
          assetTag: item.assetTag || '',
          condition: item.condition || 'Good',
          status: 'Assigned',
          purchaseDate: item.purchaseDate || null,
          warrantyExpiry: item.warrantyExpiry || null,
          notes: item.notes || '',
        }
      });
      
      // 3. Create Assignment
      const assignment = await prisma.assetAssignment.create({
        data: {
          assetId: asset.id,
          candidateId,
          assignedDate: assignedDate || new Date().toISOString().split('T')[0],
          assignedBy: assignedBy || 'Admin',
          remarks: item.remarks || null,
          status: 'Issued',
        }
      });
      
      results.push(assignment);
    }

    res.status(201).json({ success: true, message: 'Assets directly assigned successfully', count: results.length });
  } catch (err) {
    console.error('POST /assets/direct-assign error:', err);
    res.status(500).json({ success: false, message: 'Failed to direct-assign assets' });
  }
});

// POST /api/assets/assign — Assign an asset to a candidate
router.post('/assign', async (req, res) => {
  try {
    const { assetId, candidateId, assignedDate, assignedBy, remarks } = req.body;

    if (!assetId || !candidateId || !assignedDate) {
      return res.status(400).json({
        success: false,
        message: 'assetId, candidateId, and assignedDate are required',
      });
    }

    // Check asset exists and is available
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    if (asset.status === 'Assigned') {
      return res.status(400).json({
        success: false,
        message: `This asset is already assigned to someone. Return it first.`,
      });
    }

    // Check candidate exists
    const candidate = await prisma.onboardingCandidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    // Create assignment + update asset status
    const [assignment] = await prisma.$transaction([
      prisma.assetAssignment.create({
        data: {
          assetId,
          candidateId,
          assignedDate,
          assignedBy: assignedBy || 'Admin',
          remarks: remarks || null,
          status: 'Issued',
        },
        include: {
          asset: { select: { assetName: true, assetId: true } },
          candidate: { select: { fullName: true, onboardingId: true } },
        },
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: { status: 'Assigned' },
      }),
    ]);

    res.status(201).json({ success: true, message: 'Asset assigned successfully', assignment });
  } catch (err) {
    console.error('POST /assets/assign error:', err);
    res.status(500).json({ success: false, message: 'Failed to assign asset' });
  }
});

// PUT /api/assets/assignment/:id/return — Mark an assignment as returned
router.put('/assignment/:id/return', async (req, res) => {
  try {
    const { returnDate } = req.body;
    const today = returnDate || new Date().toISOString().split('T')[0];

    const existing = await prisma.assetAssignment.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (existing.status === 'Returned') {
      return res.status(400).json({ success: false, message: 'Asset already returned' });
    }

    const [assignment] = await prisma.$transaction([
      prisma.assetAssignment.update({
        where: { id: req.params.id },
        data: { status: 'Returned', returnDate: today },
      }),
      prisma.asset.update({
        where: { id: existing.assetId },
        data: { status: 'Available' },
      }),
    ]);

    res.json({ success: true, message: 'Asset marked as returned', assignment });
  } catch (err) {
    console.error('PUT /assignment/:id/return error:', err);
    res.status(500).json({ success: false, message: 'Failed to update return status' });
  }
});

// DELETE /api/assets/assignment/:id — Remove an assignment record
router.delete('/assignment/:id', async (req, res) => {
  try {
    const existing = await prisma.assetAssignment.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Assignment not found' });

    await prisma.$transaction([
      prisma.assetAssignment.delete({ where: { id: req.params.id } }),
      // If it was Issued, free the asset back to Available
      ...(existing.status === 'Issued'
        ? [prisma.asset.update({ where: { id: existing.assetId }, data: { status: 'Available' } })]
        : []),
    ]);

    res.json({ success: true, message: 'Assignment removed successfully' });
  } catch (err) {
    console.error('DELETE /assignment/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove assignment' });
  }
});

module.exports = router;
