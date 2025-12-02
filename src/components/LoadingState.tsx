interface Props {
  message?: string;
}

export function LoadingState({
  message = "Loading queue...",
}: Readonly<Props>) {
  return (
    <div className="p-12 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
