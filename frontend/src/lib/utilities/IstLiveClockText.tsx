import { useIstLiveClock } from "./istTime";

/**
 * Isolated component for rendering the live IST HH:MM clock so parent pages
 * never re-render when the clock ticks.
 */
export function IstLiveClockText() {
  const clock = useIstLiveClock(15000);
  return <>{clock.time}</>;
}
