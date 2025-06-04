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
var TowerBuildAnimation = loadAnimation(towerBuildSpriteSheet, 0, 6, 192, 256)
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

If we want to select a tower, we are going to need to pay for it in some resource. Otherwise it's not much of a game. Let's get the gold flowing like spice so we don't have to monkeypatch it in later.

Let's say we start with 350 gold, towers will cost 75 each and we gain 1 gold every 2 seconds. We should also gain 2 gold when a creep is killed. No gold should be given if the creep escapes.

With that, we can start. We can add these two fields to GameScene.

```go
	currentGold  int
	goldTimer    *stopwatch.Stopwatch
```

Now in the constructor, we need a couple changes. In NewGameScene, at the very bottom, above where it spawns a new wave, change the code to read like this.

```go
	g.currentGold = 350
	g.goldTimer = stopwatch.NewStopwatch(2 * time.Second)
	g.goldTimer.Start()

	g.spawnNewWave()
	return g
}
```

Now in GameScene go to the bottom of the Update function and add this right above where it returns nil.

```go
	g.goldTimer.Update()
	if g.goldTimer.IsDone(){
		g.currentGold++
		g.goldTimer.Reset()
	}
```

Now every two seconds we will add another gold onto our player. The last gold gain condition should be when a creep is killed. Let's wire up the callback for that.
Head back into the NewGameScene function. Right above g.spawnNewWave() we are going to place the following code. It should be directly under where you start the gold timer.

```go
	g.creepManager.SetOnCreepKilled(func(goldReward int) {
		g.currentGold += goldReward
	})
```

This sets the callback function for when a creep dies. This is all we will do with this for now though, as we will be tying some of this in with the animations and waiting will be better in this case. So, we have ways of making gold. Let's display our Gold.
Crack open `ui.go` and let's add a function to draw this. Of course, the font needs to scale.

```go
// DrawGoldDisplay renders the gold amount display
func (ui *UIManager) DrawGoldDisplay(screen *ebiten.Image, params RenderParams, currentGold int) {
	const healthBarX = 192.0
	const healthBarY = 64.0
	const labelOffset = 100.0

	// Position below health bar
	scaledX := healthBarX*params.Scale + params.OffsetX
	scaledY := healthBarY*params.Scale + params.OffsetY + 40*params.Scale
	labelX := scaledX - labelOffset*params.Scale

	// Create scaled font
	scaledFontFace := ui.createScaledFont(params.Scale)

	// Create text draw options
	goldOpts := &text.DrawOptions{}
	goldOpts.GeoM.Translate(labelX, scaledY)
	goldOpts.ColorScale.ScaleWithColor(color.White)

	// Draw the gold text
	goldText := fmt.Sprintf("Gold: %d", currentGold)
	text.Draw(screen, goldText, scaledFontFace, goldOpts)
}
```

We needed to pay attention to our healthbar, as we are working relative to it. I could probably hard code less, but I'm too lazy and I choose which battles I wish to fight.
In GameScene.go, look at Draw and scroll down to the very bottom. We will append this to the bottom of that function.

```go
g.uiManager.DrawGoldDisplay(screen,params,g.currentGold)
```

Run the application and we can see our gold! Now let's use that gold to purchase some towers.
We are going to make all towers cost 75 gold. Open tower_manager and at right under the imports, add this.

```go
const towerCost = 75
```

Next we want to handle tower selection in the tray. We have to take scaliing into account for which tower we are over. Put this in your tower manager.

```go
// HandleTowerSelection handles clicks on the tower tray
func (tm *TowerManager) HandleTowerSelection(level *TilemapJSON, currentGold int, params RenderParams) (bool, int) {
	if !inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft) {
		return false, 0
	}

	mouseX, mouseY := ebiten.CursorPosition()

	// Check if click is in the tray area
	if float64(mouseX) < params.TrayX || mouseX > params.ScreenWidth {
		return false, 0
	}

	// Calculate which tower was clicked
	const baseTowerSpacing = 140.0 // Updated to match drawTowerOptions
	const baseTowerStartY = 20.0
	const baseTowerHeight = 128.0

	scaledTowerSpacing := baseTowerSpacing * params.Scale
	scaledTowerStartY := baseTowerStartY * params.Scale
	scaledTowerHeight := baseTowerHeight * params.Scale

	relativeY := float64(mouseY) - scaledTowerStartY
	if relativeY < 0 {
		return false, 0
	}

	towerIndex := int(relativeY / scaledTowerSpacing)
	if towerIndex < 0 || towerIndex >= len(tm.towers) {
		return false, 0
	}

	// Check if click is within tower area only (not in button area)
	towerOffset := relativeY - float64(towerIndex)*scaledTowerSpacing

	// Only select tower if click is within tower image area, not button area
	if towerOffset < 0 || towerOffset > scaledTowerHeight {
		return false, 0
	}

	// Don't allow selection of towers (except "none") if player can't afford them
	if towerIndex > 0 && currentGold < towerCost {
		return false, 0 // Not enough gold to select tower
	}

	// Tower selected successfully
	return true, towerIndex
}
```

