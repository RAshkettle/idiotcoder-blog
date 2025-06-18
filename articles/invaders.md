---
title: "Invaders"
date: "06-16-2025"
article_type: "TUTORIALS"
categories: ["go", "tutorial"]
---

# Invaders - Creating a Space Invaders remake game with Ebitengine (IN PROGRESS)

I'm very much all about retro gaming. Particularly I have a soft spot for Space Invaders. When the game came out, I lived 3 short blocks from an Arcade that got it in. I remember spending every cent of my paper route money in one night. I was obsesed...
![go invaders](invaders/go-invaders.png).

The first thing we want to do it a good old `go mod init Invaders`

Now we want to create a folder and call it `assets`. There are a good number of assets in this game, and since I created all of these, feel free to swipe them for yourself [here](https://github.com/RAshkettle/go-Invaders--tutorial). Grab everything in the assets subdirectory, including `assets.go`. We will be explaining everything next, but if you don't want to type it all out, there it is.

I like starting with painting the basic layout of the game first, so we will want to load the assets. In doing so, we will be creating an embedded filesystem (our assets will be embedded into our executable). This will make deploying the game much easier, and allow for less manipulation shenanigans.

Let us create a file in the root of our `assets` folder and call it `assets.go`.

```go
package assets
import (
	"bytes"
	"embed"
	"image"

	"github.com/hajimehoshi/ebiten/v2"
)

//go:embed *
var assets embed.FS
```

So, all we have done so far is to create a package for our embedded filesystem. Remember that in Go, packages are based off directory.  
After that, we imported some simple libraries we are going to need.  
Lastly, we create our embedded filesystem. NOTE: _*The comment is absolutely necessary*_.

Next we need some helpers to load everything. First, let's set up Audio.

```go
func loadAudio(filePath string) []byte {
	data, err := assets.ReadFile(filePath)
	if err != nil {
		panic(err)
	}
	return data
}
```

This simply loads up the audio file. It does not decode it, just loads it into memory for us.

Next comes image loading. We cannot use ebitenutils here because of the embedded filesystem. Still, it's kind of simple. Let's load the files.

```go
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

If you look at the assets, the aliens are 2 frames. In Space Invaders, there are 2 frames to the animation and they toggle between them each time they move. Since this type of animation isn't our usual cup of tea, let's handle this in the simpelist way possible.

```go
func splitImage(spriteSheet *ebiten.Image) []*ebiten.Image {
	const invaderSize = 16

	firstFrame := spriteSheet.SubImage(image.Rect(0, 0, invaderSize, invaderSize)).(*ebiten.Image)
	secondFrame := spriteSheet.SubImage(image.Rect(invaderSize, 0, invaderSize*2, invaderSize)).(*ebiten.Image)

	return []*ebiten.Image{firstFrame, secondFrame}
}
```

This function simply returns a slice with the two animation frames.

The Base is also a bit different, so we need to handle it differently. Bases in Space Invaders are destructable by section. I've choses to make the bases out of 16x16 blocks. Each frame of the block is that block with more damage. A block has 3 health, so it's perfect. You will also note it's pretty much the same as the function above. I considered refactoring it, but in the end, it didn't seem worth the effort. It's up to you.

```go
func splitBaseImage(spriteSheet *ebiten.Image) []*ebiten.Image {
	const tileSize = 16
	first := spriteSheet.SubImage(image.Rect(0, 0, tileSize, tileSize)).(*ebiten.Image)
	second := spriteSheet.SubImage(image.Rect(tileSize, 0, tileSize*2, tileSize)).(*ebiten.Image)
	third := spriteSheet.SubImage(image.Rect(tileSize*2, 0, tileSize*3, tileSize)).(*ebiten.Image)
	return []*ebiten.Image{first, second, third}
}
```

Ok, so back up where we created the embed, add all of this. Don't worry about it, all it's doing is calling the helper functions to load the assets we need for the entire game. This will load them on game launch, so works as a pre-loader.

```go
var (
	topInvaderSpriteSheet    = loadImage("invaders/topInvader.png")
	middleInvaderSpriteSheet = loadImage("invaders/middleInvader.png")
	bottomInvaderSpriteSheet = loadImage("invaders/bottomInvader.png")

	TopInvaderAnimation    = splitImage(topInvaderSpriteSheet)
	MiddleInvaderAnimation = splitImage(middleInvaderSpriteSheet)
	BottomInvaderAnimation = splitImage(bottomInvaderSpriteSheet)

	Player     = loadImage("player/Player.png")
	PlayerShot = loadImage("player/PlayerShot.png")
	AlienShot  = loadImage("invaders/AlienShot.png")
	UFO        = loadImage("invaders/ufo.png")

	baseSpriteSheet = loadImage("player/base.png")
	BaseSprites     = splitBaseImage(baseSpriteSheet)

	MoveSound           = loadAudio("audio/move.ogg")
	PlayerShootSound    = loadAudio("audio/laserShoot.ogg")
	AlienExplosionSound = loadAudio("audio/alienexplosion.ogg")
	PlayerDeathSound    = loadAudio("audio/playerDeath.ogg")
	UFOSound            = loadAudio("audio/ufo.ogg")
)
```

If you haven't, remember the mighty `go mod tidy` which will handle all the `go get` work for you.

Go ahead and put that file away. We are finished with it. From this point on, you don't have to worry about loading any more assets.

Create `main.go`.

```go
package main

func main(){}
```

Close it up. This lets us compile at least. I do not like being in a broken state.

Now, nearly every game has different states or scenes. In our case, we can have a title scene, a game scene, and an end scene. We should create those as a skeleton first so we don't go crazy wiring it up later. Some things are just done easier up front. If I were making a base game template, it would contain an embedded filesystem with a few helpers, a scene manager, and the three mentioned scenes. If you were going to create one, that would be a good area to begin.

Create a new file called `scene_manager.go` and open it up.

Start by defining a scene type and creating an enum for them.

```go
package main


type SceneType int

const (
	SceneTitleScreen SceneType = iota
	SceneGame
	SceneEndScreen
)
```

Next we need to create an interface. Note that this is the same interface as Ebitengine's Game interface. This is not by accident.

```go


import "github.com/hajimehoshi/ebiten/v2"

[...]

type Scene interface {
	Update() error
	Draw(screen *ebiten.Image)
	Layout(outerWidth, outerHeight int) (int, int)
}
```

Note: Ignore any time I put [...] as that really just means _"some code is here"_.

Then we can start creating our SceneManager.

```go
type SceneManager struct {
	currentScene Scene
	sceneType    SceneType
}
```

Next, before we can continue, we need to create some scenes. They can be pretty empty for now, so let's create them all together.

`title_scene.go`.

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

type TitleScene struct {
	sceneManager *SceneManager
}

func (t *TitleScene) Update() error {
	return nil
}

func (t *TitleScene) Draw(screen *ebiten.Image) {

}

func (t *TitleScene) Layout(outerWidth, outerHeight int) (int, int) {
	return outerWidth, outerHeight
}

```

`game_scene.go`

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

type GameScene struct {
	sceneManager *SceneManager
}

func (g *GameScene) Update() error {
	return nil
}

func (g *GameScene) Draw(screen *ebiten.Image) {

}

func (g *GameScene) Layout(outerWidth, outerHeight int) (int, int) {
	return outerWidth, outerHeight
}

```

`end_scene.go`

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

type EndScene struct {
	sceneManager *SceneManager
}

func (e *EndScene) Update() error {
	return nil
}

func (e *EndScene) Draw(screen *ebiten.Image) {

}

func (e *EndScene) Layout(outerWidth, outerHeight int) (int, int) {
	return outerWidth, outerHeight
}
```

This let's us continue with our SceneManager. Back in `scene_manager.go`.

```go
type SceneManager struct {
	currentScene Scene
	sceneType    SceneType
	titleScene   *TitleScene
	gameScene    *GameScene
	endScene     *EndScene
}
```

Here we have added the three scenes to our struct. Now we need to make our SceneManager also adhere to our Scene Interface.

```go
func (sm *SceneManager) Update() error {
	return sm.currentScene.Update()
}

func (sm *SceneManager) Draw(screen *ebiten.Image) {
	sm.currentScene.Draw(screen)
}

func (sm *SceneManager) Layout(outerWidth, outerHeight int) (int, int) {
	return sm.currentScene.Layout(outerWidth, outerHeight)
}
```

This simply calls through to the active scene.
Add a constructor factory for each of the scenes. Just drop each of these into their respective files.
`title_scene.go`

```go
func NewTitleScene(sm *SceneManager) *TitleScene {
	return &TitleScene{
		sceneManager: sm,
	}
}
```

`game_scene.go`

```go
func NewGameScene(sm *SceneManager) *GameScene {

	return &GameScene{
		sceneManager: sm,

	}
}
```

`end_scene.go`

```go
func NewEndScene(sm *SceneManager) *EndScene {
	return &EndScene{
		sceneManager: sm,
	}
}
```

And with that, we can create our SceneManager factory now. Open `scene_manager.go`. For now, we will make our Game Scene the default. Later just by changing this, we will be able to transition scenes.

```go
func NewSceneManager() *SceneManager {
	sm := &SceneManager{
		sceneType: SceneTitleScreen,
	}

	sm.titleScene = NewTitleScene(sm)
	sm.gameScene = NewGameScene(sm)
	sm.endScene = NewEndScene(sm)

	sm.currentScene = sm.gameScene

	return sm
}
```

With that, let's get a screen launching FINALLY!
Open `main.go` back up and change it to this.

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

func main() {
	ebiten.SetWindowResizingMode(ebiten.WindowResizingModeEnabled)
	ebiten.SetWindowTitle("Invaders")
	ebiten.SetWindowSize(640, 480)

	sceneManager := NewSceneManager()

	err := ebiten.RunGame(sceneManager)
	if err != nil {
		panic(err)
	}
}
```

We are setting up our window here and creating a new SceneManager. This is the last for main.go, so feel free to close it.

Now type `go run .` and you should see this...
![blank screen](invaders/blankScreen.png)

I know. Not very exciting. However, we now have everything we need to start cooking. Let's get moving!
