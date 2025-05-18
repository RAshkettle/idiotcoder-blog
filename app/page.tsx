import {
  Calendar,
  ChevronRight,
  Gamepad2,
  Tag,
  Terminal,
  User,
} from "lucide-react";
import Link from "next/link";
import CommanderProfile from "../components/commander-profile";

export default function Home() {
  return (
    <main className="min-h-screen bg-black font-mono relative overflow-hidden">
      {/* CRT and Scanlines Effect - Much more pronounced now */}
      <div className="pointer-events-none fixed inset-0 bg-scanline z-50"></div>
      <div className="pointer-events-none fixed inset-0 bg-crt-glow z-40"></div>

      {/* RTS-style background */}
      <div className="fixed inset-0 bg-[url('/placeholder.svg?height=100&width=100&text=BG')] bg-repeat opacity-10 z-0"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* RTS-style header panel */}
        <header className="rts-panel mb-8 p-1">
          <div className="rts-panel-inner p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rts-button-square p-1 w-10 h-10 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-amber-400 glow">
                Idiotcoder.com
              </h1>
            </div>
            <nav>
              <ul className="flex gap-4">
                {["HOME", "PROJECTS", "GAME_JAMS", "ABOUT"].map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="rts-button px-3 py-1 inline-block"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main content area */}
          <div className="md:col-span-3">
            {/* Resources bar - RTS style */}
            <div className="rts-resource-bar mb-6 flex justify-between items-center">
              <div className="rts-resource flex items-center gap-2">
                <div className="rts-resource-icon w-8 h-8 flex items-center justify-center">
                  <span className="text-yellow-400">⚙️</span>
                </div>
                <span className="text-yellow-400">POSTS: 42</span>
              </div>
              <div className="rts-resource flex items-center gap-2">
                <div className="rts-resource-icon w-8 h-8 flex items-center justify-center">
                  <span className="text-green-400">🏆</span>
                </div>
                <span className="text-green-400">JAMS: 12</span>
              </div>
              <div className="rts-resource flex items-center gap-2">
                <div className="rts-resource-icon w-8 h-8 flex items-center justify-center">
                  <span className="text-blue-400">💾</span>
                </div>
                <span className="text-blue-400">PROJECTS: 8</span>
              </div>
            </div>

            {/* Featured post - RTS panel style */}
            <div className="rts-panel mb-6">
              <div className="rts-panel-header px-3 py-1">
                <h2 className="text-lg font-bold text-amber-400">
                  MISSION_BRIEFING
                </h2>
              </div>
              <div className="rts-panel-inner p-4">
                <article>
                  <h3 className="text-xl font-bold mb-2 text-amber-300">
                    Ludum Dare 54: "Pixel Panic" Post-Mortem
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-amber-400/70 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> 10.15.2023
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> COMMANDER
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> GAME_JAM
                    </span>
                  </div>
                  <div className="relative aspect-video mb-4 rts-screen overflow-hidden">
                    <img
                      src="/placeholder.svg?height=400&width=800&text=GAME_SCREENSHOT"
                      alt="Pixel Panic Game Screenshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-scanline opacity-30"></div>
                  </div>
                  <p className="mb-4 leading-relaxed text-amber-100">
                    &gt; MISSION REPORT: Just completed Ludum Dare 54 with my
                    entry "Pixel Panic". The theme was "Limited Space" so I
                    created a tactical resource management game where you
                    command units in an increasingly cramped battlefield. The
                    48-hour time constraint was challenging, but the core
                    mechanics are solid...
                  </p>
                  <div className="flex justify-end">
                    <Link
                      href="#"
                      className="rts-button px-4 py-2 inline-flex items-center gap-2"
                    >
                      FULL_REPORT <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              </div>
            </div>

            {/* Recent posts - RTS panel style */}
            <div className="rts-panel">
              <div className="rts-panel-header px-3 py-1">
                <h2 className="text-lg font-bold text-amber-400">
                  INTELLIGENCE_ARCHIVE
                </h2>
              </div>
              <div className="rts-panel-inner p-4">
                <div className="grid gap-6">
                  {[1, 2, 3].map((post) => (
                    <article key={post} className="grid md:grid-cols-4 gap-4">
                      <div className="rts-screen aspect-video md:aspect-square overflow-hidden">
                        <img
                          src={`/placeholder.svg?height=200&width=200&text=INTEL_${post}`}
                          alt={`Post ${post} thumbnail`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-scanline opacity-30"></div>
                      </div>
                      <div className="md:col-span-3">
                        <h3 className="text-lg font-bold mb-2 text-amber-300">
                          {post === 1 &&
                            "Tactical Guide: Pixel-Perfect Collision Detection"}
                          {post === 2 &&
                            "Command Center Setup: Tools and Software"}
                          {post === 3 &&
                            "Sound Engineering: Creating Authentic RTS Audio"}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-amber-400/70 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{" "}
                            {`10.${5 + post}.2023`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {post === 1 && "TACTICAL"}
                            {post === 2 && "EQUIPMENT"}
                            {post === 3 && "COMMS"}
                          </span>
                        </div>
                        <p className="text-sm mb-2 line-clamp-2 text-amber-100">
                          {post === 1 &&
                            "&gt; TACTICAL REPORT: This guide outlines advanced collision detection strategies for your 2D games. Essential for creating responsive unit movement and combat..."}
                          {post === 2 &&
                            "&gt; EQUIPMENT MANIFEST: A complete breakdown of all hardware and software in my command center. From development environments to asset creation tools..."}
                          {post === 3 &&
                            "&gt; COMMUNICATIONS LOG: Creating authentic RTS sound effects and unit acknowledgments can significantly enhance player immersion. Here's my process..."}
                        </p>
                        <Link
                          href="#"
                          className="rts-button-small px-2 py-1 inline-flex items-center gap-1"
                        >
                          ACCESS <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - RTS style */}
          <div className="md:col-span-1">
            {/* Mini-map style about section */}
            <CommanderProfile />
            {/* Game jams section */}
            <div className="rts-panel mb-6">
              <div className="rts-panel-header px-3 py-1">
                <h2 className="text-lg font-bold text-amber-400">
                  BATTLE_RECORDS
                </h2>
              </div>
              <div className="rts-panel-inner p-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <div className="rts-button-square w-6 h-6 flex items-center justify-center">
                      <Gamepad2 className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="text-sm text-amber-100">
                      Ludum Dare 54
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="rts-button-square w-6 h-6 flex items-center justify-center">
                      <Gamepad2 className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="text-sm text-amber-100">
                      Global Game Jam 2023
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="rts-button-square w-6 h-6 flex items-center justify-center">
                      <Gamepad2 className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="text-sm text-amber-100">
                      js13kGames 2022
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="rts-button-square w-6 h-6 flex items-center justify-center">
                      <Gamepad2 className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="text-sm text-amber-100">
                      GMTK Game Jam 2022
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tags section */}
            <div className="rts-panel">
              <div className="rts-panel-header px-3 py-1">
                <h2 className="text-lg font-bold text-amber-400">
                  UNIT_CATEGORIES
                </h2>
              </div>
              <div className="rts-panel-inner p-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "STRATEGY",
                    "PIXEL_ART",
                    "GAME_JAM",
                    "UNITY",
                    "GODOT",
                    "TUTORIAL",
                    "DEVLOG",
                    "RETRO",
                    "AUDIO",
                    "TACTICS",
                    "DESIGN",
                    "TOOLS",
                  ].map((tag) => (
                    <Link
                      key={tag}
                      href="#"
                      className="rts-button-small py-1 text-center text-xs"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
