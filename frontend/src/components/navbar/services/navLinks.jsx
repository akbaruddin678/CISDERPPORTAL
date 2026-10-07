export const getNavLink = ({ isLogin }) => {
  return [
    { label: "Home", path: "/" },
    { label: "Admission", path: "/admission" },
    {
      label: isLogin ? "Profile" : "Login",
      path: isLogin ? "/profile" : "/login",
    },
    // Add more links here later
  ];
};
