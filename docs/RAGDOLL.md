# The ragdoll

The stick figure inside the pill in the hero title ("ANIMATION ⬭") is a small
physics ragdoll. It stands and waves on its own. Push it with the pointer, or
grab a joint and drag it, and it falls, tumbles inside the pill, and gets back
up once it comes to rest.

Code: `js/models/ragdoll.js` (simulation), `js/views/ragdollView.js`
(drawing), `js/controllers/ragdollController.js` (loop and input).

- [Coordinates and units](#coordinates-and-units)
- [Skeleton](#skeleton)
- [States](#states)
- [Idle animation](#idle-animation)
- [Physics](#physics)
- [Collision with the pill](#collision-with-the-pill)
- [Getting up](#getting-up)
- [Input](#input)
- [Drawing](#drawing)
- [Reduced motion](#reduced-motion)
- [Constants](#constants)
- [Tuning tips](#tuning-tips)

## Coordinates and units

- The pill is a box of `W × H` CSS pixels; the canvas fills it.
- `x` grows to the right and `y` grows downwards (canvas convention).
- **Every length is a fraction of `H`.** Bone lengths, margins, gravity,
  thresholds and radii all scale with the pill, so the figure behaves the
  same at any screen size. The pill itself is sized in `em` and scales with
  the hero title.
- Time advances in fixed steps of **0.016 s per frame** (≈ 60 fps). It is not
  measured, so on a 120 Hz display the figure moves twice as fast. This keeps
  the simulation deterministic and simple.

## Skeleton

Eleven joints. "Left" and "right" are as seen on screen.

```
               0  head
               │
               1  neck
            ╱  │  ╲
   elbow  3    │    5  elbow
          │    │    │
   hand   4    │    6  hand
               │
               2  hip
             ╱   ╲
     knee   7     9   knee
            │     │
     foot   8     10  foot
```

Bones are distance constraints `[a, b, length/H, stiffness]`:

| Bone | Joints | Length (×H) | Stiffness | Drawn |
|---|---|---|---|---|
| Neck | 0–1 | 0.13 | 1 | no (the gap reads as the neck) |
| Spine | 1–2 | 0.28 | 1 | yes |
| Left upper arm / forearm | 1–3, 3–4 | 0.15, 0.15 | 1 | yes |
| Right upper arm / forearm | 1–5, 5–6 | 0.15, 0.15 | 1 | yes |
| Left thigh / shin | 2–7, 7–8 | 0.19, 0.19 | 1 | yes |
| Right thigh / shin | 2–9, 9–10 | 0.19, 0.19 | 1 | yes |
| Head–hip helper | 0–2 | 0.41 | 0.12 | no |
| Knee–knee helper | 7–9 | 0.09 | 0.03 | no |

The two helpers are soft and invisible. Head–hip resists the torso folding in
half, which keeps the figure readable as a person. Knee–knee nudges the legs
apart so they do not end up crossed.

The knee–knee helper is **switched off while the figure gets up**. It only
keeps the knees a fixed distance apart; it does not know which knee belongs on
which side. When the figure lands with its legs swapped, each knee has to pass
the other on the way to its own side, and the helper pushes them back apart in
the wrong direction. It used to win by a small margin, so the knees stuck
together near the middle with the feet apart (an inverted Y) until the 5 s
get-up timeout snapped the pose straight. In a headless test of 1,000 random
falls, that happened in 18% of get-ups; with the helper off while rising it
never does, and every get-up finishes in about 1.5 s.

The standing pose (`IDLE`) gives each joint an offset from the centre of the
box, in `H` units, with the feet on the floor of the pill.

## States

```
  idle ──(pushed or grabbed)──► physics ──(at rest for ~1.5 s)──► rising
    ▲                              ▲                                 │
    │                              └──────(touched again)────────────┤
    └─────────────(every joint back in the standing pose)────────────┘
```

| State | Flags | What `step()` does |
|---|---|---|
| idle | `idle = true` | Advances the idle clock `t` and calls `pose()`. No physics. |
| physics | `idle = false`, `rising = false` | Verlet step, constraints, collisions; counts frames at rest. |
| rising | `idle = false`, `rising = true` | Same physics with fading gravity, plus `rise()` pulling joints home. |

`wake()` moves from idle (or rising) to physics. It zeroes joint velocities on
the way out of idle, so the figure does not inherit motion from the animation.

## Idle animation

`pose()` sets every joint directly from the time `t`:

- **Bob.** Arms and legs move up and down by `0.006·H·sin(2t)`, so the
  figure is never perfectly still.
- **Wave.** The first wave starts at `t = 1.5 s` and repeats every 5 s. Each
  lasts `D = 2.8 s`:
  - `e` (0 → 1) raises the right arm. For the first 0.5 s it follows a cubic
    curve, `1 + 2.2u³ + 1.2u²` with `u` going from −1 to 0, which overshoots
    slightly before settling at 1. It holds at 1, then eases back down over
    the last 0.5 s.
  - `we` (0 → 1) fades the forearm swing in from 0.35 s and out just before
    the end.
  - The forearm swings around the elbow by `a = 0.65·we·sin(11t)` radians,
    about 1.75 waves per second.
  - The head leans away from the raised arm (`−0.075·e·H`), with a small sway
    in time with the wave. The neck follows a little, and the left arm shifts
    slightly.
- The raised arm is computed directly: the elbow sits above the shoulder, the
  hand one forearm length (0.15·H) from the elbow at angle `a`. The idle pose
  is blended towards that by `e`.

Because `pose()` sets `px = x`, joints have zero velocity whenever physics
takes over.

## Physics

`step()` uses **position-based verlet integration**. Each joint stores its
current position `(x, y)` and its previous one `(px, py)`; their difference is
its velocity. One frame:

1. **Integrate.** For each joint: `v = (x − px) · 0.995` (0.5% air drag), then
   `px = x`, `x += v`, and `y += v_y + g`. Gravity is `g = 0.004·H` per frame²,
   scaled by `max(0, 1 − riseT/1.5)` while rising so it fades out over 1.5 s.
2. **Solve constraints**, 8 passes. Each pass:
   - For each bone, measures its length `d` against the rest length `L·H` and
     moves both ends towards each other (or apart) by
     `(d − L·H)/d · 0.5 · stiffness` of the vector between them. Rigid bones
     (stiffness 1) are fully corrected; the helpers only slightly. The
     knee–knee helper is skipped while rising (see [Skeleton](#skeleton)).
   - Pushes every joint back inside the pill (see below).
   - If a joint is grabbed, pins it to the pointer (and inside the pill).
3. **Update state.**
   - Dragging: resets the at-rest counter and cancels any get-up.
   - Rising: runs `rise()`.
   - Otherwise: finds the fastest joint. If it moved less than `0.004·H` this
     frame, `still` counts up; any faster movement resets it. After 90
     consecutive frames at rest (about 1.5 s), the figure starts to rise.

More passes make the bones stiffer and the figure more stable, at the cost of
CPU. With 11 joints and 12 bones, 8 passes is negligible.

## Collision with the pill

The pill is a **stadium**: every point within `r = H/2` of the horizontal
segment from `(r, r)` to `(W − r, r)`. `fit(p, m)`:

1. Finds the closest point on the segment, `cx = clamp(p.x, r, W − r)`.
2. If the joint is farther than `r − m` from `(cx, r)`, moves it back onto
   that distance along the same direction.
3. If the contact is on the lower half (the floor), damps its velocity: it
   keeps 75% horizontally and 60% vertically. This is what makes the figure
   settle rather than bounce forever.

The margin `m` is the head radius (`0.085·H`) for the head, so the drawn head
never pokes outside the pill, and `0.03·H` for every other joint.

## Getting up

`rise()` runs every frame while rising. It advances `riseT` by 0.016 s and
pulls each joint towards its standing position by a fraction `k` of the
remaining distance:

```
k = clamp((riseT − delay) · 0.14, 0, 0.14)
```

So `k` ramps from 0 to 0.14 over one second, starting after a per-joint delay:

| Joints | Delay |
|---|---|
| Knees, feet (7–10) | 0 s |
| Neck, hip (1, 2) | 0.4 s |
| Elbows, hands (3–6) | 0.5 s |
| Head (0) | 0.9 s |

That ordering reads as getting up: plant the feet, lift the body, then the
arms, and finally raise the head. Velocities are damped to 60% each frame so
the motion stays controlled, and gravity fades out at the same time.

It finishes when every joint is within `0.015·H` of its target after at least
1.5 s, or unconditionally after 5 s (a safety net; in practice every get-up
finishes in about 1.5 s). Then the figure goes back to idle with
`t = 0`, so the first wave comes 1.5 s later.

Touching the figure while it is rising cancels the get-up.

## Input

Handled by `RagdollController` with Pointer Events, so mouse, touch and pen
behave the same. Coordinates are in CSS pixels relative to the canvas.

| Event | Action |
|---|---|
| `pointerdown` | `grab(x, y)`: picks the joint nearest to the pointer, within `0.4·H`. If there is one, the canvas captures the pointer and the cursor becomes `grabbing`. |
| `pointermove` while dragging | `dragTo(x, y)`: the grabbed joint follows the pointer on the next step. |
| `pointermove` otherwise | `push(x, y, dx, dy)`: pushes joints near the pointer (see below). |
| `pointerup`, `pointercancel` | `release()`: the joint keeps its velocity, so the figure can be thrown. |
| `pointerleave` | Forgets the last position, so re-entering does not cause a jump. |
| window `resize` | Resizes the canvas and the model, then redraws. |

`push()` clamps the pointer movement to ±0.5·H per axis and ignores movements
under 0.02·H, so slow hovering does nothing. Joints within 0.5·H of the
pointer receive a velocity impulse of `0.22 · movement · w`, where
`w = 1 − distance/0.5H` fades to zero at the edge. In verlet terms, the impulse
is applied by moving `px, py` backwards.

On touch screens the canvas has `touch-action: none`, so dragging the figure
does not scroll the page.

## Drawing

`RagdollView.draw()` clears the canvas and draws in white with round caps and
joins, line width `0.055·H`:

- the spine (1–2),
- both arms as one polyline, hand–elbow–neck–elbow–hand (4–3–1–5–6),
- both legs as one polyline, foot–knee–hip–knee–foot (8–7–2–9–10),
- a filled circle of radius `0.085·H` for the head.

The neck bone is not drawn; the gap between the head circle and the
shoulders reads as the neck.

The canvas backing store is sized to CSS size × `devicePixelRatio` on every
resize, and the context is scaled to match, so drawing code works in CSS
pixels and stays sharp on high-DPI screens.

## Reduced motion

When the user prefers reduced motion, there is no `requestAnimationFrame`
loop:

- On start, the standing pose is drawn once. No waving or bobbing.
- Dragging runs one step per pointer event, so the figure follows the
  pointer without animating on its own.
- A push runs 60 steps at once, showing where it ends up after about a second.

## Constants

| Value | Where | Meaning |
|---|---|---|
| 0.016 | `step`, `rise` | Seconds per frame. |
| 1.5, 5, 2.8 | `pose` | First wave start, wave period, wave duration (s). |
| 0.5 | `pose` | Arm raise and lower time (s). |
| 11, 0.65 | `pose` | Forearm swing speed (rad/s) and amplitude (rad). |
| 0.995 | `step` | Velocity kept per frame (air drag). |
| 0.004·H | `step` | Gravity per frame². |
| 8 | `step` | Constraint solver passes. |
| 0.085·H, 0.03·H | `step`, `ragdollView` | Head radius / pill margin for the head; margin for other joints. |
| 0.75, 0.6 | `fit` | Velocity kept on floor contact, horizontal and vertical. |
| 0.004·H, 90 | `step` | Rest speed threshold and frames at rest before getting up. |
| 0.14, delays | `rise` | Maximum pull per frame and per-joint start delays. |
| 0.015·H, 1.5, 5 | `rise` | Done tolerance, minimum and maximum get-up time (s). |
| 0.4·H | `nearest` | Grab radius. |
| 0.5·H, 0.02·H, 0.22 | `push` | Push radius and clamp, dead zone, strength. |
| 0.055·H | `ragdollView` | Line width. |

## Tuning tips

- **Floppier or stiffer:** lower or raise the solver passes (8), or the
  stiffness of the helper bones.
- **Heavier or lighter:** raise or lower gravity (0.004·H). Raising drag
  (lowering 0.995) makes it feel like it is moving through water.
- **Bouncier landings:** raise the floor damping factors in `fit()` (0.75 and
  0.6) towards 1.
- **Gets up sooner or later:** change the frames at rest (90) or the rest
  threshold (0.004·H).
- **More or less sensitive to hovering:** change the push strength (0.22) or
  the dead zone (0.02·H).
- To check a change without the browser's timing, the model has no DOM
  access and can be stepped in Node:

  ```js
  // node -e "…" from the repository root
  global.window={};require('./js/models/ragdoll.js');
  const r=new window.CV.Ragdoll();r.resize(150,70);   // a 150×70 pill
  r.push(75,35,30,0);                                 // shove it to the right
  let f=0;while(!r.idle)r.step(),f++;                 // until it is standing again
  console.log('back on its feet after',f,'frames');
  ```
