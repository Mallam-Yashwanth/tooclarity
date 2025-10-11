const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    // Unified model type and hierarchy
    type: { type: String, enum: ["PROGRAM","COURSE"], required: true, index: true },
    parentProgram: { type: mongoose.Schema.Types.ObjectId, ref: "Course", index: true },
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
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
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
    imageUrl: {
      type: String, // file path / URL
    },
    brochureUrl: {
      type: String, // file path / URL
    },

    // Additional fields for Under Graduate / Post Graduate
    graduationType: { type: String },
    streamType: { type: String },
    selectBranch: { type: String },
    eligibilityCriteria: { type: String },
    aboutBranch: { type: String },
    educationType: { type: String },
    classSize: { type: String },

    // Additional fields for Coaching Centers
    categoriesType: { type: String },
    domainType: { type: String },

    // Additional fields for Study Hall
    // --- ✅ UPDATED Study Hall Section ---
    hallName: { type: String, trim: true },
    seatingOption: { type: String },
    openingTime: { type: String },
    closingTime: { type: String },
    operationalDays: [{ type: String }],
    totalSeats: { type: String },
    availableSeats: { type: String },
    pricePerSeat: { type: String },
    hasWifi: { type: String, enum: ["Yes", "No"] },
    hasChargingPoints: { type: String, enum: ["Yes", "No"] },
    hasAC: { type: String, enum: ["Yes", "No"] },
    hasPersonalLocker: { type: String, enum: ["Yes", "No"] },
    // Additional fields for Tuition Centers
    tuitionType: { type: String },
    instructorProfile: { type: String },
    subject: { type: String },

    // Reference to Institution
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true, // keep required since course must belong to an institution
      index: true,
    },

    // Note: program reference removed; use parentProgram pointing to a Course with type='PROGRAM'

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
      index: true,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
