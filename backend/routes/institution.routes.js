const express = require('express');
const institutionController = require('../controllers/institution.controller');
const { validateL1Creation, validateL2Update } = require('../middleware/validators')
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// CREATE (L1)
router.post('/', validateL1Creation, institutionController.createL1Institution);

// UPDATE (L2)
router.put(
    '/details',
    validateL2Update,
    institutionController.updateL2InstitutionDetails
);

// READ & DELETE
router.route('/me')
    .get( institutionController.getMyInstitution)
    .delete( institutionController.deleteMyInstitution);

router.post('/upload',
    upload.single("file"),
    institutionController.uploadFileData
);



module.exports = router;