Now we need to store the selected tower. Go to your GameScene and add.

```go
selectedTower int
```

Since it defaults to 0, which is also the No Tower option, we dont need to do anything more for that.
In GameScene, at the end of your Update function, again right above the return, place this.

```go
// Use the logical screen size from Layout() instead of actual window size
	dummyImageForParams := ebiten.NewImage(1920, 1280) // Use the same dimensions as Layout()
	inputParams := g.renderer.CalculateRenderParams(dummyImageForParams, g.level)

	// Handle tower selection input
	if clicked, towerIndex := g.towerManager.HandleTowerSelection(g.level, g.currentGold, inputParams); clicked {
		g.selectedTower = towerIndex
	}
```

Now still in GameScene, go to the bottom of the Draw function and look for this line.

```go
	g.towerManager.DrawTowerTray(screen, params, 0, g.uiManager)
```

That 0 was ok for the moment, but we need to make it real now.

```go
	g.towerManager.DrawTowerTray(screen, params, g.selectedTower, g.uiManager)

```

Then, right under, look for DrawGoldDisplay is being called. Put this right after that call.

```go
	g.towerManager.DrawPlacementIndicator(screen,params,g.selectedTower,g.level)

```

Now to do our drawing, we need to convert our screen coordinates to grid coordinates.

```go
// screenToGrid converts screen coordinates to grid coordinates
func (tm *TowerManager) screenToGrid(screenX, screenY int, params RenderParams) (int, int) {
	const tileSize = 64

	// Convert screen position to map-relative position
	mapX := float64(screenX) - params.OffsetX
	mapY := float64(screenY) - params.OffsetY

	// Convert to grid coordinates
	gridX := int(mapX / (float64(tileSize) * params.Scale))
	gridY := int(mapY / (float64(tileSize) * params.Scale))

	return gridX, gridY
}
```

With this, we can now show our selected Tower.

```go
// DrawPlacementIndicator renders the tower image following the cursor
func (tm *TowerManager) DrawPlacementIndicator(screen *ebiten.Image, params RenderParams, selectedTowerID int, level *TilemapJSON) {
	if selectedTowerID > 0 && selectedTowerID < len(tm.towers) {
		mouseX, mouseY := ebiten.CursorPosition()
		ebiten.SetCursorMode(ebiten.CursorModeHidden)

		towerImg := tm.towers[selectedTowerID]
		if towerImg != nil && level != nil { // Ensure level is not nil
			gridX, gridY := tm.screenToGrid(mouseX, mouseY, params)
			// Corrected placement check:
			//This is temporary.  For now, all tiles will be invalid
			//TODO:  Change this logic...
			canPlace := false
			// World coordinates of the target tile's center
			tileCenterX_world := float64(gridX*level.TileWidth + level.TileWidth/2)
			tileCenterY_world := float64(gridY*level.TileHeight + level.TileHeight/2)

			imgUnscaledWidth := float64(towerImg.Bounds().Dx())
			imgUnscaledHeight := float64(towerImg.Bounds().Dy())

			// Top-left corner for drawing (world coordinates), to achieve bottom-center placement
			drawX_world := tileCenterX_world - (imgUnscaledWidth / 2)
			drawY_world := tileCenterY_world - imgUnscaledHeight // Bottom of image at tileCenterY_world

			indicatorOpts := &ebiten.DrawImageOptions{}
			indicatorOpts.GeoM.Scale(params.Scale, params.Scale)
			indicatorOpts.GeoM.Translate(
				drawX_world*params.Scale+params.OffsetX,
				drawY_world*params.Scale+params.OffsetY,
			)

			if canPlace {
				indicatorOpts.ColorScale.Scale(0.8, 1.0, 0.8, 0.5) // Greenish tint for valid
			} else {
				indicatorOpts.ColorScale.Scale(1.0, 0.5, 0.5, 0.5) // Reddish tint for invalid
			}
			screen.DrawImage(towerImg, indicatorOpts)
		} else if towerImg != nil && level == nil {
			// Fallback: Draw at cursor if level info is missing (should not happen in normal flow)
			indicatorOpts := &ebiten.DrawImageOptions{}
			indicatorOpts.GeoM.Scale(params.Scale, params.Scale)
			// Basic centering on cursor
			indicatorOpts.GeoM.Translate(float64(mouseX)-float64(towerImg.Bounds().Dx())*params.Scale/2, float64(mouseY)-float64(towerImg.Bounds().Dy())*params.Scale/2)
			screen.DrawImage(towerImg, indicatorOpts)
		}
	} else {
		ebiten.SetCursorMode(ebiten.CursorModeVisible)
	}
}

```

