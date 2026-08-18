// src/components/ToastContainer.js
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Zoom } from 'react-toastify';

const CustomToastContainer: React.FC = () => {
  return (
    <ToastContainer
    position="bottom-center"
    autoClose={4000}
    hideProgressBar
    newestOnTop={false}
    closeOnClick={false}
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="dark"
    transition={Zoom}
    toastStyle={{ width: 'auto', fontSize:'15px', padding:'15px 35px 15px 20px', minHeight:'auto'}}
    />
  );
};

export default CustomToastContainer;
