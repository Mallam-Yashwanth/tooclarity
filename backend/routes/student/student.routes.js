const { Router } = require('express');
const { body, param } = require('express-validator');
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
    body('fullName').isString().notEmpty().trim(),
    body('birthday').isISO8601().toDate(),
    body('location').isString().notEmpty().trim(),
  ],
  createStudent
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid student ID.')],
  getStudentById
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid student ID.'),
    body('fullName').optional().isString().trim(),
    body('birthday').optional().isISO8601().toDate(),
    body('location').optional().isString().trim(),
  ],
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
      'COACHING_CENTERS',
      'STUDY_HALLS',
      'TUITION_CENTER',
      'STUDY_ABROAD',
    ]),
    body('details').isObject(),
  ],
  updateAcademicProfile
); 

module.exports = router;