---
title: "Tower Defense"
date: "05-30-2025"
article_type: "TUTORIALS"
categories: ["go", "tutorial"]
---

# Tower Defense - Creating a Tower Defense game with Ebitengine

This tutorial will go through all the steps for you to start building your own tower defense game. In the end we will have a basic but fully functional game that you can then expand into your own.

This will be a very long tutorial, so we are going to begin with a fully loaded map. For learning how to load a Tiled Map (using this exact map), follow [this tutorial](https://www.idiotcoder.com/tiled) on loading a map from Tiled and displaying it on the screen.  
Clone the [repo](https://github.com/RAshkettle/Tile-tutorial) and build it. We should all see this image below to start.
![map image](finishedMap.png)

## Cleanup

We can start by cleaning up some code here. First, let's get rid of the ties to the Tiled Tutorial.

```bash
rm -rf .git
```

Edit your go.mod file to change the name of your module.

```
module towerDefense

go 1.24.3

require github.com/hajimehoshi/ebiten/v2 v2.8.8

require (
	github.com/ebitengine/gomobile v0.0.0-20240911145611-4856209ac325 // indirect
	github.com/ebitengine/hideconsole v1.0.0 // indirect
	github.com/ebitengine/purego v0.8.0 // indirect
	github.com/jezek/xgb v1.1.1 // indirect
	golang.org/x/sync v0.8.0 // indirect
	golang.org/x/sys v0.25.0 // indirect
)
```

_Your individual versions may vary.._

Now let's set up our new project in git.

```git
git init
git add .
git commit -m 'initial commit'
```

We will be using all the tiles and the map included, so it's good that it's all there. We are going to move them though. We will want to organize our assets better than just a big bucket of them. Let's create a directory under `assets` and name it `map`. Move all the asset files into there for now.
Of course, now we need to fix our code since it's not pointing to the new directory. Go ahead and do that. The compiler will gladly guide you to all the spots to change.

Once you have the fixes, run the application and verify you see this:  
![tower defense map](towerDefenseFixedMap.png)

At this point, it's probably a good idea to check everything in.

## Embed Assets

At this point, we are going to embed our assets. This will make it easier to deploy our game, as we dont need to distribute the assets separately. I put up a tutorial on this at [here](https://idiotcoder.com/embed). If you haven't yet, take a moment to at least read through it to understand what we are doing.

We can start with one edit to a struct we already have in `tilemap.go`. Look for this:

```type TilemapJSON struct {
	Layers     []TilemapLayerJSON `json:"layers"`
}
```

Change it to this (add the two extra fields)

```go
type TilemapJSON struct {
	Layers     []TilemapLayerJSON `json:"layers"`
	TileWidth  int                `json:"tilewidth"`
	TileHeight int                `json:"tileheight"`
}
```

Heading to our assets directory, create `assets.go` in the assets root.

Since Go packages are directory based, this will belong to the package assets. Let's start with the package and some imports we are going to need.

```go
package assets

import (
	"bytes"
	"embed"
	"image"

	"github.com/hajimehoshi/ebiten/v2"
)
```

Here is where the fun starts. Now we are going to create the embedded filesystem.

```go
//go:embed *
var assets embed.FS
```

That's all there is to setting it up. The comment is required. If you type `go run .` everything will work fine. This is because the assets folder is still there relative to the executable. Build the application, move it to another folder and try running it. It fails. This will fix that problem.

We can load our tilesets with a simple call. Remember to make it capitalized to be accessed from our main package.

```go
var GrassTileSet = loadImage("map/Grass Tileset.png")
var WaterTileSet = loadImage("map/Animated water tiles.png")
```

Now let's make that loadImage function.

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

func ReadFile(filepath string) ([]byte, error) {
	return assets.ReadFile(filepath)
}
```

You may be wondering why I didn't just do a call to ebitenUtils.NewImage instead of this extra code. Well, I tried. That call doesn't work with embedded filesystems, so I did it the recommended way. Notice the real magic here. Even though we passed a path in, that path isn't called into our assets embedded filesystem..

With this, we can replace the loading logic in tilemap.go.

In the function `getTileImage` there are two blocks of code identical except for the path. Let's replace them.
Replace:

```go
        tilesetImage, _, err = ebitenutil.NewImageFromFile("assets/map/Grass Tileset.png")
        if err != nil {
            return nil, err
        }
```

With:

```go
tilesetImage = assets.GrassTileSet
```

Then Replace:

```go
        tilesetImage, _, err = ebitenutil.NewImageFromFile("assets/map/Animated water tiles.png")
        if err != nil {
            return nil, err
        }
```

With This:

```go
tilesetImage = assets.WaterTileSet
```

Remember to add the import for your assets and you will also need to remove the declaration of err as it's no longer in use.

Now go to `NewTilemapJSON` and lets make another change. The first line of this function is

```go
contents, err := os.ReadFile(filepath)
```

Simply change this to

```go
contents, err := assets.ReadFile(filepath)
```

We need one more change. In `main.go` we load the map with the path "assets/map/level.tmj" We need to clean it up, as assets is no longer needed in that path. remove it so it reads "map/level.tmj".

Run the program and everything should compile and run fine. You should be looking at your map still.

## Scene Manager

Think of what we know about Tower Defense games. There will be waves. There will be a start. There will be an end. This tells me we should think about a scene manager. The waves we can likely do without the need of one, but a title screen and an end-screen are table stakes. Let's create one.

At it's core, a scene manager is nothing but a state machine. Let's start with some enums for each state.

```go
package main

import (
	"github.com/hajimehoshi/ebiten/v2"
)

// SceneType represents different game scenes
type SceneType int

const (
	SceneTitleScreen SceneType = iota
	SceneGame
	SceneEndScreen
)
```

Just the three basic ones for now. You can feel free to add any more yourself, but the for purposes of this tutorial, I think that's plenty.

What's a state machine in Go without an interface to drive it?

```go
type Scene interface {
	Update() error
	Draw(screen *ebiten.Image)
	Layout(outerWidth, outerHeight int) (int, int)
}
```

Every scene is going to need to Update and Draw, as those are kind of core to gameplay. Clever folks will realize this is the same interface that Game needs to follow.

Now I want to create a file for each scene. They are the exact same right now except for the name of the file and struct. I'll give you the first one.

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

type TitleScene struct {}

func (t *TitleScene) Draw(screen *ebiten.Image){}

func (t *TitleScene)Update()error{
	return nil
}

func (t *TitleScene) Layout(outerWidth, outerHeight int) (int, int) {
	return outerWidth, outerHeight
}
```

Now do the same for GameScene and EndScene.

Since we have some scenes. Let's identify our SceneManager struct.

```go
type SceneManager struct {
	currentScene Scene
	sceneType    SceneType

	// Scene instances
	titleScene *TitleScene
	gameScene  *GameScene
	endScene   *EndScene
}
```

Our SceneManager should meet the Scene interface also (as we will be passing this to ebiten as our Game struct). Add this code to scene_manager.go

```go
// Update updates the current scene
func (sm *SceneManager) Update() error {
	return sm.currentScene.Update()
}

// Draw draws the current scene
func (sm *SceneManager) Draw(screen *ebiten.Image) {
	sm.currentScene.Draw(screen)
}

// Layout returns the screen layout from the current scene
func (sm *SceneManager) Layout(outerWidth, outerHeight int) (int, int) {
	return sm.currentScene.Layout(outerWidth, outerHeight)
}

```

We also want to be able to find the current SceneType to know which scene we are in (or at least which game stage).

```go
func (sm *SceneManager) GetCurrentSceneType() SceneType {
	return sm.sceneType
}
```

A state machine without transition logic is pointless, so let's add the logic for state flow. As I said, it's pretty simple here, but good practice.

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

Now let's establish the relationship between our scenes and the scene manager.

```go
func NewSceneManager() *SceneManager {
	sm := &SceneManager{
		sceneType: SceneTitleScreen,
	}

	// Initialize scenes
	sm.titleScene = NewTitleScene(sm)
	sm.gameScene = NewGameScene(sm)
	sm.endScene = NewEndScene(sm)

	// Set initial scene
	sm.currentScene = sm.titleScene

	return sm
}
```

We now need to implement the factories for our scenes. We are passing in a reference to the scene manager to them for bidirectional communication. Again, we will make the changes in the TitleScene, but the same changes need to be made for all three scenes.

Let's begin by adding the scene manager to our struct.

```go
type TitleScene struct {
	sceneManager *SceneManager
}
```

Not a big change, just added the reference. Now let's make our factory. Again, it's simple.

```go
func NewTitleScene(sm *SceneManager)*TitleScene{
	return &TitleScene{
		sceneManager: sm,
	}
}
```

Ok, if we run this now, we still see the same thing. We wrote this code, but we didn't wire it into our game yet. To do so, we need to refactor some code in `main.go` and move it to `game_scene.go`. Remember that our scenes all fit the criteria for the Game interface.

Open up main.go and let's move some code out of there. For starters, just delete the Update function. Look for this

```go
func (g *Game) Update() error {
	return nil
}
```

and delete it. Totally useless to us right now.  
Move on to Layout.

```go
func (g *Game) Layout(outerScreenWidth, outerScreenHeight int) (ScreenWidth, ScreenHeight int) {
	return 1920, 1280
}
```

move the return to game_scene.go so it looks like this now.

```go
func (g *GameScene) Layout(outerWidth, outerHeight int) (int, int) {
	return 1920, 1280
}
```

Once you did that, make sure to delete the code in main.go.

The Game struct needs to be moved next.

```go
type Game struct {
	level *TilemapJSON
	images TileImageMap
}
```

Delete this. Go into `game_scene.go` and edit the GameScene struct.

```go
type GameScene struct {
	sceneManager *SceneManager
	level *TilemapJSON
	images TileImageMap
}
```

By now, you have noticed that game_scene is effectively our game. So..let's shift Draw Next..For now, just take the code inside main and move it to game_scene. That should make your GameScene Draw function look like this.

```go
func (g *GameScene) Draw(screen *ebiten.Image){

	if g.level == nil {
		return
	}

	const tileSize = 64 // Standard tile size

	// Draw layers in reverse order (last layer first)
	//for i := len(g.level.Layers) - 1; i >= 0; i-- {
	for i := 0; i < len(g.level.Layers); i++ {

		layer := g.level.Layers[i]

		// Draw each tile in the layer
		for y := 0; y < layer.Height; y++ {
			for x := 0; x < layer.Width; x++ {
				index := y*layer.Width + x
				if index < len(layer.Data) {
					tileID := layer.Data[index]

					// Skip empty tiles (ID 0)
					if tileID == 0 {
						continue
					}

					// Get the tile image from the map
					if tileImage, exists := g.images.Images[tileID]; exists && tileImage != nil {
						// Calculate screen position
						screenX := float64(x * tileSize)
						screenY := float64(y * tileSize)

						// Draw the tile
						opts := &ebiten.DrawImageOptions{}
						opts.GeoM.Translate(screenX, screenY)
						screen.DrawImage(tileImage, opts)
					}
				}
			}
		}
	}
}
```

This leaves the main function, which is vastly simplified.

```go
func main() {
	sceneManager := NewSceneManager()
	ebiten.SetWindowResizingMode(ebiten.WindowResizingModeEnabled)
	ebiten.SetWindowTitle("Towers of Defenders")
	ebiten.SetWindowSize(1920, 1280)

	err := ebiten.RunGame(sceneManager)
	if err != nil {
		panic(err)
	}
}
```

Here we are just instantiating the scene manager and passing that into RunGame (since it meets the criteria). The application now launches, but nothing is showing. Probably because we are on the title scene which has nothing on it. Oh and we are no longer loading the map, so there's also that. Don't worry, let's finish the manager and then get to that.

##Title Scene

It's nice that we can load a scene, but if that scene does nothing, what's the poing? Let's make a simple title screen and start with a basic change to make sure we are on it.
In our Draw function, add just this line.

```go
screen.Fill(color.RGBA{10, 15, 25, 255})
```

Run the application. You should see a nice dark bluegreenish color. Yep! We are on the title scene. Good. Let's set this screen up. For our needs, a simple Text title and instructions on how to begin seems appropriate. Let's do some font setup.

```go
package main

import (
	"bytes"
	"image/color"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/inpututil"
	"github.com/hajimehoshi/ebiten/v2/text/v2"
	"golang.org/x/image/font/gofont/goregular"
)

type TitleScene struct {
	sceneManager *SceneManager
	titleFont    *text.GoTextFace
	subtitleFont *text.GoTextFace
}
```

Grab those imports and add the font fields to the TitleScene struct. Since we changed it, let's change our NewTitleScene factory function.

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

Thanks to ebitengine and the text package, loading the fonts is incredibly easy. Now we have fonts loaded up and ready to go.

We know three functions there are sill untouched out there because of our interface restrictions. Let's look at them and apply any necessary changes. Looking at them, let's look at Layout first. Well, we got lucky here, because it's fine. No change necessary. To be fair, aside from game scene, it's superflous for the most part and only there to meet the criteria of the interface.

Update is next. We want to transition to the game scene as soon as the player either clicks the mouse or presses any key.

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

Assuming if you have gotten this far, you understand how to draw in ebitengine (simple drawing with no complexity) so I'll just put the Draw function in here for you.

```go
func (t *TitleScene) Draw(screen *ebiten.Image) {
	screen.Fill(color.RGBA{10, 15, 25, 255})

	// Get screen dimensions
	w, h := screen.Bounds().Dx(), screen.Bounds().Dy()

	// Draw title
	titleText := "Tower Defenders"
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

![title screen](tdtitlescreen.png)
And now when we run the application, we get the title scene and clicking it transitions to the game scene (just a black screen at the moment, we will fix that).

## Game Scene

Buckle up, we will be spending quite a lot of time here.
We can start by fixing it. Let's edit the NewGameScene and add in the logic we removed from our main function to load the map.

```go
func NewGameScene(sm *SceneManager) *GameScene {
	t, err := NewTilemapJSON("map/level.tmj")
	if err != nil {
 		panic(err)
 	}
	g := &GameScene{
		sceneManager: sm,
	}
	g.level = t
	g.images = t.LoadTiles()
	return g
}
```

Now run the game and the map loads on transition to game-state. We have done a lot of work to have one title screen to show for it. Don't fret. We have laid down a foundation that will make things a lot easier later on.

### Images

Let us take a moment and get our images all set up. In my [repo](https://github.com/RAshkettle/TowerDefenseTutorial). The readme in the repo will link you to all the invidividual assets directly from their creators also. In addition, I've added a tray background and an indicator for selecting no tower.

We already have ReadFile, loadImage and he image loading for our map and two tilesets. Time to get our animations too.

```go
func loadAnimation(spriteSheet *ebiten.Image, row int, numberOfFrames int, frameWidth int, frameHeight int) []*ebiten.Image {
	frames := make([]*ebiten.Image, 0, numberOfFrames)

	for frameIndex := 0; frameIndex < numberOfFrames; frameIndex++ {
		x := frameIndex * frameWidth
		y := row * frameHeight

		frame := spriteSheet.SubImage(image.Rect(x, y, x+frameWidth, y+frameHeight)).(*ebiten.Image)
		frames = append(frames, frame)
	}

	return frames
}
```

Provided a spritesheet and the meta-data, the code will beak down an animation into a slice of frames in order and ready to play.
The last helper function we will need for now is very specific to our game here. The assets have 3 towers in a strip. They are for upgrades. So, we need a function to only pull one from the spritesheet.

```go
func getFirstTower(spriteSheet *ebiten.Image) *ebiten.Image {

	// Each tower image is 64px wide and 128px tall
	//They all have 3 versions
	const towerWidth = 64
	const towerHeight = 128

	towerImage := spriteSheet.SubImage(image.Rect(0, 0, towerWidth, towerHeight)).(*ebiten.Image)

	return towerImage
}
```

The first unupgraded tower is good enough for our needs in a tutorial. Feel free to experiment with upgrades yourself though.

Now comes the tedius part. We need to load all the images. First load the spritesheets, then use that to load the animations. We need to do this for every asset, and you need to be looking at the spritesheets to know that. I'll save you the effort.

```go
var TrayBackground = loadImage("map/tray.png")
var NoneIndicator = loadImage("ui/none.png")

// Tower sprite sheets
var ballistaTowerSpriteSheet = loadImage("towers/Tower 01.png") // Renamed from towerOneSpriteSheet
var magicTowerSpriteSheet = loadImage("towers/Tower 05.png")
var BallistaTower = getFirstTower(ballistaTowerSpriteSheet) // Renamed from towerOneLevels
var MagicTower = getFirstTower(magicTowerSpriteSheet)

var towerBuildSpriteSheet = loadImage("towers/Tower Construction.png")
var TowerBuildAnimation1 = loadAnimation(towerBuildSpriteSheet, 0, 6, 192, 256)
var TowerTransitionAnimation = loadAnimation(towerBuildSpriteSheet, 1, 5, 192, 256)

var magicTowerWeaponSpriteSheet = loadImage("towers/Tower 05 - Level 01 - Weapon.png")
var MagicTowerWeaponIdleAnimation = loadAnimation(magicTowerWeaponSpriteSheet, 0, 8, 96, 96)
var MagicTowerWeaponAttackAnimation = loadAnimation(magicTowerWeaponSpriteSheet, 1, 27, 96, 96)
var magicTowerProjectileSpriteSheet = loadImage("towers/Tower 05 - Level 01 - Projectile.png")
var MagicTowerProjectileAnimation = loadAnimation(magicTowerProjectileSpriteSheet, 0, 12, 32, 32)
var magicTowerProjectileImpactSpriteSheet = loadImage("towers/Tower 05 - Level 01 - Projectile - Impact.png")
var MagicTowerProjectileImpactAnimation = loadAnimation(magicTowerProjectileImpactSpriteSheet, 0, 11, 64, 64)

var ballistaWeaponSpriteSheet = loadImage("towers/Tower 01 - Level 01 - Weapon.png")               // Renamed from towerOneWeaponStyleSheet
var ballistaWeaponProjectileSpriteSheet = loadImage("towers/Tower 01 - Level 01 - Projectile.png") // Renamed from towerOneWeaponProjectileStyleSheet
var BallistaWeaponProjectileAnimation = loadAnimation(ballistaWeaponProjectileSpriteSheet, 0, 3, 8, 40)
var ballistaWeaponImpactSpriteSheet = loadImage("towers/Tower 01 - Weapon - Impact.png")
var BallisticWeaponImpactAnimation = loadAnimation(ballistaWeaponImpactSpriteSheet, 0, 6, 64, 64)
var BallistaWeaponFire = loadAnimation(ballistaWeaponSpriteSheet, 0, 6, 96, 96) // Renamed from TowerOneWeaponFire

var HealthLeft = loadImage("ui/barRed_horizontalLeft.png")
var HealthFill = loadImage("ui/barRed_horizontalMid.png")
var HealthRight = loadImage("ui/barRed_horizontalRight.png")

// Load the creeps
var FirebugSpriteSheet = loadImage("creeps/Firebug.png")

// Firebug Animations
var FirebugSideIdle = loadAnimation(FirebugSpriteSheet, 2, 5, 128, 64)
var FirebugUpIdle = loadAnimation(FirebugSpriteSheet, 1, 5, 128, 64)
var FirebugDownIdle = loadAnimation(FirebugSpriteSheet, 0, 5, 128, 64)

var FirebugDownWalk = loadAnimation(FirebugSpriteSheet, 3, 7, 128, 64)
var FirebugUpWalk = loadAnimation(FirebugSpriteSheet, 4, 7, 128, 64)
var FirebugSideWalk = loadAnimation(FirebugSpriteSheet, 5, 7, 128, 64)

var FirebugDownDeath = loadAnimation(FirebugSpriteSheet, 6, 10, 128, 64)
var FirebugUpDeath = loadAnimation(FirebugSpriteSheet, 7, 10, 128, 64)
var FirebugSideDeath = loadAnimation(FirebugSpriteSheet, 8, 10, 128, 64)
```

These are all variabe declarations and go right under where we load the Grass and Water tilesets.

### Animations

Since we just loaded the animations, let's see how we can draw them. Create a file called `animated_sprite.go`. Let's start it simply with just the type definition. It's all explained in the comments.

```go
package main

import (
	"github.com/hajimehoshi/ebiten/v2"
)

// AnimatedSprite represents a sprite with animation capabilities
type AnimatedSprite struct {
	frames        []*ebiten.Image // Animation frames
	frameCount    int             // Total number of frames
	frameDuration float64         // Duration per frame in seconds
	currentFrame  int             // Current frame index
	frameTimer    float64         // Timer for current frame
	isPlaying     bool            // Whether animation is currently playing
	loop          bool            // Whether to loop the animation
	totalDuration float64         // Total animation duration in seconds
}
```

Of course, we need a factory method:

```go
func NewAnimatedSprite(frames []*ebiten.Image, animationLength float64, loop bool) *AnimatedSprite {
	if len(frames) == 0 {
		return nil
	}

	frameCount := len(frames)
	frameDuration := animationLength / float64(frameCount)

	return &AnimatedSprite{
		frames:        frames,
		frameCount:    frameCount,
		frameDuration: frameDuration,
		currentFrame:  0,
		frameTimer:    0.0,
		isPlaying:     false,
		loop:          loop,
		totalDuration: animationLength,
	}
}
```

And now we have an animation. Let's look at the methods that we can use to play it. The majority of the work will happen our update function, so let's get the others out of the way.

```go
func (as *AnimatedSprite) Play() {
	as.isPlaying = true
	as.currentFrame = 0
	as.frameTimer = 0.0
}
// IsPlaying returns true if the animation is currently playing.
func (as *AnimatedSprite) IsPlaying() bool {
	return as.isPlaying
}

// GetCurrentFrame returns the current frame image
func (as *AnimatedSprite) GetCurrentFrame() *ebiten.Image {
	if as.frameCount == 0 || as.currentFrame < 0 || as.currentFrame >= as.frameCount {
		return nil
	}
	return as.frames[as.currentFrame]
}
```

These are just some straightforward helper functions to deal with animations. Now for the update function.

```go
func (as *AnimatedSprite) Update(deltaTime float64) {
	if !as.isPlaying || as.frameCount <= 1 { // No need to update if not playing or single frame
		return
	}

	as.frameTimer += deltaTime

	// Advance frames based on how much time has passed relative to frameDuration
	// This handles cases where deltaTime might be larger than frameDuration (e.g., lag spikes)
	for as.frameTimer >= as.frameDuration && as.isPlaying { // Keep as.isPlaying check for non-looping animations
		as.frameTimer -= as.frameDuration
		as.currentFrame++

		if as.currentFrame >= as.frameCount {
			if as.loop {
				as.currentFrame = 0 // Loop back to start
			} else {
				as.currentFrame = as.frameCount - 1 // Stay on last frame
				as.isPlaying = false                // Stop animation
				// No need to subtract from frameTimer further if animation stopped
				// and we are on the last frame.
				break
			}
		}
	}
}
```

This is pretty much the same code used all over for people animating sprites with ebitengine. Nothing unusual here.

### Render

To account for some of the more complex UI to some (tray for tower selection, ui elements, etc), we need to keep track of some params. Create a file called `render.go` and add this to the top of it.

```go
package main

import (
	"github.com/hajimehoshi/ebiten/v2"
)

// RenderParams holds all the parameters needed for rendering
type RenderParams struct {
	Scale        float64
	OffsetX      float64
	OffsetY      float64
	TrayX        float64
	TrayWidth    int
	ScreenWidth  int
	ScreenHeight int
}

// Renderer handles map and general rendering logic
type Renderer struct{}

// NewRenderer creates a new renderer
func NewRenderer() *Renderer {
	return &Renderer{}
}
```

Nothing there really requires much explanation. This next function is a whole bunch of math. Just trust me that I worked it all out.

```go
func (r *Renderer) CalculateRenderParams(screen *ebiten.Image, level *TilemapJSON) RenderParams {
	const tileSize = 64
	const trayWidth = 80

	// Get screen dimensions
	screenWidth, screenHeight := screen.Bounds().Dx(), screen.Bounds().Dy()

	// Calculate available space for the map (minus the tray)
	mapAreaWidth := screenWidth - trayWidth

	// Calculate map dimensions
	mapWidth := float64(level.Layers[0].Width * tileSize)
	mapHeight := float64(level.Layers[0].Height * tileSize)

	// Ensure map has minimum dimensions to prevent division by zero
	if mapWidth <= 0 {
		mapWidth = float64(tileSize)
	}
	if mapHeight <= 0 {
		mapHeight = float64(tileSize)
	}

	// Calculate scale - only scale if map is larger than available area
	var scale float64 = 1.0
	if mapWidth > float64(mapAreaWidth) || mapHeight > float64(screenHeight) {
		scaleX := float64(mapAreaWidth) / mapWidth
		scaleY := float64(screenHeight) / mapHeight
		scale = scaleX
		if scaleY < scaleX {
			scale = scaleY
		}
	}

	// Ensure minimum scale to prevent crashes
	const minScale = 0.1
	if scale < minScale {
		scale = minScale
	}

	// Calculate offsets to center the map
	scaledMapWidth := mapWidth * scale
	scaledMapHeight := mapHeight * scale
	offsetX := (float64(mapAreaWidth) - scaledMapWidth) / 2
	offsetY := (float64(screenHeight) - scaledMapHeight) / 2

	// Calculate tray position (right next to the actual map)
	trayX := offsetX + scaledMapWidth

	return RenderParams{
		Scale:        scale,
		OffsetX:      offsetX,
		OffsetY:      offsetY,
		TrayX:        trayX,
		TrayWidth:    trayWidth,
		ScreenWidth:  screenWidth,
		ScreenHeight: screenHeight,
	}
}
```

### Creeps

Now we render the creeps. We can start by creating a file called `creeps.go`. Open it up and let's start by adding some imports and a couple objects.

```go
package main

import (
	"math"
	"math/rand"
	"time"
	"towerDefense/assets"

	"github.com/hajimehoshi/ebiten/v2"
)

// PathNode represents a single step in the path
// This is one point in our waypointing logic
type PathNode struct {
	X, Y int
}

// Direction enum for sprite facing
type Direction int

const (
	DirectionRight Direction = iota
	DirectionLeft
	DirectionUp
	DirectionDown
)
```

Direction is just a simple enum so we can determine the proper animation. PathNode represents a waypooing. We will go further into that later.
A creep, for our purposes, is an enemy who follows a path. There are a few properties we are going to need to make this work. Let's add them.

```go
type Creep struct {
	ID               int
	X, Y             float64
	Speed            float64
	Health           float64
	MaxHealth        float64
	Path             []PathNode
	PathIndex        int
	Animation        *AnimatedSprite
	CurrentDirection Direction
	StartDelay       float64
	Timer            float64
	Active           bool
	Damage           float64
	IsDying          bool
}
```

And of course, let's create a factory.

```go
func NewCreep(id int, x, y float64, path []PathNode, startDelay float64) *Creep {
	return &Creep{
		ID:               id,
		X:                x,
		Y:                y,
		Speed:            2.0 + rand.Float64()*2.0, // 2-4 speed range
		Health:           20.0,
		MaxHealth:        20.0,
		Path:             append([]PathNode(nil), path...), // Copy path
		PathIndex:        0,
		Animation:        NewAnimatedSprite(assets.FirebugSideIdle, 1.0, true),
		CurrentDirection: DirectionRight,
		StartDelay:       startDelay,
		Timer:            0,
		Active:           true,
		Damage:           2.0,
		IsDying:          false,
	}
}
```

Ok, let's add some methods. Let's start with a bunch of real easy and obvious ones. First some basic getters.

```go
// IsActive returns if the creep is still active
func (c *Creep) IsActive() bool {
	return c.Active
}

// GetID returns the creep's ID
func (c *Creep) GetID() int {
	return c.ID
}

// GetDamage returns the damage this creep deals when escaping
func (c *Creep) GetDamage() float64 {
	return c.Damage
}
```

Now we need to give our creep the ability to take damage (for later on). It's health cannot dip below zero.

```go
// TakeDamage reduces the creep's health
func (c *Creep) TakeDamage(amount float64) {
	if c.IsDying {
		return
	}
	c.Health -= amount
	if c.Health < 0 {
		c.Health = 0
	}
}
```

Now let's give the creep the ability to be drawn.

```go
// Draw renders the creep
func (c *Creep) Draw(screen *ebiten.Image, params RenderParams) {

	//Start by checking to make sure we have an animation.
	//Just basic bulletproofing
	if c.Animation == nil {
		return
	}

	frame := c.Animation.GetCurrentFrame()
	if frame == nil {
		return
	}

	//Maybe refactor this later to a centeral location
	tileSize := 64.0

	opts := &ebiten.DrawImageOptions{}

	// Calculate position
	worldX := c.X * tileSize
	worldY := c.Y * tileSize
	screenX := params.OffsetX + worldX*params.Scale
	screenY := params.OffsetY + worldY*params.Scale
	opts.GeoM.Scale(params.Scale, params.Scale)
	opts.GeoM.Translate(screenX, screenY)

	screen.DrawImage(frame, opts)
}
```

Since we checked on animation there, I guess we should set the proper animation.

```go
// updateDirection sets the creep's facing direction
func (c *Creep) updateDirection(dx, dy float64) {
	if math.Abs(dx) > math.Abs(dy) {
		if dx > 0 {
			c.CurrentDirection = DirectionRight
		} else {
			c.CurrentDirection = DirectionLeft
		}
	} else {
		if dy > 0 {
			c.CurrentDirection = DirectionDown
		} else {
			c.CurrentDirection = DirectionUp
		}
	}
}
// animationFramesEqual checks if two animation frame sets are the same
func animationFramesEqual(a, b []*ebiten.Image) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// setAnimation sets the appropriate animation based on state and direction
func (c *Creep) setAnimation() {
	var frames []*ebiten.Image

	// Choose animation based on movement state and direction
	if c.PathIndex >= len(c.Path)-1 || (c.PathIndex < len(c.Path)-1 && c.Timer >= c.StartDelay) {
		// Walking animation
		switch c.CurrentDirection {
		case DirectionUp:
			frames = assets.FirebugUpWalk
		case DirectionDown:
			frames = assets.FirebugDownWalk
		default: // Left/Right
			frames = assets.FirebugSideWalk
		}
	} else {
		// Idle animation
		switch c.CurrentDirection {
		case DirectionUp:
			frames = assets.FirebugUpIdle
		case DirectionDown:
			frames = assets.FirebugDownIdle
		default: // Left/Right
			frames = assets.FirebugSideIdle
		}
	}

	// Only change animation if it's different
	if c.Animation == nil || !animationFramesEqual(c.Animation.frames, frames) {
		c.Animation = NewAnimatedSprite(frames, 1.0, true)
		c.Animation.Play()
	}
}
```

Now for Update. We will add a lot to this as we go, but for now, it's simple.

```go
func (c *Creep) Update(deltaTime float64, level *TilemapJSON, onEscape func(float64)) {
	// Update timer
	c.Timer += deltaTime
	// Update animation
	c.setAnimation()
	c.Animation.Update(deltaTime)
}
```

This is a lot of work with little result. It will come together. Let's create a Creep Manager to manage our swarms and be a central point for scoring etc. Create a new file called `creep_manager.go`

```go
package main

import (
	"math/rand"

	"github.com/hajimehoshi/ebiten/v2"
)

// CreepManager handles spawning creeps and tracking their count
type CreepManager struct {
	creeps        []*Creep
	onCreepEscape func(damage float64)
	onCreepKilled func(goldReward int)
	nextCreepID   int
}
```

Just a basic struct to hold the info on our swarm of creeps. As always, a factory method is a good idea. It's good to be idiomatic.

```go
func NewCreepManager() *CreepManager {
	return &CreepManager{
		nextCreepID: 1,
	}
}
```

Our creep manager needs to be able to add a creep to it's collection. We also want a helper to increment creep id.

```go

// AddCreep adds a new creep
func (cm *CreepManager) AddCreep(creep *Creep) {
	cm.creeps = append(cm.creeps, creep)
}
// GetNextCreepID provides a unique ID for a new creep
func (cm *CreepManager) GetNextCreepID() int {
	id := cm.nextCreepID
	cm.nextCreepID++
	return id
}
```

We have those two callbacks. Let's allow to register them.

```go
// SetOnCreepEscape sets the callback for when a creep escapes
func (cm *CreepManager) SetOnCreepEscape(cb func(damage float64)) {
	cm.onCreepEscape = cb
}

// SetOnCreepKilled sets the callback for when a creep is killed
func (cm *CreepManager) SetOnCreepKilled(cb func(goldReward int)) {
	cm.onCreepKilled = cb
}
```

Of course we want to spawn them.

```go
// SpawnCreeps creates and adds creeps to the manager
func SpawnCreeps(manager *CreepManager, numCreeps int, startX, startY float64, pathNodes []PathNode) {
	if manager == nil {
		return
	}

	for i := 0; i < numCreeps; i++ {
		startDelay := 1.0 + rand.Float64()*4.0 // Random delay 1-5 seconds
		creep := NewCreep(manager.GetNextCreepID(), startX, startY, pathNodes, startDelay)
		manager.AddCreep(creep)
	}
}
```

Finally for now, Draw and Update, which will call the same in all their children.

```go
// Update updates all creeps - simplified to just handle creep lifecycle
func (cm *CreepManager) Update(level *TilemapJSON, deltaTime float64) {
	var remainingCreeps []*Creep
	for _, creep := range cm.creeps {
		if creep.IsActive() {
			creep.Update(deltaTime, level, cm.onCreepEscape)
		}
		if creep.IsActive() {
			remainingCreeps = append(remainingCreeps, creep)
		}
	}
	cm.creeps = remainingCreeps
}

// Draw renders all creeps
func (cm *CreepManager) Draw(screen *ebiten.Image, params RenderParams) {
	for _, creep := range cm.creeps {
		if creep.IsActive() {
			creep.Draw(screen, params)
		}
	}
}
```

Now we need to set things up to spawn them. I want to spawn the on the first waypoint, so let's switch to that and set up loading the waypoints. Open up `tilemap.go` and add these structs.

```go
// TilemapPropertyJSON defines the structure for properties within a Tiled object.
type TilemapPropertyJSON struct {
	Name  string `json:"name"`
	Type  string `json:"type"`
	Value any    `json:"value"` // Using 'any' (or interface{}) for flexibility
}

// Object definition for object layers (like waypoints)
type TilemapObjectJSON struct {
	Name       string                `json:"name"`
	Type       string                `json:"type"`
	X          float64               `json:"x"`
	Y          float64               `json:"y"`
	Properties []TilemapPropertyJSON `json:"properties"`
}
```

We need to add Object and Type to our TileMapLayerJSON struct, to it should be changed to this:

```go
type TilemapLayerJSON struct {
	Data    []int               `json:"data"`
	Width   int                 `json:"width"`
	Height  int                 `json:"height"`
	Name    string              `json:"name"`
	Objects []TilemapObjectJSON `json:"objects,omitempty"`
	Type    string              `json:"type,omitempty"`
}
```

The next function we will add will get all the waypoints we placed on the waypoint layer and return it to us in a slice of pathnodes. They will be ordered by name, which is a number. This is the path our creeps will follow to stay on the roads. There are other ways (a\* pathing, nav grid, curves). This was just pretty easy to understand, so I chose it.

```go
// GetWaypoints returns a slice of waypoints from the waypoints layer, sorted numerically by name
func (t *TilemapJSON) GetWaypoints() []PathNode {
	waypoints := []struct {
		Index int
		Node  PathNode
	}{}

	for _, layer := range t.Layers {
		if layer.Type == "objectgroup" && layer.Name == "waypoints" {
			for _, obj := range layer.Objects {
				// Try to parse the name as an integer
				var idx int
				_, err := fmt.Sscanf(obj.Name, "%d", &idx)
				if err != nil {
					continue // skip if not a number
				}
				tileX := int(obj.X) / t.TileWidth
				tileY := int(obj.Y) / t.TileHeight
				waypoints = append(waypoints, struct {
					Index int
					Node  PathNode
				}{idx, PathNode{X: tileX, Y: tileY}})
			}
			break
		}
	}

	// Sort by Index
	sort.Slice(waypoints, func(i, j int) bool {
		return waypoints[i].Index < waypoints[j].Index
	})

	// Extract just the PathNodes
	result := make([]PathNode, len(waypoints))
	for i, wp := range waypoints {
		result[i] = wp.Node
	}
	return result
}
```

Now we return to GameScene to finish spawning them. Well, we have something to update now. Let's change the update function.

This function will be using delta time. The easiest way to keep track of delta is to add a _lastUpdate_ field in our GameScene. This is also a good time to add a reference to our CreepManager so we can spawn the creeps. Since we need the RenderParams to scale everything, add a reference to Renderer also. Go to the GameScene struct and add the lines...

```go
lastUpdate 		time.Time
creepManager  *CreepManager
renderer			*Renderer
```

Now we can calculate our delta time in our update here.

```go
func (g *GameScene) Update() error {
	// Calculate delta time
	now := time.Now()
	deltaTime := 1.0 / float64(ebiten.TPS())

	if !g.lastUpdate.IsZero() {
		deltaTime = now.Sub(g.lastUpdate).Seconds()
	}
	g.lastUpdate = now

	g.creepManager.Update(g.level, deltaTime)
	return nil
}
```

Now we can spawn a wave of creeps onto our level.

```go
// spawnNewWave spawns a new wave of creeps with randomized count
func (g *GameScene) spawnNewWave() {
	pathNodes := g.level.GetWaypoints()
	if len(pathNodes) == 0 {
		fmt.Println("Warning: No waypoints found for spawning creeps")
		return
	}

	// Spawn firebugs at the first waypoint (waypoint 0)
	startX := float64(pathNodes[0].X)
	startY := float64(pathNodes[0].Y)

	// Randomize creep count between 5-10
	creepCount := 5 + rand.Intn(6) // 5 + (0-5) = 5-10

	SpawnCreeps(g.creepManager, creepCount, startX, startY, pathNodes)

}
```

And we need to change the factory to instantiate a creep manager and spawn creeps.

```go
func NewGameScene(sm *SceneManager) *GameScene {
	t, err := NewTilemapJSON("map/level.tmj")
	if err != nil {
		panic(err)
	}
	g := &GameScene{
		sceneManager: sm,
		lastUpdate:   time.Now(), // Initialize the timer
		creepManager: NewCreepManager(), // Initialize the creep manager
	}
	g.level = t
	g.images = t.LoadTiles()
	g.spawnNewWave()
	return g
}
```

One last thing and we finally have creeps spawning. Update Draw. At the very end of the function, add this:

```go
	//Draw other things here
	params := g.renderer.CalculateRenderParams(screen, g.level)
	g.creepManager.Draw(screen, params)
```

Run the game now and when you go to the game scene, there they are, all the creeps animated on top of each other. Still...progress!

#### Movement

Now we want our creeps to move along the road. This is completely handled by finishing the Update function in creeps.go. I've heavily commented it and even asked copilot to add comments to make this very clear.

```go
// Update handles creep movement and state
// This function is called every frame to move the creep along its path
// deltaTime: time elapsed since last frame (in seconds)
// level: the game map containing boundaries and layout
func (c *Creep) Update(deltaTime float64, level *TilemapJSON, onEscape func(float64)) {
	// Update the internal timer - this tracks how long the creep has been alive
	c.Timer += deltaTime

		// PHASE 1: Check if we should wait before starting to move
		// Some creeps have a delay before they begin moving (for staggered spawning)
		if c.Timer < c.StartDelay {
			// Still waiting, just update animation and don't move yet
			c.Animation.Update(deltaTime)
			return
		}

		// PHASE 2: Safety check - make sure we have a path to follow
		// If there's no path, the creep can't move anywhere
		if len(c.Path) == 0 {
			// No path available, just update animation
			c.Animation.Update(deltaTime)
			return
		}

		// PHASE 3: Main movement logic
		// Check if we're still following the path (not at the final waypoint yet)
		if c.PathIndex < len(c.Path)-1 {
			// We're still on the path, move toward the next waypoint
			target := c.Path[c.PathIndex+1] // Get the next waypoint to move toward

			// Calculate the direction vector from current position to target
			dx := float64(target.X) - c.X  // Horizontal distance to target
			dy := float64(target.Y) - c.Y  // Vertical distance to target
			distance := math.Hypot(dx, dy) // Total distance using Pythagorean theorem

			// Only move if there's actually distance to cover
			if distance > 0 {
				// Calculate how far we can move this frame based on speed
				moveDistance := c.Speed * deltaTime

				// Check if we can reach the target this frame
				if moveDistance >= distance {
					// We can reach the waypoint this frame - snap to it exactly
					c.X = float64(target.X)
					c.Y = float64(target.Y)
					c.PathIndex++ // Move to the next waypoint
				} else {
					// We can't reach the waypoint this frame - move part way there
					// Normalize the direction vector (make it length 1) and scale by move distance
					c.X += (dx / distance) * moveDistance
					c.Y += (dy / distance) * moveDistance
				}

				// Update which direction the sprite should face based on movement
				c.updateDirection(dx, dy)
			}
		} else {
			// PHASE 4: We've reached the end of the path - move off screen
			// Calculate the direction to continue moving (same as last path segment)
			var dx, dy float64 = 1, 0 // Default direction is right if we can't calculate

			// If we have at least 2 path points, use the direction of the last segment
			if len(c.Path) > 1 {
				last := c.Path[len(c.Path)-1] // Final waypoint
				prev := c.Path[len(c.Path)-2] // Second-to-last waypoint

				// Calculate direction vector of the last path segment
				dx = float64(last.X - prev.X)
				dy = float64(last.Y - prev.Y)

				// Normalize the direction vector so it has length 1
				norm := math.Hypot(dx, dy)
				if norm > 0 {
					dx /= norm
					dy /= norm
				}
			}

			// Continue moving in that direction to exit the screen
			moveDistance := c.Speed * deltaTime
			c.X += dx * moveDistance
			c.Y += dy * moveDistance
		}

		// PHASE 5: Check if the creep has escaped (moved outside the map boundaries)
		if level != nil && len(level.Layers) > 0 {
			// Get the map dimensions from the first layer
			mapWidth := float64(level.Layers[0].Width)
			mapHeight := float64(level.Layers[0].Height)

			// Check if creep is outside map bounds (with small buffer of -1)
			if c.X < -1 || c.X > mapWidth || c.Y < -1 || c.Y > mapHeight {
				// Creep has escaped! Mark it as inactive so it gets removed
				c.Active = false
				// TODO: This is where we would call a function to handle player losing health
				// if onEscape != nil {
				// 	onEscape(c.Damage)
				// }
				return
			}
		}


	// PHASE 6: Update visual appearance
	// Set the correct animation based on current state and direction
	c.setAnimation()
	// Update the animation frames (for walking/idle cycles)
	c.Animation.Update(deltaTime)
}
```

Now to make them work better. When they leave the screen, the player should take damage. Let's track that. We need to add max health and player health to the GameScene.

```go
type GameScene struct {
	sceneManager *SceneManager
	level        *TilemapJSON
	images       TileImageMap

	creepManager *CreepManager
	lastUpdate   time.Time
	renderer     *Renderer
	playerHealth int
	maxHealth    int
}
```

and back to the Update Method in our Creep Manager (creep_manager.go)

```go
func (cm *CreepManager) Update(level *TilemapJSON, deltaTime float64) {
	var remainingCreeps []*Creep
	for _, creep := range cm.creeps {
		if creep.IsActive() {
			// Create a callback function to handle escapes
			onEscape := func(damage float64) {
				if cm.onCreepEscape != nil {
					cm.onCreepEscape(damage)
				}
			}
			creep.Update(deltaTime, level, onEscape)
		}
		// Check if creep is still active after update (may have escaped)
		if creep.IsActive() {
			remainingCreeps = append(remainingCreeps, creep)
		}
	}
	cm.creeps = remainingCreeps
}
```

And we need to update our NewGameScene factory

```go
func NewGameScene(sm *SceneManager) *GameScene {
	t, err := NewTilemapJSON("map/level.tmj")
	if err != nil {
		panic(err)
	}
	g := &GameScene{
		sceneManager: sm,
		lastUpdate:   time.Now(),        // Initialize the timer
		creepManager: NewCreepManager(), // Initialize the creep manager
	}
	g.level = t
	g.images = t.LoadTiles()
	g.creepManager.SetOnCreepEscape(func(damage float64) {
		g.playerHealth -= int(damage)
		if g.playerHealth < 0 {
			g.playerHealth = 0
		}})
	g.spawnNewWave()
	return g
}
```

Here we added the SetOnCreepEscape callback function. Since we now have the creeps spawning, animated, following the path, and damaging the player as they escape, it's time to create a spawner to create a spawn about 5 seconds after every spawn finishes.

We want a timer, because we are going to have the wait 5 seconds to spawn a new level.

```
go get github.com/RAshkettle/Stopwatch@v1.0.3
```

In game_scene, add this import.

```go
stopwatch "github.com/RAshkettle/Stopwatch"
```

Add the following to the end of GameScene

```go
		spawnTimer:   stopwatch.NewStopwatch(5 * time.Second), // 5 second timer
		hasSpawned:   true, // Start as true since we spawn initially
```

Since we added these, we need to edit the NewGameScene factory. Let's do that.

```go
func NewGameScene(sm *SceneManager) *GameScene {
	t, err := NewTilemapJSON("map/level.tmj")
	if err != nil {
		panic(err)
	}
	g := &GameScene{
		sceneManager: sm,
		lastUpdate:   time.Now(),        // Initialize the timer
		creepManager: NewCreepManager(), // Initialize the creep manager
		spawnTimer:   stopwatch.NewStopwatch(5 * time.Second), // 5 second timer
		hasSpawned:   true, // Start as true since we spawn initially
	}
	g.level = t
	g.images = t.LoadTiles()
	g.creepManager.SetOnCreepEscape(func(damage float64) {
		g.playerHealth -= int(damage)
		if g.playerHealth < 0 {
			g.playerHealth = 0
		}})
	g.spawnNewWave()
	return g
}
```

Now in the update function, we will increment the tic on our timer. Then we check to see if it triggered. If so, we spawn a new wave. The rest of the changes are so we either don't spawn nothing, or spawn infinite waves of creeps.

```go
func (g *GameScene) Update() error {
	// Calculate delta time
	now := time.Now()
	deltaTime := float64(0)

	if !g.lastUpdate.IsZero() {
		deltaTime = now.Sub(g.lastUpdate).Seconds()
	}
	g.lastUpdate = now

	g.creepManager.Update(g.level, deltaTime)

	// Update the spawn timer
	g.spawnTimer.Update()

	// Check if timer is done to spawn new wave
	if g.spawnTimer.IsDone() && !g.hasSpawned {
		g.spawnNewWave()
		g.spawnTimer.Stop()
		g.hasSpawned = true
	}

	// Check if all creeps are removed and timer is not already running
	if len(g.creepManager.creeps) == 0 && !g.spawnTimer.IsRunning() && g.hasSpawned {
		g.spawnTimer.Start()
		g.hasSpawned = false
	}

	return nil
}
```

At this point, we have accomplished the following:

- Embedded File System
- Loading Tiled Map
- Spawn Creeps
- Player Damage on Creep Escape
- Respawn Timer
- Pathfinding
- Animations

This is starting to be quite a bit, isn't it? Well, we aren't finished yet! How about we put some UI into this?

### UI

Create a new file called `ui.go`.

```go
package main

import (
	"bytes"
	"fmt"
	"image/color"
	"towerDefense/assets"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/text/v2"
	"golang.org/x/image/font/gofont/gobold"
)
`
```

Now we need a UI Manager and constructor.

```go
// UIManager handles all UI rendering
type UIManager struct{}

// NewUIManager creates a new UI manager
func NewUIManager() *UIManager {
	return &UIManager{}
}
```

First we will draw a health bar. The assets are already loaded from earlier, but we will need a "Health" label, so let's set up the font.

```go
var (
	boldFontFace *text.GoTextFace
)

func init() {
	// Initialize the bold font face
	boldFontSource, err := text.NewGoTextFaceSource(bytes.NewReader(gobold.TTF))
	if err != nil {
		panic(err)
	}
	boldFontFace = &text.GoTextFace{
		Source: boldFontSource,
		Size:   20,
	}
}
```

Next we want to turn this font into a scaled font, so we can cleanly scale our game.

```go
// createScaledFont creates a font face scaled appropriately for the current scale
func (ui *UIManager) createScaledFont(scale float64) *text.GoTextFace {
	scaledFontSize := 20.0 * scale
	if scaledFontSize < 8 {
		scaledFontSize = 8 // Minimum readable size
	}

	return &text.GoTextFace{
		Source: boldFontFace.Source,
		Size:   scaledFontSize,
	}
}
```

This font will serve us for all the UI elements. With that, we can draw the Health label

```go
// drawHealthLabel renders the "Health:" text label
func (ui *UIManager) drawHealthLabel(screen *ebiten.Image, scaledX, scaledY, labelOffset, scale float64) {
	labelX := scaledX - labelOffset*scale
	labelY := scaledY - 4*scale

	// Create scaled font
	scaledFontFace := ui.createScaledFont(scale)

	// Create text draw options
	opts := &text.DrawOptions{}
	opts.GeoM.Translate(labelX, labelY)
	opts.ColorScale.ScaleWithColor(color.White)

	// Draw the text
	text.Draw(screen, "Health:", scaledFontFace, opts)
}
```

This is a bit more complicates, so again, I'll make sure it's over commented. This is where we stack the segments to show a healthbar that grows and shrinks depending on the health.

```go
// drawHealthBarSegments renders the actual health bar with segments
func (ui *UIManager) drawHealthBarSegments(screen *ebiten.Image, scaledX, scaledY, scale float64, currentHealth, maxHealth int) {
	// Calculate what percentage of health remains (0.0 to 1.0)
	healthPercentage := float64(currentHealth) / float64(maxHealth)

	// Convert percentage to number of filled segments out of 10 total segments
	// Example: 75% health = 7.5, which becomes 7 filled segments when cast to int
	filledSegments := int(healthPercentage * 10) // 10 segments total

	// Track the current X position as we draw each piece from left to right
	currentX := scaledX

	// Draw the left end cap of the health bar (rounded left edge)
	if assets.HealthLeft != nil {
		// Create drawing options for the left cap
		leftOpts := &ebiten.DrawImageOptions{}

		// Scale the image to match the current zoom level
		leftOpts.GeoM.Scale(scale, scale)

		// Position the left cap at the starting coordinates
		leftOpts.GeoM.Translate(currentX, scaledY)

		// Actually draw the left cap to the screen
		screen.DrawImage(assets.HealthLeft, leftOpts)

		// Get the dimensions of the left cap image
		leftBounds := assets.HealthLeft.Bounds()

		// Move our X position forward by the width of the left cap (scaled)
		// This ensures the next piece will be drawn right after this one
		currentX += float64(leftBounds.Dx()) * scale
	}

	// Draw 10 individual health segments that make up the main bar
	for i := 0; i < 10; i++ {
		if assets.HealthFill != nil {
			// Create drawing options for this health segment
			fillOpts := &ebiten.DrawImageOptions{}

			// Scale the segment to match current zoom level
			fillOpts.GeoM.Scale(scale, scale)

			// Position this segment at the current X position
			fillOpts.GeoM.Translate(currentX, scaledY)

			// Determine if this segment should be filled or empty based on current health
			if i < filledSegments {
				// This segment represents health that the player still has
				// Apply color tinting based on how much health remains
				if currentHealth <= 30 {
					// Critical health: bright red (boost red, reduce green/blue)
					fillOpts.ColorScale.Scale(1.2, 0.3, 0.3, 1.0) // Bright red
				} else if currentHealth <= 50 {
					// Low health: orange warning color
					fillOpts.ColorScale.Scale(1.0, 0.6, 0.2, 1.0) // Orange
				}
				// If health > 50, use the default red color (no color scaling applied)

				// Draw the filled segment with appropriate color
				screen.DrawImage(assets.HealthFill, fillOpts)
			} else {
				// This segment represents health that has been lost
				// Make it dark gray and semi-transparent to show it's empty
				fillOpts.ColorScale.Scale(0.2, 0.2, 0.2, 0.6) // Dark gray, 60% opacity
				screen.DrawImage(assets.HealthFill, fillOpts)
			}

			// Get the dimensions of the health fill segment
			fillBounds := assets.HealthFill.Bounds()

			// Move our X position forward by the width of this segment (scaled)
			// This positions us for drawing the next segment
			currentX += float64(fillBounds.Dx()) * scale
		}
	}

	// Draw the right end cap of the health bar (rounded right edge)
	if assets.HealthRight != nil {
		// Create drawing options for the right cap
		rightOpts := &ebiten.DrawImageOptions{}

		// Scale the right cap to match current zoom level
		rightOpts.GeoM.Scale(scale, scale)

		// Position the right cap at the final X position (after all segments)
		rightOpts.GeoM.Translate(currentX, scaledY)

		// Draw the right cap to complete the health bar
		screen.DrawImage(assets.HealthRight, rightOpts)
	}
}
```

I know that's a lot, but nothing in there is all that complicated. Now we create a function that ties all this together so we can call it from our game scene.

```go
// DrawHealthBar renders the health bar and "Health:" label
func (ui *UIManager) DrawHealthBar(screen *ebiten.Image, params RenderParams, currentHealth, maxHealth int) {
	const healthBarX = 192.0
	const healthBarY = 64.0
	const labelOffset = 100.0

	// Scale the positioning and add map offset
	scaledX := healthBarX*params.Scale + params.OffsetX
	scaledY := healthBarY*params.Scale + params.OffsetY

	// Draw "Health:" label
	ui.drawHealthLabel(screen, scaledX, scaledY, labelOffset, params.Scale)

	// Draw health bar segments
	ui.drawHealthBarSegments(screen, scaledX, scaledY, params.Scale, currentHealth, maxHealth)
}
```

Going to `game_scene.go` we need to add a reference to our UIManager to our GameScene.

```go
type GameScene struct {
	sceneManager *SceneManager
	level        *TilemapJSON
	images       TileImageMap

	creepManager *CreepManager
	lastUpdate   time.Time
	renderer     *Renderer
	playerHealth int
	maxHealth    int
	spawnTimer   *stopwatch.Stopwatch
	hasSpawned   bool // Flag to prevent multiple spawns
	uiManager    *UIManager
}
```

Then in the very last line of our Draw function, add this line.

```go
g.uiManager.DrawHealthBar(screen, params, g.playerHealth, g.maxHealth)
```

Run the game. Everything should be there, and if you scale the game bigger or smaller, the UI should scale properly. Awesome! One problem...it's empty! Why is it not reflecting our player's health?  
The answer is simple. We never set those values. Change the NewGameScene factory to this.

```go
func NewGameScene(sm *SceneManager) *GameScene {
	t, err := NewTilemapJSON("map/level.tmj")
	if err != nil {
		panic(err)
	}
	g := &GameScene{
		sceneManager: sm,
		lastUpdate:   time.Now(),        // Initialize the timer
		creepManager: NewCreepManager(), // Initialize the creep manager
		spawnTimer:   stopwatch.NewStopwatch(5 * time.Second), // 5 second timer
		hasSpawned:   true, // Start as true since we spawn initially
		maxHealth: 100,
		playerHealth: 100,
	}
	g.level = t
	g.images = t.LoadTiles()
	g.creepManager.SetOnCreepEscape(func(damage float64) {
		g.playerHealth -= int(damage)
		if g.playerHealth < 0 {
			g.playerHealth = 0
		}})
	g.spawnNewWave()
	return g
}
```

Now run the game and you see a complete health bar. Now we have our next problem. It seems even though we added player damage on creep escape, it's not really working. Let us fix that.
If you go to creeps.go, we wrote the code for damage, but forgot to uncomment it out when we finished. In the creeps.go file, look at the Update function and find this.

```go
				// TODO: This is where we would call a function to handle player losing health
				//if onEscape != nil {
					//onEscape(c.Damage)
				//}
```

Just uncomment it. Now if you run it, the creeps damage the player on escape. Now that we have damage, we have the Player Death, or Game Over condition. When we reach this condition, we should go to the End Scene. There we should be informed of the Game's status and be given an opportunity to play again. Let us begin with the transition to the end scene. This should go in `game_scene.go` and should be placed at the top of the Update function.

```go
	// Check if player health has reached zero - game over!
	if g.playerHealth <= 0 {
		g.sceneManager.TransitionTo(SceneEndScreen)
		return nil
	}
```

Now, when the player's health reaches zero, we will go to the end scene. Of course, it's just a black screen, so let's fix that.  
Before we do so, I noticed some bad code behavior that I wish to fix. We never instantiate the UIManager or the Renderer. It's currently still working, but will certainly not hold up for long. Change the function to this.

```go
func NewGameScene(sm *SceneManager) *GameScene {
	t, err := NewTilemapJSON("map/level.tmj")
	if err != nil {
		panic(err)
	}
	g := &GameScene{
		sceneManager: sm,
		lastUpdate:   time.Now(),        // Initialize the timer
		creepManager: NewCreepManager(), // Initialize the creep manager
		spawnTimer:   stopwatch.NewStopwatch(5 * time.Second), // 5 second timer
		hasSpawned:   true, // Start as true since we spawn initially
		maxHealth:    100,
		playerHealth: 100,
		uiManager:    NewUIManager(), // Initialize the UI manager
		renderer:     NewRenderer(),  // Initialize the renderer
	}
	g.level = t
	g.images = t.LoadTiles()
	g.creepManager.SetOnCreepEscape(func(damage float64) {
		g.playerHealth -= int(damage)
		if g.playerHealth < 0 {
			g.playerHealth = 0
		}})
	g.spawnNewWave()
	return g
}
```

Great! Now we can return to the End Scene. Start by adding the font information to the struct.

```go
type EndScene struct {
	sceneManager *SceneManager
	titleFont    *text.GoTextFace
	subtitleFont *text.GoTextFace
}
```

Now let's fix our factory to add these new fields.

```go
func NewEndScene(sm *SceneManager) *EndScene {
	// Create fonts (same pattern as TitleScene)
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

Now we need to update our Draw function. This is just pushing text around on the screen and is nothing special. Experiment some with it to understand text positioning.

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

	// Draw restart instruction
	subtitleText := "Press any key to restart"
	subtitleBounds, _ := text.Measure(subtitleText, t.subtitleFont, 0)
	subtitleX := (w - int(subtitleBounds)) / 2
	subtitleY := titleY + 80

	op2 := &text.DrawOptions{}
	op2.GeoM.Translate(float64(subtitleX), float64(subtitleY))
	op2.ColorScale.ScaleWithColor(color.RGBA{200, 150, 150, 255}) // Lighter red text
	text.Draw(screen, subtitleText, t.subtitleFont, op2)
}
```

Now we need to change Update to listen for input so it can transition to restart. We will be calling a function in this code that doesn't exist yet. Do not fret, it shall be the very next thing we do.

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
			t.sceneManager.gameScene.Reset()
			t.sceneManager.TransitionTo(SceneGame)
		return nil
	}
	// Check for mouse clicks
	if inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft) ||
		inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonRight) {
			t.sceneManager.gameScene.Reset()
			t.sceneManager.TransitionTo(SceneGame)
		return nil
	}
	return nil
}
```

Now let's go to `game_scene.go` and create a Reset function. All this is doing it resetting all the state in the game to what it was at the beginning. We will be revisiting this function as we add new managers (like for towers) and for resetting some new values.

```go

