/**
 * Subtle grid-line background overlay with a radial fade mask.
 * Renders behind page content on public marketing pages.
 */
export default function GridBackground() {
  return (
    <div
      className="grid-background-overlay"
      aria-hidden="true"
    />
  );
}