Now when you click on a tower, your cursor is replaced by a semi-transparent version of the tower. It's shaded red because we are telling it there are no valid placements at the moment. We will fix that next.
In `tower_manager.go` Let's add a function to return whether or not a tile is available for building a tower.

```go
// isTileBuildable checks if a tile at given grid coordinates is buildable
func (tm *TowerManager) isTileBuildable(col, row int, level *TilemapJSON) bool {
	// Check if position is within map bounds
	if col < 0 || row < 0 {
		return false
	}
 //Inner bounds checked ok, now check outer bounds
	layer := level.Layers[0]
	if col >= layer.Width || row >= layer.Height {
		return false
	}

	// Water Tiles, and Details Tiles and Road Tiles should be un-buildable.
	//So any tiles that aren't empty on those two layers should return false
	//All other tiles (grass) are buildable
	for _, layer := range level.Layers {
		index := row*layer.Width + col
		if index >= 0 && index < len(layer.Data) {
			tileID := layer.Data[index]

			// Skip empty tiles
			if tileID == 0 {
				continue
			}

			// Remove flip flags to get actual tile ID
			actualTileID := tileID &^ flipMask

			// Check if it's a water tile (cannot place towers on water)
			if actualTileID >= waterFirstTileIDLocal {
				return false
			}

			// Check if it's a details layer tile (cannot place towers on details)
			if layer.Name == "details" {
				return false
			}
		}
	}

	return true
}
```

You will notice we need a couple values (the id of the first water tile and the masks for flipping tiles). Let's change our const declaration at the top to read this.

```go
const (
	waterFirstTileIDLocal = 257
	flipMask              = 0x80000000 | 0x40000000 | 0x20000000
	towerCost             = 75 // Cost to place a tower
)
```

It's "working" but not completely. There is an obvious bug in tower placement. Where the tower is "hovering" isn't necessarily where it's going to be painted. We have an offset issue. Let's fix it.
The bug is in our Draw function.
Right above the loop, under the tileSize definition, place these two lines.

```go
	dummyImageForParams := ebiten.NewImage(1920, 1280) // Use the same dimensions as Layout()
	params := g.renderer.CalculateRenderParams(dummyImageForParams, g.level)

```

This gives us a common dimension for our scaling.
Then in the bottom of the loop (but inside it), right under where we defiine screenX and screenY, change to this.

```go
						// Draw the tile with proper scaling and offset
						opts := &ebiten.DrawImageOptions{}
						opts.GeoM.Scale(params.Scale, params.Scale)
						opts.GeoM.Translate(screenX*params.Scale+params.OffsetX, screenY*params.Scale+params.OffsetY)
						screen.DrawImage(tileImage, opts)
```

The offset bug should be fixed and things should be working just fine now. And at the bottom where we redeclare params, delete that line. We were calculating params and using it all outside the map. This gives us a visual bug in what we saw on the map drawing. To be completely honest, I'm wondering if keeping this grid-based was the best solution I could have done, but here we are. It's an area to experiment with.

But cool, now let's get around to placing towers.

Let's open up `tower_manager.go` and do some work.

First, let's add some constants at the top of the file under the imports.

```go
const (
	BallistaTowerID = 1
	MagicTowerID    = 2
)
```

This just helps us determine which tower is selected. Easily expandable.
Then edit the TowerManager to hold our placed towers and create the PlacedTower struct to hold the data for each tower.

```go
type TowerManager struct {
	towers       []*ebiten.Image
	placedTowers []PlacedTower
}
// PlacedTower represents a tower that has been placed on the map
type PlacedTower struct {
	Image   *ebiten.Image
	X       int // Grid position X
	Y       int // Grid position Y
	TowerID int // Which tower type (index in towers array)
}
```

