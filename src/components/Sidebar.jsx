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
    <aside className="flex h-full w-16 shrink-0 flex-col border-r border-hairline bg-panel md:w-64">
      <div className="flex items-center justify-center gap-2 px-2 py-5 md:justify-start md:px-5">
        <ApertureMark size={24} className="text-amber" />
        <span className="hidden font-display text-lg font-semibold tracking-tight text-paper md:block">
          Vision AI
        </span>
      </div>

      <nav className="flex flex-col items-center gap-1 px-2 md:items-stretch md:px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            href={to}
            title={label}
            aria-label={label}
            className={`flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors md:justify-start md:px-3 ${
              pathname === to
                ? "bg-panel2 text-paper"
                : "text-muted hover:bg-panel2/60 hover:text-paper"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            <span className="hidden md:inline">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto hidden px-3 pb-5 md:block">
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
