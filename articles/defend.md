---
title: "Defend"
date: "06-26-2025"
article_type: "TUTORIALS"
categories: ["go", "tutorial"]
image: "invaders/go-invaders.png"
---

# Defend - IN PROGRESS - Creating a Defenders remake in Golang

Continuing in my love for all things retro gaming, we come to Defender. This was one of the first real action type games. As always, the code for this tutorial can be found [here](https://github.com/RAshkettle/Defend)
Let's get started!

As always, we begin with a `go mod init defend`
We will start out with a scene manager as always, so create the following files (my example uses touch, do it however you wish).

```bash
touch end_scene.go title_scene.go game_scene.go scene_manager.go main.go
```

We will start with our Scene Manager. Open up the file and let's add some code.

- We will add a enum for scene types.

- We will add an interface for Scene, which will be the same as Ebitengiens game interface
- We will add a SceneManager struct containing pointers to all our scenes.

The SceneManager is essentially just a state machine for our scenes.

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

type SceneType int

const (
	SceneTitleScreen SceneType = iota
	SceneGame
	SceneEndScreen
)

type Scene interface {
	Update() error
	Draw(screen *ebiten.Image)
	Layout(outerWidth, outerHeight int) (int, int)
}

type SceneManager struct {
	currentScene Scene
	sceneType    SceneType
	titleScene   *TitleScene
	gameScene    *GameScene
	endScene     *EndScene
}
```

We have a SceneManager, lets make a factory...

```go
func NewSceneManager() *SceneManager {
	sm := &SceneManager{
		sceneType: SceneTitleScreen,
	}

	sm.titleScene = NewTitleScene(sm)
	sm.gameScene = NewGameScene(sm)
	sm.endScene = NewEndScene(sm)

	sm.currentScene = sm.titleScene

	return sm
}
```

Notice a couple things here. First, we are defaulting to our title screen. That makes sense. Second, when we create our scenes, we will pass our scene manager to their factories.

Next, we need to follow the Game interface.

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

This is simply a pass-through to our individual scenes.

The final piece missing in our scene manager is a transition function to change state.

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

Great! That file is done. Close it up and let's set up our scenes. Let's just move backwards for no particular reason and start with end_scene. Open it up and let's get started.  
There's not much to these scenes for now, just the bare skeleton, so let's just drop everything in at once. It's pretty easy to follow along with at this point.

In each file, we do the same three things.

1.  We create a struct which holds a reference to the scene manager.
2.  We implement the Scene Interface
3.  We make a factory for our Scene.

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

type EndScene struct {
	sceneManager *SceneManager
}

func (e *EndScene) Update() error {
	return nil
}

func (e *EndScene) Draw(screen *ebiten.Image) {}

func (e *EndScene) Layout(outerWidth, outerHeight int) (int, int) {
	return outerWidth, outerHeight
}

func NewEndScene(sm *SceneManager) *EndScene {
	end := &EndScene{
		sceneManager: sm,
	}
	return end
}
```

Now let's do the same thing for game_scene and title_scene.

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

type GameScene struct {
	sceneManager *SceneManager
}

func (g *GameScene) Update() error {
	return nil
}

func (g *GameScene) Draw(screen *ebiten.Image) {}

func (g *GameScene) Layout(outerWidth, outerHeight int) (int, int) {
	return outerWidth, outerHeight
}

func NewGameScene(sm *SceneManager) *GameScene {
	game := &GameScene{
		sceneManager: sm,
	}
	return game
}
```

and of course,

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

type TitleScene struct {
	sceneManager *SceneManager
}

func (t *TitleScene) Update() error {
	return nil
}

func (t *TitleScene) Draw(screen *ebiten.Image) {}

func (t *TitleScene) Layout(outerWidth, outerHeight int) (int, int) {
	return outerWidth, outerHeight
}

func NewTitleScene(sm *SceneManager) *TitleScene {
	title := &TitleScene{
		sceneManager: sm,
	}
	return title
}
```

With that, we have scene management hooked up. Now let's wire that into our `main.go`.  
This is simple. Create a new SceneManager, set some basic config settings, and launch the game.

```go
package main

import "github.com/hajimehoshi/ebiten/v2"

func main() {
	sm := NewSceneManager()
	ebiten.SetWindowResizingMode(ebiten.WindowResizingModeEnabled)
	ebiten.SetWindowTitle("Defend")
	ebiten.SetWindowSize(640, 480)

	err := ebiten.RunGame(sm)
	if err != nil {
		panic(err)
	}
}
```

Run the game and you will see this...
![blank game](defend/defendBlank.png)

Of coures, it's not all that exciting for the work we just did. Let's get that title screen done then so we can get into our game.

Open up `title_scene.go` and let's edit it.
First we will be adding some fields to our struct to hold the fonts. This means adding some imports.

```go
package main

import (
	"bytes"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/text/v2"
	"golang.org/x/image/font/gofont/goregular"
)

type TitleScene struct {
	sceneManager *SceneManager
	titleFont    *text.GoTextFace
	subtitleFont *text.GoTextFace
}
```

Update the factory to add the fonts.

```go
func NewTitleScene(sm *SceneManager) *TitleScene {
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
	title := &TitleScene{
		sceneManager: sm,
		titleFont:    titleFont,
		subtitleFont: subtitleFont,
	}
	return title
}
```

Now we have fonts loaded. Let's render a simple text title.
Let's change the Draw function and draw our title.

```go
func (t *TitleScene) Draw(screen *ebiten.Image) {
	screen.Fill(color.RGBA{10, 15, 25, 255})

	// Get screen dimensions
	w, h := screen.Bounds().Dx(), screen.Bounds().Dy()

	// Draw title
	titleText := "DEFEND"
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

This simply added the title in the center with the instructions to press the space key to start.

I guess we need to edit Update to listen for key presses. When one happens, transition to the Game Scene.

```go
func (t *TitleScene) Update() error {
	// Check for key presses
	if ebiten.IsKeyPressed(ebiten.KeySpace) {
		t.sceneManager.TransitionTo(SceneGame)
		return nil
	}
	return nil
}
```

Run the Game and you should see this...
![title screen](defend/title.png)

When you press space bar, you are met with an empty screen. That's ok...that is the Game Scene! So far, so good.

Next I want to set up our asset loader. You can't have a game without assets. This game will have very simple assets, but we still need to load them.
Create a new folder in your game's root directory and call it `assets`

There are very simple sprites to this game, so I created some and they can be found at my linked repo.

Under `assets` create another folder called `sprites`. Inside that folder, place our `player.png` sprite.
In the `assets` root folder, create a file called `assets.go`. We will create our embedded filesystem here.
I have another tutorial on embedded filesystems in go, so if you don't understand this, feel free to look at it before going further. For now, just add this to the file.

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

var PlayerSprite = loadImage("sprites/player.png")

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

All this does is load the player sprite and make it available to our game.
Let's add our player. Create a file called `player.go`
We will start out with a simple enum to determine facing (left/right).

```go
package main

import (
	"defend/assets"

	"github.com/hajimehoshi/ebiten/v2"
)
type FACING int
const (
	RIGHT FACING = iota
	LEFT
)
```

Next we create a Player struct with position, sprite and facing. Create a factory for it too with some decent defaults that should put it near the center of the screen. We can tweak that later if we wish.

```go
type Player struct {
	X      float64
	Y      float64
	Image  *ebiten.Image
	Facing FACING
}

func NewPlayer() *Player {
	return &Player{
		Image:  assets.PlayerSprite,
		X:      150.0,
		Y:      100.0,
		Facing: RIGHT,
	}
}
```

Now we simply have to draw it. Go to `game_scene.go` and let's make a couple simple changes.

First, let's make layout in our game scene deterministic so our game scales automatically.

```go
func (g *GameScene) Layout(outerWidth, outerHeight int) (int, int) {
	return 320, 240
}
```

Next, add Player to our GameScene struct. Make sure to initialize it in the factory.

```go
type GameScene struct {
	sceneManager *SceneManager
	player       *Player
}
func NewGameScene(sm *SceneManager) *GameScene {
	game := &GameScene{
		sceneManager: sm,
		player:       NewPlayer(),
	}
	return game
}
```

Now, we don't have controls yet, so no reason for update changes, but we do need to draw the player. The only action we are taking is to translate the player to the default coordinates.

```go
func (g *GameScene) Draw(screen *ebiten.Image) {
	// Draw the player
	op := &ebiten.DrawImageOptions{}
	op.GeoM.Translate(g.player.X, g.player.Y)
	screen.DrawImage(g.player.Image, op)
}
```

Run the game and hit space to move to the game scene. You should be greeted with this.
![player](defend/playerDrawn.png)

Now that we have the player, we want to see it move. Defender is not going to be straightforward here. In defender, the player stays in the middle of the screen, but the map is moved. This is fairly common in games though and is handled through use of a virtual camera.
Let's get the terrain generated and the camera set up.
Create a new file named `camera.go`
We will start with a struct to define our camera and the factory to instantiate it. We need the "current" X value, the speed to move it, and the dimensions of what we want to show.

```go
package main

type Camera struct {
	X      float64
	Speed  float64
	Width  float64
	Height float64
}

func NewCamera(screenWidth, screenHeight float64) *Camera {
	return &Camera{
		X:      0,
		Speed:  3.0,
		Width:  screenWidth,
		Height: screenHeight,
	}
}
```

Next we just need functions to move it left and right. We also want some wrapping logic, as the map in Defender scrolls.

```go
func (c *Camera) MoveLeft(terrainWidth float64) {
	c.X -= c.Speed
	if c.X < 0 {
		c.X += terrainWidth
	}
}

func (c *Camera) MoveRight(terrainWidth float64) {
	c.X += c.Speed
	if c.X >= terrainWidth {
		c.X -= terrainWidth
	}
}
```

With that, we have a fully working camera for our game.
Next we need to generate the terrain. Defender has sharp peaks, but I decided to go with rounded hills. Why? Sin is easier to work with and the code ended up cleaner. I also like the looks, so I have no issues with it.

The terrain is drawn by drawing a series of points. We generate these points.

Create a new file called `terrain.go`.
Let's start by creating a struct to define our terrain and a factory to initialize it.

For the struct, we need the color to draw it, the width of our terrain in pixels (3x the screen in our case), and a slice of points indicatiing the height of the terrain. We set a point every 5 pixels so it looks smooth.
We then use the Sin function to generate our rolling hills.

```go
type Terrain struct {
	points       []float64
	width        float64
	terrainColor color.RGBA
}

func NewTerrain(screenWidth float64) *Terrain {
	totalWidth := screenWidth * 3
	numPoints := int(totalWidth / 5)

	points := make([]float64, numPoints)

	for i := 0; i < numPoints; i++ {
		x := float64(i) * 5.0

		baseHeight := 40.0

		height := baseHeight +
			20.0*math.Sin(x*0.01) +
			15.0*math.Sin(x*0.02+0.5) +
			25.0*math.Sin(x*0.005-0.7) +
			10.0*math.Max(0, math.Sin(x*0.03+1.2))

		points[i] = height
	}

	return &Terrain{
		points:       points,
		width:        totalWidth,
		terrainColor: color.RGBA{255, 140, 0, 255},
	}
}
```

Now we draw the terrain using vector line drawing.

```go
	screenWidth := float64(screen.Bounds().Dx())
	screenHeight := float64(screen.Bounds().Dy())

	cameraX := camera.X
	for cameraX < 0 {
		cameraX += t.width
	}
	for cameraX >= t.width {
		cameraX -= t.width
	}

	pointSpacing := 5.

	for screenX := 0.; screenX < screenWidth; screenX += pointSpacing {
		worldX := screenX + cameraX

		for worldX >= t.width {
			worldX -= t.width
		}

		index := int(worldX / pointSpacing)
		nextIndex := (index + 1) % len(t.points)

		if index >= 0 && index < len(t.points) {
			height := t.points[index]
			nextHeight := t.points[nextIndex]

			y1 := screenHeight - height
			y2 := screenHeight - nextHeight
			x1 := screenX
			x2 := screenX + pointSpacing

			vector.StrokeLine(screen, float32(x1), float32(y1), float32(x2), float32(y2), 1, t.terrainColor, false)
		}
	}
}
```

Since we now have terrain and a camera, add them to the GameScene. Open `game_scene.go`. Add the Camera and Terrain to the struct and factory. We hard code the screen size for now because we know it. We will refactor that out later to have it in a single spot.

```go
type GameScene struct {
	sceneManager *SceneManager
	player       *Player
	camera       *Camera
	terrain      *Terrain
}
func NewGameScene(sm *SceneManager) *GameScene {
	width, height := 320.0, 240.0
	camera := NewCamera(width, height)
	terrain := NewTerrain(width)

	game := &GameScene{
		sceneManager: sm,
		player:       NewPlayer(),
		camera:       camera,
		terrain:      terrain,
	}
	return game
}
```

We now need to update Draw to draw the terrain.

```go
func (g *GameScene) Draw(screen *ebiten.Image) {
	screen.Fill(color.Black)
	g.terrain.Draw(screen, g.camera)
	op := &ebiten.DrawImageOptions{}

	if g.player.Facing == LEFT {
		op.GeoM.Scale(-1, 1)
		op.GeoM.Translate(float64(g.player.Image.Bounds().Dx()), 0)
	}
	op.GeoM.Translate(g.player.X, g.player.Y)
	screen.DrawImage(g.player.Image, op)
}
```

Run the game and you see this!
![terrain](defend/terrain.png)

Looking better, but what's the point if we can't move. Let's start with basic camera moevement.
Open `player.go` and change its Update function.

```go
func (p *Player) Update(camera *Camera, terrainWidth float64) error {
	if ebiten.IsKeyPressed(ebiten.KeyLeft) || ebiten.IsKeyPressed(ebiten.KeyA){
		camera.MoveLeft(terrainWidth)
		p.Facing = LEFT
	}

	if ebiten.IsKeyPressed(ebiten.KeyRight) || ebiten.IsKeyPressed(ebiten.KeyD){
		camera.MoveRight(terrainWidth)
		p.Facing = RIGHT
	}
	return nil
}
```

When we call this from our GameScene Update method, it will move the camera depending on our keypresses.

```go
func (g *GameScene) Update() error {
	if err := g.player.Update(g.camera, float64(g.terrain.width)); err != nil {
		return err
	}
	return nil
}
```

Now when we move left or right, the terrain scrolls properly. Note that there is no up/down yet and you cannot move within the camera. We will get to that.

However, I'd like to do the mini map first. It's good for seeing how things are working overall, so important enough that I'd like to address it before working on the rest of the movement.

Let's create `minimap.go` and open it up.  
We will need to create a struct for our map. It will need a pointer to the terrain (to emulate it), the camera (to know where we are), some basic coordinates and size, and some colors for drawing.
Let's create it and the factory for it first.

```go
package main

