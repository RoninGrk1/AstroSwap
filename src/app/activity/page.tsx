import { ActivityPanel } from "@/components/activity/ActivityPanel";

export const metadata = {
  title: "Activity · AstroSwap",
};

export default function ActivityPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-lg">
      <div className="mb-5 text-center sm:mb-6 sm:text-left">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-violet-300/70">
          Explore Beyond
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Transaction activity
        </h1>
      </div>
      <ActivityPanel />
    </div>
  );
}