As expected, we need to edit the factory.

```go
func NewTowerManager() *TowerManager {
	return &TowerManager{
		towers: []*ebiten.Image{
			assets.NoneIndicator,
			assets.BallistaTower,
			assets.MagicTower,
		},
		placedTowers: make([]PlacedTower, 0),
	}
}
```

Now let us create some helper functions.
The first will simply get the image for the requested tower.

```go
func (tm *TowerManager) getTowerImage(towerID int) *ebiten.Image {
	switch towerID {
	case BallistaTowerID:
		return assets.BallistaTower
	case MagicTowerID:
		return assets.MagicTower
	default:
		return nil
	}
}
```

Next, for when we want to, we should create the code to add a new placed tower. This will get called after all validity checks have passed.

```go
func (tm *TowerManager) placeTower(col, row int, towerID int) {
	towerImg := tm.getTowerImage(towerID)
	if towerImg == nil {
		return // Invalid tower ID
	}
	newTower := PlacedTower{
		Image:   towerImg,
		X:       col,
		Y:       row,
		TowerID: towerID,
	}

	tm.placedTowers = append(tm.placedTowers, newTower)
}
```

These helpers get called by the next function we will be writing. HandleTowerPlacement should be the wrapper that checks for the validity of the tile for placement and checks to see if the player has enough gold. This will be called in an update function.

```go
// HandleTowerPlacement handles clicks on the map to place towers
func (tm *TowerManager) HandleTowerPlacement(selectedTowerID int, level *TilemapJSON, params RenderParams, currentGold *int) {
	if selectedTowerID == 0 || level == nil { // No tower selected or level is nil
		return
	}

	mouseX, mouseY := ebiten.CursorPosition()

	// Convert screen coordinates to map grid coordinates
	// Use level.TileWidth and level.TileHeight for tile dimensions
	gridX := int((float64(mouseX) - params.OffsetX) / (float64(level.TileWidth) * params.Scale))
	gridY := int((float64(mouseY) - params.OffsetY) / (float64(level.TileHeight) * params.Scale))

	// Check if click is within map bounds (considering tray)
	mapPixelWidth := float64(level.Layers[0].Width*level.TileWidth) * params.Scale
	mapPixelHeight := float64(level.Layers[0].Height*level.TileHeight) * params.Scale

	if float64(mouseX) < params.OffsetX || float64(mouseX) > params.OffsetX+mapPixelWidth ||
		float64(mouseY) < params.OffsetY || float64(mouseY) > params.OffsetY+mapPixelHeight {
		return // Click is outside the map area
	}

	if inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft) {
		if tm.isTileBuildable(gridX, gridY, level) { //&& !tm.isTowerAtLocation(gridX, gridY) {

			if *currentGold >= towerCost {
				*currentGold -= towerCost
				tm.placeTower(gridX, gridY, selectedTowerID)
				return //Tower placed!  This is the good case
			}
			return //Not enough gold
		}
	}
}
```

Now we need one change in `game_scene.go`. Since HandleTowerPlacement scans for input, it needs to be placed in our GameScene's Update function. Drop it at the end, right before we return nil.

```go
	g.towerManager.HandleTowerPlacement(g.selectedTower, g.level, inputParams, &g.currentGold)

```

Now run the game. Oops. We should probably draw the towers we placed. This is simple, since we know the images.

```go
func (tm *TowerManager) DrawPlacedTowers(screen *ebiten.Image, params RenderParams, level *TilemapJSON) {
	if level == nil { // Guard against nil level
		return
	}
	for _, tower := range tm.placedTowers {
		if tower.Image == nil {
			continue
		}
		// Calculate tower position to match building animation positioning
		// Use tile center for consistent positioning with animations
		tileCenterX := float64(tower.X*level.TileWidth + level.TileWidth/2)
		tileCenterY := float64(tower.Y*level.TileHeight + level.TileHeight/2)

		// Get tower image dimensions
		towerImg := tower.Image
		imgWidth := float64(towerImg.Bounds().Dx())
		imgHeight := float64(towerImg.Bounds().Dy())

		// Position tower to be centered horizontally and bottom-aligned vertically on the tile
		drawX_world := tileCenterX - (imgWidth / 2.0)
		drawY_world := tileCenterY - imgHeight

		opts := &ebiten.DrawImageOptions{}
		opts.GeoM.Scale(params.Scale, params.Scale)
		opts.GeoM.Translate(
			drawX_world*params.Scale+params.OffsetX,
			drawY_world*params.Scale+params.OffsetY,
		)

		screen.DrawImage(tower.Image, opts)

	}
}
```

