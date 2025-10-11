const Notification = require('../models/Notification');

// Utility: build recipient filter from query and auth context
function buildScopeFilter(req) {
	const { scope, studentId, institutionId, branchId } = req.query;
	// For admins, we can infer institutionAdmin from req.user if available
	const filter = {};
	if (scope === 'student' && studentId) { filter.recipientType = 'STUDENT'; filter.student = studentId; }
	else if (scope === 'institution' && institutionId) { filter.recipientType = 'INSTITUTION'; filter.institution = institutionId; }
	else if (scope === 'branch' && branchId) { filter.recipientType = 'BRANCH'; filter.branch = branchId; }
	else if (scope === 'admin' && (req.user?.id || req.query.institutionAdminId)) { filter.recipientType = 'ADMIN'; filter.institutionAdmin = req.user?.id || req.query.institutionAdminId; }
	else { filter.recipientType = { $in: ['SYSTEM','ADMIN','INSTITUTION','BRANCH','STUDENT'] }; }
	return filter;
}

exports.list = async function(req, res) {
	try {
    const { page = 1, limit = 20, unread, category, cursor } = req.query;
		const filter = buildScopeFilter(req);
		if (typeof unread !== 'undefined') filter.read = unread === 'true' ? false : true;
		if (category) filter.category = category;
    const lim = Math.min(100, parseInt(limit));

    // Cursor-based pagination (createdAt desc, _id desc)
    let items;
    if (cursor) {
      try {
        const [tsStr, idStr] = String(cursor).split('_');
        const ts = new Date(tsStr);
        const _id = idStr;
        const cursorFilter = Object.assign({}, filter, { $or: [
          { createdAt: { $lt: ts } },
          { createdAt: ts, _id: { $lt: _id } }
        ]});
        items = await Notification.find(cursorFilter).sort({ createdAt: -1, _id: -1 }).limit(lim);
      } catch {
        items = await Notification.find(filter).sort({ createdAt: -1, _id: -1 }).limit(lim);
      }
    } else {
      items = await Notification.find(filter).sort({ createdAt: -1, _id: -1 }).limit(lim);
    }

    const next = items.length === lim ? `${items[items.length - 1].createdAt.toISOString()}_${items[items.length - 1]._id}` : null;
    res.json({ success: true, data: { items, nextCursor: next, limit: lim } });
	} catch (e) {
		res.status(500).json({ success: false, message: e.message });
	}
};

exports.create = async function(req, res) {
	try {
    const { title, description, category, recipientType, student, institution, branch, institutionAdmin, metadata } = req.body;
    // Basic metadata normalization for production-level deep links
    const norm = Object.assign({}, metadata || {});
    if (!norm.type) {
      // derive type from category if not provided
      const c = (category || '').toString().toUpperCase();
      if (c === 'USER') norm.type = 'WELCOME';
    }
    if (!norm.route) {
      const t = (norm.type || '').toString().toUpperCase();
      if (t === 'CALLBACK_REQUEST') norm.route = '/dashboard/leads';
      else if (t === 'NEW_STUDENT') norm.route = '/dashboard';
      else norm.route = '/notifications';
    }
		/* Set expiresAt per policy
		const now = Date.now();
		const ttlByCategoryMs = {
			otp: 5 * 60 * 1000,
			system: 30 * 24 * 60 * 60 * 1000,
			billing: 180 * 24 * 60 * 60 * 1000,
			security: 90 * 24 * 60 * 60 * 1000,
			user: 30 * 24 * 60 * 60 * 1000,
			other: 60 * 24 * 60 * 60 * 1000
		};
		const ttl = ttlByCategoryMs[(category || 'other').toLowerCase()] || ttlByCategoryMs.other;
		const expiresAt = new Date(now + ttl);
		const doc = await Notification.create({ title, description, category, recipientType, student, institution, branch, institutionAdmin, metadata, expiresAt });*/
		// Global policy: 7-day retention handled by TTL on createdAt
    // Enqueue for async processing (jobs)
    try {
      const { addNotificationJob } = require('../jobs/notification.job');
      await addNotificationJob({ title, description, category, recipientType, student, institution, branch, institutionAdmin, metadata: norm });
    } catch (e) {
      console.error('Enqueue notification failed, falling back to direct create');
      const doc = await Notification.create({ title, description, category, recipientType, student, institution, branch, institutionAdmin, metadata: norm });
      try {
        const io = req.app.get('io');
        if (io) {
          if (recipientType === 'INSTITUTION' && institution) io.to(`institution:${institution}`).emit('notificationCreated', { notification: doc });
          if (recipientType === 'ADMIN' && institutionAdmin) io.to(`institutionAdmin:${institutionAdmin}`).emit('notificationCreated', { notification: doc });
          if (recipientType === 'STUDENT' && student) io.to(`student:${student}`).emit('notificationCreated', { notification: doc });
          if (recipientType === 'BRANCH' && branch) io.to(`branch:${branch}`).emit('notificationCreated', { notification: doc });
        }
      } catch {}
      return res.json({ success: true, data: doc });
    }
    res.json({ success: true, data: { enqueued: true } });
	} catch (e) {
		res.status(400).json({ success: false, message: e.message });
	}
};

exports.markRead = async function(req, res) {
	try {
		const { ids } = req.body;
		if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'ids required' });
		const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await Notification.updateMany({ _id: { $in: ids } }, { $set: { read: true, expiresAt: expireAt } });
    try {
      const io = req.app.get('io');
      if (io) {
        // We cannot easily infer rooms for each id without extra lookup; emit generic update
        ids.forEach((notificationId) => {
          io.emit('notificationUpdated', { notificationId, read: true });
        });
      }
    } catch (_) {}
    res.json({ success: true, data: { updated: result.modifiedCount } });
	} catch (e) {
		res.status(400).json({ success: false, message: e.message });
	}
};

// markUnread removed per policy

exports.remove = async function(req, res) {
	try {
		const { ids } = req.body;
		if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'ids required' });
    const result = await Notification.deleteMany({ _id: { $in: ids } });
    try {
      const io = req.app.get('io');
      if (io) {
        ids.forEach((notificationId) => io.emit('notificationRemoved', { notificationId }));
      }
    } catch (_) {}
    res.json({ success: true, data: { removed: result.deletedCount } });
	} catch (e) {
		res.status(400).json({ success: false, message: e.message });
	}
};
