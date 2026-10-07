export const ActionButton = ({ 
    children, 
    onClick, 
    variant = "primary" 
  }) => {
    const baseClasses = "w-full py-2 px-4 font-medium rounded-lg transition duration-150";
    
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "border border-gray-300 hover:bg-gray-50 text-gray-700",
      accent: "bg-indigo-600 hover:bg-indigo-700 text-white"
    };
  
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${variants[variant]}`}
      >
        {children}
      </button>
    );
  };