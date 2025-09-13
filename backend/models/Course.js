const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    // Common Fields
    courseName: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    aboutCourse: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    courseDuration: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    mode: {
      type: String,
      enum: ["Offline", "Online", "Hybrid"],
    },
    priceOfCourse: {
      type: Number,
      min: 0,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    image: {
      type: String, // file path / URL
    },
    brochure: {
      type: String, // file path / URL
    },

    // Additional fields for Under Graduate / Post Graduate
    graduationType: { type: String },
    streamType: { type: String },
    selectBranch: { type: String },
    aboutBranch: { type: String },
    educationType: { type: String },
    classSize: { type: String },

    // Additional fields for Coaching Centers
    categoriesType: { type: String },
    domainType: { type: String },

    // Additional fields for Study Hall
    seatingOption: { type: String },
    openingTime: { type: String },
    closingTime: { type: String },
    operationalDays: [{ type: String }],
    totalSeats: { type: String },
    availableSeats: { type: String },
    pricePerSeat: { type: String },
    hasWifi: { type: Boolean },
    hasChargingPoints: { type: Boolean },
    hasAC: { type: Boolean },
    hasPersonalLocker: { type: Boolean },

    // Additional fields for Tuition Centers
    tuitionType: { type: String },
    instructorProfile: { type: String },
    subject: { type: String },

    // Relation
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true, // keep required since course must belong to an institution
      index: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
      index: true,
    }
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
