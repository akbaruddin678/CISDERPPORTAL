import React, { useEffect, useState } from "react";
import TeacherHomeView from "../view/TeacherHomeView";
import { getUserProfile } from "../services/getAuthToken";
import { useGetTeacherDashboardStatsQuery } from "../api/teacherClassesApi";
import { notificationService } from "../../Notifications/notificationService";

const TeacherMainContainer = () => {
  const user = getUserProfile();
  const { data, isFetching } = useGetTeacherDashboardStatsQuery();
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  useEffect(() => {
    let active = true;
    notificationService.mine()
      .then((response) => { if (active) setNotifications(response.data || []); })
      .catch(() => { if (active) setNotifications([]); })
      .finally(() => { if (active) setIsLoadingNotifications(false); });
    return () => { active = false; };
  }, []);

  const stats = {
    activeCourseCount: data?.data?.activeCourseCount ?? 0,
    pendingMarksCount: data?.data?.pendingMarksCount ?? 0,
    pendingLeaveCount: data?.data?.pendingLeaveCount ?? 0,
    openSubstitutionCount: data?.data?.openSubstitutionCount ?? 0,
    teacherName: data?.data?.teacherName ?? null,
    designation: data?.data?.designation ?? null,
    profilePhotoUrl: data?.data?.profilePhotoUrl ?? null,
  };

  return <TeacherHomeView isLoading={isFetching} user={user} stats={stats} notifications={notifications} isLoadingNotifications={isLoadingNotifications} />;
};

export default TeacherMainContainer;
