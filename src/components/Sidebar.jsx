"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Mic, MonitorSmartphone, Tv } from "lucide-react";
import ApertureMark from "./ApertureMark";
import { useDevices } from "@/lib/useDevices";

const navItems = [
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/voice", label: "Voice", icon: Mic },
];

export default function Sidebar() {
  const pathname = usePathname();
  const devices = useDevices();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-hairline bg-panel">
      <div className="flex items-center gap-2 px-5 py-5">
        <ApertureMark size={24} className="text-amber" />
        <span className="font-display text-lg font-semibold tracking-tight text-paper">
          Vision AI
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            href={to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === to
                ? "bg-panel2 text-paper"
                : "text-muted hover:bg-panel2/60 hover:text-paper"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto px-3 pb-5">
        <p className="px-3 pb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
          Devices in view
        </p>
        <div className="flex flex-col gap-1">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-paper/90"
            >
              {device.kind === "display" ? (
                <Tv size={15} className={device.online ? "text-cyan" : "text-muted"} />
              ) : (
                <MonitorSmartphone size={15} className={device.online ? "text-cyan" : "text-muted"} />
              )}
              <span className={device.online ? "" : "text-muted"}>{device.name}</span>
              <span
                className={`ml-auto h-1.5 w-1.5 rounded-full ${
                  device.online ? "bg-cyan" : "bg-hairline"
                }`}
                aria-label={device.online ? "online" : "offline"}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
