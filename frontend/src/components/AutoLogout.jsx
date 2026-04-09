import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AutoLogout = ({ timeoutMinutes = 15 }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // Set timer to X minutes
      timeoutId = setTimeout(() => {
        sessionStorage.clear(); // 🛑 Wipe security token
        toast.error("Session expired due to inactivity. Please log in again.");
        navigate('/login');
      }, timeoutMinutes * 60 * 1000);
    };

    // Listen for ANY signs of life
    const events = ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // Start the clock on mount

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [navigate, timeoutMinutes]);

  return null; // 👻 This component renders nothing visually!
};

export default AutoLogout;