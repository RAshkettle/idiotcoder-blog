import Link from "next/link";

const CommanderProfile = () => {
  return (
    <div className="rts-panel mb-6">
      <div className="rts-panel-header px-3 py-1">
        <h2 className="text-lg font-bold text-amber-400">COMMANDER_PROFILE</h2>
      </div>
      <div className="rts-panel-inner p-4">
        <div className="text-center mb-4">
          <div className="w-24 h-24 mx-auto relative mb-2 rts-screen rounded-full overflow-hidden">
            <img
              src="/me.svg?height=100&width=100&text=CMDR"
              alt="Idiotcoder Avatar"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-scanline opacity-30"></div>
          </div>
          <h3 className="font-bold text-amber-300">Idiotcoder</h3>
          <p className="text-xs text-amber-400/70">Tactical Game Developer</p>
        </div>
        <p className="text-sm mb-4 text-amber-100">
          &gt; PERSONNEL FILE: Specialized in tactical game design and
          retro-inspired strategy games. Veteran of multiple game jam campaigns
          with expertise in pixel art and game mechanics.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="https://www.github.com/RAshkettle"
            target="_blank"
            className="rts-button-small py-1 text-center"
          >
            GITHUB
          </Link>
          <Link
            href="https://fatoldyeti.itch.io/"
            target="_blank"
            className="rts-button-small py-1 text-center"
          >
            ITCH.IO
          </Link>
          <Link
            href="https://discordapp.com/users/138461747802669056"
            target="_blank"
            className="rts-button-small py-1 text-center"
          >
            Discord
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CommanderProfile;
