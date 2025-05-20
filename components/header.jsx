import { Terminal } from "lucide-react";
import Link from "next/link";

const Header = () => {
  return (
    <header className="rts-panel mb-8 p-1 z-[60] relative">
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
                  href={`/${item.toLowerCase()}`}
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
  );
};

export default Header;