// Reset resets the game scene to initial state
func (g *GameScene) Reset() {
	g.playerHealth = g.maxHealth

	// Reset components
	g.creepManager = NewCreepManager()
	g.creepManager.SetOnCreepEscape(func(damage float64) {
		g.playerHealth -= int(damage)
		if g.playerHealth < 0 {
			g.playerHealth = 0
		}
	})
	// Spawn first wave
	if g.level != nil {
		pathNodes := g.level.GetWaypoints()
		if len(pathNodes) > 0 {
			g.spawnNewWave()
		}
	}
}
```

Now we have an end condition for our game. Typically a Tower Defense has no real win condition. It's more of a "play until you die" kind of thing. So now I guess it's time to allow the player to fight back. Let's start in on towers.

First thing is first. We need a place to put the towers on our screen. I created the `tray.png` file to serve this purpose. It's already loaded in our assets, so let's use it.
First, since the tray's purpose is to hold our towers, it makes sense that it should belong to the tower manager. Let's create that. Make a new file and call it `tower_manager.go`. It's not a lot yet, so I'll drop it all in and then explain it.

```go
package main

import (
	"towerDefense/assets"

	"github.com/hajimehoshi/ebiten/v2"
)

type TowerManager struct{}

// drawTrayBackground renders the tray background image
func (tm *TowerManager) drawTrayBackground(screen *ebiten.Image, params RenderParams) {
	trayOpts := &ebiten.DrawImageOptions{}

	// Scale the tray image to fit the available space
	trayImageBounds := assets.TrayBackground.Bounds()
	trayImageWidth := float64(trayImageBounds.Dx())
	trayImageHeight := float64(trayImageBounds.Dy())

	// Calculate scale to fit the tray area
	trayScaleX := float64(params.TrayWidth) / trayImageWidth
	trayScaleY := float64(params.ScreenHeight) / trayImageHeight

	trayOpts.GeoM.Scale(trayScaleX, trayScaleY)
	trayOpts.GeoM.Translate(params.TrayX, 0)
	screen.DrawImage(assets.TrayBackground, trayOpts)
}

