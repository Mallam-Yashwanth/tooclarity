"use client";

import React from "react";
import { withAuth, useAuth } from "../../lib/auth-context";
import StudentDashboard from "@/components/student/StudentDashboard";
import InstituteDashboard from "@/components/dashboard/InstituteDashboard";

function DashboardPage() {
	const { user } = useAuth();

	// If student, render StudentDashboard
	if (user?.role === "STUDENT") {
		return <StudentDashboard />;
	}

	// If institute admin, render InstituteDashboard (which has the correct context from layout)
	if (user?.role === "INSTITUTE_ADMIN") {
		return <InstituteDashboard />;
	}

	return <div></div>;
}

export default withAuth(DashboardPage); 