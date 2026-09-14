/** Placeholder chrome shown while the theme and CMS content load, so the page doesn't flash an unstyled or wrong-layout hero. */
export default function SiteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-20 bg-navbar-bg" />
      <div className="skeleton h-[30rem] w-full sm:h-[34rem]" />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="skeleton h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
