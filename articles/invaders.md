---
title: "Invaders"
date: "06-16-2025"
article_type: "TUTORIALS"
categories: ["go", "tutorial"]
image: "invaders/go-invaders.png"
---

# Invaders - Creating a Space Invaders remake game with Ebitengine

I'm very much all about retro gaming. Particularly I have a soft spot for Space Invaders. When the game came out, I lived 3 short blocks from an Arcade that got it in. I remember spending every cent of my paper route money in one night. I was obsesed...
![go invaders](invaders/go-invaders.png).

The first thing we want to do it a good old `go mod init Invaders`

Now we want to create a folder and call it `assets`. There are a good number of assets in this game, and since I created all of these, feel free to swipe them for yourself [here](https://github.com/RAshkettle/go-invaders-tutorial). Grab everything in the assets subdirectory, including `assets.go`. We will be explaining everything next, but if you don't want to type it all out, there it is.

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
We need the current direction for the aliens to move, and we will also need a timer, as we want the aliens to move once per second, but speed up as each alien dies.

All the work for this goes into `game_scene.go`

```go
type GameScene struct {
	sceneManager     *SceneManager
	player           *Player
	bases            []*Base
	aliens           []*Alien
	currentDirection Direction
	timer            *stopwatch.Stopwatch
}
```

Let's set the factory to create these new fields.

```go
func NewGameScene(sm *SceneManager) *GameScene {

	g := &GameScene{
		sceneManager:     sm,
		player:           NewPlayer(),
		aliens:           SpawnAlienWave(),
		timer:            stopwatch.NewStopwatch(1 * time.Second),
		currentDirection: LEFT,
	}
	g.bases = CreateBases(g.player.Y)

	return g
}
```

Just for code clarity, I made a helper function to toggle the direction.

```go
func toggleDirection(current Direction) Direction {
	if current == LEFT {
		return RIGHT
	}
	return LEFT
}
```

Then we need to move the aliens. They move as a unit, on tic. When the aliens on the end reach the edge of our screen, reverse their direction and move them 8 pixels down.

```go
func (g *GameScene) moveAliens() {
	// Check if any alien will hit the screen boundaries
	shouldReverse := false
	for _, alien := range g.aliens {
		if g.currentDirection == LEFT && alien.X-8 <= 0 {
			shouldReverse = true
			break
		} else if g.currentDirection == RIGHT && alien.X+8 >= 320-ALIEN_SIZE {
			shouldReverse = true
			break
		}
	}
	// If we need to reverse direction, do it and move down
	if shouldReverse {
		g.currentDirection = toggleDirection(g.currentDirection)
		for _, alien := range g.aliens {
			alien.Y += 8        // Move down when reversing direction
			alien.ToggleFrame()
		}
	} else {
		for _, alien := range g.aliens {
			if g.currentDirection == LEFT {
				alien.X -= 8
			} else {
				alien.X += 8
			}
			alien.ToggleFrame()
		}
	}
}
```

Lastly, we need to add the logic to our Update function. The logic is as follows.  
Get the speed for the timer. This is how fast the tics are for the alien movement. The less aliense we have, the faster they will move.  
Update Player already was there.  
Now update and check the timer. When it's ready, move the aliens and set the new stopwatch time.

```go
func (g *GameScene) Update() error {
	currentSpeed := len(g.aliens) * 20

	err := g.player.Update()
	if err != nil {
		panic(err)
	}
	if !g.timer.IsRunning() {
		g.timer.Start()
	}
	g.timer.Update()
	if g.timer.IsDone() {
		// This is when we animate and Move
		g.moveAliens()
		g.timer = stopwatch.NewStopwatch(time.Duration(currentSpeed) * time.Millisecond)
		g.timer.Start()
	}
	return nil
}
```

They MOVE! This is starting to really look like it should. We need sound though. Let's add it.
Again, all we need to change will be in `game_scene.go`

First, add an audio context to our GameScene file to serve as a global variable throughout our application.

```go
var audioContext = audio.NewContext(44100)
```

Then define a new context and add it to our struct

```go
func NewGameScene(sm *SceneManager) *GameScene {
	g := &GameScene{
		sceneManager:     sm,
		player:           NewPlayer(),
		aliens:           SpawnAlienWave(),
		timer:            stopwatch.NewStopwatch(1 * time.Second),
		currentDirection: LEFT,
	}
	g.bases = CreateBases(g.player.Y)
	return g
}
```

Then at the very top of MoveAliens, add this...

```go
	moveStream, err := vorbis.DecodeWithSampleRate(audioContext.SampleRate(), bytes.NewReader(assets.MoveSound))
	if err != nil {

		return // Don't proceed if decoding failed
	}

	moveAudioPlayer, err := audioContext.NewPlayer(moveStream)
	if err != nil {

		return // Don't proceed if player creation failed
	}
	moveAudioPlayer.Play()
```

Now run your game and you should hear the movement sound each time they shift. GREAT!

It's time to create our first End Condition. Now that the aliens move and descend, we need to end the game if they reach the bottom.
On our End Scene, we will display the player's score. Therefore, we need to add it to our GameScene.
In addition, let's grab the height of our screen so we know where the bottom is.

```go
type GameScene struct {
	sceneManager     *SceneManager
	player           *Player
	bases            []*Base
	aliens           []*Alien
	currentDirection Direction
	timer            *stopwatch.Stopwatch
	score            int
}

const gameSceneHeight = 240
```

Now right at the bottom of the GameScene's Update function, just before you return nil, add this.

```go
	// Check for lose condition (aliens reaching bottom)
	if len(g.aliens) > 0 {
		// Get alien height from the sprite. Assumes all alien sprites for CurrentFrame are same height.
		alienHeight := g.aliens[0].Sprite[g.aliens[0].CurrentFrame].Bounds().Dy()
		for _, alien := range g.aliens {
			if alien.Y+alienHeight >= gameSceneHeight {
				g.sceneManager.TransitionTo(SceneEndScreen) // Immediate transition for aliens reaching bottom
				return nil                                  // Transitioning, no more updates for this scene
			}
		}
	}
```

Now let's get that EndScene up and running. Let's add our fonts to our struct.

```go
package main

import (
	"bytes"
	"fmt"
	"image/color"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/inpututil"
	"github.com/hajimehoshi/ebiten/v2/text/v2"
	"golang.org/x/image/font/gofont/goregular"
)

type EndScene struct {
	sceneManager *SceneManager
	titleFont    *text.GoTextFace
	subtitleFont *text.GoTextFace
}
```

Of course, you understand by now that this means a factory update.

```go
func NewEndScene(sm *SceneManager) *EndScene {
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
	return &EndScene{
		sceneManager: sm,
		titleFont:    titleFont,
		subtitleFont: subtitleFont,
	}
}
```

Update now needs to listen for key presses and mouse clicks. This should feel familiar as it's the same as the Title Scene.

```go
func (t *EndScene) Update() error {
	// Check for key presses
	if ebiten.IsKeyPressed(ebiten.KeySpace) ||
		ebiten.IsKeyPressed(ebiten.KeyEnter) ||
		ebiten.IsKeyPressed(ebiten.KeyEscape) ||
		inpututil.IsKeyJustPressed(ebiten.KeyA) ||
		inpututil.IsKeyJustPressed(ebiten.KeyS) ||
		inpututil.IsKeyJustPressed(ebiten.KeyD) ||
		inpututil.IsKeyJustPressed(ebiten.KeyW) {
		t.sceneManager.gameScene = NewGameScene(t.sceneManager)
		t.sceneManager.TransitionTo(SceneGame)
		return nil
	}
	// Check for mouse clicks
	if inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft) ||
		inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonRight) {
		t.sceneManager.gameScene = NewGameScene(t.sceneManager)
		t.sceneManager.TransitionTo(SceneGame)
		return nil
	}
	return nil
}
```

All we have left here is to render our text to the screen.

```go
func (t *EndScene) Draw(screen *ebiten.Image) {
	// Dark red background to indicate game over
	screen.Fill(color.RGBA{25, 10, 10, 255})

	// Get screen dimensions
	w, h := screen.Bounds().Dx(), screen.Bounds().Dy()

	// Draw "Game Over" title
	titleText := "Game Over"
	titleBounds, _ := text.Measure(titleText, t.titleFont, 0)
	titleX := (w - int(titleBounds)) / 2
	titleY := h/2 - 50

	op := &text.DrawOptions{}
	op.GeoM.Translate(float64(titleX), float64(titleY))
	op.ColorScale.ScaleWithColor(color.RGBA{255, 100, 100, 255}) // Light red text
	text.Draw(screen, titleText, t.titleFont, op)

	// Draw final score
	scoreText := fmt.Sprintf("Final Score: %d", t.sceneManager.gameScene.score)
	scoreBounds, _ := text.Measure(scoreText, t.subtitleFont, 0)
	scoreX := (w - int(scoreBounds)) / 2
	scoreY := titleY + 50

	op3 := &text.DrawOptions{}
	op3.GeoM.Translate(float64(scoreX), float64(scoreY))
	op3.ColorScale.ScaleWithColor(color.RGBA{255, 200, 100, 255}) // Golden color for score
	text.Draw(screen, scoreText, t.subtitleFont, op3)

	// Draw restart instruction
	subtitleText := "Press any key to restart"
	subtitleBounds, _ := text.Measure(subtitleText, t.subtitleFont, 0)
	subtitleX := (w - int(subtitleBounds)) / 2
	subtitleY := titleY + 100

	op2 := &text.DrawOptions{}
	op2.GeoM.Translate(float64(subtitleX), float64(subtitleY))
	op2.ColorScale.ScaleWithColor(color.RGBA{200, 150, 150, 255}) // Lighter red text
	text.Draw(screen, subtitleText, t.subtitleFont, op2)
}
```

And now, when the aliens reach the bottom, you should see this.
![game over](invaders/gameOver.png)

All these aliens and no way to blast em. Let's fix that.
Open up `player.go` and add a PlayerMissile struct

```go
type PlayerMissile struct {
	Sprite *ebiten.Image
	X      int
	Y      int
}
```

We will need to track two constants for this. The speed of the missile, and the cooldown time for missile shots.

```go
const(
	playerMissileSpeed  = 3
	playerShootCooldown = 500 * time.Millisecond
)
```

PlayerMissile needs a factory

```go
func NewPlayerMissile(p *Player) *PlayerMissile {
	// Center missile on player
	missileWidth := assets.PlayerShot.Bounds().Dx()
	playerWidth := p.Sprite.Bounds().Dx()
	return &PlayerMissile{
		Sprite: assets.PlayerShot,
		X:      p.X + (playerWidth / 2) - (missileWidth / 2),
		Y:      p.Y,
	}
}
```

And let's update Player and it's Factory to contain missiles.

```go
type Player struct {
	Sprite     *ebiten.Image
	X          int
	Y          int
	ShootTimer *stopwatch.Stopwatch
	Missiles   []*PlayerMissile
}
func NewPlayer() *Player {
	playerWidth := assets.Player.Bounds().Dx()
	playerHeight := assets.Player.Bounds().Dy()
	return &Player{
		Sprite:     assets.Player,
		X:          (gameWidth - playerWidth) / 2,
		Y:          gameHeight - playerHeight - 8,
		ShootTimer: stopwatch.NewStopwatch(playerShootCooldown),
		Missiles:   make([]*PlayerMissile, 0),
	}
}
```

Then in the Update function, place this code at the bottom (right before the final return nil). This fires the missile, provided the cooldown timer has expired.
Additionally, it will play a sound when you fire.

```go
	// Shooting logic
	p.ShootTimer.Update()
	if inpututil.IsKeyJustPressed(ebiten.KeySpace) {
		if !p.ShootTimer.IsRunning() || p.ShootTimer.IsDone() {
			newMissile := NewPlayerMissile(p)
			p.Missiles = append(p.Missiles, newMissile)
			p.ShootTimer.Reset() // Reset and start the timer
			p.ShootTimer.Start()

			// Play shoot sound
			if audioContext != nil {
				shootSoundBytes := assets.PlayerShootSound
				shootStream, err := vorbis.DecodeWithSampleRate(audioContext.SampleRate(), bytes.NewReader(shootSoundBytes))
				if err != nil {
					log.Printf("Error decoding player shoot sound: %v", err)
				} else {
					shootAudioPlayer, err := audioContext.NewPlayer(shootStream)
					if err != nil {
						log.Printf("Error creating audio player for shoot sound: %v", err)
					} else {
						shootAudioPlayer.Play()
					}
				}
			}
		}
	}

	// Update missiles
	activeMissiles := make([]*PlayerMissile, 0, len(p.Missiles))
	for _, missile := range p.Missiles {
		missile.Y -= playerMissileSpeed
		if missile.Y+missile.Sprite.Bounds().Dy() > 0 { // Check if missile is still on screen (top edge)
			activeMissiles = append(activeMissiles, missile)
		}
	}
	p.Missiles = activeMissiles
```

Now, back in `game_scene.go` add the following function. This function will simply determine through a rect overlap, whether or not there is a collision between the player's missile and an alien. If so, play a sound, remove the alien and give the player points.

```go
func (g *GameScene) CheckPlayerMissileCollision() {
	activeMissiles := make([]*PlayerMissile, 0, len(g.player.Missiles))
	activeAliens := make([]*Alien, 0, len(g.aliens))

	// Track which aliens were hit
	aliensHit := make(map[*Alien]bool)

	for _, missile := range g.player.Missiles {
		hit := false

		// Get missile center point (only center 2 pixels)
		missileX := missile.X + missile.Sprite.Bounds().Dx()/2 - 1
		missileY := missile.Y + missile.Sprite.Bounds().Dy()/2 - 1
		missileRect := image.Rect(missileX, missileY, missileX+2, missileY+2)

		for _, alien := range g.aliens {
			// Skip if this alien was already hit
			if aliensHit[alien] {
				continue
			}

			// Get alien sprite bounds
			alienRect := image.Rect(alien.X, alien.Y,
				alien.X+alien.Sprite[alien.CurrentFrame].Bounds().Dx(),
				alien.Y+alien.Sprite[alien.CurrentFrame].Bounds().Dy())

			// Check if missile center intersects with alien
			if missileRect.Overlaps(alienRect) {
				// Add alien points to player
				g.score += alien.PointsValue
				hit = true
				aliensHit[alien] = true

				// Play alien explosion sound
				explosionStream, err := vorbis.DecodeWithSampleRate(audioContext.SampleRate(), bytes.NewReader(assets.AlienExplosionSound))
				if err != nil {
					log.Printf("Error decoding alien explosion sound: %v", err)
				} else {
					explosionAudioPlayer, err := audioContext.NewPlayer(explosionStream)
					if err != nil {
						log.Printf("Error creating audio player for explosion sound: %v", err)
					} else {
						explosionAudioPlayer.Play()
					}
				}

				break // This missile hit an alien, don't check other aliens
			}
		}
		// Only keep missile if it didn't hit anything
		if !hit {
			activeMissiles = append(activeMissiles, missile)
		}
	}
	// Build active aliens list (only aliens that weren't hit)
	for _, alien := range g.aliens {
		if !aliensHit[alien] {
			activeAliens = append(activeAliens, alien)
		}
	}
	// Update the slices with only active (non-collided) objects
	g.player.Missiles = activeMissiles
	g.aliens = activeAliens
}
```

Now you can shoot aliens!
![shooting enabled](invaders/shootingEnabled.png)

Sure, we can shoot them, but things are a bit wonky. Firstly, the bases allow the player to be invulnerable. In Space Invaders, when a base is hit, by an enemy or player (doesn't matter), the base takes damage. Let's enable that.

The following function will check for collisions to a base and apply the damage (visually and in data).

```go
func (g *GameScene) CheckMissileBaseCollisions() {
	// Check player missiles vs bases
	activeMissiles := make([]*PlayerMissile, 0, len(g.player.Missiles))
	for _, missile := range g.player.Missiles {
		hit := false

		// Get missile center 4 pixels on X-axis for more precise collision
		missileWidth := missile.Sprite.Bounds().Dx()
		missileCenterX := missile.X + missileWidth/2 - 2 // Center minus 2 pixels
		missileRect := image.Rect(missileCenterX, missile.Y,
			missileCenterX+4, // Only 4 pixels wide
			missile.Y+missile.Sprite.Bounds().Dy())

		for _, base := range g.bases {
			for _, block := range base.Blocks {
				if !block.Exists {
					continue
				}

				// Get block bounds (accounting for 50% scale)
				blockRect := image.Rect(block.X, block.Y, block.X+8, block.Y+8)

				if missileRect.Overlaps(blockRect) {
					block.TakeDamage()
					hit = true

					// Play alien explosion sound for base hit
					explosionStream, err := vorbis.DecodeWithSampleRate(audioContext.SampleRate(), bytes.NewReader(assets.AlienExplosionSound))
					if err != nil {
						log.Printf("Error decoding base hit sound: %v", err)
					} else {
						explosionAudioPlayer, err := audioContext.NewPlayer(explosionStream)
						if err != nil {
							log.Printf("Error creating audio player for base hit sound: %v", err)
						} else {
							explosionAudioPlayer.Play()
						}
					}
					break
				}
			}
			if hit {
				break
			}
		}

		if !hit {
			activeMissiles = append(activeMissiles, missile)
		}
	}
	g.player.Missiles = activeMissiles
}
```

Now our bases take damage from our shots rather than being cheat codes.  
I guess now that we are killing enemies, we should show the score. Again all changes are in `game_scene.go`
To our GameScene struct, at a reference to our font.

```go
scoreFont        *text.GoTextFace
```

And let's update the factory.

```go
func NewGameScene(sm *SceneManager) *GameScene {
	scoreFontSource, _ := text.NewGoTextFaceSource(bytes.NewReader(goregular.TTF))
	scoreFont := &text.GoTextFace{
		Source: scoreFontSource,
		Size:   8,
	}
	g := &GameScene{
		sceneManager:     sm,
		player:           NewPlayer(),
		aliens:           SpawnAlienWave(),
		timer:            stopwatch.NewStopwatch(1 * time.Second),
		currentDirection: LEFT,
		scoreFont:        scoreFont,
	}
	g.bases = CreateBases(g.player.Y)
	return g
}
```

The last step for this is to add the following to the end of the Draw function.

```go
		// Draw score
		scoreText := fmt.Sprintf("SCORE: %d", g.score)
		textOp := &text.DrawOptions{}
		textOp.GeoM.Scale(float64(scale), float64(scale))
		textOp.GeoM.Translate(offsetX+15*scale, offsetY+15*scale)
		textOp.ColorScale.ScaleWithColor(color.RGBA{225, 225, 255, 255}) /
		text.Draw(screen, scoreText, g.scoreFont, textOp)
```

And there ya go! Now we have a score showing which follows to our end scene. We are starting to have an actual game here.

### UFO

Space Invaders had that random little UFO flying at the top of the screen periodically for some extra points. Let's add it.
Create a new file and call it `ufo.go`
We can start out simple with the struct for it and it's factory.

```go
package main

import (
	"bytes"
	"invaders/assets"
	"log"
	"math/rand"
	"time"

	stopwatch "github.com/RAshkettle/Stopwatch"
	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/audio/vorbis"
)

type UFO struct {
	Sprite       *ebiten.Image
	X            int
	Y            int
	Speed        int
	FrameCounter int
}

func NewUFO() *UFO {
	return &UFO{
		Sprite:       assets.UFO,
		X:            320,
		Y:            16,
		Speed:        1,
		FrameCounter: 0,
	}
}
```

The UFO spawns on a few rules. It spawns once the first 10 enemies in a wave have been destroyed. After that, it spawns on a random duration.

```go
func (g *GameScene) StartUFOTimer() {
	// Random duration between 10-30 seconds
	duration := time.Duration(10+rand.Intn(21)) * time.Second
	g.ufoTimer = stopwatch.NewStopwatch(duration)
	g.ufoTimer.Start()
}
```

Of course, when the timer goes off, the caller will likely want to spawn a UFO.

```go
func (g *GameScene) SpawnUFO() {
	if g.ufo == nil {
		g.ufo = NewUFO()

		// Start playing UFO sound at 50% volume, looping
		ufoStream, err := vorbis.DecodeWithSampleRate(audioContext.SampleRate(), bytes.NewReader(assets.UFOSound))
		if err != nil {
			log.Printf("Error decoding UFO sound: %v", err)
		} else {
			g.ufoAudioPlayer, err = audioContext.NewPlayer(ufoStream)
			if err != nil {
				log.Printf("Error creating UFO audio player: %v", err)
			} else {
				g.ufoAudioPlayer.SetVolume(0.5) // 50% volume
				g.ufoAudioPlayer.Play()
			}
		}
	}
}
```

So, now that it's spawned, let's move it across the screen.

```go
func (g *GameScene) UpdateUFO() {
	if g.ufo != nil {
		g.ufo.FrameCounter++
		// Move only every other frame (50% slower)
		if g.ufo.FrameCounter%2 == 0 {
			g.ufo.X -= g.ufo.Speed
		}

		// Remove UFO if it goes off the left side of screen
		if g.ufo.X+g.ufo.Sprite.Bounds().Dx() < 0 {
			g.ufo = nil
			// Stop UFO sound
			if g.ufoAudioPlayer != nil {
				g.ufoAudioPlayer.Pause()
				g.ufoAudioPlayer = nil
			}
			g.StartUFOTimer()
		}
	}
		// Keep UFO sound looping while UFO exists
		if g.ufo != nil && g.ufoAudioPlayer != nil && !g.ufoAudioPlayer.IsPlaying() {
			g.ufoAudioPlayer.Rewind()
			g.ufoAudioPlayer.Play()
		}

		// Check if UFO should spawn (at least 10 kills and no UFO active and no timer running)
		if g.aliensKilled >= 10 && g.ufo == nil && (g.ufoTimer == nil || g.ufoTimer.IsDone()) {
			g.SpawnUFO()
		}

		// Update UFO timer
		if g.ufoTimer != nil {
			g.ufoTimer.Update()
			if g.ufoTimer.IsDone() {
				g.ufoTimer.Stop()
				g.ufoTimer = nil
			}
		}
}
```

That moves it across the screen and plays the sounds.
So, time to head back to `game_scene.go`
We can start by adding a few more fields to our GameScene struct. On this one instance, we can ignore the factory, because all defaults are being properly set.

```go
	ufo              *UFO
	ufoTimer         *stopwatch.Stopwatch
	ufoAudioPlayer   *audio.Player
	aliensKilled 		  int
```

At the bottom of the Update function, after whe check for missile collisions, add this line.

```go
g.UpdateUFO()
```

In our Draw function, right above where we draw the score...

```go
	// Draw UFO if exists
	if g.ufo != nil {
		ufoOp := &ebiten.DrawImageOptions{}
		ufoOp.GeoM.Scale(float64(scale), float64(scale))
		ufoOp.GeoM.Translate(float64(g.ufo.X)*scale+offsetX, float64(g.ufo.Y)*scale+offsetY)
		screen.DrawImage(g.ufo.Sprite, ufoOp)
	}
```

In the CheckPlayerMissileCollision function, look for the following lines

```go
				g.score += alien.PointsValue
				hit = true
				aliensHit[alien] = true
```

Add this to it

```go
g.aliensKilled++
```

This will tell us when to spawn our first UFO (the killing of 10 aliens).

Now we need to check to see if the player hit the UFO with a missile. Go into CheckPlayerMissileCollisions and look for this...

```go
		// Only keep missile if it didn't hit anything
		if !hit {
			activeMissiles = append(activeMissiles, missile)
		}
```

Right ABOVE that statement, add this.

```go
				// Check UFO collision
				if !hit && g.ufo != nil {
					// Get UFO bounds
					ufoRect := image.Rect(g.ufo.X, g.ufo.Y,
						g.ufo.X+g.ufo.Sprite.Bounds().Dx(),
						g.ufo.Y+g.ufo.Sprite.Bounds().Dy())

					// Check if missile center intersects with UFO
					if missileRect.Overlaps(ufoRect) {
						// Add UFO points to player
						g.score += 100
						hit = true

						// Play alien explosion sound
						explosionStream, err := vorbis.DecodeWithSampleRate(audioContext.SampleRate(), bytes.NewReader(assets.AlienExplosionSound))
						if err != nil {
							log.Printf("Error decoding UFO explosion sound: %v", err)
						} else {
							explosionAudioPlayer, err := audioContext.NewPlayer(explosionStream)
							if err != nil {
								log.Printf("Error creating audio player for UFO explosion sound: %v", err)
							} else {
								explosionAudioPlayer.Play()
							}
						}
						// Remove UFO and start timer for next one
						g.ufo = nil
						// Stop UFO sound
						if g.ufoAudioPlayer != nil {
							g.ufoAudioPlayer.Pause()
							g.ufoAudioPlayer = nil
						}
						g.StartUFOTimer()
					}
				}
```

The UFO is working and now behaves as expected.

We are nearly complete here. All we need now is for the enemy to shoot back. Let's do this.
Open up `alien.go` and let's add a struct for our alien's missiles. Just the coordinates and an image.

```go
type AlienMissile struct {
	Sprite *ebiten.Image
	X      int
	Y      int
}
```

Now let's append to our GameScene. We want a slice to hold our missiles. In addition, since we know the missiles will be trying to kill the player, let's add death logic. Add the following fields to GameScene

```go
	alienMissiles    []*AlienMissile
	deathTimer       *stopwatch.Stopwatch
	playerDead       bool
	playerLives      int
```

Then in our NewGameScene factory, instantiate them...

```go
		alienMissiles:    make([]*AlienMissile, 0),
		deathTimer:       stopwatch.NewStopwatch(1500 * time.Millisecond), // 1.5 seconds
		playerDead:       false,
		playerLives:      5,
```

At the bottom of MoveAliens, right before the closing brace, add this code to Spawn missiles...

```go
	// Check for SquidAlien shooting (10% chance per movement)
	for _, alien := range g.aliens {
		// Only allow shooting if we have less than 3 missiles active
		if alien.AlienType == SquidAlien && rand.Float64() < 0.1 && len(g.alienMissiles) < 3 {
			missileX := alien.X + alien.Sprite[alien.CurrentFrame].Bounds().Dx()/2 - assets.AlienShot.Bounds().Dx()/2
			missileY := alien.Y + alien.Sprite[alien.CurrentFrame].Bounds().Dy()

			newAlienMissile := &AlienMissile{
				Sprite: assets.AlienShot,
				X:      missileX,
				Y:      missileY,
			}
			g.alienMissiles = append(g.alienMissiles, newAlienMissile)
		}
	}
```

This logic spawns a missile every random interval, provided there are not already 3 missiles active. It triggers on enemy move (like the arcade game does).

We need to check for collisions against the player and against the bases. Let's do the player first.

Note that if the player collides with a missile, we start the death timer. This delay keeps us from immediately dying again to the same missile.

```go
func (g *GameScene) CheckAlienMissilePlayerCollision() {
	// Don't check collisions if player is already dead
	if g.playerDead {
		return
	}

	activeAlienMissiles := make([]*AlienMissile, 0, len(g.alienMissiles))

	// Get player bounds
	playerRect := image.Rect(g.player.X, g.player.Y,
		g.player.X+g.player.Sprite.Bounds().Dx(),
		g.player.Y+g.player.Sprite.Bounds().Dy())

	for _, missile := range g.alienMissiles {
		// Get missile bounds
		missileRect := image.Rect(missile.X, missile.Y,
			missile.X+missile.Sprite.Bounds().Dx(),
			missile.Y+missile.Sprite.Bounds().Dy())

		// Check if missile intersects with player
		if missileRect.Overlaps(playerRect) {
			// Player is hit - decrease lives and start death timer
			g.playerLives--
			g.playerDead = true
			g.deathTimer.Reset()
			g.deathTimer.Start()

			// Clear all alien missiles to prevent instant death on respawn
			g.alienMissiles = make([]*AlienMissile, 0)

			// Play player death sound
			deathStream, err := vorbis.DecodeWithSampleRate(audioContext.SampleRate(), bytes.NewReader(assets.PlayerDeathSound))
			if err != nil {
				log.Printf("Error decoding player death sound: %v", err)
			} else {
				deathAudioPlayer, err := audioContext.NewPlayer(deathStream)
				if err != nil {
					log.Printf("Error creating audio player for death sound: %v", err)
				} else {
					deathAudioPlayer.Play()
				}
			}
			// Return early since we cleared all missiles
			return
		} else {
			// Keep missile if no collision
			activeAlienMissiles = append(activeAlienMissiles, missile)
		}
	}
	g.alienMissiles = activeAlienMissiles
}
```

Now that we've checked player collisions, we need to check against the bases.

```go
func(g *GameScene)CheckAlienMissileBaseCollision(){
		// Check alien missiles vs bases
		activeAlienMissiles := make([]*AlienMissile, 0, len(g.alienMissiles))
		for _, missile := range g.alienMissiles {
			hit := false

			// Get missile bounds
			missileRect := image.Rect(missile.X, missile.Y,
				missile.X+missile.Sprite.Bounds().Dx(),
				missile.Y+missile.Sprite.Bounds().Dy())

			for _, base := range g.bases {
				for _, block := range base.Blocks {
					if !block.Exists {
						continue
					}

					// Get block bounds (accounting for 50% scale)
					blockRect := image.Rect(block.X, block.Y, block.X+8, block.Y+8)

					if missileRect.Overlaps(blockRect) {
						block.TakeDamage()
						hit = true

						// Play alien explosion sound for base hit
						explosionStream, err := vorbis.DecodeWithSampleRate(audioContext.SampleRate(), bytes.NewReader(assets.AlienExplosionSound))
						if err != nil {
							log.Printf("Error decoding base hit sound: %v", err)
						} else {
							explosionAudioPlayer, err := audioContext.NewPlayer(explosionStream)
							if err != nil {
								log.Printf("Error creating audio player for base hit sound: %v", err)
							} else {
								explosionAudioPlayer.Play()
							}
						}
						break
					}
				}
				if hit {
					break
				}
			}

			if !hit {
				activeAlienMissiles = append(activeAlienMissiles, missile)
			}
		}
		g.alienMissiles = activeAlienMissiles
}
```

That leaves us with needing changes to Draw and Update to wire it all in. Let's do Draw first as it's the simplest.
In `game_scene.go` add this to the Draw function right above where we Draw the Score.

```go
		// Draw alien missiles
		for _, missile := range g.alienMissiles {
			missileOp := &ebiten.DrawImageOptions{}
			missileOp.GeoM.Scale(float64(scale), float64(scale))
			missileOp.GeoM.Translate(float64(missile.X)*scale+offsetX, float64(missile.Y)*scale+offsetY)
			screen.DrawImage(missile.Sprite, missileOp)
		}
```

That puts the missiles on the screen, but now we need to move em.
Now let's change Update. The changes will go to the bottom and the top of the function. Look for this block at the bottom....

```go
	// Check for lose condition (aliens reaching bottom)
	if len(g.aliens) > 0 {
		// Get alien height from the sprite. Assumes all alien sprites for CurrentFrame are same height.
		alienHeight := g.aliens[0].Sprite[g.aliens[0].CurrentFrame].Bounds().Dy()
		for _, alien := range g.aliens {
			if alien.Y+alienHeight >= gameSceneHeight {
				g.sceneManager.TransitionTo(SceneEndScreen) // Immediate transition for aliens reaching bottom
				return nil                                  // Transitioning, no more updates for this scene
			}
		}
		[...]
```

Change it to this...

```go
	if len(g.aliens) > 0 {
		// Get alien height from the sprite. Assumes all alien sprites for CurrentFrame are same height.
		alienHeight := g.aliens[0].Sprite[g.aliens[0].CurrentFrame].Bounds().Dy()
		for _, alien := range g.aliens {
			if alien.Y+alienHeight >= gameSceneHeight {
				g.sceneManager.TransitionTo(SceneEndScreen) // Immediate transition for aliens reaching bottom
				return nil                                  // Transitioning, no more updates for this scene
			}
		}

		// Update alien missiles
		activeAlienMissiles := make([]*AlienMissile, 0, len(g.alienMissiles))
		for _, missile := range g.alienMissiles {
			missile.Y += 1                   // Move missile down at speed 1
			if missile.Y < gameSceneHeight { // Keep missile if still on screen
				activeAlienMissiles = append(activeAlienMissiles, missile)
			}
		}
		g.alienMissiles = activeAlienMissiles
		g.CheckPlayerMissileCollision()
		g.CheckAlienMissilePlayerCollision()
		g.CheckMissileBaseCollisions()
		g.CheckAlienMissileBaseCollision()
		g.UpdateUFO()

	}
	return nil
}
```

We added a call to Check collisions with the player and the bases. We are also moving the missile steadily downward.
At the very top of Update is this line...

```go
currentSpeed := len(g.aliens) * 20
```

Directly after that line, add this...

```go
	// Check death timer first
	if g.playerDead {
		g.deathTimer.Update()
		if g.deathTimer.IsDone() {
			if g.playerLives <= 0 {
				// Game over - stop UFO sound and transition to end screen
				if g.ufoAudioPlayer != nil {
					g.ufoAudioPlayer.Pause()
					g.ufoAudioPlayer = nil
				}
				g.sceneManager.TransitionTo(SceneEndScreen)
				return nil
			} else {
				// Player has lives remaining - respawn
				g.playerDead = false
				// Reset player position to center bottom
				playerWidth := g.player.Sprite.Bounds().Dx()
				g.player.X = (320 - playerWidth) / 2
			}
		}
		// Don't process other game logic while player is dead
		return nil
	}
```

This code does a check to see if the player was hit and needs to lose a life (or ultimately to the end screen).

Now the player loses a life every time they are hit. After 5 lives, the game is over. We have fully wired through our other win condition.

Having five lives is great, but not knowing how many are left isn't a good game mechanic. Let's fix it.
The amount of work here is pretty small. Just add this block to the end of our Draw function in `game_scene.go`

```go
	livesText := fmt.Sprintf("LIVES: %d", g.playerLives)
	livesTextOp := &text.DrawOptions{}
	livesTextOp.GeoM.Scale(float64(scale), float64(scale))
	// Position at top right - calculate text width and position accordingly
	livesTextBounds, _ := text.Measure(livesText, g.scoreFont, 0)
	livesTextOp.GeoM.Translate(offsetX+gameWidth-livesTextBounds-23*scale, offsetY+15*scale)
	livesTextOp.ColorScale.ScaleWithColor(color.RGBA{220, 220, 255, 255})
	text.Draw(screen, livesText, g.scoreFont, livesTextOp)
```

With that, we have our game. It's basic, but true to it's origin.
