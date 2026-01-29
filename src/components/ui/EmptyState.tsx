interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
      <span className="text-4xl">{icon}</span>
      <p className="mt-3 text-lg font-semibold text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-[#03C75A] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02b350]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
