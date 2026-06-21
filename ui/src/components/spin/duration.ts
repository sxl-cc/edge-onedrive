export function getAnimationDurationMs(element?: HTMLElement | null): number {
  if (!element) {
    return 0;
  }
  const styles = getComputedStyle(element);
  const durationString = styles.animationDuration || "0s";
  const duration = Number.parseFloat(durationString);
  return durationString.endsWith("ms") ? duration : duration * 1000;
}
