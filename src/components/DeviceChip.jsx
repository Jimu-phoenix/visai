export default function DeviceChip({ device, active, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!device.online}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
        active
          ? "border-amber bg-amber/10 text-amber"
          : "border-hairline text-muted hover:text-paper disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${device.online ? "bg-cyan" : "bg-hairline"}`}
      />
      {device.name}
    </button>
  );
}
