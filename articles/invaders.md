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

Ok, let's get the static scenes out of the way. We will spruce up the Title Scene first.

So, let's add some font references.

```go
type TitleScene struct {
	sceneManager *SceneManager
	titleFont    *text.GoTextFace
	subtitleFont *text.GoTextFace
}
```

And that means we need to change our factory...
Here we create our fonts.

```go
func NewTitleScene(sm *SceneManager) *TitleScene {
	// Create fonts
	titleFontSource, _ := text.NewGoTextFaceSource(bytes.NewReader(goregular.TTF))
	titleFont := &text.GoTextFace{
		Source: titleFontSource,
		Size:   48,
	}

	subtitleFontSource, _ := text.NewGoTextFaceSource(bytes.NewReader(goregular.TTF))
	subtitleFont := &text.GoTextFace{
		Source: subtitleFontSource,
		Size:   24,
	}

	return &TitleScene{
		sceneManager: sm,
		titleFont:    titleFont,
		subtitleFont: subtitleFont,
	}
}
```

When any Key is pressed, we want to start our game. Let's make sure mouse clicks count also.

```go
func (t *TitleScene) Update() error {
	// Check for key presses
	if ebiten.IsKeyPressed(ebiten.KeySpace) ||
		ebiten.IsKeyPressed(ebiten.KeyEnter) ||
		ebiten.IsKeyPressed(ebiten.KeyEscape) ||
		inpututil.IsKeyJustPressed(ebiten.KeyA) ||
		inpututil.IsKeyJustPressed(ebiten.KeyS) ||
		inpututil.IsKeyJustPressed(ebiten.KeyD) ||
		inpututil.IsKeyJustPressed(ebiten.KeyW) {
		t.sceneManager.TransitionTo(SceneGame)
		return nil
	}

	// Check for mouse clicks
	if inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft) ||
		inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonRight) {
		t.sceneManager.TransitionTo(SceneGame)
		return nil
	}

	return nil
}
```

Note: Now we need to have the TransitionTo method on our Scene Manager.

Open `scene_manager.go` and let's add this code. All it does is change the current scene. We could bruteforce this, but why? This lets us add rules later if we wish.

```go
func (sm *SceneManager) TransitionTo(sceneType SceneType) {
	sm.sceneType = sceneType

	switch sceneType {
	case SceneTitleScreen:
		sm.currentScene = sm.titleScene
	case SceneGame:
		sm.currentScene = sm.gameScene
	case SceneEndScreen:
		sm.currentScene = sm.endScene
	}
}
```

While we are in that file, look at the NewSceneManager factory and change the `sm.currentScene` to this

```go
sm.currentScene = sm.titleScene
```

Now let's finish our Title Scene. Update the Draw method to the following...

```go
func (t *TitleScene) Draw(screen *ebiten.Image) {
	screen.Fill(color.RGBA{10, 15, 25, 255})

	// Get screen dimensions
	w, h := screen.Bounds().Dx(), screen.Bounds().Dy()

	// Draw title
	titleText := "INVADERS"
	titleBounds, _ := text.Measure(titleText, t.titleFont, 0)
	titleX := (w - int(titleBounds)) / 2
	titleY := h/2 - 50

	op := &text.DrawOptions{}
	op.GeoM.Translate(float64(titleX), float64(titleY))
	op.ColorScale.ScaleWithColor(color.RGBA{220, 220, 255, 255})
	text.Draw(screen, titleText, t.titleFont, op)

	// Draw subtitle
	subtitleText := "Press any key to Start"
	subtitleBounds, _ := text.Measure(subtitleText, t.subtitleFont, 0)
	subtitleX := (w - int(subtitleBounds)) / 2
	subtitleY := titleY + 80

	op2 := &text.DrawOptions{}
	op2.GeoM.Translate(float64(subtitleX), float64(subtitleY))
	op2.ColorScale.ScaleWithColor(color.RGBA{180, 180, 200, 255})
	text.Draw(screen, subtitleText, t.subtitleFont, op2)
}
```

