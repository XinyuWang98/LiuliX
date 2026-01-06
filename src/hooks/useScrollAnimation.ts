import { useEffect, useRef, useState } from 'react';

/**
 * 滚动动画Hook
 * 当元素进入视口时触发动画
 * 
 * @param threshold - 触发阈值（0-1），默认0.1表示元素10%可见时触发
 * @param triggerOnce - 是否只触发一次，默认true
 * @returns [ref, isVisible] - 返回ref和可见状态
 */
export function useScrollAnimation(threshold = 0.1, triggerOnce = true) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            {
                threshold,
                rootMargin: '0px 0px -50px 0px', // 提前50px触发
            }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [threshold, triggerOnce]);

    return [ref, isVisible] as const;
}
