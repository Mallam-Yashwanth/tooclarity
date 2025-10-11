const Course = require("../models/Course");
const { Institution } = require("../models/Institution");
const InstituteAdminModel = require("../models/InstituteAdmin");
const AppError = require("../utils/appError");
const asyncHandler = require("express-async-handler");
const { uploadStream } = require("../services/upload.service");

// Generic helpers
async function incrementMetricGeneric(req, res, next, cfg) {
  const { institutionId, courseId } = req.params;
  const { metricField, rollupField, updatedEvent, institutionAdminTotalEvent } = cfg;

  const incUpdate = {}; incUpdate[metricField] = 1;
  const course = await Course.findOneAndUpdate(
    { _id: courseId, institution: institutionId },
    { $inc: incUpdate },
    { new: true }
  );
  if (!course) return next(new AppError("Course not found", 404));

  // rollup upsert for today
  try {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const dayKey = `${yyyy}-${mm}-${dd}`;

    const incPath = `${rollupField}.$.count`;
    const queryHas = { _id: courseId }; queryHas[`${rollupField}.day`] = dayKey;
    const queryPush = { _id: courseId }; queryPush[`${rollupField}.day`] = { $ne: dayKey };

    await Course.updateOne(queryHas, { $inc: { [incPath]: 1 } });
    await Course.updateOne(queryPush, { $push: { [rollupField]: { day: dayKey, count: 1 } } });
  } catch (err) {
    console.error('CourseController: rollup update failed', err?.message || err);
  }

  // Emit socket events with fresh institutionAdmin total
  try {
    const io = req.app.get("io");
    if (io) {
      const payload = { institutionId, courseId };
      payload[metricField] = course[metricField];
      io.to(`institution:${institutionId}`).emit(updatedEvent, payload);

      const inst = await Institution.findById(institutionId).select("institutionAdmin");
              if (inst?.institutionAdmin) {
          const adminId = String(inst.institutionAdmin);
          io.to(`institutionAdmin:${adminId}`).emit(updatedEvent, payload);
          const institutions = await Institution.find({ institutionAdmin: adminId }).select('_id');
        const ids = institutions.map(i => i._id);
        if (ids.length > 0) {
          const groupField = {}; groupField[`total`] = { $sum: { $ifNull: [ `$${metricField}`, 0 ] } };
          const agg = await Course.aggregate([
            { $match: { institution: { $in: ids } } },
            { $group: Object.assign({ _id: null }, groupField) }
          ]);
          const total = (agg[0]?.total) || 0;
          const totalPayload = metricField === 'courseViews' ? { totalViews: total } : 
                              metricField === 'comparisons' ? { totalComparisons: total } : 
                              { totalLeads: total };
          io.to(`institutionAdmin:${adminId}`).emit(institutionAdminTotalEvent, totalPayload);
        }
      }
    }
  } catch (err) {
    console.error('CourseController: socket emit/institutionAdmin total failed', err?.message || err);
  }

  return res.status(200).json({ success: true, data: { courseId, [metricField]: course[metricField] } });
}