import (
	"image/color"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/vector"
)

type Minimap struct {
	terrain       *Terrain
	camera        *Camera
	width         int
	height        int
	posX          int
	posY          int
	terrainColor  color.RGBA
	viewportColor color.RGBA
	borderColor   color.RGBA
}

func NewMinimap(terrain *Terrain, camera *Camera, screenWidth, screenHeight int) *Minimap {
	minimapWidth := screenWidth / 3
	minimapHeight := 30
	minimapX := (screenWidth - minimapWidth) / 2
	minimapY := 5

	return &Minimap{
		terrain:       terrain,
		camera:        camera,
		width:         minimapWidth,
		height:        minimapHeight,
		posX:          minimapX,
		posY:          minimapY,
		terrainColor:  color.RGBA{255, 140, 0, 255},
		viewportColor: color.RGBA{255, 255, 255, 255},
		borderColor:   color.RGBA{0, 0, 255, 255},
	}
}
```

As you can see, the minimap consists of the drawn terrain, a border, and a viewport indicator which shows us where we are on the map.
First let's draw the border

```go
func (m *Minimap) drawBorder(screen *ebiten.Image) {
	vector.StrokeLine(screen, float32(m.posX), float32(m.posY), float32(m.posX+m.width), float32(m.posY), 1, m.borderColor, false)
	vector.StrokeLine(screen, float32(m.posX), float32(m.posY+m.height), float32(m.posX+m.width), float32(m.posY+m.height), 1, m.borderColor, false)
	vector.StrokeLine(screen, float32(m.posX), float32(m.posY), float32(m.posX), float32(m.posY+m.height), 1, m.borderColor, false)
	vector.StrokeLine(screen, float32(m.posX+m.width), float32(m.posY), float32(m.posX+m.width), float32(m.posY+m.height), 1, m.borderColor, false)
}
```

Next we can draw the terrain inside this area. For now, it's essentially a copy of the terrain drawing code, just with some scaling math in it. We may refactor this later, but honestly..it works.

```go
func (m *Minimap) drawTerrain(screen *ebiten.Image) {
	terrainWidth := m.terrain.width
	scaleX := float64(m.width) / terrainWidth

	maxHeight := 0.0
	for _, h := range m.terrain.points {
		if h > maxHeight {
			maxHeight = h
		}
	}

	scaleY := scaleX

	yOffset := float64(m.posY) + float64(m.height)*0.9 - maxHeight*scaleY/2

	cameraX := m.camera.X
	for cameraX < 0 {
		cameraX += terrainWidth
	}
	for cameraX >= terrainWidth {
		cameraX -= terrainWidth
	}

	pointSpacing := 5.0

	for worldX := 0.0; worldX < terrainWidth; worldX += pointSpacing {
		screenX := (worldX * scaleX)

		index := int(worldX / pointSpacing)
		nextIndex := (index + 1) % len(m.terrain.points)

		if index >= 0 && index < len(m.terrain.points) {
			height := m.terrain.points[index]
			nextHeight := m.terrain.points[nextIndex]

			y1 := yOffset - height*scaleY
			y2 := yOffset - nextHeight*scaleY
			x1 := float64(m.posX) + screenX
			x2 := float64(m.posX) + screenX + (pointSpacing * scaleX)

			vector.StrokeLine(screen, float32(x1), float32(y1), float32(x2), float32(y2), 1, m.terrainColor, false)
		}
	}
}
```

Then we need a viewport. This is an indicator that shows us where the current screen is on the map.

```go
func (m *Minimap) drawViewport(screen *ebiten.Image) {
	terrainWidth := m.terrain.width

	cameraX := m.camera.X
	for cameraX < 0 {
		cameraX += terrainWidth
	}
	for cameraX >= terrainWidth {
		cameraX -= terrainWidth
	}

	viewportWidth := m.width / 3

	viewportPosition := float64(m.posX) + (cameraX/terrainWidth)*float64(m.width)

	viewportX := int(viewportPosition) - (viewportWidth / 2)

	if viewportX < m.posX {
		viewportX += m.width
	}
	if viewportX+viewportWidth > m.posX+m.width {
		viewportX = m.posX
	}

	vector.StrokeLine(
		screen,
		float32(viewportX), float32(m.posY),
		float32(viewportX+viewportWidth), float32(m.posY),
		2, m.viewportColor, false,
	)
	vector.StrokeLine(
		screen,
		float32(viewportX), float32(m.posY+m.height),
		float32(viewportX+viewportWidth), float32(m.posY+m.height),
		2, m.viewportColor, false,
	)
	vector.StrokeLine(
		screen,
		float32(viewportX), float32(m.posY),
		float32(viewportX), float32(m.posY+m.height),
		2, m.viewportColor, false,
	)
	vector.StrokeLine(
		screen,
		float32(viewportX+viewportWidth), float32(m.posY),
		float32(viewportX+viewportWidth), float32(m.posY+m.height),
		2, m.viewportColor, false,
	)
}
```

And of course, let's wire them up

```go
func (m *Minimap) Draw(screen *ebiten.Image) {
	m.drawBorder(screen)
	m.drawTerrain(screen)
	m.drawViewport(screen)
}
```

Now all we need to do it call this Draw function from our Game Scene.

Open `game_scene.go` and add the mini-map. Let's start with the reference to the map in the Game Scene struct.

```go
type GameScene struct {
	sceneManager *SceneManager
	player       *Player
	camera       *Camera
	terrain      *Terrain
	minimap      *Minimap
}

