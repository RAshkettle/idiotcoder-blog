---
title: "Embed"
date: "05-29-2025"
article_type: "TUTORIALS"
categories: ["tools", "go", "tutorial"]
---

# Embed

Go version 1.16 released with the embed package. I didn't give it much thought for far too long. A couple months ago, I was writing a web server in go and realized I could embed all the assets and keep it all in one exe.  
My initial thoughts were that it was really cool to just need to relase one exe and nothing else. Then I realized that directory path walking would be a bit more difficult given an embedded filesystem. That led me to start really looking at the package and what it provides.

For games, it lets us embed our assets into our application, again making it so when we release an exe, that's all they need. It also solves the problem of how to protect, encrypt, etc...all your assets.

Using this is totally optional. Whether or not you choose to, take the time to understand it. It's definitely something worth knowing more about.
Also, keep in mind that this technique and package is not just tied to game development.

So..let us begin.

_All code and assets for this tutorial can be found [here](https://github.com/RAshkettle/embed-tutorial)._

We will start with the basic ebitengine application.

```go
import (
	"github.com/hajimehoshi/ebiten/v2"
)

type Game struct{}

func (g *Game) Draw(screen *ebiten.Image) {}

func (g *Game) Layout(outerScreenWidth, outerScreenHeight int) (ScreenWidth, ScreenHeight int) {
	return 480, 320
}

func (g *Game) Update() error {
	return nil
}

func main() {
	g := &Game{}

	err := ebiten.RunGame(g)
	if err != nil {
		panic(err)
	}
}
```

Next create an assets folder. Place an image in it. I'm going to use a simple one from Kenney. For the purposes of this tutorial, it doesn't matter what you use. Beside the image, create a file and name it `assets.go`

I'm going to put the full contents of the file here and we will discuss below.

```go
package assets

import (
	"bytes"
	"embed"
	"image"
	_ "image/png"

	"github.com/hajimehoshi/ebiten/v2"
)

//go:embed *
var assets embed.FS

var PlayerSpriteImage = loadImage("images/red_character.png")

func loadImage(filePath string) *ebiten.Image {
	data, err := assets.ReadFile(filePath)
	if err != nil {
		panic(err)
	}

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		panic(err)
	}

	ebitenImg := ebiten.NewImageFromImage(img)
	return ebitenImg
}

```

Ok, it's not a lot, so let's dig in.
To start, we import embed. It's part of the standard library, which is great. Note the comment.

```go
//go:embed *
var assets embed.FS
```

This sets up our embedded filesystem and assigns it to the variable assets. Pay particular attention to that comment. It's not superflous, but required.

After we set up the filesystem, we can load the assets _almost_ the same as we would any other time. The only big thing to look out for here is that some of the helper functions in ebitenutils don't work with embedded filesystems.

Finishing up, we move back to `main.go`
Import our assets package:

```go
"embed_tutorial/assets"
```

add our image to the game struct

```go
type Game struct {
	player *ebiten.Image
}
```

change the main func to this (note: all we are doing here is adding the call to load the sprite):

```go
func main() {
	g := &Game{}
	g.player = assets.PlayerSpriteImage

	err := ebiten.RunGame(g)
	if err != nil {
		panic(err)
	}
}
```

We finish this off with the Draw func.

```go
func (g *Game) Draw(screen *ebiten.Image) {
	op := ebiten.DrawImageOptions{}
	op.GeoM.Translate(100.0, 30.0)
	screen.DrawImage(g.player, &op)
}
```

If all went well, you should see your image as normal.
![embed](embed.png)

Now's the fun part. Build your application and move it anywhere. No need to copy the assets folder, it's all in there.
