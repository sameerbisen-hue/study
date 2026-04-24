import { useEffect, useState } from "react";
import Upload from "../pages/Upload";
import UploadMobileAuthFix from "../pages/UploadMobileAuthFix";

export default function UploadRouter() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <UploadMobileAuthFix /> : <Upload />;
}
