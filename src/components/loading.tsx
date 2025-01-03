import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const Loading = () => (
  <div className="flex items-center justify-center h-full">
    <FaSpinner className="animate-spin text-blue-500 h-8 w-8" />
    <span className="ml-4 text-lg text-blue-500">Đang tải dữ liệu...</span>
  </div>
);

export default Loading;