And of course, in `game_scene.go` we need to call this from the end of our Draw function.

```go
g.towerManager.DrawPlacedTowers(screen, params, g.level)
```

Now run the game and it's drawing towers happily until you run out of gold. Of course, we have another bug. You can draw towers directly on top of each other. Let's fix this.
In `tower_manager.go` look for the isTileBuildable function. Right near the top (it doesn't matter where, I put it right after the inner bounds check), add the following check.

```go
		// Check if there's already a tower at this position
		for _, placedTower := range tm.placedTowers {
			if placedTower.X == col && placedTower.Y == row {
				return false
			}
		}
```

Now you can no longer place towers one on top of another. Things are starting to come together. However, we need a little visual flair. Let's add a building animation for the tower, along with a little delay.

Start by adding two more constants to the top of our `tower_manager.go`

```go
	StageBuilding      = 0
	StageTransitioning = 1
```

Then add this to the TowerManager

```go
buildingAnimations   []*BuildingAnimationState
```

This means we will need to create a BuildingAnimationState struct. Let's do it now.

```go
// BuildingAnimationState holds the state for a tower being built
type BuildingAnimationState struct {
	X, Y             int
	TowerIDToPlace   int
	CurrentAnimation *AnimatedSprite
	Stage            int // 0 for build, 1 for transition
}
```

Edit the TowerManager factory to accept this new slice.

```go
func NewTowerManager() *TowerManager {
	return &TowerManager{
		towers: []*ebiten.Image{
			assets.NoneIndicator,
			assets.BallistaTower,
			assets.MagicTower,
		},
		placedTowers: make([]PlacedTower, 0),
		buildingAnimations:   make([]*BuildingAnimationState, 0),
	}
}
```

Go to HandleTowerPlacement and find this

```go
	tm.placeTower(gridX, gridY, selectedTowerID)
```

Replace it with this

```go
tm.startBuildingAnimation(gridX, gridY, selectedTowerID)
```

Instead of just placing the tower, we are placing a set of animations between clicking for placement and the actual placement. Let's put in the function we just called.

```go
// startBuildingAnimation starts the building animation for a tower at the specified grid position
func (tm *TowerManager) startBuildingAnimation(col, row int, towerID int) {
	// Create a new building animation state
	buildingAnimation := &BuildingAnimationState{
		X:              col,
		Y:              row,
		TowerIDToPlace: towerID,
		Stage:          StageBuilding,
		CurrentAnimation: NewAnimatedSprite(assets.TowerBuildAnimation, 1.0, false), // 1 second for build animation
	}

	// Start the animation
	buildingAnimation.CurrentAnimation.Play()

	// Add to the building animations slice
	tm.buildingAnimations = append(tm.buildingAnimations, buildingAnimation)
}
```

Now we just need to update the animations and draw them. Let's add Update first.

```go
// UpdateBuildingAnimations updates all towers currently in their build/transition animation
func (tm *TowerManager) UpdateBuildingAnimations(deltaTime float64) {
	updatedAnimations := make([]*BuildingAnimationState, 0, len(tm.buildingAnimations))
	for _, ba := range tm.buildingAnimations {
		if ba.CurrentAnimation != nil {
			ba.CurrentAnimation.Update(deltaTime)
			if !ba.CurrentAnimation.IsPlaying() {
				if ba.Stage == StageBuilding {
					// Transition to the next animation
					ba.Stage = StageTransitioning
					// Assuming animationLength of 0.75 second for transition, adjust as needed
					ba.CurrentAnimation = NewAnimatedSprite(assets.TowerTransitionAnimation, 0.75, false) // Adjusted duration
					ba.CurrentAnimation.Play()
					updatedAnimations = append(updatedAnimations, ba) // Keep it for next stage
				} else if ba.Stage == StageTransitioning {
					// Animation finished, place the actual tower
					tm.placeTower(ba.X, ba.Y, ba.TowerIDToPlace)
					// Do not add to updatedAnimations, effectively removing it
				}
			} else {
				updatedAnimations = append(updatedAnimations, ba) // Animation still playing
			}
		}
	}
	tm.buildingAnimations = updatedAnimations
}
```

The above function plays the build animation until its complete, then it triggers the transition animation. When that completes, it removes the animation and the tower is placed.
Lastly, we need to draw the animations...

```go
// DrawBuildingAnimations draws all towers currently in their build/transition animation
func (tm *TowerManager) DrawBuildingAnimations(screen *ebiten.Image, params RenderParams, level *TilemapJSON) {
	if level == nil { // Guard against nil level
		return
	}
	const finalTowerSpriteHeight = 128.0 // Height of the final tower sprites

	for _, ba := range tm.buildingAnimations {
		if ba.CurrentAnimation != nil {
			frame := ba.CurrentAnimation.GetCurrentFrame()
			if frame != nil {
				opts := &ebiten.DrawImageOptions{}
				imgWidth := float64(frame.Bounds().Dx())  // Animation frame width
				imgHeight := float64(frame.Bounds().Dy()) // Animation frame height

				// Calculate the center of the target grid cell in world coordinates
				tileCenterX := float64(ba.X*level.TileWidth + level.TileWidth/2)
				tileCenterY := float64(ba.Y*level.TileHeight + level.TileHeight/2)

				// Calculate screenX to center the animation frame horizontally on the tile's center.
				screenX := tileCenterX - (imgWidth / 2.0)

				// Calculate screenY to align the visual center of the animation frame
				// with the visual center of the final tower sprite.
				screenY := tileCenterY - (finalTowerSpriteHeight+imgHeight)/2.0

				opts.GeoM.Scale(params.Scale, params.Scale)
				opts.GeoM.Translate(screenX*params.Scale+params.OffsetX, screenY*params.Scale+params.OffsetY)
				screen.DrawImage(frame, opts)
			}
		}
	}
}
```

The only thing left to do to get this all wired in is to make changes in Update and Draw in our GameScene to call these functions.
In Draw, find where you are drawing all the components. Anywhere in there, you can put this line.

```go
g.towerManager.DrawBuildingAnimations(screen, params, g.level)
```

Next Update. Find where we update the CreepManager. That's a pretty decent spot (exact spot in this method doesn't matter for this). Add this line.

