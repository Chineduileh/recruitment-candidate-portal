const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  applyToJob,
  getMyApplications,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');

// All application routes require login
router.post('/', protect, applyToJob);
router.get('/mine', protect, getMyApplications);
router.put('/:id', protect, updateApplication);
router.delete('/:id', protect, deleteApplication);

module.exports = router;