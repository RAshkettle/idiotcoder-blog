---
title: "2025 Ebitengine Game Jam"
date: "06-23-2025"
categories: ["puzzle"]
article_type: "GAME_JAM"
image: "union/union.png"
---

# 2025 Ebitengine Game Jam

[Jam Page](https://idiotcoder.itch.io/un-ion)

The theme was UNION, which I chose to interpret as UN-ION (to remove the charge from particles).

Basic gameplay loop is to place tetris pieces. As pieces are placed, positive and negative charged blocks will neutralize out and disappear, scoring points.
You need 4 or more in a row horizontally where the + and - equals zero.  
Neutral blocks break up chains.

## Storms

When 4 or more blocks of the same charge exist vertically, a storm is created. Every 3 seconds, a neutral block will be spawned from this in a random row. Break these apart fast to neutralize them.

My entry was pretty straightforward and easy to implement. However, I found the sound to be vexing when used in webassembly. I'm going to need to look closely at Ebitengine's audio libraries and see how to optimize them (or use another entirely for sound).

I'll make a tutorial on this game and link it here when finished.