```go
g.towerManager.UpdateBuildingAnimations(deltaTime)
```

Now run the game. When you click to place a tower, you get a little animation of it being built then a nice transition animation.

So, what's left? We need to add weapons and their projectiles. Then we need collision. After that, death for creeps. Once we have that, I think we have the bones of a real game. Let's get those weapons up and running.

First we are going to need some constants for how the weapons should react.

```go
const weaponRotationSpeed = 3.0      // Radians per second for weapon rotation
const weaponRotationSmoothness = 8.0 // Higher values = smoother but slower rotation
const towerRange = 5.0               // Range in tiles for tower attacks
const fireDelay = 1.5                // Seconds between shots
const fireAnimationDuration = 0.5    // Duration of firing animation
```

Then we need to add some fields to PlacedTower

```go
type PlacedTower struct {
	Image   *ebiten.Image
	X       int // Grid position X
	Y       int // Grid position Y
	TowerID int // Which tower type (index in towers array)
	Damage          float64
	WeaponImage     *ebiten.Image   // Image for the tower's weapon, if any
	WeaponAngle     float64         // Current angle of the weapon in radians. 0 = East, -PI/2 = North.
	FireTimer       float64         // Time remaining before weapon can fire again
	FiringAnimation *AnimatedSprite // Current firing animation, if any
	IdleAnimation   *AnimatedSprite // Idle animation for weapons that have one
	WeaponFired     bool            // Flag to indicate if weapon has been fired and needs to spawn a projectile
	TargetX         float64         // X position of target when weapon was fired
	TargetY         float64         // Y position of target when weapon was fired
}
```

PlaceTower needs to be edited to add these fields too.

