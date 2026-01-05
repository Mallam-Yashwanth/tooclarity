// const mongoose = require("mongoose");
// const { Client } = require('@elastic/elasticsearch');
// const esClient = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });

// const courseSchema = new mongoose.Schema(
//   {
//     parentProgram: { type: mongoose.Schema.Types.ObjectId, ref: "Course", index: true },
//     courseName: {
//       type: String,
//       trim: true,
//       maxlength: 150,
//     },
//     aboutCourse: {
//       type: String,
//       trim: true,
//       maxlength: 2000,
//     },
//     courseDuration: {
//       type: String,
//       trim: true,
//       maxlength: 50,
//     },
//     startDate: {
//       type: Date,
//     },
//     endDate: {
//       type: Date,
//     },
//     mode: {
//       type: String,
//       enum: ["Offline", "Online", "Hybrid"],
//     },
//     priceOfCourse: {
//       type: Number,
//       min: 0,
//     },
//     location: {
//       type: String,
//       trim: true,
//       maxlength: 10000,
//     },
//     state: {
//       type: String,
//       trim: true,
//       maxlength: 100,
//     },
//     district: {
//       type: String,
//       trim: true,
//       maxlength: 100,
//     },
//     imageUrl: {
//       type: String, // file path / URL
//     },
//     brochureUrl: {
//       type: String, // file path / URL
//     },

    // status:{
    //   type: String,
    //   enum:['Active','Inactive'],
    //   default:'Inactive'
    // },

//     courseSubscriptionStartDate:{type:Date},
//     courseSubscriptionEndDate:{type:Date},

//     // Additional fields for Under Graduate / Post Graduate
//     graduationType: { type: String },
//     streamType: { type: String },
//     selectBranch: { type: String },
//     eligibilityCriteria: { type: String },
//     aboutBranch: { type: String },
//     educationType: { type: String },
//     classSize: { type: String },

//     // Additional fields for Coaching Centers
//     categoriesType: { type: String },
//     domainType: { type: String },
//     courseHighlights: { type: String },
//     subDomainType: { type: String },

//     // Additional fields for Study Hall
//     // --- ✅ UPDATED Study Hall Section ---
//     hallName: { type: String, trim: true },
//     seatingOption: { type: String },
//     openingTime: { type: String },
//     closingTime: { type: String },
//     operationalDays: [{ type: String }],
//     totalSeats: { type: String },
//     availableSeats: { type: String },
//     pricePerSeat: { type: String },
//     hasWifi: { type: String, enum: ["Yes", "No"] },
//     hasChargingPoints: { type: String, enum: ["Yes", "No"] },
//     hasAC: { type: String, enum: ["Yes", "No"] },
//     hasPersonalLocker: { type: String, enum: ["Yes", "No"] },
//     // Additional fields for Tuition Centers
//     tuitionType: { type: String },
//     instructorProfile: { type: String },
//     subject: { type: String },

//     // Reference to Institution
//     institution: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Institution",
//       required: true, // keep required since course must belong to an institution
//       index: true,
//     },

//     // Note: program reference removed; use parentProgram pointing to a Course with type='PROGRAM'

//     branch: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Branch",
//       required: false,
//       index: true,
//     },
//   },
//   { timestamps: true }
// );

// const Course = mongoose.model("Course", courseSchema);


// // --- POST SAVE ---
// courseSchema.post('save', async function (doc) {
//   try {
//     if (doc.status === 'Active') {
//       await esClient.index({
//         index: 'courses_index',
//         id: doc._id.toString(),
//         document: {
//           id: doc._id.toString(),
//           courseName: doc.courseName || null,
//           selectBranch: doc.selectBranch || null,
//         },
//       });
//       console.log(`✅ Indexed new course ${doc._id} to Elasticsearch`);
//     } else {
//       // Remove if not active
//       await esClient.delete({
//         index: 'courses_index',
//         id: doc._id.toString(),
//       }).catch(() => {});
//       console.log(`🗑️ Removed inactive course ${doc._id} from Elasticsearch`);
//     }
//   } catch (err) {
//     console.error('❌ Error syncing course to Elasticsearch (save):', err.message);
//   }
// });

// // --- POST UPDATE ---
// courseSchema.post('findOneAndUpdate', async function (doc) {
//   try {
//     if (!doc) return;
//     if (doc.status === 'Active') {
//       await esClient.index({
//         index: 'courses_index',
//         id: doc._id.toString(),
//         document: {
//           id: doc._id.toString(),
//           courseName: doc.courseName || null,
//           selectBranch: doc.selectBranch || null,
//         },
//       });
//       console.log(`🔁 Updated course ${doc._id} in Elasticsearch`);
//     } else {
//       await esClient.delete({
//         index: 'courses_index',
//         id: doc._id.toString(),
//       }).catch(() => {});
//       console.log(`🗑️ Removed inactive course ${doc._id} from Elasticsearch`);
//     }
//   } catch (err) {
//     console.error('❌ Error syncing course to Elasticsearch (update):', err.message);
//   }
// });