That is pretty much the same template I use for most of my title screens. You may want to add a loading screen, or others. You will do what your game needs.
Run the game and you should see this
![title screen](invaders/titleScreen.png)

When you click on the screen or press any key, you get a black screen again. This is because it transitioned to the Game Scene. So far, so good!

So let's get the Player on the screen.
Create a new file called `player.go`

We will just add a couple imports and some constants to make our lives easier.

```go
package main

import (
	"invaders/assets"
	"math"
	"github.com/hajimehoshi/ebiten/v2"
)
const (
	gameWidth           = 320
	gameHeight          = 240
	playerSpeed         = 2
)
```

Now let's create the Player Struct and its constructor. The Factory will create the player in the bottom center of the screen.

```go
type Player struct {
	Sprite     *ebiten.Image
	X          int
	Y          int
}

func NewPlayer() *Player {
	playerWidth := assets.Player.Bounds().Dx()
	playerHeight := assets.Player.Bounds().Dy()
	return &Player{
		Sprite:     assets.Player,
		X:          (gameWidth - playerWidth) / 2,
		Y:          gameHeight - playerHeight - 8,
	}
}
```

Next we need to update the player, looking for keypresses and reacting accordingly.

```go
func (p *Player) Update() error {
	// Player movement
	if ebiten.IsKeyPressed(ebiten.KeyArrowLeft) || ebiten.IsKeyPressed(ebiten.KeyA) {
		p.X -= playerSpeed
	}
	if ebiten.IsKeyPressed(ebiten.KeyArrowRight) || ebiten.IsKeyPressed(ebiten.KeyD) {
		p.X += playerSpeed
	}

	// Keep player within screen bounds
	playerSpriteWidth := p.Sprite.Bounds().Dx()
	if p.X < 0 {
		p.X = 0
	}
	if p.X+playerSpriteWidth > gameWidth {
		p.X = gameWidth - playerSpriteWidth
	}
	return nil
}
```

And there isn't much point in having the player if we can't see it on the screen.

```go
func (p *Player) Draw(screen *ebiten.Image){
	width, height := ebiten.WindowSize()
	scaledWidth := width / 320.0
	scaledHeight := height / 240.0
	scale := math.Min(float64(scaledWidth), float64(scaledHeight))

	// Calculate centering offsets
	gameWidth := 320.0 * scale
	gameHeight := 240.0 * scale
	offsetX := (float64(width) - gameWidth) / 2.0
	offsetY := (float64(height) - gameHeight) / 2.0

	op := &ebiten.DrawImageOptions{}
	op.GeoM.Scale(float64(scale), float64(scale))
	op.GeoM.Translate(float64(p.X)*scale+offsetX, float64(p.Y)*scale+offsetY)

	screen.DrawImage(p.Sprite, op)
}
```

Now we need to hook this up to our game scene. Open up `game_scene.go` and let's start by adding a reference to player onto our GameScene. We may as well update the factory also.

```go
type GameScene struct {
	sceneManager *SceneManager
	player *Player
}
func NewGameScene(sm *SceneManager) *GameScene {

	return &GameScene{
		sceneManager: sm,
		player: NewPlayer(),

	}
}
```

As you can see, that was a trivial change. The next part is just as simple. Update and Draw need to simply call the same methods on the Player Struct.

```go
func (g *GameScene) Update() error {
	err := g.player.Update()
	if err != nil{
		panic(err)
	}
	return nil
}

func (g *GameScene) Draw(screen *ebiten.Image) {
	g.player.Draw(screen)

}
```

Now run the game and click through the title screen. You should be rewarded with...
![player loaded](invaders/playerloaded.png)

Move the S/D or Arrow keys and you can see the player move.

The player needs bases to hide behind. Bases in Space Invaders are not just sprites. The base needs to be destructable in parts. Some iterations had single lines in the base destroyed, and some had the base made up of smaller squares that individually broke.  
We will follow the latter method. I'll give each block 3 health, and have a visual indicator for damage. When a block loses all its health, it's removed.
Let us create `base.go` and add a couple structs to it.

