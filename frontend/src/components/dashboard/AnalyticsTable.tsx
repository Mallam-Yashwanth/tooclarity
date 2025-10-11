import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

export interface CoursePerformanceRow {
  sno: number | string;
  name: string;
  status: "Live" | "Draft" | "Paused" | "Expired";
  views: number;
  leads: number;
  engagementRate: string; // e.g., '3.6%'
}

interface AnalyticsTableProps {
  rows: CoursePerformanceRow[];
  onAddCourse?: () => void;
  titleOverride?: string;
  nameHeaderOverride?: string;
}

const StatusPill: React.FC<{ status: CoursePerformanceRow["status"] }> = ({ status }) => {
  const colorMap = {
    "Live": "bg-emerald-100 text-emerald-700",
    "Draft": "bg-gray-100 text-gray-700", 
    "Paused": "bg-yellow-100 text-yellow-700",
    "Expired": "bg-red-100 text-red-700"
  };
  const color = colorMap[status];
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${color}`}>
      <span className={`h-2 w-2 rounded-full ${status==='Live' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></span>
      {status}
    </span>
  );
};

const AnalyticsTable: React.FC<AnalyticsTableProps> = ({ rows, onAddCourse, titleOverride, nameHeaderOverride }) => {
  return (
    <Card className="m-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
      <CardContent className="p-3 sm:p-6 ">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{titleOverride || "Course Performance"}</h3>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[650px] w-full">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 text-sm">
                <th className="text-left font-medium py-3">S.No</th>
                <th className="text-left font-medium py-3">{nameHeaderOverride || "Course Name"}</th>
                <th className="text-left font-medium py-3">Status</th>
                <th className="text-left font-medium py-3">Views</th>
                <th className="text-left font-medium py-3">Leads</th>
                <th className="text-left font-medium py-3">Engagement rate</th>
                <th className="text-left font-medium py-3">Action</th>
              </tr>
            </thead>
            <tbody >
              {rows.map((r, idx) => (
                <tr key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_1px_0_0_#F0F0F0]/50 dark:shadow-none">
                  <td className="p-4 text-gray-900 dark:text-gray-100">{r.sno}</td>
                  <td className="p-4">
                    <div className="text-gray-900 dark:text-gray-100 font-medium">{r.name}</div>
                  </td>
                  <td className="p-4"><StatusPill status={r.status} /></td>
                  <td className="p-4 text-gray-900 dark:text-gray-100">{r.views.toLocaleString()}</td>
                  <td className="p-4 text-gray-900 dark:text-gray-100">{r.leads}</td>
                  <td className="p-4 text-gray-900 dark:text-gray-100">{r.engagementRate}</td>
                  <td className="p-4">
                    <Button onClick={onAddCourse} variant="ghost" size="sm" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="mr-0"/>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center mt-6">
          <Button onClick={onAddCourse} variant="secondary" className="text-gray-600 border border-gray-200 rounded-full bg-white p-5">
            <span className="text-lg mr-2">＋</span>
            Add Course
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsTable; 