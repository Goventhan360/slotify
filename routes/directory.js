const express = require('express');
const router = express.Router();
const { getProviders, getPatients, getPublicProviders } = require('../controllers/directoryController');
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// GET /api/directory/public — public list of providers (no auth)
router.get('/public', getPublicProviders);

// GET /api/directory/providers — any authenticated user can see providers
router.get('/providers', authenticate, getProviders);

// GET /api/directory/patients — only providers can see patient list
router.get('/patients', authenticate, roleCheck('provider'), getPatients);

module.exports = router;
