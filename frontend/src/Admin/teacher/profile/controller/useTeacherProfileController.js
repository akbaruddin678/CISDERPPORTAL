import { useGetMyProfileQuery } from "../../api/teacherClassesApi";

const useTeacherProfileController = () => {
  const { data, isFetching, isError, refetch } = useGetMyProfileQuery();

  return {
    profile: data?.data?.profile || null,
    documents: data?.data?.documents || [],
    isFetching,
    isError,
    refetch,
  };
};

export default useTeacherProfileController;
