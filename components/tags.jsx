import Link from "next/link";

const Tags = () => {
  return (
    <div className="rts-panel">
      <div className="rts-panel-header px-3 py-1">
        <h2 className="text-lg font-bold text-amber-400">UNIT_CATEGORIES</h2>
      </div>
      <div className="rts-panel-inner p-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            "STRATEGY",
            "PIXEL_ART",
            "GAME_JAM",
            "GO",
            "THREEJS",
            "TUTORIAL",
            "DEVLOG",
            "AUDIO",
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
  );
};

export default Tags;