async function institutionAdminTotalGeneric(userId, metricField) {
  const institutions = await Institution.find({ institutionAdmin: userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) return 0;
  const agg = await Course.aggregate([
    { $match: { institution: { $in: ids } } },
    { $group: { _id: null, total: { $sum: { $ifNull: [ `$${metricField}`, 0 ] } } } }
  ]);
  return agg[0]?.total || 0;
}

// student-based leads helpers
async function institutionAdminLeadsRangeCurrent(userId, range) {
  const institutions = await Institution.find({ institutionAdmin: userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) return 0;
  const now = new Date();
  let startDate, endDate;
  if (range === 'weekly') {
    startDate = new Date(now); startDate.setUTCDate(startDate.getUTCDate() - 6); endDate = new Date(now);
  } else if (range === 'monthly') {
    startDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1); endDate = new Date(now);
  } else if (range === 'yearly') {
    startDate = new Date(now.getUTCFullYear(), 0, 1); endDate = new Date(now);
  } else { return 0; }
  return InstituteAdminModel.countDocuments({ institution: { $in: ids }, role: 'STUDENT', createdAt: { $gte: startDate, $lte: endDate } });
}

async function institutionAdminLeadsRangePrevious(userId, range) {
  const institutions = await Institution.find({ institutionAdmin: userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) return 0;
  const now = new Date();
  let startDate, endDate;
  if (range === 'weekly') {
    endDate = new Date(now); endDate.setUTCDate(endDate.getUTCDate() - 7); startDate = new Date(endDate); startDate.setUTCDate(startDate.getUTCDate() - 6);
  } else if (range === 'monthly') {
    startDate = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1); endDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  } else if (range === 'yearly') {
    startDate = new Date(now.getUTCFullYear() - 1, 0, 1); endDate = new Date(now.getUTCFullYear(), 0, 1);
  } else { return 0; }
  return InstituteAdminModel.countDocuments({ institution: { $in: ids }, role: 'STUDENT', createdAt: { $gte: startDate, $lt: endDate } });
}

// Fixed range calculation function with proper date handling
async function institutionAdminRangeGeneric(userId, rollupField, range) {
  const institutions = await Institution.find({ institutionAdmin: userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) return 0;
  
  const now = new Date();
  let startDate, endDate;
  
  if (range === 'weekly') {
    // Last 7 days (including today)
    startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() - 6);
    endDate = new Date(now);
  } else if (range === 'monthly') {
    // Current month (from 1st to today)
    startDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
    endDate = new Date(now);
  } else if (range === 'yearly') {
    // Current year (from Jan 1st to today)
    startDate = new Date(now.getUTCFullYear(), 0, 1);
    endDate = new Date(now);
  } else {
    return 0;
  }
  
  // Format dates for comparison (YYYY-MM-DD format)
  const startKey = startDate.toISOString().split('T')[0];
  const endKey = endDate.toISOString().split('T')[0];

  const agg = await Course.aggregate([
    { $match: { institution: { $in: ids } } },
    { $unwind: { path: `$${rollupField}`, preserveNullAndEmptyArrays: false } },
    { $match: { 
      [`${rollupField}.day`]: { 
        $gte: startKey, 
        $lte: endKey 
      } 
    }},
    { $group: { _id: null, total: { $sum: `$${rollupField}.count` } } }
  ]);
  
  return agg[0]?.total || 0;
}

// Fixed previous range calculation function with proper date handling
async function institutionAdminPreviousRangeGeneric(userId, rollupField, range) {
  const institutions = await Institution.find({ institutionAdmin: userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) return 0;
  
  const now = new Date();
  let startDate, endDate;
  
  if (range === 'weekly') {
    // Previous week (7 days before current week)
    endDate = new Date(now);
    endDate.setUTCDate(endDate.getUTCDate() - 7);
    startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 6);
  } else if (range === 'monthly') {
    // Previous month
    startDate = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
    endDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  } else if (range === 'yearly') {
    // Previous year
    startDate = new Date(now.getUTCFullYear() - 1, 0, 1);
    endDate = new Date(now.getUTCFullYear(), 0, 1);
  } else {
    return 0;
  }
  
  // Format dates for comparison (YYYY-MM-DD format)
  const startKey = startDate.toISOString().split('T')[0];
  const endKey = endDate.toISOString().split('T')[0];

  const agg = await Course.aggregate([
    { $match: { institution: { $in: ids } } },
    { $unwind: { path: `$${rollupField}`, preserveNullAndEmptyArrays: false } },
    { $match: { 
      [`${rollupField}.day`]: { 
        $gte: startKey, 
        $lt: endKey 
      } 
    }},
    { $group: { _id: null, total: { $sum: `$${rollupField}.count` } } }
  ]);
  
  return agg[0]?.total || 0;
}

const checkOwnership = async (institutionId, userId) => {
  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new AppError("No institution found with that ID", 404);
  }
  if (institution.institutionAdmin.toString() !== userId) {
    throw new AppError(
      "You are not authorized to perform this action for this institution",
      403
    );
  }
  return institution;
};

