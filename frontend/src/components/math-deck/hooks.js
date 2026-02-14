import { useState, useEffect, useRef } from "react";
import { isBrowser } from "./utils";

/**
 * Hook to detect when an element enters the viewport once.
 * Useful for lazy rendering math blocks for performance.
 */
export function useInViewOnce(rootMargin = "200px") {
    const [inView, setInView] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!isBrowser || !ref.current || inView) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.unobserve(ref.current);
                }
            },
            { rootMargin }
        );

        observer.observe(ref.current);

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [inView, rootMargin]);

    return { ref, inView };
}
