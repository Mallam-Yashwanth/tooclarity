import React from 'react';
import {
  Search,
  Bell,
  Moon,
  Settings,
  BarChart3,
  Users,
  Calendar,
} from 'lucide-react';

const DummyDashboard = () => {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-gray-50">
      {/* ===== HEADER ===== */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Logo + Search */}
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 text-white px-3 py-2 rounded font-bold text-lg">
              TC
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search here"
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Notifications + Profile */}
          <div className="flex items-center space-x-4">
            <Bell className="w-5 h-5 text-gray-600 cursor-pointer" />
            <Moon className="w-5 h-5 text-gray-600 cursor-pointer" />
            <div className="flex items-center space-x-2">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format"
                alt="Srinivas Chari"
                className="w-8 h-8 rounded-full"
              />
              <div className="hidden sm:block">
                <div className="text-sm font-medium">Srinivas Chari</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== BODY (Sidebar + Main Content) ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 space-y-6 flex-shrink-0">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <Settings className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
          <BarChart3 className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
          <Calendar className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
          <Users className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
        </aside>

        {/* ===== Main Section ===== */}
        <main className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
          {/* Top Controls */}
          <div className="flex justify-between items-start flex-shrink-0 mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-6">
                <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Dashboard
                </h1>
                <div className="flex space-x-2">
                  <button className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                    Weekly
                  </button>
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
                    Monthly
                  </button>
                  <button className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                    Yearly
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-hidden space-y-6">
            {/* ===== Recent Inquiries Table ===== */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Inquiries
                </h2>
              </div>

              <div className="overflow-x-auto overflow-y-hidden max-h-[35vh]">
                <table className="min-w-full table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Program Interest
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Inquiry Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { name: 'Santhosh', id: '#181210', date: '15-07-2025' },
                      { name: 'Sai Kiran', id: '#181210', date: '15-07-2025' },
                      { name: 'Rohith Reddy', id: '#181210', date: '15-07-2025' },
                      { name: 'Prashanth', id: '#181210', date: '15-07-2025' },
                    ].map((student, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{student.date}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            <img
                              src={`https://images.unsplash.com/photo-${1472099645785 + index}-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&auto=format`}
                              alt={student.name}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {student.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          B.Tech Computer Science
                        </td>
                        <td className="px-4 py-2 text-sm">
                          Requested for call back
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== Program Reach Chart ===== */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Program Reach Over Time
              </h2>
              <div className="h-[180px] w-full max-h-full relative">
                <svg className="w-full h-full" viewBox="0 0 800 200">
                  <rect width="100%" height="100%" fill="#f9fafb" />
                  <path
                    d="M 60 60 Q 200 40 300 80 Q 400 120 500 90 Q 600 70 720 50"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DummyDashboard;