// DrawTowerTray renders the tower selection tray
func (tm *TowerManager) DrawTowerTray(screen *ebiten.Image, params RenderParams, selectedTower int, uiManager *UIManager) {
	// Draw the tray background
	tm.drawTrayBackground(screen, params)
}
```

The TowerManager struct for now is simply a placeholder. We will be adding to it, but for just the tray, it's good. DrawTowerTray is our aggregator function. It will call all the composit parts that make up the tray, allowing for smaller and more single task functions. I know we will need to know the selected tower in the future, so I'm adding it to the signature now.

drawTrayBackground just simply draws and scales the tray image.

Next we need to go into our GameScene and add a reference to the tower manager.

```go
towerManager *TowerManager
```

Make sure to fix the factory method too...

```go
func NewGameScene(sm *SceneManager) *GameScene {
	t, err := NewTilemapJSON("map/level.tmj")
	if err != nil {
		panic(err)
	}
	g := &GameScene{
		sceneManager: sm,
		lastUpdate:   time.Now(),        // Initialize the timer
		creepManager: NewCreepManager(), // Initialize the creep manager
		spawnTimer:   stopwatch.NewStopwatch(5 * time.Second), // 5 second timer
		hasSpawned:   true, // Start as true since we spawn initially
		maxHealth:    100,
		playerHealth: 100,
		uiManager:    NewUIManager(), // Initialize the UI manager
		renderer:     NewRenderer(),  // Initialize the renderer
		towerManager: &TowerManager{},
	}
	g.level = t
	g.images = t.LoadTiles()
	g.creepManager.SetOnCreepEscape(func(damage float64) {
		g.playerHealth -= int(damage)
		if g.playerHealth < 0 {
			g.playerHealth = 0
		}})
	g.spawnNewWave()
	return g
}
```

And in your game_scene Draw function, at the very end, between the definition of params and the creepManager being invoked, call DrawTowerTray. The bottom of your Draw function should look like this.

```go
	params := g.renderer.CalculateRenderParams(screen, g.level)

	g.towerManager.DrawTowerTray(screen, params, 0, g.uiManager)
	g.creepManager.Draw(screen, params)
	g.uiManager.DrawHealthBar(screen, params, g.playerHealth, g.maxHealth)
