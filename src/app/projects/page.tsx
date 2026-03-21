'use client';

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <h1 className="text-lg font-bold text-center text-gray-900">Проекты</h1>
      </div>

      <div className="text-center py-12 px-4">
        <div className="text-5xl mb-4">🏗️</div>
        <p className="text-gray-500 font-medium">Инвестиционные проекты</p>
        <p className="text-gray-400 text-sm mt-1">
          Появится в Фазе 3 — P&L по виллам и другим проектам
        </p>
      </div>
    </div>
  );
}
