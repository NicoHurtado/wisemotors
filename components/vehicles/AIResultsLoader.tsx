'use client';

export function AIResultsLoader() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16">
      {/* Loading normal */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-wise border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-xl font-semibold text-gray-800">Analizando tu petición…</p>
        <p className="text-gray-500 mt-1">Comparando especificaciones y encontrando el mejor match</p>
      </div>
    </div>
  );
}
