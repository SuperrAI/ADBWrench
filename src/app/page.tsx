export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-neutral-900">SuperrWrench</h1>
        <p className="text-lg text-neutral-600">
          Browser-based Android device debugging and management
        </p>
        <p className="text-sm text-neutral-400">
          Connect your Android device via USB to get started
        </p>
      </div>
    </main>
  );
}
