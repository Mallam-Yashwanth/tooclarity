// server.js
const dotenv = require('dotenv');
// ✅ Load correct environment file immediately
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });


const cookieParser = require('cookie-parser');
const globalAuthMiddleware = require('./middleware/globalAuth.middleware');






console.log(`Environment loaded: ${process.env.NODE_ENV}`);
console.log(`Using file: ${envFile}`);


const mongoose = require('mongoose');
const path = require('path');
const { Institution } = require('./models/Institution');
const { initializeElasticsearch } = require('./config/esSync');


console.log(`Environment loaded: ${process.env.NODE_ENV}`);
console.log(`Using file: ${envFile}`);


const app = require('./app');


const DB = process.env.MONGO_URI;


mongoose.connection.once('open', async () => {
  console.log('✅ MongoDB connection successful!');
  try {
    await initializeElasticsearch(); // 🚀 Perform safe ES sync once DB is ready
  } catch (err) {
    console.error('Elasticsearch sync error:', err?.message || err);
  }
});


// ✅ Start Express server
const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`🚀 App running on port ${port}...`);
  try {
    require('./jobs/notification.job').startNotificationWorker();
  } catch (e) {
    console.error('Failed to start notification worker:', e?.message || e);
  }
});


// ✅ Attach Socket.IO
const { Server } = require('socket.io');


const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN_WEB,
    credentials: true,
  },
});
app.set('io', io);


// Socket singleton for workers
try {
  require('./utils/socket').setIO(io);
} catch { }


//socket connection with the cookie //
io.use((socket, next) => {
  const req = socket.request;
  const res = {
    cookie: () => { },
    clearCookie: () => { },
    status: (code) => ({
      json: (errBody) => next(new Error(errBody.message || 'Authentication Failed'))
    })
  };


  const parseCookies = cookieParser(process.env.JWT_SECRET);
  parseCookies(req, res, async (err) => {
    if (err) return next(new Error('Cookie Parse Error'));
    await globalAuthMiddleware(req, res, (authErr) => {
      if (authErr) return next(authErr);
      socket.user = { id: req.userId, role: req.userRole };
      next();
    });
  });
});


// socket connection with the user
io.on('connection', (socket) => {
  const { id: userId, role: userRole } = socket.user;
  console.log(`Secure Connection: User ${userId} (${userRole})`);


  if (userRole === 'institutionAdmin') {
    socket.join(`institutionAdmin:${userId}`);
  } else if (userRole === 'student') {
    socket.join(`student:${userId}`);
  } else if (userRole === 'admin') {
    socket.join(`admin:${userId}`);
  }


  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


// ✅ Integrate Workers Here (the magic)
(async () => {
  try {
    const workerPath = path.join(__dirname, 'workers', 'index.js');
    require(workerPath); // instantly runs the async IIFE inside workers/index.js
    console.log('⚙️ Background workers initialized');
  } catch (err) {
    console.error('❌ Failed to initialize workers:', err.message || err);
  }
})();


// ✅ Watch for Course changes (realtime updates)
(async () => {
  try {
    const Course = require('./models/Course');
    const { Institution } = require('./models/Institution');
    const changeStream = Course.watch([{ $match: { operationType: { $in: ['update', 'replace'] } } }], {
      fullDocument: 'updateLookup',
    });


    changeStream.on('change', async (change) => {
      try {
        const doc = change.fullDocument;
        if (!doc) return;
        const updated = change.updateDescription?.updatedFields || {};
        const institutionId = String(doc.institution);
        const inst = await Institution.findById(institutionId).select('institutionAdmin');
        const keys = Object.keys(updated);
        const viewsRollupsChanged = keys.some((k) => k.startsWith('viewsRollups'));
        const comparisonsRollupsChanged = keys.some((k) => k.startsWith('comparisonRollups'));


        // courseViews or viewsRollups change → emit events
        if (typeof updated.courseViews !== 'undefined' || viewsRollupsChanged || change.operationType === 'replace') {
          if (institutionId)
            io.to(`institution:${institutionId}`).emit('courseViewsUpdated', {
              institutionId,
              courseId: String(doc._id),
              courseViews: doc.courseViews,
            });


          if (inst?.institutionAdmin) {
            const adminId = String(inst.institutionAdmin);
            io.to(`institutionAdmin:${adminId}`).emit('courseViewsUpdated', {
              institutionId,
              courseId: String(doc._id),
              courseViews: doc.courseViews,
            });


            const institutions = await Institution.find({ institutionAdmin: adminId }).select('_id');
            const ids = institutions.map((i) => i._id);
            if (ids.length > 0) {
              const agg = await Course.aggregate([
                { $match: { institution: { $in: ids } } },
                { $group: { _id: null, totalViews: { $sum: { $ifNull: ['$courseViews', 0] } } } },
              ]);
              const totalViews = agg[0]?.totalViews || 0;
              io.to(`institutionAdmin:${adminId}`).emit('institutionAdminTotalViews', { totalViews });
            }
          }
        }


        // comparisons change → emit comparison events
        if (typeof updated.comparisons !== 'undefined' || comparisonsRollupsChanged || change.operationType === 'replace') {
          if (institutionId)
            io.to(`institution:${institutionId}`).emit('comparisonsUpdated', {
              institutionId,
              courseId: String(doc._id),
              comparisons: doc.comparisons,
            });


          if (inst?.institutionAdmin) {
            const adminId = String(inst.institutionAdmin);
            io.to(`institutionAdmin:${adminId}`).emit('comparisonsUpdated', {
              institutionId,
              courseId: String(doc._id),
              comparisons: doc.comparisons,
            });


            const institutions = await Institution.find({ institutionAdmin: adminId }).select('_id');
            const ids = institutions.map((i) => i._id);
            if (ids.length > 0) {
              const agg = await Course.aggregate([
                { $match: { institution: { $in: ids } } },
                { $group: { _id: null, totalComparisons: { $sum: { $ifNull: ['$comparisons', 0] } } } },
              ]);
              const totalComparisons = agg[0]?.totalComparisons || 0;
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


// ✅ Watch Enquiries for realtime updates
(async () => {
  try {
    const Enquiries = require('./models/Enquiries');
    const { Institution } = require('./models/Institution');
    const stream = Enquiries.watch([{ $match: { operationType: { $in: ['insert'] } } }], {
      fullDocument: 'updateLookup',
    });


    stream.on('change', async (change) => {
      try {
        const doc = change.fullDocument;
        if (!doc) return;
        const institutionId = String(doc.institution);
        if (institutionId) io.to(`institution:${institutionId}`).emit('enquiryCreated', { enquiry: doc });


        const inst = await Institution.findById(institutionId).select('institutionAdmin');
        if (inst?.institutionAdmin) {
          const adminId = String(inst.institutionAdmin);
          io.to(`institutionAdmin:${adminId}`).emit('enquiryCreated', { enquiry: doc });


          const institutions = await Institution.find({ institutionAdmin: adminId }).select('_id');
          const ids = institutions.map((i) => i._id);
          const totalLeads = await Enquiries.countDocuments({
            institution: { $in: ids },
            enquiryType: { $in: [/^callback$/i, /^demo$/i] },
          });
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


// ✅ Global error handling
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

