import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";

export interface StudentItem {
  date: string;
  name: string;
  id: string;
  status: string;
  programInterests?: string[];
  avatarUrl?: string;
  // Optional contact/meta fields
  email?: string;
  phone?: string;
  address?: string;
  program?: string;
  // Optional timestamp for filtering
  timestampMs?: number;
}

interface StudentListProps {
  title?: string;
  items: StudentItem[];
  isLoading?: boolean;
  onStudentClick?: (student: StudentItem) => void;
  onStudentHover?: (student: StudentItem) => void;
  hideActions?: boolean;
  selectionMode?: 'click' | 'hover';
  statusLabel?: string;
  useDashboardColumns?: boolean;
  useIconWhenNoAvatar?: boolean;
}

const StudentList: React.FC<StudentListProps> = ({
  title = "Student list",
  items,
  isLoading,
  onStudentClick,
  onStudentHover,
  hideActions = false,
  selectionMode = 'click',
  statusLabel = 'Status',
  useDashboardColumns = false,
  useIconWhenNoAvatar = false
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.4 }
    })
  };

  const statusOptions = [
    'all', 'Requested for call back', 'Requested for demo', 
    'Interested in pricing', 'Follow up needed', 'Hot lead', 
    'Qualified prospect', 'Demo scheduled'
  ];


  const filteredAndSortedItems = items
    .filter(item => filterStatus === 'all' || item.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const handleStudentClick = (student: StudentItem) => {
    if (selectionMode === 'click') {
      setSelectedStudent(selectedStudent === student.id ? null : student.id);
      onStudentClick?.(student);
    }
  };

  const handleStudentHover = (student: StudentItem) => {
    if (selectionMode === 'hover') {
      setSelectedStudent(student.id);
      onStudentHover?.(student);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      // Merged enquiry type and status system
      'Requested for callback': 'bg-blue-50 text-blue-700',
      'Requested for demo': 'bg-purple-50 text-purple-700',
      'Contacted': 'bg-indigo-50 text-indigo-700',
      'Interested': 'bg-green-50 text-green-700',
      'Demo Scheduled': 'bg-pink-50 text-pink-700',
      'Follow Up Required': 'bg-yellow-50 text-yellow-700',
      'Qualified': 'bg-emerald-50 text-emerald-700',
      'Not Interested': 'bg-red-50 text-red-700',
      'Converted': 'bg-green-50 text-green-700',
      // Legacy statuses (fallback)
      'New Lead': 'bg-blue-50 text-blue-700',
      'Interested in pricing': 'bg-green-50 text-green-700',
      'FollowUp needed': 'bg-yellow-50 text-yellow-700',
      'Hot lead': 'bg-red-50 text-red-700',
      'Qualified prospect': 'bg-indigo-50 text-indigo-700',
      'Demo scheduled': 'bg-pink-50 text-pink-700'
    };
    return colors[status] || 'bg-gray-50 text-gray-700';
  };

  const renderAvatar = (item: StudentItem) => {
    if (item.avatarUrl) {
      return <img src={item.avatarUrl} alt={item.name} className="h-9 w-9 rounded-full object-cover" />;
    }
    if (useIconWhenNoAvatar) {
      return (
        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
          <FontAwesomeIcon icon={faUser} className="text-base" />
        </div>
      );
    }
    return (
      <div className="h-9 w-9 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">
        {item.name.charAt(0)}
      </div>
    );
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-none bg-gray-50 dark:bg-gray-900 shadow-sm rounded-2xl border border-gray-100 dark:border-gray-800">
        <CardContent className="p-0 bg-gray-50 dark:bg-gray-900">
          {!hideActions && (
            <div className="px-6 pt-1 flex items-center justify-between">
              <div className="text-2xl font-semibold">{title}</div>
              
              <div className="flex items-center gap-2">      
                <motion.div 
                  className="text-gray-400 cursor-pointer"
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.2 }}
                >
                </motion.div>
              </div>
              
            </div>
           )}
            
        {/* Header: visible from md and up */}
          {useDashboardColumns ? (
            <div className="px-6 hidden md:grid grid-cols-12 text-sm md:text-2xl font-semibold py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="col-span-3">Date</div>
              <div className="col-span-5">Student name</div>
              <div className="col-span-2 pr-2">Program Interest</div>
              <div className="col-span-2 text-center pl-2">{statusLabel}</div>
            </div>
          ) : (
          <div className="px-6 hidden md:grid grid-cols-12 text-sm md:text-2xl font-semibold py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="col-span-3">Date</div>
          <div className="col-span-6">Student name</div>
              <div className="col-span-2 text-center">{statusLabel}</div>
        </div>
          )}
          
          <div className={`divide-y divide-gray-100 ${useDashboardColumns ? 'px-3' : ''}`}>
            <AnimatePresence>
              {isLoading ? (
                <motion.div
                  key="loading"
                  className="px-6 py-8 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </motion.div>
              ) : (
                filteredAndSortedItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    className={`px-3 sm:px-6 py-3 sm:py-4 grid bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-2xl ${useDashboardColumns ? 'grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-start sm:items-center my-2 sm:my-3' : 'm-2 sm:m-3 grid-cols-1 gap-3 md:grid-cols-12 md:items-center'} transition-all duration-200 cursor-pointer`}
                    variants={itemVariants}
                    custom={idx}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => handleStudentClick(item)}
                    onMouseEnter={() => handleStudentHover(item)}
                    layout
            >
                    {useDashboardColumns ? (
                      <>
                        {/* Date */}
                        <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 sm:col-span-3 sm:text-base font-semibold mb-2 sm:mb-0">
                          <span className="block sm:hidden text-xs text-gray-500 mb-1">Date</span>
                          {item.date}
                        </div>
                        {/* Student */}
                        <div className="flex items-start gap-3 sm:col-span-5 mb-3 sm:mb-0">
                          {renderAvatar(item)}
                          <div className="leading-tight flex-1">
                            <div className="text-sm font-medium sm:text-md font-semibold text-gray-900 dark:text-gray-100">{item.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">#{item.id}</div>
                          </div>
                        </div>
                        {/* Program interest */}
                        <div className="sm:col-span-2 pr-0 sm:pr-2 mb-3 sm:mb-0">
                          <span className="block sm:hidden text-xs text-gray-500 mb-1">Program Interest</span>
                          {item.programInterests && item.programInterests.length > 0 ? (
                            <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 truncate whitespace-nowrap overflow-hidden">
                              {item.programInterests.join(", ")}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </div>
                        {/* Status */}
                        <div className="text-sm text-gray-700 sm:col-span-2 flex justify-start sm:justify-center items-center pl-0 sm:pl-2">
                          <span className="block sm:hidden text-xs text-gray-500 mb-1 mr-2">{statusLabel}</span>
                          <motion.span 
                            className={`inline-block px-2 text-[0.75rem] sm:text-[0.8rem] md:text-md font-semibold py-1 rounded-full text-xs ${getStatusColor(item.status)}`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.status}
                          </motion.span>
                        </div>
                      </>
                    ) : (
                      <>
              {/* Date */}
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 md:col-span-3 md:text-base font-semibold mb-2 md:mb-0">
                      <span className="block md:hidden text-xs md:text-base font-semibold text-gray-500 mb-1">Date</span>
                {item.date}
              </div>
                        {/* Student + Program interests (compact) */}
                        <div className="flex items-start gap-3 md:col-span-6 mb-3 md:mb-0">
                          {renderAvatar(item)}
                <div className="leading-tight flex-1">
                        <div className="text-sm font-medium md:text-md font-semibold text-gray-900 dark:text-gray-100">{item.name}</div>
                            {item.programInterests && item.programInterests.length > 0 && (
                              <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                                {item.programInterests.join(", ")}
                              </div>
                            )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">#{item.id}</div>
                </div>
              </div>
                        {/* Status */}
                    <div className="text-sm text-gray-700 md:col-span-3 flex justify-start md:justify-left items-center">
                          <span className="md:hidden block text-xs text-gray-500 mb-1">{statusLabel}</span>
                          <motion.span 
                            className={`inline-block px-2 text-[0.8rem] md:text-md font-semibold py-1 rounded-full text-xs ${getStatusColor(item.status)}`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.status}
                          </motion.span>
              </div>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
};

export default StudentList;