// // --- POST DELETE ---
// courseSchema.post('findOneAndDelete', async function (doc) {
//   try {
//     if (doc) {
//       await esClient.delete({
//         index: 'courses_index',
//         id: doc._id.toString(),
//       });
//       console.log(`🗑️ Deleted course ${doc._id} from Elasticsearch`);
//     }
//   } catch (err) {
//     console.error('❌ Error syncing course to Elasticsearch (delete):', err.message);
//   }
// });

// module.exports = Course;



const mongoose = require("mongoose");

const options = {
  discriminatorKey: "courseType", // 🔑 VERY IMPORTANT
  timestamps: true,
};

/* -----------------------------------------------------
   BASE COURSE SCHEMA
----------------------------------------------------- */
const BaseCourseSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },

    courseName: {
      type: String,
      required: true,
    },

    aboutCourse: String,
    courseDuration: String,
    mode: String,
    priceOfCourse: String,

    locationURL: String,
    state: String,
    district: String,
    town: String,

    startDate: String,
    endDate: String,

    imageUrl: String,
    brochureUrl: String,
    centerImageUrl: String,
    tuitionImageUrl: String,
    kindergartenImageUrl: String,
    schoolImageUrl: String,
    intermediateImageUrl: String,

    eligibilityCriteria: String,

    academicDetails: [{ type: Object }],
    facultyDetails: [{ type: Object }],

    year: String,
    studyMaterial: String,
  },
  options
);

/* -----------------------------------------------------
   BASE MODEL
----------------------------------------------------- */
const Course = mongoose.model("Course", BaseCourseSchema);

/* -----------------------------------------------------
   UG / PG DISCRIMINATOR
----------------------------------------------------- */
const UgPgCourseSchema = new mongoose.Schema({
  graduationType: String,
  streamType: String,
  educationType: String,

  collegeType: String,
  collegeCategory: String,
  affiliationType: String,
  ownershipType: String,

  placementDrives: String,
  mockInterviews: String,
  resumeBuilding: String,
  linkedinOptimization: String,

  highestPackage: String,
  averagePackage: String,
});

Course.discriminator("UG_PG", UgPgCourseSchema);

/* -----------------------------------------------------
   SCHOOL / KINDERGARTEN DISCRIMINATOR
----------------------------------------------------- */
const SchoolCourseSchema = new mongoose.Schema({
  schoolType: String,
  curriculumType: String,
  schoolCategory: String,

  hostelFacility: String,
  playground: String,
  busService: String,

  extendedCare: String,
  mealsProvided: String,
  outdoorPlayArea: String,

  classType: String,
});

Course.discriminator("SCHOOL", SchoolCourseSchema);

/* -----------------------------------------------------
   COACHING CENTER DISCRIMINATOR
----------------------------------------------------- */
const CoachingCourseSchema = new mongoose.Schema({
  categoriesType: String,
  domainType: String,
  subDomainType: String,
  courseHighlights: String,

  mockTests: String,
  certification: String,
});

Course.discriminator("COACHING", CoachingCourseSchema);

/* -----------------------------------------------------
   STUDY HALL DISCRIMINATOR
----------------------------------------------------- */
const StudyHallCourseSchema = new mongoose.Schema({
  seatingOption: String,
  openingTime: String,
  closingTime: String,
  openingTimePeriod: String,
  closingTimePeriod: String,

  operationalDays: [String],

  totalSeats: String,
  availableSeats: String,
  pricePerSeat: String,

  hasWifi: String,
  hasChargingPoints: String,
  hasAC: String,
  hasPersonalLocker: String,
});

Course.discriminator("STUDY_HALL", StudyHallCourseSchema);

/* -----------------------------------------------------
   TUITION CENTER DISCRIMINATOR
----------------------------------------------------- */
const TuitionCourseSchema = new mongoose.Schema({
  tuitionType: String,
  instructorProfile: String,
  subject: String,
  monthlyFees: String,
  classTiming: String,
});

Course.discriminator("TUITION", TuitionCourseSchema);

/* -----------------------------------------------------
   EXPORTS
----------------------------------------------------- */
module.exports = {
  Course,
  BaseCourseSchema,
};
