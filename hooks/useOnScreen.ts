
import { useState, useEffect, MutableRefObject } from 'react';

export function useOnScreen<T extends Element>(ref: MutableRefObject<T | null>, rootMargin: string = '0px'): boolean {
  const [isIntersecting, setIntersecting] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersecting(entry.isIntersecting);
      },
      {
        rootMargin,
        threshold: 0.1 // Slightly less sensitive than 0
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [ref, rootMargin]); // Re-run only if ref or margin changes

  return isIntersecting;
}