func NewGameScene(sm *SceneManager) *GameScene {
	width, height := 320.0, 240.0
	camera := NewCamera(width, height)
	terrain := NewTerrain(width)
	game := &GameScene{
		sceneManager: sm,
		player:       NewPlayer(),
		camera:       camera,
		terrain:      terrain,
	}
	game.minimap = NewMinimap(terrain, camera, int(width), int(height))
	return game
}
```

Lastly at the end of the Draw function, add this line

```go
	g.minimap.Draw(screen)
```

Run the game now and you can see it.
![mini map](defend/minimap.png)

So, we have a player on the screen. We can move the player right or left, which results in the camera moving. However, in the game, the player has some mobility within the camera. There is a little play from the center on horizontal and the vertical movement should be enabled.

Let's start with vertical movement, as it's going to be very simple.
We want to clamp movement to the bottom of the screen (screen height - 10 pixels puts it 2 pixels from bottom) and the bottom of the minimap (35 pixels).

Open up `player.go`
In the Update function, add this to the bottom...

```go
	minY := 35.0 // minimap's bottom edge
	maxY := float64(camera.Height - 10)

	if ebiten.IsKeyPressed(ebiten.KeyArrowUp) || ebiten.IsKeyPressed(ebiten.KeyW) {
		p.Y -= 2
		if p.Y < minY {
			p.Y = minY
		}
	}

	if ebiten.IsKeyPressed(ebiten.KeyArrowDown) || ebiten.IsKeyPressed(ebiten.KeyS) {
		p.Y += 2
		if p.Y > maxY {
			p.Y = maxY
		}
	}
