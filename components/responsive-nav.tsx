"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ScanlineToggle from "./scanline-toggle";

export default function ResponsiveNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const menuItems = [
    { label: "TUTORIALS", href: "/tutorials" },
    { label: "GAME_JAMS", href: "/jams" },
    { label: "MISC", href: "/misc" },
    { label: "GAMES", href: "/games/tower-defender" },
    { label: "ABOUT", href: "/about" },
  ];

  return (
    <nav className="z-10">
      {/* Desktop Navigation */}
      <ul className="hidden md:flex gap-4 items-center">
        <li key="TUTORIALS">
          <Link href="/tutorials" className="rts-button px-3 py-1 inline-block">
            TUTORIALS
          </Link>
        </li>
        <li key="GAME_JAMS">
          <Link href="/jams" className="rts-button px-3 py-1 inline-block">
            GAME_JAMS
          </Link>
        </li>
        <li key="MISC">
          <Link href="/misc" className="rts-button px-3 py-1 inline-block">
            MISC
          </Link>
        </li>
        <li key="GAMES">
          <Link href="/games" className="rts-button px-3 py-1 inline-block">
            GAMES
          </Link>
        </li>
        <li key="ABOUT">
          <Link href="/about" className="rts-button px-3 py-1 inline-block">
            ABOUT
          </Link>
        </li>
        <li>
          <ScanlineToggle />
        </li>
      </ul>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center gap-2">
        <ScanlineToggle />
        <button
          onClick={toggleMenu}
          className="rts-button-square p-1 w-8 h-8 flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-4 h-4 text-amber-400" />
          ) : (
            <Menu className="w-4 h-4 text-amber-400" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div className="absolute top-full right-0 mt-2 w-48 rts-panel z-50 md:hidden">
            <div className="rts-panel-inner p-2">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="rts-button px-3 py-2 block text-center w-full"
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
