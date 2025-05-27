title: "Stopwatch"
date: "05-27-2025"
article_type: "TUTORIALS"
categories: ["tools", "go", "tutorial"]

---

# Stopwatch - A Timer implementation for Ebitengine

One very common tool used in game programming is the timer. Being able to spawn various timers in the game helps us make sense of the chaos of interactions within our game.

Not every game needs a timer, but more often than not, you will find yourself re-writing the same implementation over and over. Even though it's very little code, at some point you are going to have to ask yourself why you haven't just written a reusable and tested library for this functionality. Let's solve that little dilemma now and create one.

## Step 1: REPO

The first thing we want to do is set up a github repo for this. Technically you can do it any time, but I find doing this first is the way to go.

![github repo snapshot](stopwatch-repo.png)

Now that we have the REPO made, let's clone it. Navigate to the desired directory and type

`go get github.com/<your name>/Stopwatch`

## Step 2: INIT

Now navigate to the stopwatch directory. Type the following to init your golang library.
`go mod init github.com/<your name>/stopwatch`

This will initialize your application and create a go.mod file for you.
Next, let's get our only external dependency, ebitengine.

`go get github.com/hajimehoshi/ebiten/v2`

Your go.mod should look something like this:

```toml
module github.com/RAshkettle/Stopwatch

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

Now we are ready to start. Create a file named `stopwatch.go`

First we start with a simple package declaration and imports.

```go
package main

import(
"time"
"github.com/hajimeohoshi/ebiten/v2"
)
```

Next we need a struct to represent our stopwatch:

```go
type Stopwatch struct {
 currentTicks int
 maxTicks     int
 isActive     bool
}
```

:

We will build a factory function to build a new Stopwatch in an idiomatic way.

```go
func NewStopwatch(d *time.Duration) *Stopwatch {
 return &Stopwatch{
  currentTicks: 0,
  maxTicks:     int(d.Milliseconds()) * ebiten.TPS() / 1000,
  isActive:     false,
 }
}
```