```

By setting the Y value, we can manipulate the player without effecting the camera.

This works great! Now let us add the slight vertical movement.

All the code for this will be in `player.go`

Start by creting a const for the player's move speed.

```go
const (
	PLAYER_MOVE_SPEED = 0.1
)
```

Next we head into Update where we have to do a few things. Starting out, we need to determine where on the X coordinate our ship should be.
The ship should be at the edge of the minimap and should remain on the screen.

```go
	screenWidth := int(camera.Width)
	minimapWidth := screenWidth / 3
	minimapX := (screenWidth - minimapWidth) / 2
	leftEdge := float64(minimapX)
	rightEdge := float64(minimapX + minimapWidth)
	minY := 35.0
	maxY := float64(camera.Height - 10)
```

After we check the Right and Left movement, add these checks for Up and Down.

```go
	if ebiten.IsKeyPressed(ebiten.KeyArrowUp) || ebiten.IsKeyPressed(ebiten.KeyW) {
		p.Y -= 2
		if p.Y < minY {
			p.Y = minY
		}
	}

	if ebiten.IsKeyPressed(ebiten.KeyArrowDown) || ebiten.IsKeyPressed(ebiten.KeyS) {
		p.Y += 2
		if p.Y > maxY {
			p.Y = maxY
		}
	}
