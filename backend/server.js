const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Institution } = require('./models/Institution');
// const {Course} =require('./models/Course')

// dotenv.config();
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

console.log(`Enviourment loaded :${process.env.NODE_ENV}`)
console.log(`Using ile ${envFile}`);
const app = require('./app');

const DB = process.env.MONGO_URI;
mongoose.connect(DB).then(() => console.log('✅ MongoDB connection successful!'));

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
    console.log(`🚀 App running on port ${port}...`);
    try { require('./jobs/notification.job').startNotificationWorker(); } catch (e) { console.error('Failed to start notification worker:', e?.message || e); }
});

// Attach Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true
  }
});
app.set('io', io);
// Socket singleton for workers
try { require('./utils/socket').setIO(io); } catch {}

io.on('connection', (socket) => {
  // Expect client to join institution room
  socket.on('joinInstitution', (institutionId) => {
    if (institutionId) socket.join(`institution:${institutionId}`);
  });
  // InstitutionAdmin scope room for cross-institution aggregates
  socket.on('joinInstitutionAdmin', (adminId) => {
    if (adminId) socket.join(`institutionAdmin:${adminId}`);
  });
  // Student-specific room
  socket.on('joinStudent', (studentId) => {
    if (studentId) socket.join(`student:${studentId}`);
  });
  // Program-specific room (optional for program pages)
  socket.on('joinProgram', (programId) => {
    if (programId) socket.join(`program:${programId}`);
  });
  // Admin-specific room (platform admin)
  socket.on('joinAdmin', (adminId) => {
    if (adminId) socket.join(`admin:${adminId}`);
  });
  // Branch-specific room
  socket.on('joinBranch', (branchId) => {
    if (branchId) socket.join(`branch:${branchId}`);
  });
});

// Emit realtime events even if DB is updated externally (watch courseViews changes)
(async () => {
  try {
    const Course = require('./models/Course');
    const { Institution } = require('./models/Institution');
    const changeStream = Course.watch([
      { $match: { 'operationType': { $in: ['update', 'replace'] } } }
    ], { fullDocument: 'updateLookup' });

    changeStream.on('change', async (change) => {
      try {
        const doc = change.fullDocument;
        if (!doc) return;
        const updated = change.updateDescription?.updatedFields || {};
        const institutionId = String(doc.institution);
        const { Institution } = require('./models/Institution');
        const inst = await Institution.findById(institutionId).select('institutionAdmin');

        const keys = Object.keys(updated);
        const viewsRollupsChanged = keys.some(k => k.startsWith('viewsRollups'));
        const comparisonsRollupsChanged = keys.some(k => k.startsWith('comparisonRollups'));

        // courseViews or viewsRollups change → emit views events and institutionAdmin totals
        if (typeof updated.courseViews !== 'undefined' || viewsRollupsChanged || change.operationType === 'replace') {
          if (institutionId) io.to(`institution:${institutionId}`).emit('courseViewsUpdated', { institutionId, courseId: String(doc._id), courseViews: doc.courseViews });
          if (inst?.institutionAdmin) {
            const adminId = String(inst.institutionAdmin);
            io.to(`institutionAdmin:${adminId}`).emit('courseViewsUpdated', { institutionId, courseId: String(doc._id), courseViews: doc.courseViews });
            const institutions = await Institution.find({ institutionAdmin: adminId }).select('_id');
            const ids = institutions.map(i => i._id);
            if (ids.length > 0) {
              const agg = await require('./models/Course').aggregate([
                { $match: { institution: { $in: ids } } },
                { $group: { _id: null, totalViews: { $sum: { $ifNull: ["$courseViews", 0] } } } }
              ]);
              const totalViews = (agg[0]?.totalViews) || 0;
              io.to(`institutionAdmin:${adminId}`).emit('institutionAdminTotalViews', { totalViews });
            }
          }
        }

        // comparisons or comparisonRollups change → emit comparison events and institutionAdmin totals
        if (typeof updated.comparisons !== 'undefined' || comparisonsRollupsChanged || change.operationType === 'replace') {
          if (institutionId) io.to(`institution:${institutionId}`).emit('comparisonsUpdated', { institutionId, courseId: String(doc._id), comparisons: doc.comparisons });
          if (inst?.institutionAdmin) {
            const adminId = String(inst.institutionAdmin);
            io.to(`institutionAdmin:${adminId}`).emit('comparisonsUpdated', { institutionId, courseId: String(doc._id), comparisons: doc.comparisons });
            const institutions = await Institution.find({ institutionAdmin: adminId }).select('_id');
            const ids = institutions.map(i => i._id);
            if (ids.length > 0) {
              const agg = await require('./models/Course').aggregate([
                { $match: { institution: { $in: ids } } },
                { $group: { _id: null, totalComparisons: { $sum: { $ifNull: ["$comparisons", 0] } } } }
              ]);
              const totalComparisons = (agg[0]?.totalComparisons) || 0;
              io.to(`institutionAdmin:${adminId}`).emit('institutionAdminTotalComparisons', { totalComparisons });
            }
          }
        }
      } catch (err) {
        console.error('Courses change stream handler failed:', err?.message || err);
      }
    });
  } catch (e) {
    console.error('Change stream init failed:', e?.message || e);
  }
})();

// Watch enquiries collection for realtime callback/demo updates and total leads
(async () => {
  try {
    const Enquiries = require('./models/Enquiries');
    const { Institution } = require('./models/Institution');
    const stream = Enquiries.watch([{ $match: { operationType: { $in: ['insert'] } } }], { fullDocument: 'updateLookup' });
    stream.on('change', async (change) => {
      try {
        const doc = change.fullDocument;
        if (!doc) return;
        const institutionId = String(doc.institution);
        if (institutionId) io.to(`institution:${institutionId}`).emit('enquiryCreated', { enquiry: doc });
        // Notify institutionAdmin rooms as well and push updated totals
        const inst = await Institution.findById(institutionId).select('institutionAdmin');
        if (inst?.institutionAdmin) {
          const adminId = String(inst.institutionAdmin);
          io.to(`institutionAdmin:${adminId}`).emit('enquiryCreated', { enquiry: doc });
          // Emit updated total leads (callback/demo enquiries only)
          const { default: mongoose } = require('mongoose');
          const institutions = await Institution.find({ institutionAdmin: adminId }).select('_id');
          const ids = institutions.map(i => i._id);
          const totalLeads = await Enquiries.countDocuments({ institution: { $in: ids }, enquiryType: { $in: [/^callback$/i, /^demo$/i] } });
          io.to(`institutionAdmin:${adminId}`).emit('institutionAdminTotalLeads', { totalLeads });
        }
      } catch (err) {
        console.error('Enquiries change stream handler failed:', err?.message || err);
      }
    });
  } catch (e) {
    console.error('Enquiries change stream init failed:', e?.message || e);
  }
})();

process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
