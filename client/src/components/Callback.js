import { useEffect, useRef } from 'react';
import axios from 'axios';

const Callback = () => {
  const hasFetched = useRef(false); // Prevent duplicate calls
  
  const getAccessToken = async () => {
    if (hasFetched.current) return; // Prevent duplicate execution
    hasFetched.current = true;

    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');

    if (code) {
      sessionStorage.setItem("authCode", code);

      try {
        await axios.post(
          `${process.env.REACT_APP_BASE_URL}/api/upstox/generateAccessToken`,
          { code }
        );

        // Ensure parent window exists and is ready
        if (window.opener && !window.opener.closed) {
          // Send message and wait briefly to ensure it's received
          window.opener.postMessage('authComplete', '*');
          setTimeout(() => {
            window.close();
          }, 100);
        } else {
          // Fallback if window.opener is not available
          window.location.href = '/dashboard';
          window.opener?.location.reload();
        }
      } catch (error) {
        alert("Failed to generate access token");
        window.location.href = '/dashboard';
        window.opener?.location.reload();
      }

    } else {
      console.error('No authorization code found');
    }
  };

  useEffect(() => {
    // Add message listener for parent window
    const handleMessage = (event) => {
      if (event.data === 'authComplete') {
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    getAccessToken();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return <div>Authorization successful. You can close this window.</div>;
};

export default Callback;
