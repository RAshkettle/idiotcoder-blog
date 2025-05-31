---
title: "Tiled"
date: "05-29-2025"
article_type: "TUTORIALS"
categories: ["tools", "go", "tutorial"]
---

# Tiled - Loading a tiled map

_code and assets for this tutorial can be found on my [github repo](https://github.com/RAshkettle/Tile-tutorial)._

Quite a few Indie games are simple in layout. As an example, let's look at Asteroids or Space Invaders. In both, the spawn points are easy to understand and requires nothing more than a simple function to lay out. There is no complex map involved.

However, more complex games like RPGs, Platformers and such, usually require a tilemap and a tilemap editor makes things a lot easier. There are a few out there, but for this tutorial, we will focus on the most popular by a landslide. [Tiled](https://www.mapeditor.org/).

## Initial Setup

Since this is an ebitengine project, let's begin by setting up the basics.

```go
package main

import (
	"github.com/hajimehoshi/ebiten/v2"
)

type Game struct{}

func (g *Game) Draw(screen *ebiten.Image) {}

func (g *Game) Layout(outerScreenWidth, outerScreenHeight int) (ScreenWidth, ScreenHeight int) {
	return 1920, 1280
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

This is your basic template for any given ebitengine game, nothing special. Create folder named assets in the root directory of your project.

## Create TileMap

Now, let's get a simple tileset. I chose one from Foozle on itch, as I'm going to use it for my Tower Defense tutorial, so two birds and all that. The tileset I chose can be found [here](https://foozlecc.itch.io/spire-tileset-1).

You can create your own tilemap for this, or you can just grab the one I made from my assets folder. Grab everything, as it's all needed. My tileset looks like this:
![tilemap](tilemapExample.png)

## Examine the File

So, we saved our tilemap as json. Fortunately go and json are good friends. Open up the tilemap in a text editor. Mine can be found in assets/level.tmj

Let's look at the JSON.

```json
{
  "compressionLevel"
  "height"
  "infinite"
  "layers"
  "nextLayerId"
  "nextObjectId"
  "orientation"
  "renderorder"
  "tiledversion"
  "tileheight"
  "tilesets"
  "tilewidth"
  "type"
  "version"
  "width"
}
```

All of this information can have value. For now though, only a few fields really matter to us.
tile height and width is valuable, but something we already should kind of know. Unless you are changing tile sizes dynamically, I'm not sure how much real value there is in it for us.

TileSets is very valuable, so take note of that.

Layers is the most important thing we will be looking at. This is the data telling us which and where tile to place. Let's write some code to load this information.

## Parse TileMap

We start with imports. We will need to interact with the operating system to load the json file, and then we need to parse it. Add these to your imports.

```go
	"encoding/json"
	"os"
```

Then we need a new struct to represent a layer.

```go
type TilemapLayerJSON struct {
	Data   []int `json:"data"`
	Width  int   `json:"width"`
	Height int   `json:"height"`
	Name string `json:"name"`
}
```

This holds the information we will need to render this map onto the screen. The name is a simple label to indetify which layer it is. Height and Width are number of tiles in each direction, which is good for letting us know how to lay out the tiles.
Data is a representation of the tiles used, with their Id being the number in the slice.

Since we have multiple layers typically, let's make a type for that too.

```go
type TilemapJSON struct {
	Layers []TilemapLayerJSON `json:"layers"`
}
```

Now this part is simple. Open the file, parse it, then load the data into the TilemapLayerJSON structs.

```go
func NewTilemapJSON(filepath string) (*TilemapJSON, error) {
	contents, err := os.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	var tilemapJSON TilemapJSON
	err = json.Unmarshal(contents, &tilemapJSON)
	if err != nil {
		return nil, err
	}

	return &tilemapJSON, nil
}
```

This is technically all we need from the file. If we used multiple tilesets on each layer, there would be more work. We could return the tileset information so that we could use the tile's id to figure out which tileset to pull it from, but that's more complicated that it's worth for out needs.

Inside our func main, change to this.

```go
func main(){
  g := &Game{}
  t, err := NewTilemapJSON("assets/level.tmj")
	if err != nil {
		panic(err)
	}
	g.level = t

  ...//rest of the function
}
```

So, we now have the data we need. Let's get about loading the images. Tilemaps often have extra images you didn't use in them. There are several reasons for this, including laziness, but let's just agree it happens and should be taken care of if possible.

Being a lazy dev, I'd rather just create a function to tell me what to load.
So let's start with a struct to hold the distinct images. A simple map with the tile Id as the key and the Image as the value would work just great.

```go
type TileImageMap struct {
	Images map[int]*ebiten.Image
}

```

This gives us a bucket to store our images in. The next step is to load it.
Create a function that returns our TileImageMap. Since we need the TileMapJson for the layers, let's attach this to that struct. Let's add some code below and then talk about it.

```go
func(t TilemapJSON) LoadTiles() TileImageMap {
    tileMap := TileImageMap{
        Images: make(map[int]*ebiten.Image),
    }

    // collect all unique tile IDs from all layers
    uniqueTileIDs := make(map[int]bool)
    for _, layer := range t.Layers {
        for _, tileID := range layer.Data {
            if tileID != 0 { // 0 typically represents empty/no tile
                uniqueTileIDs[tileID] = true
            }
        }
    }
		for tileID := range uniqueTileIDs {
			i,err := getTileImage(tileID)
			if err != nil{
				panic(err)
			}
			tileMap.Images[tileID] = i
		}
    return tileMap
}
```

What we did was pretty straightforward. We simply loop through all the layers and inside each layer, we loop through the data looking for distinct ids. We don't store 0 because 0 means no image. We aren't loading the images yet, and the returned map is empty. This is just the first step.

Then we loop through those unique ids and we call getTileImage to get it. Of course, we haven't written that yet, so it won't compile, but don't worry. We will do that right now.

## Load the Images

Now we need the to know where to look for images. This is why the tilemap came with the firstgid property for each tilemap. This gives us a way to map the id to the appropriate tileset. We could programatically do this, as it's just a property on the main map, but I like to optimize when I can and just use constants if it's not likely to change.

Near the top of the file, under the imports, add the following two lines:

```go
    // first tile ID constants for each tileset
    const groundFirstTileID = 1
    const waterFirstTileID = 257
```

_Of course, if you are using your own map, adjust the names and values._

This next on is a bit more touchy than I expected, so I'll explain in detail.
We start with a function signature (obviously) and adding the variables we are going to need.

```go
func getTileImage(tileID int) (*ebiten.Image, error) {

	var tilesetImage *ebiten.Image
	var err error
	var localTileID int
	var tileWidth, tileHeight int = 64, 64 // Standard tile size
	var tilesPerRow int
```

As you can see, we pass in the Tile Id and get either an image or an error in return. Obviously we need varibles to hold our error and return, so we create them. We also want to know the local id. For tiles outside of the first tileset, we need to create an offset. This is the id with the offset applied.
Width and Height are obvious, and tiles per row is important in splitting the single dimentional array.

This next part is where the trickery resides. We check the id against the values in our const values to determine which tileset to pull it from. If it's the first one, just grab it. If it's not, do the math to get the localized index and grab that one. At this point we are only getting the localized index and the correct tileset. We have not gotten the actual tile yet. Here is what the code should look like so far (place right under the var declarations above).

```go
if tileID >= groundFirstTileID && tileID < waterFirstTileID {
		// Ground tileset
		tilesetImage, _, err = ebitenutil.NewImageFromFile("assets/Grass Tileset.png")
		if err != nil {
			return nil, err
		}
		localTileID = tileID - groundFirstTileID
		tilesPerRow = 16 // Ground tileset has 16 columns
	} else if tileID >= waterFirstTileID {
		// Water tileset
		tilesetImage, _, err = ebitenutil.NewImageFromFile("assets/Animated water tiles.png")
		if err != nil {
			return nil, err
		}
		localTileID = tileID - waterFirstTileID
		tilesPerRow = 70 // Water tileset has 70 columns
	} else {
		return nil, nil // Invalid tile ID
	}
```

Then we can simply finish off by getting the correct tile in that tileset.

```go
	// Calculate tile position in the tileset
	tileX := (localTileID % tilesPerRow) * tileWidth
	tileY := (localTileID / tilesPerRow) * tileHeight

	// Extract the tile from the tileset
	tileRect := image.Rect(tileX, tileY, tileX+tileWidth, tileY+tileHeight)
	tileImage := tilesetImage.SubImage(tileRect).(*ebiten.Image)

	return tileImage, nil
}
```

The complete function should look like this:

```go
func getTileImage(tileID int) (*ebiten.Image, error) {

	var tilesetImage *ebiten.Image
	var err error
	var localTileID int
	var tileWidth, tileHeight int = 64, 64 // Standard tile size
	var tilesPerRow int

	if tileID >= groundFirstTileID && tileID < waterFirstTileID {
		// Ground tileset
		tilesetImage, _, err = ebitenutil.NewImageFromFile("assets/Grass Tileset.png")
		if err != nil {
			return nil, err
		}
		localTileID = tileID - groundFirstTileID
		tilesPerRow = 16 // Ground tileset has 16 columns
	} else if tileID >= waterFirstTileID {
		// Water tileset
		tilesetImage, _, err = ebitenutil.NewImageFromFile("assets/Animated water tiles.png")
		if err != nil {
			return nil, err
		}
		localTileID = tileID - waterFirstTileID
		tilesPerRow = 70 // Water tileset has 70 columns
	} else {
		return nil, nil // Invalid tile ID
	}

	// Calculate tile position in the tileset
	tileX := (localTileID % tilesPerRow) * tileWidth
	tileY := (localTileID / tilesPerRow) * tileHeight

	// Extract the tile from the tileset
	tileRect := image.Rect(tileX, tileY, tileX+tileWidth, tileY+tileHeight)
	tileImage := tilesetImage.SubImage(tileRect).(*ebiten.Image)

	return tileImage, nil
}

```

## RENDER

At this point, we have loaded the map, determined the map sprites we needed, and loaded them. Now it's time to render it to the screen.

Back in main.go, look at the Draw function. Right now it's a sad empty little thing. Let's fix that.

We loop through all the layers. Inside each layer, we traverse each row, drawing the tiles with the given image. It's about as straightforward as it gets, so I'll just leave it here.

```go
func (g *Game) Draw(screen *ebiten.Image) {
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

If all went well, you should see this:
![finished map](finishedMap.png)

But wait! We have a problem here. Notice the rock at the top by the river and notice the bridge. Obvious errors.  
The bridge is an error from the map. It's just the way that tile draws. The fix is to take the bottom tile and flip it to make it fit. But doing that looks worse. What's going on here?

Well, flipped tiles in Tiled have a flag that shows them as such. Looking at their documentation, this is a pretty simple fix.

All our work will be in tilemap.go.

Directly under the imports, around where you defined the `groundFirstTileID` place the following code.

```go
const (
	FlippedHorizontally = 0x80000000
	FlippedVertically   = 0x40000000
	FlippedDiagonally   = 0x20000000
	FlipMask            = FlippedHorizontally | FlippedVertically | FlippedDiagonally
)
```

These are the masks used by Tiled to determine if something is flipped. At the top of the getTiledImage function, before all the varible declarations, add the following check.

```go
    flippedH := (tileID & FlippedHorizontally) != 0
    flippedV := (tileID & FlippedVertically) != 0
    flippedD := (tileID & FlippedDiagonally) != 0

    // Get the actual tile ID without flip flags
    actualTileID := tileID &^ FlipMask // Use defined FlipMask
```

Here we check to see if any of the flags are present in the tile indicating it's flipped. If so, we need to mark it as such for rendering and we need to store the actual id of the tile, stripped of that flag.

For the rest, we just redirect all the tileID references in the function to point to actualTildID. Again, for ease, the full function is below.

```go
func getTileImage(tileID int) (*ebiten.Image, error) {
    flippedH := (tileID & FlippedHorizontally) != 0
    flippedV := (tileID & FlippedVertically) != 0
    flippedD := (tileID & FlippedDiagonally) != 0

    // Get the actual tile ID without flip flags
    actualTileID := tileID &^ FlipMask // Use defined FlipMask

    var tilesetImage *ebiten.Image
    var err error
    var localTileID int
    var tileWidth, tileHeight int = 64, 64 // Standard tile size
    var tilesPerRow int

    if actualTileID >= groundFirstTileID && actualTileID < waterFirstTileID {
        // Ground tileset
        tilesetImage, _, err = ebitenutil.NewImageFromFile("assets/Grass Tileset.png")
        if err != nil {
            return nil, err
        }
        localTileID = actualTileID - groundFirstTileID // Use actualTileID, not tileID
        tilesPerRow = 16 // Ground tileset has 16 columns
    } else if actualTileID >= waterFirstTileID { // Use actualTileID, not tileID
        // Water tileset
        tilesetImage, _, err = ebitenutil.NewImageFromFile("assets/Animated water tiles.png")
        if err != nil {
            return nil, err
        }
        localTileID = actualTileID - waterFirstTileID // Use actualTileID, not tileID
        tilesPerRow = 70 // Water tileset has 70 columns
    } else {
        return nil, nil // Invalid tile ID
    }

    // Calculate tile position in the tileset
    tileX := (localTileID % tilesPerRow) * tileWidth
    tileY := (localTileID / tilesPerRow) * tileHeight

    // Extract the tile from the tileset
    tileRect := image.Rect(tileX, tileY, tileX+tileWidth, tileY+tileHeight)
    tileImage := tilesetImage.SubImage(tileRect).(*ebiten.Image)

    // Apply flips if needed
    if flippedH || flippedV || flippedD {
        tileImage = applyFlips(tileImage, flippedH, flippedV, flippedD)
    }

    return tileImage, nil
}
```

So, one last problem. applyFlips doesn't exist. Guess noting gets past you. This is just basic math to flip horizontally, vertically, or rotate (diagonal).

```go
func applyFlips(img *ebiten.Image, flippedH, flippedV, flippedD bool) *ebiten.Image {
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()

	// Create a new image for the flipped result
	flippedImg := ebiten.NewImage(w, h)

	opts := &ebiten.DrawImageOptions{}

	// Handle diagonal flip (90° rotation) first
	if flippedD {
		// 90° clockwise rotation + horizontal flip = diagonal flip in Tiled
		opts.GeoM.Translate(-float64(w)/2, -float64(h)/2)
		opts.GeoM.Rotate(3.14159 / 2) // 90 degrees in radians
		opts.GeoM.Scale(-1, 1)        // Horizontal flip
		opts.GeoM.Translate(float64(h)/2, float64(w)/2)
	} else {
		// Handle horizontal flip
		if flippedH {
			opts.GeoM.Scale(-1, 1)
			opts.GeoM.Translate(float64(w), 0)
		}

		// Handle vertical flip
		if flippedV {
			opts.GeoM.Scale(1, -1)
			opts.GeoM.Translate(0, float64(h))
		}
	}

	flippedImg.DrawImage(img, opts)
	return flippedImg
}
```

If all went well, you should see this:
![tower defense map](towerDefenseFixedMap.png)

That's the basics of loading tiled maps.
