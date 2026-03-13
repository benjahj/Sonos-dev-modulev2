# companion-module-sonos-speakers

Bitfocus Companion module for controlling Sonos speakers and speaker groups.

## Features

- Playback control — play, pause, toggle, next/previous track
- Volume control — set exact level or adjust by step, mute/unmute
- Audio source switching — Line-In, Queue, Stream URI
- Group management — join/leave groups, set group volume, switch group source
- Real-time feedback — button colours update instantly via Sonos event subscriptions
- Variables — expose per-speaker state (volume, source, transport state, group, etc.) for use anywhere in Companion

## Supported Hardware

Sonos Play:1, Play:3, Play:5, One, One SL, Arc, Beam, Move, Roam, Era 100, Era 300, Amp, Port, and any other network-connected Sonos device.

## Setup

1. In Companion, add a new connection and select **Sonos** as the manufacturer.
2. Enter the **IP address** of any one Sonos speaker on your network.
3. The module auto-discovers all other speakers on the same subnet.

> Assign a static/reserved IP to the discovery speaker in your router to keep the connection stable across reboots.

## Actions

| Action | Description |
|---|---|
| Play/Pause | Play, pause, or toggle playback |
| Next Track | Skip to next track |
| Previous Track | Go to previous track |
| Set Volume | Set exact volume (0–100) |
| Adjust Volume | Raise or lower volume by a step (-100 to +100) |
| Set Muted | Mute, unmute, or toggle |
| Load Stream URI | Load and optionally autoplay a stream URI |
| Select Line-In Source | Switch speaker to its analog Line-In input |
| Select Queue Source | Switch speaker back to its local queue |
| Join Group | Add a speaker to another speaker's group |
| Leave Group | Remove a speaker from its group (goes standalone) |
| Set Group Volume | Set volume for all speakers in a group |
| Group: Select Line-In | Switch entire group to coordinator's Line-In |
| Group: Select Queue | Switch entire group to coordinator's queue |

## Feedbacks

| Feedback | Trigger |
|---|---|
| Device playing | Transport state is `PLAYING` or `TRANSITIONING` |
| Device paused | Transport state is `PAUSED_PLAYBACK` |
| Device stopped | Transport state is `STOPPED` |
| Device active | Transport state is `PLAYING` or `TRANSITIONING` |
| Device muted | Mute state is on |
| Device volume | Volume matches condition (equal / greater than / less than) |
| Source is Line-In | Current source is Line-In input |
| Source is Queue | Current source is local queue |
| Source type matches | Current source matches selected type |
| Speaker is in a group | Speaker is following a coordinator |
| Speaker is group coordinator | Speaker is leading a group |

## Variables

Per-speaker variables (replace `<UUID>` with the speaker's Sonos UUID):

| Variable | Description |
|---|---|
| `device.<UUID>.name` | Speaker name |
| `device.<UUID>.group` | Group name |
| `device.<UUID>.volume` | Current volume (e.g. `50%`) |
| `device.<UUID>.streamUri` | Raw current track URI |
| `device.<UUID>.source` | Source type: `line-in`, `tv`, `queue`, `radio`, `stream`, `group`, `unknown` |
| `device.<UUID>.status` | `active` or `inactive` |
| `device.<UUID>.transportState` | `PLAYING`, `PAUSED_PLAYBACK`, `STOPPED`, `TRANSITIONING` |
| `device.<UUID>.isCoordinator` | `true` if leading a group |

## Presets

Ready-made button presets are generated automatically for every discovered speaker, covering playback, volume, mute, source selection, and group management.

## Development

```bash
# Install dependencies
yarn install

# Build (TypeScript → dist/)
yarn build

# Watch mode
yarn dev
```

## License

MIT — © Benjamin Hald