```go
func (tm *TowerManager) placeTower(col, row int, towerID int) {
	towerImg := tm.getTowerImage(towerID)
	if towerImg == nil {
		return // Invalid tower ID
	}
	newTower := PlacedTower{
		Image:   towerImg,
		X:       col,
		Y:       row,
		TowerID: towerID,
		Damage:          50,
		WeaponAngle:     -math.Pi / 2, // Initialize weapon angle to North (upwards)
		FireTimer:       0.0,          // Ready to fire immediately
		FiringAnimation: nil,          // No firing animation initially
		IdleAnimation:   nil,          // No idle animation initially
		WeaponFired:     false,        // Initialize WeaponFired to false
	}	// If it's BallistaTower (ID from ballista_tower.go), add its static weapon image
	if towerID == BallistaTowerID && len(assets.BallistaWeaponFire) > 0 {
		newTower.WeaponImage = assets.BallistaWeaponFire[0]
	}

	// If it's Magic Tower (ID from magic_tower.go), add its idle animation and initial weapon image
	if towerID == MagicTowerID && len(assets.MagicTowerWeaponIdleAnimation) > 0 {
		newTower.WeaponImage = assets.MagicTowerWeaponIdleAnimation[0]
		// Create and start the looping idle animation
		newTower.IdleAnimation = NewAnimatedSprite(assets.MagicTowerWeaponIdleAnimation, 1.0, true) // 1 second duration, looping
		newTower.IdleAnimation.Play()
	}

	tm.placedTowers = append(tm.placedTowers, newTower)
}
```

Now go to the Draw function of your TowerManager. Right under our DrawImage call at the end of the function, add this:

```go
		// WEAPON RENDERING (if tower has a weapon)
		// Weapons are optional overlay sprites that can be static or animated
		if tower.WeaponImage != nil {
			// DETERMINE WHICH WEAPON SPRITE TO USE
			// The weapon sprite depends on the tower's current state:
			// - Firing animation (if actively shooting)
			// - Idle animation (if has animated weapon when not shooting)
			// - Static weapon image (fallback for non-animated weapons)
			var weaponImg *ebiten.Image
			if tower.FiringAnimation != nil && tower.FiringAnimation.IsPlaying() {
				// Tower is currently firing - use firing animation frame
				weaponImg = tower.FiringAnimation.GetCurrentFrame()
			} else if tower.IdleAnimation != nil && tower.IdleAnimation.IsPlaying() {
				// Tower has idle animation (like magic tower) - use idle frame
				weaponImg = tower.IdleAnimation.GetCurrentFrame()
			} else {
				// Use static weapon image (for towers without animations)
				weaponImg = tower.WeaponImage
			}

			// RENDER THE WEAPON (if we have a valid sprite)
			if weaponImg != nil {
				// Get weapon sprite dimensions
				w, h := weaponImg.Bounds().Dx(), weaponImg.Bounds().Dy()

				// Calculate tower center for weapon positioning reference
				tileCenterX := float64(tower.X*level.TileWidth + level.TileWidth/2)
				tileCenterY := float64(tower.Y*level.TileHeight + level.TileHeight/2)

				// Create transformation matrix for weapon positioning
				optsWeapon := &ebiten.DrawImageOptions{}

				// TOWER-TYPE-SPECIFIC WEAPON POSITIONING
				// Different tower types position their weapons differently:
				if tower.TowerID == MagicTowerID {
					// MAGIC TOWER WEAPON POSITIONING:
					// - Weapon stays fixed (no rotation)
					// - Positioned at a specific offset from tower's top-left corner
					// - Magic towers have floating orbs that don't track targets

					weaponCenterX_local := float64(w) / 2.0    // Weapon's center point X
					weaponBottomY_local := float64(h)          // Weapon's bottom edge Y

					// Calculate tower's top-left corner in world coordinates
					towerTopLeftX := float64(tower.X * level.TileWidth)
					towerTopLeftY := float64(tower.Y * level.TileHeight)

					// Position weapon at fixed offset from tower (magic orb positioning)
					weaponAnchorX_world := towerTopLeftX + 32.0     // 32 pixels right of tower corner
					weaponAnchorY_world := towerTopLeftY            // At tower's top edge

					// Apply transformations:
					// 1. Move weapon's anchor point (center-bottom) to origin for positioning
					optsWeapon.GeoM.Translate(-weaponCenterX_local, -weaponBottomY_local)
					// 2. NO rotation for magic towers - weapons stay stationary
					// 3. Move weapon to its final position relative to tower
					optsWeapon.GeoM.Translate(weaponAnchorX_world, weaponAnchorY_world)
				} else {
					// DEFAULT WEAPON POSITIONING (Ballista and other rotating weapons):
					// - Weapon rotates to track targets
					// - Positioned at center of tower base
					// - Rotation pivot is weapon's center point

					weaponCenterX_local := float64(w) / 2.0    // Weapon's center point X
					weaponCenterY_local := float64(h) / 2.0    // Weapon's center point Y

					// Position weapon at the center of the tower base (not the sprite center)
					towerBaseCenterX_world := tileCenterX
					towerBaseCenterY_world := tileCenterY - (imgHeight / 2.0) // Center of tower base

					// Apply transformations for rotating weapons:
					// 1. Move weapon's rotation pivot (center) to origin
					optsWeapon.GeoM.Translate(-weaponCenterX_local, -weaponCenterY_local)
					// 2. Rotate weapon around origin to point toward target
					//    Note: We add π/2 to correct for sprite orientation (weapons point up by default)
					correctedAngle := tower.WeaponAngle + math.Pi/2
					optsWeapon.GeoM.Rotate(correctedAngle)
					// 3. Move rotated weapon to be centered on the tower base
					optsWeapon.GeoM.Translate(towerBaseCenterX_world, towerBaseCenterY_world)
				}

				// APPLY GLOBAL TRANSFORMATIONS
				// Convert weapon from world coordinates to screen coordinates
				optsWeapon.GeoM.Scale(params.Scale, params.Scale)       // Apply camera zoom
				optsWeapon.GeoM.Translate(params.OffsetX, params.OffsetY) // Apply camera offset

				// Draw the weapon sprite
				screen.DrawImage(weaponImg, optsWeapon)
			}
		}
```

