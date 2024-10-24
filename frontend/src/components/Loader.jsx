import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader;
