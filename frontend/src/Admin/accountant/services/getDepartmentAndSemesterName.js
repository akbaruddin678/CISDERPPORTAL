const getDepartmentAndSemesterName = (extra = []) => {
  const challanTypeOptions = [
    { value: "1st_semester", label: "1st Semester" },
    { value: "2nd_semester", label: "2nd Semester" },
    { value: "3rd_semester", label: "3rd Semester" },
    { value: "4th_semester", label: "4th Semester" },
    { value: "5th_semester", label: "5th Semester" },
    { value: "6th_semester", label: "6th Semester" },
    { value: "7th_semester", label: "7th Semester" },
    { value: "8th_semester", label: "8th Semester" },
    ...extra,
  ];

  const departmentOptions = [
    { value: "bs_nursing", label: "BS Nursing" },
    { value: "post_rn", label: "Post RN" },
    { value: "lhv_cmw", label: "LHV/CMW" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "dpt", label: "Doctor of Physical Therapy" },
    { value: "bs_english", label: "BS English" },
    { value: "bs_computer_science", label: "BS Computer Science" },
    { value: "bs_applied_psychology", label: "BS Applied Psychology" },
    { value: "bba", label: "BBA" },
    ...extra,
  ];
  return {
    challanTypeOptions,
    departmentOptions,
  };
};

export default getDepartmentAndSemesterName;
