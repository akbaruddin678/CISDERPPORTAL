import { useNavigate } from "react-router-dom";

export const DocumentGrid = ({ documents }) => {
 

  // Define document types with their labels and how to identify them
  const docTypes = [
    {
      key: "profilePhoto",
      label: "Profile Photo",
      url: documents.photoFile, // This is stored separately
    },
    {
      key: "cnicDoc_front",
      label: "CNIC Front",
      // Look for CNIC front in docs array (you might need to track which is which)
      url: documents.docs?.[0], // First doc - adjust based on your upload order
    },
    {
      key: "cnicDoc_back",
      label: "CNIC Back",
      url: documents.docs?.[1], // Second doc - adjust based on your upload order
    },
    {
      key: "matricCertificate",
      label: "Matric Certificate",
      url: documents.docs?.[2], // Third doc - adjust based on your upload order
    },
    {
      key: "fscCertificate",
      label: "FSC Certificate",
      url: documents.docs?.[3], // Fourth doc - adjust based on your upload order
    },
    {
      key: "lastDegreeDoc",
      label: "Degree Document",
      url: documents.docs?.[4], // Fifth doc - adjust based on your upload order
    },
  ];

  return (
    <section>
      <h3 className="text-xl font-semibold text-indigo-700 mb-4 pt-5 border-b border-indigo-100">
        Submitted Documents
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {docTypes.map(({ key, label, url }) => (
          <DocumentThumbnail key={key} label={label} url={url} />
        ))}
      </div>
    </section>
  );
};

const DocumentThumbnail = ({ label, url }) => {
  const handleClick = () => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="border rounded-lg p-3 text-center hover:shadow-md transition-shadow">
      {url ? (
        <button
          onClick={handleClick}
          className="w-full text-blue-600 hover:underline font-medium"
        >
          📄 View {label}
        </button>
      ) : (
        <p className="text-gray-400">❌ Not submitted</p>
      )}
      {url && (
        <p className="text-xs text-gray-500 mt-2 truncate">
          {url.split("/").pop()} {/* Show filename */}
        </p>
      )}
    </div>
  );
};
