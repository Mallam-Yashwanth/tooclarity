const mongoose = require("mongoose");
const InstitutionAdmin = require("../models/InstituteAdmin");
const asyncHandler = require("express-async-handler");

exports.getInstitutionAnalytics = asyncHandler(async (req, res) => {
  const { type, sendViewGroupData = false } = req.body;
  const userId = req.userId;

  if (!["weekly", "monthly", "yearly"].includes(type)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid analytics type" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let groupFormat = "%Y-%m-%d";
  let rangeStart = new Date(today);

  if (type === "weekly") rangeStart.setDate(today.getDate() - 7);
  if (type === "monthly") {
    groupFormat = "%Y-%m";
    rangeStart.setMonth(today.getMonth() - 1);
  }
  if (type === "yearly") {
    groupFormat = "%Y";
    rangeStart.setFullYear(today.getFullYear() - 1);
  }

  const result = await InstitutionAdmin.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $limit: 1 },

    {
      $lookup: {
        from: "analyticsdailies",
        localField: "institutionId",
        foreignField: "institutionId",
        as: "analytics"
      }
    },

    // Filter records & prepare timeline only if needed
    {
      $project: {
        analytics: {
          $filter: {
            input: "$analytics",
            as: "a",
            cond: {
              $and: [
                { $gte: ["$$a.day", rangeStart] },
                { $lte: ["$$a.day", today] },
                { $in: ["$$a.metric", ["views", "leads"]] }
              ]
            }
          }
        }
      }
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: "$analytics.metric",
              total: { $sum: "$analytics.count" }
            }
          }
        ],

        viewsTimeline: sendViewGroupData
          ? [
              { $unwind: "$analytics" },
              { $match: { "analytics.metric": "views" } },
              {
                $group: {
                  _id: {
                    label: {
                      $dateToString: {
                        format: groupFormat,
                        date: "$analytics.day"
                      }
                    }
                  },
                  count: { $sum: "$analytics.count" }
                }
              },
              {
                $project: {
                  _id: 0,
                  label: "$_id.label",
                  count: 1
                }
              },
              { $sort: { label: 1 } }
            ]
          : []
      }
    }
  ]);

  if (!result.length) {
    return res.status(404).json({
      success: false,
      message: "Institution not found for this admin"
    });
  }

  const { totals, viewsTimeline } = result[0];

  let viewsTotal = 0;
  let leadsTotal = 0;

  totals.forEach((t) => {
    if (t._id === "views") viewsTotal = t.total;
    if (t._id === "leads") leadsTotal = t.total;
  });

  const response = {
    success: true,
    type,
    dateRange: {
      from: rangeStart.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0]
    },
    views: { total: viewsTotal },
    leads: { total: leadsTotal }
  };

  if (sendViewGroupData) {
    response.views.timeline = viewsTimeline;
  }

  return res.status(200).json(response);
});