This function fragment has been over-documented to help you follow it.
Now when you run the application, you can see the towers have weapons. Now let's finish wiring the code that will have the weapons follow to face the enemies.

Create a function called UpdatePlacedTowers. This will handle all the logic of rotating our tower's weapon to face the nearest enemy.

```go
func (tm *TowerManager) UpdatePlacedTowers(deltaTime float64, activeCreeps []*Creep) {
	for i := range tm.placedTowers {
		tower := &tm.placedTowers[i]


		// Update idle animation if it exists
		if tower.IdleAnimation != nil {
			tower.IdleAnimation.Update(deltaTime)
		}

		var nearestCreep *Creep
		minDistSq := math.MaxFloat64

		// Tower's center in tile coordinates
		towerCenterX := float64(tower.X) + 0.5 // Add 0.5 to get center of tile
		towerCenterY := float64(tower.Y) + 0.5

		for _, creep := range activeCreeps {
			if creep == nil || !creep.IsActive() {
				continue
			}

			// Creep coordinates are already in tile coordinates
			creepX := creep.X
			creepY := creep.Y

			dx := creepX - towerCenterX
			dy := creepY - towerCenterY
			distSq := dx*dx + dy*dy

			if distSq < minDistSq {
				minDistSq = distSq
				nearestCreep = creep
			}
		}

		if nearestCreep != nil {
			// Skip weapon rotation for Magic Tower (it should remain stationary)
			if tower.TowerID != MagicTowerID {
				// Calculate angle to target (both in tile coordinates)
				dx := nearestCreep.X - towerCenterX
				dy := nearestCreep.Y - towerCenterY
				targetAngle := math.Atan2(dy, dx)

				currentAngle := tower.WeaponAngle

				// Calculate the shortest angular distance
				deltaAngle := targetAngle - currentAngle

				// Normalize angle difference to [-π, π]
				for deltaAngle > math.Pi {
					deltaAngle -= 2 * math.Pi
				}
				for deltaAngle < -math.Pi {
					deltaAngle += 2 * math.Pi
				}

				maxRotation := weaponRotationSpeed * deltaTime

				// Use smooth interpolation for more fluid rotation
				// Calculate rotation step with smoothing factor
				rotationStep := deltaAngle * weaponRotationSmoothness * deltaTime

				// Clamp the rotation step to maximum rotation speed
				if math.Abs(rotationStep) > maxRotation {
					if rotationStep > 0 {
						rotationStep = maxRotation
					} else {
						rotationStep = -maxRotation
					}
				}

				// Apply the smooth rotation step
				tower.WeaponAngle += rotationStep

				// Normalize weapon angle to [-π, π]
				for tower.WeaponAngle > math.Pi {
					tower.WeaponAngle -= 2 * math.Pi
				}
				for tower.WeaponAngle < -math.Pi {
					tower.WeaponAngle += 2 * math.Pi
				}
			}
		}
	}
}
```

Then it's back to GameScene and adding this to the Update method (right after where we call HandleTowerPlacement)

```go
g.towerManager.UpdatePlacedTowers(deltaTime,g.creepManager.creeps)
```

Now you will see the tower weapon will rotate to face the nearest creep.

ALMOST THERE! We need to add projectiles and collision and that's a game!

So..projectiles...