```go
package main

import (
	"invaders/assets"
	"math"

	"github.com/hajimehoshi/ebiten/v2"
)

type BaseBlock struct {
	Sprite      *ebiten.Image
	X           int
	Y           int
	DamageLevel int // 0 = no damage, 1-2 = damaged, 3 = destroyed (removed)
	Exists      bool
}

type Base struct {
	Blocks []*BaseBlock
	X      int
	Y      int
}
```

Base is really just a location for the groups, and all the blocks contained in that singlar base group. The BaseBlock represents an individual block within the base.

We need factories to create them. NewBaseBlock is simple. NewBase creates a collection of these blocks to create a group called Base.

```go
func NewBaseBlock(x, y int) *BaseBlock {
	return &BaseBlock{
		Sprite:      assets.BaseSprites[0], // Start with no damage frame
		X:           x,
		Y:           y,
		DamageLevel: 0,
		Exists:      true,
	}
}

func NewBase(baseX, baseY int) *Base {
	base := &Base{
		Blocks: make([]*BaseBlock, 0),
		X:      baseX,
		Y:      baseY,
	}

	for row := 0; row < 4; row++ {
		for col := 0; col < 4; col++ {
			blockX := baseX + (col * 8)
			blockY := baseY + (row * 8)

			// Skip bottom center blocks (archway effect)
			if row == 3 && (col == 1 || col == 2) {
				continue
			}

			block := NewBaseBlock(blockX, blockY)
			base.Blocks = append(base.Blocks, block)
		}
	}

	return base
}
```

Next we have a helper function to create all of our bases.

```go
func CreateBases(playerY int) []*Base {
	bases := make([]*Base, 4)

	// Calculate base positioning
	baseWidth := 4 * 8 // 4 blocks * 8 pixels each (scaled down 50%)
	screenWidth := 320
	spacing := (screenWidth - (4 * baseWidth)) / 5 // Equal spacing between and around bases

	baseY := playerY - 8 - (4 * 8) // 8 pixels above player, minus base height

	for i := 0; i < 4; i++ {
		baseX := spacing + (i * (baseWidth + spacing))
		bases[i] = NewBase(baseX, baseY)
	}

	return bases
}
```

And lastly, we need to draw the bases.

```go
func (b *Base) Draw(screen *ebiten.Image) {
	width, height := ebiten.WindowSize()
	scaledWidth := width / 320.0
	scaledHeight := height / 240.0
	scale := math.Min(float64(scaledWidth), float64(scaledHeight))

	// Calculate centering offsets
	gameWidth := 320.0 * scale
	gameHeight := 240.0 * scale
	offsetX := (float64(width) - gameWidth) / 2.0
	offsetY := (float64(height) - gameHeight) / 2.0

	for _, block := range b.Blocks {
		if block.Exists {
			blockOp := &ebiten.DrawImageOptions{}
			blockOp.GeoM.Scale(float64(scale)*0.5, float64(scale)*0.5) // Scale blocks down by 50%
			blockOp.GeoM.Translate(float64(block.X)*scale+offsetX, float64(block.Y)*scale+offsetY)
			screen.DrawImage(block.Sprite, blockOp)
		}
	}

}
```

Just as in Player, we need to edit game_scene to call our bases.
At the bottom of our GameScene struct, add this

```go
	bases        []*Base
```

Change NewGameScene to address this new field.

```go
func NewGameScene(sm *SceneManager) *GameScene {
	g := &GameScene{
		sceneManager: sm,
		player:       NewPlayer(),
	}
	g.bases = CreateBases(g.player.Y)
	return g
}
```

This leaves us to edit Draw so we display them.

```go
func (g *GameScene) Draw(screen *ebiten.Image) {
	g.player.Draw(screen)

	for _, base := range g.bases {
		base.Draw(screen)
	}

}
```

Run your game and see this!
![bases loaded](invaders/basesloaded.png)

Let's get some Aliens on there!
Create a new file called `alien.go`

We start the file out by creating an enum for our alien types...

```go
package main

import (
	"invaders/assets"

	"github.com/hajimehoshi/ebiten/v2"
)

type AlienType int

const (
	SquidAlien AlienType = iota
	ArmAlien
	FootAlien
)
```

Add some simple constants for layout

