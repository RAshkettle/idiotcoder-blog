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

  const menuItems = ["TUTORIALS", "GAME_JAMS", "MISC", "ABOUT"];

  return (
    <nav className="z-10">
      {/* Desktop Navigation */}
      <ul className="hidden md:flex gap-4 items-center">
        {menuItems.map((item) => (
          <li key={item}>
            <Link href="#" className="rts-button px-3 py-1 inline-block">
              {item}
            </Link>
          </li>
        ))}
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
                  <li key={item}>
                    <Link
                      href="#"
                      className="rts-button px-3 py-2 block text-center w-full"
                      onClick={closeMenu}
                    >
                      {item}
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
