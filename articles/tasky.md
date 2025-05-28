---
title: "Tasky"
date: "05-28-2025"
categories: ["tools", "design", "devlog"]
article_type: "MISC"
---

# Tasky

Every single time I start a new game jam, I find myself looking for some planning tools. You know the drill. Head over to find a trello board, find somewhere to keep small todos, maybe bring up something for more concrete notes...

So, I finally got an itch to make them for myself. So, I put together this little webapp to contain all these tools. Its a work in progress and probably will be for quite some time, but I wanted to share it in case it help anybody else.  
So, I built some tools.

1.  Kanban Board - easy to track features
2.  ToDo - simple post-it notes for keeping track of things too small to be on the kanban board
3.  Issues - Central place to track bugs. Syncs with Kanban board and turns issue into a task once it moves past investigation.
4.  Notes - Markdown note editor

These are all project based, so even though it's using local storage, it can handle multiple projects/jams at once.

While doing this, I decided to just play around and styled it as a generic saas offering. I even went in and filled out all the pricing and such as a joke (you will see). Ignore all that, I was just getting carried away.

The whole thing is fully open source and free. You can run it locally, or host it on a site like vercel or netlify. Everything stores to local storage, which was enough for my needs, but I may allow for configuration to store on something more permenant like PostgreSQL.

The code can be found in my [github repo](https://github.com/RAshkettle/tasky). If you want to try it out, it's also hosted [here](https://idiotcoder-tasky.netlify.app/)

Do keep in mind, this is a work in progress and not a real high priority...it has bugs.