```go
const (
	NUMBER_OF_ALIENS_IN_ROW = 12
	ALIEN_SIZE              = 16
	PADDING                 = 64
)
```

Next we create the Alien Struct and its factory.

```go
type Alien struct {
	Sprite       []*ebiten.Image
	X            int
	Y            int
	PointsValue  int
	AlienType    AlienType
	CurrentFrame int
}

func NewAlien(a AlienType) *Alien {
	return &Alien{
		Sprite:       GetAlienSpriteByType(a),
		PointsValue:  getAlienPointsByType(a),
		AlienType:    AlienType(a),
		CurrentFrame: 0,
	}
}
```

Let's grab the appropriate animation and frame (we only want each loaded once, not once per sprite).

```go
func GetAlienSpriteByType(a AlienType) []*ebiten.Image {
	switch a {
	case SquidAlien:
		return assets.TopInvaderAnimation
	case ArmAlien:
		return assets.MiddleInvaderAnimation
	default:
		return assets.BottomInvaderAnimation

	}
}
func (a *Alien) ToggleFrame() {
	a.CurrentFrame = (a.CurrentFrame + 1) % 2
}
```

Lastly, we need a helper to spawn a wave when we need one (new game or wave completed).

```go
func SpawnAlienWave() []*Alien {
	aliens := make([]*Alien, 0)

	for i := range NUMBER_OF_ALIENS_IN_ROW {
		//Make the top row dude
		alien := NewAlien(SquidAlien)
		alien.X = (i * ALIEN_SIZE) + PADDING
		alien.Y = ALIEN_SIZE
		aliens = append(aliens, alien)

		//Make the Middle Row Dudes
		alien = NewAlien(ArmAlien)
		alien.X = (i * ALIEN_SIZE) + PADDING
		alien.Y = ALIEN_SIZE * 2
		aliens = append(aliens, alien)

		alien = NewAlien(ArmAlien)
		alien.X = (i * ALIEN_SIZE) + PADDING
		alien.Y = ALIEN_SIZE * 3
		aliens = append(aliens, alien)
		//Make the bottom row dudes
		alien = NewAlien(FootAlien)
		alien.X = (i * ALIEN_SIZE) + PADDING
		alien.Y = ALIEN_SIZE * 4
		aliens = append(aliens, alien)

		alien = NewAlien(FootAlien)
		alien.X = (i * ALIEN_SIZE) + PADDING
		alien.Y = ALIEN_SIZE * 5
		aliens = append(aliens, alien)
	}
	return aliens
}
```

I'm sure by now you are getting the hang of this, so open up game_scene and let's edit it to add this to it.
To `GameScene` add the following line

```go
aliens       []*Alien
```

Edit the factory accordingly

```go
func NewGameScene(sm *SceneManager) *GameScene {
	g := &GameScene{
		sceneManager: sm,
		player:       NewPlayer(),
		aliens:       SpawnAlienWave(),
	}
	g.bases = CreateBases(g.player.Y)
	return g
}
```

Then edit Draw

```go
func (g *GameScene) Draw(screen *ebiten.Image) {
	width, height := ebiten.WindowSize()
	scaledWidth := width / 320.0
	scaledHeight := height / 240.0
	scale := math.Min(float64(scaledWidth), float64(scaledHeight))

	// Calculate centering offsets
	gameWidth := 320.0 * scale
	gameHeight := 240.0 * scale
	offsetX := (float64(width) - gameWidth) / 2.0
	offsetY := (float64(height) - gameHeight) / 2.0
	for _, alien := range g.aliens {
		op := &ebiten.DrawImageOptions{}
		op.GeoM.Scale(float64(scale), float64(scale))
		op.GeoM.Translate(float64(alien.X)*scale+offsetX, float64(alien.Y)*scale+offsetY)
		screen.DrawImage(alien.Sprite[alien.CurrentFrame], op)
	}
	g.player.Draw(screen)
	for _, base := range g.bases {
		base.Draw(screen)
	}
}
```

Run it and you see we now have enemies!
![enemies](invaders/enemies.png)

Now that we have enemies, let's get them moving!
