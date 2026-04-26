import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AutoLogout = ({ timeoutMinutes = 15 }) => {
  const navigate = useNavigate();
  
  // 🟢 Use refs to track timer IDs and avoid unnecessary re-renders
  const logoutTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const warningToastId = useRef(null);

  useEffect(() => {
    const clearAllTimers = () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };

    const resetTimer = () => {
      clearAllTimers();

      // 1. Set the Warning Timer (Trigger 2 minutes before the actual logout)
      const warningDelay = (timeoutMinutes - 2) * 60 * 1000;
      
      warningTimerRef.current = setTimeout(() => {
        showExpiryWarning();
      }, warningDelay);

      // 2. Set the Actual Logout Timer
      const logoutDelay = timeoutMinutes * 60 * 1000;
      
      logoutTimerRef.current = setTimeout(() => {
        performLogout();
      }, logoutDelay);
    };

    const showExpiryWarning = () => {
      // 🟢 LOW-04 FIX: Show warning toast with a "Stay Logged In" action button
      warningToastId.current = toast.warning(
        ({ closeToast }) => (
          <div>
            <p style={{ margin: '0 0 10px 0' }}>Your session expires in 2 minutes due to inactivity.</p>
            <button 
              onClick={() => {
                resetTimer(); // Restarts the 15-minute clock
                closeToast(); // Closes the warning
              }}
              style={{
                background: '#fff',
                color: '#f59e0b',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: '900',
                fontSize: '11px',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              Stay Logged In
            </button>
          </div>
        ),
        {
          position: "top-center",
          autoClose: false, // Keep open until user clicks or logout occurs
          closeOnClick: false,
          draggable: false,
          toastId: 'session-warning' // Prevent duplicate warnings
        }
      );
    };

    const performLogout = () => {
      // Clear any remaining warning toast
      if (warningToastId.current) toast.dismiss(warningToastId.current);
      
      sessionStorage.clear(); // 🛑 Wipe security token
      toast.error("Session expired. Please log in again.", { toastId: 'session-expired' });
      navigate('/login');
    };

    // Listen for activity to reset the timer
    const events = ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress'];
    
    const handleActivity = () => {
        // Only reset if a warning isn't currently active 
        // (This prevents a mouse move from accidentally dismissing the warning)
        if (!toast.isActive('session-warning')) {
            resetTimer();
        }
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer(); // Start the clock on mount

    return () => {
      clearAllTimers();
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [navigate, timeoutMinutes]);

  return null; 
};

export default AutoLogout;