```

Once we have this, let's set the player on the correct edge and animate it.

```go
	targetX := leftEdge
	if p.Facing == LEFT {
		targetX = rightEdge
	}

	distToTarget := targetX - p.X
	p.X += distToTarget * PLAYER_MOVE_SPEED
```

Now if you run the game, your player can go up and down. Also, when they change direction, it gives a little extra room. That's looking good. I guess now it's time to shoot.
I'm not going to lie, this turned out to be a LOT harder to do than I expected. We start with a new file named `laser.go`
We need to create a struct to hold the data for our laser. Obviously we will need the X and Y coordinates, as well as facing. We don't need a sprite because it's just a vector drawing. We will hold a boolean for whether or not the Laser is still active, so we can remove it when it's travelled far enough or when it hits an enemy. Then we need the Distance Travelled so we know when to remove it. Lastly, because the beam grows, we need Current Length to track how long it is.
Create the struct and its factory.

```go
package main

import (
	"image/color"
	"math/rand"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/vector"
)

type Laser struct {
	X                 float64
	Y                 float64
	CurrentLength     int
	Direction         FACING
	DistanceTravelled float64
	Active            bool
}

func NewLaser(x, y float64, facing FACING) *Laser {
	return &Laser{
		X:             x,
		Y:             y,
		CurrentLength: 0,
		Direction:     facing,
		Active:        true,
	}
}
```

Next we want to create our Update function for the laser. First we will move the beam in the correct direction at a speed that is 2x the player speed (camera speed in our case).  
Then we check the length, growing it if the current length isn't 64 pixels.
Lastly, if the distance travelled is greater than the 150 pixels range we want, mark it for removal.

```go
func (l *Laser) Update() {
	if l.Direction == LEFT {
		l.X -= 6
	} else {
		l.X += 6
	}
	if l.CurrentLength < 64 {
		l.CurrentLength += 3
	}
	l.DistanceTravelled += 6
	if l.DistanceTravelled > 150 {
		l.Active = false
	}
}
```

Next we have the Draw function for Laser. For this, I ran into a cycle of hell of the beam not showing up properly. It turned out I needed information from the Camera to appropriately translate the beam from world coordinates.

So, we start by adjusting the X by the camera's X. Then, just to match the game, we set colors and we loop through each pixel of our beam. In our loop, we determine whether or not to render it (we always render the first 2...just in case). Then we choose a color and render it.

```go
func (l *Laser) Draw(screen *ebiten.Image, camera *Camera) {
	drawX := l.X - camera.X
	whiteColor := color.RGBA{255, 255, 255, 255}
	lightBlueColor := color.RGBA{200, 220, 255, 255}

	for i := 0; i < l.CurrentLength; i++ {
		if rand.Float64() < 0.2 && i > 2 {
			continue
		}
		pixelX := drawX
		if l.Direction == RIGHT {
			pixelX += float64(i)
		} else {
			pixelX -= float64(i)
		}
		pixelColor := whiteColor
		if rand.Float64() < 0.2 {
			pixelColor = lightBlueColor
		}
		vector.StrokeLine(
			screen,
			float32(pixelX),
			float32(l.Y),
			float32(pixelX+1),
			float32(l.Y),
			1,
			pixelColor,
			false,
		)
	}
}
```

Close that file up and open `player.go`
We want to add a slice of pointers to our lasers to our player struct. At the bottom of the struct, add this.

```go
ActiveShots []*Laser
```

That means in the factory, we need to add...

```go
ActiveShots: make([]*Laser, 0),
```

Now go to the Update function and go all the way to the bottom. Just above that final `return nil` add the following.

```go
	if inpututil.IsKeyJustPressed(ebiten.KeySpace) {
		if len(p.ActiveShots) < 3 {
			// Convert player screen position to world position for laser spawning
			worldX := p.X + camera.X + 16
			laser := NewLaser(worldX, p.Y+6, p.Facing)
			p.ActiveShots = append(p.ActiveShots, laser)
		}

	}

	for _, laser := range p.ActiveShots {
		laser.Update()
	}
	activeLasers := make([]*Laser, 0)
	for _, laser := range p.ActiveShots {
		if laser.Active {
			activeLasers = append(activeLasers, laser)
		}
	}
	p.ActiveShots = activeLasers
