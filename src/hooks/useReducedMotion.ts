import { useEffect, useState } from 'react'

/**
 * Whether the visitor asked for reduced motion.
 *
 * Starts false so the server-rendered markup and the first client render agree;
 * the real value lands in an effect. Anything gated on this must therefore be
 * safe to show for one frame.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