```

Now run the game and you will see a simple selection tray that scales with the window.

That's sure one nice tray. You know what would look better? Some Towers. Let's add some Towers to the tray.
Let's go back to our tower manager. Edit the struct to add a slice of images. Then create a factory to create a new one.

```go
type TowerManager struct{
	towers []*ebiten.Image
}

func NewTowerManager() *TowerManager {
	return &TowerManager{
		towers: []*ebiten.Image{
			assets.NoneIndicator,
			assets.BallistaTower,
			assets.MagicTower,
		},
	}
}
```

Then in our Game Scene, in the NewGameScene factory, find where we just added this

```go
towerManager: &TowerManager{},
```

Change it to this

```go
towerManager: NewTowerManager(),
```

I really need to get into a habit of just making these methods. It would be a lot easier on me in the long run. I digress...
We are going to make a new function called drawTowerOptions. All this function will do it cycle through our supplied tower options and display them, scaled down from the top. We pass the selected Tower into it so later we can make a visual indicator of any tower we are currently selecting.

```go
// drawTowerOptions renders individual tower options in the tray
func (tm *TowerManager) drawTowerOptions(screen *ebiten.Image, params RenderParams, selectedTower int, uiManager *UIManager) {
	const baseTowerSpacing = 140.0 // Reduced back to original spacing since no upgrade buttons
	const baseTowerStartY = 20.0
	const baseTowerWidth = 64.0
	const baseTowerHeight = 128.0

	scaledTowerSpacing := baseTowerSpacing * params.Scale
	scaledTowerStartY := baseTowerStartY * params.Scale
	scaledTowerWidth := baseTowerWidth * params.Scale
	scaledTowerHeight := baseTowerHeight * params.Scale

	for i, towerImg := range tm.towers {
		if towerImg == nil {
			continue
		}

		// Calculate tower position
		towerX := params.TrayX + (float64(params.TrayWidth)-scaledTowerWidth)/2
		towerY := scaledTowerStartY + float64(i)*scaledTowerSpacing

		// Only draw if the tower fits within the screen
		if towerY+scaledTowerHeight > float64(params.ScreenHeight) {
			continue
		}

		// Draw the tower image
		towerOpts := &ebiten.DrawImageOptions{}
		towerOpts.GeoM.Scale(params.Scale, params.Scale)
		towerOpts.GeoM.Translate(towerX, towerY)

		screen.DrawImage(towerImg, towerOpts)
	}
}
```

This should be called in our DrawTowerTray method.

```go
// DrawTowerTray renders the tower selection tray
func (tm *TowerManager) DrawTowerTray(screen *ebiten.Image, params RenderParams, selectedTower int, uiManager *UIManager) {
	// Draw the tray background
	tm.drawTrayBackground(screen, params)
	tm.drawTowerOptions(screen, params,selectedTower, uiManager)
}
```

Run the game and you should see a Nothing icon and two towers. It's just images, so let's get them working.