```

The first bit is creating a new laser when space is pressed (provided they don't already have 3 active lasers).
Then we loop through each laser calling its Update function.
Last, we remove any inactive lasers.

Close that up and open `game_scene.go`. Head to the Draw function. This is the last thing we need to wire it all up.
At the top of the Draw function, we do a screen fill and draw the terrain. RIGHT AFTER THAT, and before we create a new DrawImageOptions, add this code.

```go
	for _, laser := range g.player.ActiveShots {
		laser.Draw(screen, g.camera)
	}
```

This code simply iterates through any active lasers and calls its draw function to render it.

Now run the game and you can see that when you press space, it shoots.
It's said that in space, nobody can hear you scream. Sure...physics. However, firing silently with no sounds just feels lacking. Let us add a sound effect to our shots.

In our assets folder is a subfolder called `audio`. We have a laser.wav file in there. Let's load that in our `assets.go`

First, let's define what we need to export to our main game. That would be the Player for our sound, and possibly the Audio Context. We will export it just in case we need it later.

```go
var AudioContext = audio.NewContext(44100)

var LaserSound = loadPlayerFromWav("audio/laser.wav", 0.3)

```

You can see from here, we will need to create a loadPlayerFromWav function. This isn't loading a Player as in "the player", but rather an Audio Player. The first param should be the location of the file. The second is the volume (that sound blew my ears out).

```go
func loadPlayerFromWav(filePath string, volume float64) *audio.Player {
	data, err := assets.ReadFile(filePath)
	if err != nil {
		panic(err)
	}
	stream, err := wav.DecodeWithSampleRate(AudioContext.SampleRate(), bytes.NewReader(data))
	if err != nil {
		panic(err)
	}
	player, err := AudioContext.NewPlayer(stream)
	if err != nil {
		panic(err)
	}
	player.SetVolume(volume)
	return player
}
```

So at this point, we now have our audio player all set up. Let's go into Player.go (yeah, this gets confusing) and look at the Update function. Scroll to where we spawn the laser (space bar press).
Just change it so it reads as this...

```go
	if inpututil.IsKeyJustPressed(ebiten.KeySpace) {
		if len(p.ActiveShots) < 3 {
			// Convert player screen position to world position for laser spawning
			worldX := p.X + camera.X + 16
			laser := NewLaser(worldX, p.Y+6, p.Facing)
			p.ActiveShots = append(p.ActiveShots, laser)

			// Play laser sound
			assets.LaserSound.Rewind()
			assets.LaserSound.Play()
		}
	}
