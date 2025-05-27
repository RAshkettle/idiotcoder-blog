---
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
package stopwatch

import(
"time"
"github.com/hajimeohoshi/ebiten/v2"
)
```

Notice the package is not main, but rather stopwatch. We are not building an executable here, but a library to be used inside a game.

Next we need a struct to represent our stopwatch:

```go
type Stopwatch struct {
 currentTicks int
 maxTicks     int
 isActive     bool
}
```

_isActive_ is straightforward: Is it on?  
_maxTicks_ is how many ticks you want the timer to be set for.  
_currentTicks_ holds where we are on the timeline.

Next will build a factory function to build a new Stopwatch in an idiomatic way.

```go
func NewStopwatch(d *time.Duration) *Stopwatch {
 return &Stopwatch{
  currentTicks: 0,
  maxTicks:     int(d.Milliseconds()) * ebiten.TPS() / 1000,
  isActive:     false,
 }
}
```

We pass a duration (in milliseconds) to the factory and it sets the maxTicks to that timeframe, adjusting by the TPS (ticks per second) and dividing it by 1000. This syncs ebitengine's ticks with ours.

Technically the other two fields could be omitted as they are displaying default values. I set them manually to make the intention clear to anybody who looks at the code.

So, once we have a new stopwatch, we need to be able to start and stop it. Let's add that.

```go
func (s *Stopwatch) Start() {
	s.isActive = true
}

func (s *Stopwatch) Stop() {
	s.isActive = false
}
```

It's as simple as flipping the isActive value.

Let's allow the user to reset the clock in the event they want to restart before it goes off. It's a simple matter of putting currentTicks back to 0.

```go
func (s *Stopwatch) Reset() {
	s.currentTicks = 0
}

```

Now of course, there is no magic here. We need to update the ticks. We will create an update function which should be called in our game every tick (so inside the gameloop update function).

```go
func (s *Stopwatch) Update() {
	if s.isActive && s.maxTicks < s.currentTicks {
		s.currentTicks++
	}
}
```

This is a pretty simple function. All it does is check to see if the timer is running or finished. If not, it increments the internal clock.

Lastly we need to check if it's finished. Normally I'd use an event for this, but Go has no such concept. Building an eventing library seems overkill for a timer, so let's just stick to this for now.

```go
func (s *Stopwatch) IsDone() bool {
	return s.maxTicks <= s.currentTicks
}
```

This simple check on every update (after the update is called) should be plenty for our needs. It is a simple timer after all. Note that you could replace the check in the Update function with a call to this now that it's available.
