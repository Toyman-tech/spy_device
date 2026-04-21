import StatusIndicator from "@/components/StatusIndicator";
import RecordingsGrid from "@/components/RecordingsGrid";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="container">
      <div className="header-actions">
        <ThemeToggle />
      </div>
      <header className="header">
        <h1>Spy Recon Dashboard</h1>
        <p>Live monitoring & secure audio intelligence system</p>
      </header>

      <main>
        <StatusIndicator />
        <RecordingsGrid />
      </main>
    </div>
  );
}