exports.createCourse = asyncHandler(async (req, res, next) => {
  const { institutionId } = req.params;

  // Ensure the user owns the institution
  await checkOwnership(institutionId, req.userId);

  const { courses, totalCourses } = req.body;

  if (!totalCourses || !Array.isArray(courses) || courses.length < 1) {
    return next(new AppError("No courses provided", 400));
  }

  // Add institutionId and defaults to each course object
  const coursesToInsert = courses.map((course) => ({
    ...course,
    institution: institutionId,
    image: course.image || "",
    brochure: course.brochure || "",
  }));

  // Insert all courses at once
  const createdCourses = await Course.insertMany(coursesToInsert);

  res.status(201).json({
    success: true,
    count: createdCourses.length,
    data: createdCourses,
  });
});

exports.getAllCoursesForInstitution = asyncHandler(async (req, res, next) => {
  const { institutionId } = req.params;

  await checkOwnership(institutionId, req.userId);

  const q = { institution: institutionId };
  if (req.query.type) {
    q.type = req.query.type; // optional filter by type: 'PROGRAM' | 'COURSE'
  }
  const courses = await Course.find(q);

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

exports.getCourseById = asyncHandler(async (req, res, next) => {
  const { institutionId, courseId } = req.params;
  await checkOwnership(institutionId, req.userId);

  const course = await Course.findById(courseId);

  if (!course || course.institution.toString() !== institutionId) {
    return next(
      new AppError(
        "Course not found or does not belong to this institution",
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

exports.updateCourse = asyncHandler(async (req, res, next) => {
  const { institutionId, courseId } = req.params;
  await checkOwnership(institutionId, req.userId);

  let course = await Course.findById(courseId);
  if (!course || course.institution.toString() !== institutionId) {
    return next(
      new AppError(
        "Course not found or does not belong to this institution",
        404
      )
    );
  }

  const updateData = { ...req.body };
  const folderPath = `tco_clarity/courses/${institutionId}`;

  if (req.files) {
    const uploadPromises = [];
    if (req.files.image) {
      uploadPromises.push(
        uploadStream(req.files.image[0].buffer, {
          folder: `${folderPath}/images`,
          resource_type: "image",
        }).then((result) => (updateData.image = result.secure_url))
      );
    }
    if (req.files.brochure) {
      uploadPromises.push(
        uploadStream(req.files.brochure[0].buffer, {
          folder: `${folderPath}/brochures`,
          resource_type: "auto",
        }).then((result) => (updateData.brochure = result.secure_url))
      );
    }
    await Promise.all(uploadPromises);
  }

  const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: updatedCourse,
  });
});

exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const { institutionId, courseId } = req.params;

  await checkOwnership(institutionId, req.userId);

  const course = await Course.findById(courseId);
  if (!course || course.institution.toString() !== institutionId) {
    return next(
      new AppError(
        "Course not found or does not belong to this institution",
        404
      )
    );
  }

  await Course.deleteOne({ _id: courseId });

  res.status(204).json({
    success: true,
    data: {},
  });
});

// Unified metric increment: /:courseId/metrics?metric=views|comparisons|leads
exports.incrementMetricUnified = asyncHandler(async (req, res, next) => {
  const raw = (req.query.metric || req.body.metric || '').toString().toLowerCase();
  const isViews = raw === 'views' || raw === 'courseviews';
  const isComparisons = raw === 'comparisons' || raw === 'comparison';
  const isLeads = raw === 'leads' || raw === 'leadsgenerated';
  
  if (!isViews && !isComparisons && !isLeads) {
    return next(new AppError('Invalid metric. Use metric=views|comparisons|leads', 400));
  }
  
  const cfg = isViews
    ? { metricField: 'courseViews', rollupField: 'viewsRollups', updatedEvent: 'courseViewsUpdated', institutionAdminTotalEvent: 'institutionAdminTotalViews' }
    : isComparisons
    ? { metricField: 'comparisons', rollupField: 'comparisonRollups', updatedEvent: 'comparisonsUpdated', institutionAdminTotalEvent: 'institutionAdminTotalComparisons' }
    : { metricField: 'leadsGenerated', rollupField: 'leadsRollups', updatedEvent: 'leadsUpdated', institutionAdminTotalEvent: 'institutionAdminTotalLeads' };
    
  return incrementMetricGeneric(req, res, next, cfg);
});

// ----- Helpers: periods -----
function getCurrentPeriod(range) {
  const now = new Date();
  let startDate, endDate;
  if (range === 'weekly') {
    startDate = new Date(now); startDate.setUTCDate(startDate.getUTCDate() - 6); endDate = new Date(now);
  } else if (range === 'monthly') {
    startDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1); endDate = new Date(now);
  } else if (range === 'yearly') {
    startDate = new Date(now.getUTCFullYear(), 0, 1); endDate = new Date(now);
  } else {
    startDate = new Date(now); startDate.setUTCDate(startDate.getUTCDate() - 6); endDate = new Date(now);
  }
  return { startDate, endDate };
}

function getPreviousPeriod(range) {
  const now = new Date();
  let startDate, endDate;
  if (range === 'weekly') {
    endDate = new Date(now); endDate.setUTCDate(endDate.getUTCDate() - 7);
    startDate = new Date(endDate); startDate.setUTCDate(startDate.getUTCDate() - 6);
  } else if (range === 'monthly') {
    startDate = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
    endDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  } else if (range === 'yearly') {
    startDate = new Date(now.getUTCFullYear() - 1, 0, 1);
    endDate = new Date(now.getUTCFullYear(), 0, 1);
  } else {
    endDate = new Date(now); endDate.setUTCDate(endDate.getUTCDate() - 7);
    startDate = new Date(endDate); startDate.setUTCDate(startDate.getUTCDate() - 6);
  }
  return { startDate, endDate };
}

// ----- Helpers: Course rollups aggregation -----
async function aggregateRollupsTotal(userId, rollupField, startDate, endDate) {
  const institutions = await Institution.find({ institutionAdmin: userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) return 0;
  const startKey = startDate.toISOString().split('T')[0];
  const endKey = endDate.toISOString().split('T')[0];
  const agg = await Course.aggregate([
    { $match: { institution: { $in: ids } } },
    { $unwind: { path: `$${rollupField}`, preserveNullAndEmptyArrays: false } },
    { $match: { [`${rollupField}.day`]: { $gte: startKey, $lte: endKey } } },
    { $group: { _id: null, total: { $sum: `$${rollupField}.count` } } }
  ]);
  return agg[0]?.total || 0;
}

// ----- Helpers: student-based leads -----
async function countStudentsInRange(userId, startDate, endDate) {
  const institutions = await Institution.find({ institutionAdmin: userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) return 0;
  return InstituteAdminModel.countDocuments({ institution: { $in: ids }, role: 'STUDENT', createdAt: { $gte: startDate, $lte: endDate } });
}

async function countStudentsTotal(userId) {
  const institutions = await Institution.find({ institutionAdmin: userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) return 0;
  return InstituteAdminModel.countDocuments({ institution: { $in: ids }, role: 'STUDENT' });
}

// ----- Unified institutionAdmin metric summary -----
// GET /summary/metrics/institutionAdmin?metric=views|comparisons|leads
exports.getInstitutionAdminMetricSummaryUnified = asyncHandler(async (req, res, next) => {
  const raw = (req.query.metric || '').toString().toLowerCase();
  const isViews = raw === 'views' || raw === 'courseviews';
  const isComparisons = raw === 'comparisons' || raw === 'comparison';
  const isLeads = raw === 'leads' || raw === 'leadsgenerated';

  if (!isViews && !isComparisons && !isLeads) return next(new AppError('Invalid metric. Use metric=views|comparisons|leads', 400));

  if (isLeads) {
    const totalLeads = await countStudentsTotal(req.userId);
    return res.status(200).json({ success: true, data: { totalLeads } });
  }

  // Fallback totals from Course
  const institutions = await Institution.find({ institutionAdmin: req.userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) {
    if (isViews) return res.status(200).json({ success: true, data: { totalViews: 0 } });
    return res.status(200).json({ success: true, data: { totalComparisons: 0 } });
  }
  const groupField = isViews ? '$courseViews' : '$comparisons';
  const agg = await Course.aggregate([
    { $match: { institution: { $in: ids } } },
    { $group: { _id: null, total: { $sum: { $ifNull: [ groupField, 0 ] } } } }
  ]);
  const total = agg[0]?.total || 0;
  if (isViews) return res.status(200).json({ success: true, data: { totalViews: total } });
  return res.status(200).json({ success: true, data: { totalComparisons: total } });
});

// ----- Unified institutionAdmin metric by range -----
// GET /summary/metrics/institutionAdmin/range?metric=views|comparisons|leads&range=weekly|monthly|yearly
exports.getInstitutionAdminMetricByRangeUnified = asyncHandler(async (req, res, next) => {
  const raw = (req.query.metric || '').toString().toLowerCase();
  const range = (req.query.range || 'weekly').toString().toLowerCase();
  const isViews = raw === 'views' || raw === 'courseviews';
  const isComparisons = raw === 'comparisons' || raw === 'comparison';
  const isLeads = raw === 'leads' || raw === 'leadsgenerated';

  if (!isViews && !isComparisons && !isLeads) return next(new AppError('Invalid metric. Use metric=views|comparisons|leads', 400));

  if (isLeads) {
    const { startDate: cs, endDate: ce } = getCurrentPeriod(range);
    const { startDate: ps, endDate: pe } = getPreviousPeriod(range);
    const current = await countStudentsInRange(req.userId, cs, ce);
    const previous = await countStudentsInRange(req.userId, ps, pe);
    const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    return res.status(200).json({ success: true, data: { totalLeads: current, trend: { value: Math.abs(trend), isPositive: trend >= 0 } } });
  }

  const rollupField = isViews ? 'viewsRollups' : 'comparisonRollups';
  const { startDate: cs, endDate: ce } = getCurrentPeriod(range);
  const { startDate: ps, endDate: pe } = getPreviousPeriod(range);
  const current = await aggregateRollupsTotal(req.userId, rollupField, cs, ce);
  const previous = await aggregateRollupsTotal(req.userId, rollupField, ps, pe);
  const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  if (isViews) return res.status(200).json({ success: true, data: { totalViews: current, trend: { value: Math.abs(trend), isPositive: trend >= 0 } } });
  return res.status(200).json({ success: true, data: { totalComparisons: current, trend: { value: Math.abs(trend), isPositive: trend >= 0 } } });
});

// ----- Series: monthly counts for a given year -----
exports.getInstitutionAdminMetricSeriesUnified = asyncHandler(async (req, res, next) => {
  const raw = (req.query.metric || '').toString().toLowerCase();
  const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
  const isViews = raw === 'views' || raw === 'courseviews';
  const isComparisons = raw === 'comparisons' || raw === 'comparison';
  const isLeads = raw === 'leads' || raw === 'leadsgenerated';
  if (!isViews && !isComparisons && !isLeads) {
    return next(new AppError('Invalid metric. Use metric=views|comparisons|leads', 400));
  }

  const institutions = await Institution.find({ institutionAdmin: req.userId }).select('_id');
  const ids = institutions.map(i => i._id);
  if (ids.length === 0) {
    return res.status(200).json({ success: true, data: { series: new Array(12).fill(0) } });
  }

  if (isLeads) {
    const series = [];
    for (let m = 0; m < 12; m++) {
      const startDate = new Date(Date.UTC(year, m, 1));
      const endDate = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999));
      // inclusive end
      const count = await InstituteAdminModel.countDocuments({
        institution: { $in: ids },
        role: 'STUDENT',
        createdAt: { $gte: startDate, $lte: endDate }
      });
      series.push(count);
    }
    return res.status(200).json({ success: true, data: { series } });
  }

  // Views or comparisons via rollups
  const rollupField = isViews ? 'viewsRollups' : 'comparisonRollups';
  const series = [];
  for (let m = 0; m < 12; m++) {
    const startDate = new Date(Date.UTC(year, m, 1));
    const endDate = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999));
    const startKey = startDate.toISOString().split('T')[0];
    const endKey = endDate.toISOString().split('T')[0];
    const agg = await Course.aggregate([
      { $match: { institution: { $in: ids } } },
      { $unwind: { path: `$${rollupField}`, preserveNullAndEmptyArrays: false } },
      { $match: { [`${rollupField}.day`]: { $gte: startKey, $lte: endKey } } },
      { $group: { _id: null, total: { $sum: `$${rollupField}.count` } } }
    ]);
    series.push(agg[0]?.total || 0);
  }
  return res.status(200).json({ success: true, data: { series } });
});
