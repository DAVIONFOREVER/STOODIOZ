
import { useState, useEffect, MutableRefObject } from 'react';

export function useOnScreen<T extends Element>(ref: MutableRefObject<T | null>, rootMargin: string = '0px'): boolean {
  const [isIntersecting, setIntersecting] = useState<boolean>(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const element = ref.current;
    if (!element || !(element instanceof Element)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersecting(entry.isIntersecting);
      },
      {
        rootMargin,
        threshold: 0.1 // Slightly less sensitive than 0
      }
    );

    try {
      observer.observe(element);
    } catch {
      observer.disconnect();
      return;
    }

    return () => {
      try {
        observer.unobserve(element);
      } catch {
        // ignore if element is gone
      }
      observer.disconnect();
    };
  }, [ref, rootMargin]); // Re-run only if ref or margin changes

  return isIntersecting;
}
