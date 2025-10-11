const InstituteAdmin = require('../../models/InstituteAdmin.js');
const { matchedData } = require('express-validator');

// ✅ Reusable schema validation for academic profiles
const validateProfileDetails = (profileType, details) => {
  switch (profileType) {
    case 'KINDERGARTEN':
      return ['CURRENTLY_IN', 'COMPLETED', 'SEEKING_ADMISSION'].includes(details.status);

    case 'SCHOOL':
    case 'INTERMEDIATE':
    case 'TUITION_CENTER':
      return typeof details.studyingIn === 'string' && typeof details.preferredStream === 'string';

    case 'GRADUATION':
      if (details.graduationType === 'UNDER_GRADUATE' || details.graduationType === 'POST_GRADUATE') {
        return typeof details.studyingIn === 'string' && typeof details.preferredStream === 'string';
      }
      return false;

    case 'COACHING_CENTER':
      return (
        ['UPSKILLING_SKILL_DEVELOPMENT', 'EXAM_PREPARATION', 'VOCATIONAL_TRAINING'].includes(details.lookingFor) &&
        typeof details.academicLevel === 'string' &&
        typeof details.stream === 'string' &&
        typeof details.passoutYear === 'string'
      );

    case 'STUDY_HALLS':
      return true;

    case 'STUDY_ABROAD':
      return (
        typeof details.studyGoals === 'string' &&
        typeof details.budgetPerYear === 'string' &&
        Array.isArray(details.preferredCountries) &&
        ['YES', 'NO', 'APPLIED'].includes(details.passportStatus)
      );

    default:
      return false;
  }
};

// ✅ Create a new Student
const createStudent = async (req, res) => {
  console.log('createStudent called with body:', req.body);
  const { name, email, contactNumber, address, googleId } = matchedData(req);
  console.log('Extracted data:', { name, email, contactNumber, address, googleId });

  try {
    const student = new InstituteAdmin({
      googleId,
      name,
      email,
      contactNumber,
      address,
      role: 'STUDENT',
    });
    console.log('Student object created:', student);

    await student.save();
    console.log('Student saved successfully');
    res.status(201).json({ data: student });
  } catch (error) {
    console.error('Error in createStudent:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

// ✅ Get a Student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await InstituteAdmin.findOne({ _id: req.params.id, role: 'STUDENT' });

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.status(200).json({ data: student });
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

// ✅ Update Student Details
const updateStudentDetails = async (req, res) => {
  const updates = matchedData(req, { locations: ['body'] });

  try {
    const student = await InstituteAdmin.findOneAndUpdate(
      { _id: req.params.id, role: 'STUDENT' },
      { $set: updates },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.status(200).json({ data: student });
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

// ✅ Update Academic Profile
const updateAcademicProfile = async (req, res) => {
  console.log('updateAcademicProfile called with body:', req.body);
  const { profileType, details } = req.body;
  console.log('profileType:', profileType);
  console.log('details:', details);

  if (!validateProfileDetails(profileType, details)) {
    console.log('Validation failed for profileType:', profileType, 'details:', details);
    return res.status(400).json({ error: 'Invalid structure for the provided profile details.' });
  }

  const academicProfile = { profileType, details };

  try {
    const student = await InstituteAdmin.findOneAndUpdate(
      { _id: req.params.id, role: 'STUDENT' },
      { $set: { academicProfile } },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.status(200).json({
      message: 'Academic profile updated successfully.',
      data: student.academicProfile,
    });
  } catch (error) {
    console.error('Error updating academic profile:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};

module.exports = {
  createStudent,
  getStudentById,
  updateStudentDetails,
  updateAcademicProfile,
};
