import { useEffect } from "react";

export function useScrollLock(isLocked) {
  useEffect(() => {
    if (isLocked) {
      // Save current scroll position and body overflow
      const scrollY = window.scrollY;
      const originalStyle = window.getComputedStyle(document.body).overflow;
      
      // Lock scroll
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Restore scroll
        document.body.style.overflow = originalStyle;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}

export default useScrollLock;
