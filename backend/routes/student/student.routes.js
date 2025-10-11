const { Router } = require('express');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validators');
const {
  createStudent,
  getStudentById,
  updateStudentDetails,
  updateAcademicProfile,
} = require('../../controllers/student/student.controller');

const router = Router();

router.post(
  '/',
  [
    body('name').isString().notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('contactNumber').optional().isString().trim(),
    body('address').optional().isString().trim(),
    body('googleId').optional().isString().trim(),
  ],
  handleValidationErrors,
  createStudent
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid student ID.')],
  handleValidationErrors,
  getStudentById
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid student ID.'),
    body('name').optional().isString().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('contactNumber').optional().isString().trim(),
    body('address').optional().isString().trim(),
  ],
  handleValidationErrors,
  updateStudentDetails
);

router.put(
  '/:id/academic-profile',
  [
    param('id').isMongoId().withMessage('Invalid student ID.'),
    body('profileType').isIn([
      'KINDERGARTEN',
      'SCHOOL',
      'INTERMEDIATE',
      'GRADUATION',
      'COACHING_CENTER',
      'STUDY_HALLS',
      'TUITION_CENTER',
      'STUDY_ABROAD',
    ]),
    body('details').isObject(),
  ],
  handleValidationErrors,
  updateAcademicProfile
); 

module.exports = router;