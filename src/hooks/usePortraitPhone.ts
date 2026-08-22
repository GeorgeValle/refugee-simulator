import { useEffect, useState } from "react";

const PORTRAIT_PHONE_QUERY = "(orientation: portrait) and (max-width: 767px)";

export function usePortraitPhone(): boolean {
  const [isPortraitPhone, setIsPortraitPhone] = useState(
    () => typeof window !== "undefined" && window.matchMedia(PORTRAIT_PHONE_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(PORTRAIT_PHONE_QUERY);
    const update = () => setIsPortraitPhone(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isPortraitPhone;
}