```

That's it! Start your game and it feels a lot better when we shoot.
I think it's time we started to create things to shoot at!
I guess the first step is to load the asset. Open up `assets.go` and add this near the top.

```go
var AlienSprite = loadImage("sprites/alien.png")
```

That's all we need to do in order to load the sprite.
Now create a new file called `alien.go`
We need a struct to hold this with the normal info you would expect.

```go
package main

import (
	"defend/assets"
	"math/rand"

	"github.com/hajimehoshi/ebiten/v2"
)

type Alien struct{
	X float64
	Y float64
	Image *ebiten.Image
	Active bool
}
func NewAlien(x, y float64)*Alien{
	return &Alien{
		X: x,
		Y: y,
		Image: assets.AlienSprite,
		Active: true,
	}
}
```

Next, we want a manager function to check to see if aliens should spawn. We want to make sure there are at least 6 aliens at all time.
The aliens should spawn anywhere in the world coordinates (so in 3 screens worth of horizontal).

```go
func CheckAlienSpawn(activeAliens []*Alien, terrainWidth float64)[]*Alien{
	if len(activeAliens) < 6{
		randomX := rand.Float64() * terrainWidth
		minY := 40.0
		maxY := 210.0
		randomY := minY + rand.Float64() * (maxY - minY)
		newAlien := NewAlien(randomX, randomY)
		activeAliens = append(activeAliens, newAlien)
	}
	return activeAliens
}
```

Then we need to Draw our alien.

```go
func (a *Alien) Draw(screen *ebiten.Image, camera *Camera, terrainWidth float64) {
	// Calculate alien position relative to camera, handling wrapping
	drawX := a.X - camera.X

	// Handle wrapping - if the alien appears to be very far away due to wrapping,
	// adjust its position to appear on the correct side
	if drawX > terrainWidth/2 {
		drawX -= terrainWidth
	} else if drawX < -terrainWidth/2 {
		drawX += terrainWidth
	}

	// Only draw if alien is visible on screen (with some margin)
	if drawX > -50 && drawX < camera.Width + 50 {
		op := &ebiten.DrawImageOptions{}
		op.GeoM.Translate(drawX, a.Y)
		screen.DrawImage(a.Image, op)
	}
}
```

Now open `game_scene.go` and add a slice of Aliens to our GameScene struct

```go
aliens       []*Alien
```

Our factory needs to update this..

```go
aliens:       []*Alien{},
```

Now in our Update function, let's change it to this.

```go
func (g *GameScene) Update() error {
	if err := g.player.Update(g.camera, float64(g.terrain.width)); err != nil {
		return err
	}
	g.aliens = CheckAlienSpawn(g.aliens, g.terrain.width)

	return nil
}
```

Now every tic, if there are under 6 aliens, they will spawn to be back at that number. We can add a delay to that later if we choose.
And finally in the Draw function, pretty much anywhere after drawing the terrain, place this...

```go
	for _, alien := range g.aliens {
		alien.Draw(screen, g.camera, g.terrain.width)
	}
```

Now when you run the game, you should see something similar to this...
![aliens](defend/alienSpawn.png)

Now that we have them spawning, let's get them on the mini map! First, I'm going to come clean here. The mini-map is bugged as hell. I've been ignoring it because I had zero idea how to fix it. It's time we do something about it before going any more.
Notice that the terrain isn't exactly matching in the mini-map and the world. Also, what's indicated on the mini-map is certainly now what you see in the world. Until now, it was good enough, but since we need to add aliens to it, we should fix it.

I asked a friendly AI to comment the living hell out of this to explain it all inline (and full disclosure, it also told me how to fix it...)
Open `minimap.go` and let's overwrite the Draw function

```go
func (m *Minimap) Draw(screen *ebiten.Image) {
	// Draw blue border around minimap
	vector.StrokeLine(screen, float32(m.posX), float32(m.posY), float32(m.posX+m.width), float32(m.posY), 1, m.borderColor, false)
	vector.StrokeLine(screen, float32(m.posX), float32(m.posY+m.height), float32(m.posX+m.width), float32(m.posY+m.height), 1, m.borderColor, false)
	vector.StrokeLine(screen, float32(m.posX), float32(m.posY), float32(m.posX), float32(m.posY+m.height), 1, m.borderColor, false)
	vector.StrokeLine(screen, float32(m.posX+m.width), float32(m.posY), float32(m.posX+m.width), float32(m.posY+m.height), 1, m.borderColor, false)

	// Calculate dimensions and scaling
	terrainWidth := m.terrain.width
	screenWidth := float64(screen.Bounds().Dx())

	// Calculate scaling factors for minimap
	scaleX := float64(m.width) / terrainWidth
	scaleY := float64(m.height) / m.camera.Height // Match main view's Y scaling

	// Get normalized camera position
	cameraX := m.camera.X
	for cameraX < 0 {
		cameraX += terrainWidth
	}
	for cameraX >= terrainWidth {
		cameraX -= terrainWidth
	}

	// Calculate viewport width in minimap space - represents one screen's worth
	viewportWidth := int((screenWidth / terrainWidth) * float64(m.width))

	// Position the viewport indicator based on the camera's left edge
	viewportPosition := float64(cameraX) / terrainWidth
	viewportX := m.posX + int(float64(m.width)*viewportPosition)

	// Draw all terrain points using same pointSpacing as in terrain.Draw
	pointSpacing := 5.0
	lastX := -1.0
	lastY := -1.0

	// Draw all terrain points for all 3 screens
	for i := 0; i < len(m.terrain.points); i++ {
		// Convert world position to minimap position
		worldX := float64(i) * pointSpacing
		minimapX := m.posX + int(worldX*scaleX)

		// Calculate height at this point
		height := m.terrain.points[i]
		minimapY := m.posY + m.height - int(height*scaleY)

		// Draw line segment if not the first point and not wrapping around edge
		if lastX >= 0 {
			vector.StrokeLine(
				screen,
				float32(lastX), float32(lastY),
				float32(minimapX), float32(minimapY),
				1, m.terrainColor, false,
			)
		}

		lastX = float64(minimapX)
		lastY = float64(minimapY)
	}

	// Draw the viewport indicator, handling wrapping by drawing two boxes if needed.
	if viewportX+viewportWidth > m.posX+m.width {
		// --- View is wrapped, draw two boxes ---
		// 1. Draw the part on the right edge of the minimap
		part1Width := (m.posX + m.width) - viewportX
		vector.StrokeRect(screen, float32(viewportX), float32(m.posY), float32(part1Width), float32(m.height), 2, m.viewportColor, false)

		// 2. Draw the part on the left edge of the minimap
		part2Width := (viewportX + viewportWidth) - (m.posX + m.width)
		vector.StrokeRect(screen, float32(m.posX), float32(m.posY), float32(part2Width), float32(m.height), 2, m.viewportColor, false)
	} else {
		// --- View is not wrapped, draw a single box ---
		vector.StrokeRect(screen, float32(viewportX), float32(m.posY), float32(viewportWidth), float32(m.height), 2, m.viewportColor, false)
	}
}
```

Now that it's fixed, let's add the aliens. We need to start by passing in the aliens slice to the Draw function of the mini-map. Open `minimap.go` and change the Draw function signature to this...

```go
unc (m *Minimap) Draw(screen *ebiten.Image, aliens []*Alien) {
```

Now, in that same function, anywhere after drawing the terrain, add this...

```go
	for _, alien := range aliens {
		minimapAlienX := m.posX + int(alien.X*scaleX)
		minimapAlienY := m.posY + int(alien.Y*scaleY)

		// Ensure the dot is within the minimap bounds before drawing
		if minimapAlienX >= m.posX && minimapAlienX < m.posX+m.width &&
			minimapAlienY >= m.posY && minimapAlienY < m.posY+m.height {
			// Draw a 1x1 pixel dot
			screen.Set(minimapAlienX, minimapAlienY, color.RGBA{255, 255, 255, 255})
		}
	}
```

Close that file and open `game_scene.go`.
At the very bottom of the Draw function, we call the Draw function for the mini-map. Change it to this.

```go
g.minimap.Draw(screen, g.aliens)
```

Note that all we really did here was pass the alien slice along too.

That's all there is to it. Fire up the game and you should see this!
![alien dots](defend/fixedMini.png)
