## Sonos Speakers

Control individual Sonos speakers and groups — set volume, switch audio sources (Line-In, TV/HDMI, Queue), manage speaker groups, and monitor playback status in real-time.

### Setup

1. Add a new connection and choose **Sonos** as the manufacturer.
2. Enter the **IP address** of any one Sonos speaker in your network. The module will auto-discover all other speakers.

### Actions

#### Playback
- **Play/Pause** — Play, pause, or toggle playback on a speaker
- **Next Track** — Skip to the next track
- **Previous Track** — Go back to the previous track

#### Volume
- **Set Volume** — Set an exact volume level (0–100) for a specific speaker
- **Adjust Volume** — Increase or decrease volume by a configurable step
- **Set Muted** — Mute, unmute, or toggle mute on a speaker

#### Source
- **Load Stream URI** — Load and optionally autoplay a stream URI (supports Spotify, radio, HTTP streams, etc.)
- **Select Line-In Source** — Switch a speaker to its Line-In (analog) audio input
- **Select Queue Source** — Switch a speaker back to its local playback queue

#### Group Management
- **Join Group** — Add a speaker to another speaker's group
- **Leave Group** — Remove a speaker from its current group (returns to standalone)
- **Set Group Volume** — Set the volume for all speakers in a group (sent to the coordinator)
- **Group: Select Line-In Source** — Switch the entire group to the coordinator's Line-In input
- **Group: Select Queue Source** — Switch the entire group back to the coordinator's local queue

### Variables

Each discovered speaker exposes the following variables (replace `<UUID>` with the speaker's UUID):

| Variable | Description |
|---|---|
| `device.<UUID>.name` | Speaker friendly name |
| `device.<UUID>.group` | Group name the speaker belongs to |
| `device.<UUID>.volume` | Current volume (e.g. `50%`) |
| `device.<UUID>.streamUri` | Current track/stream URI |
| `device.<UUID>.source` | Current source: `line-in`, `tv`, `queue`, `radio`, `stream`, `group`, or `unknown` |
| `device.<UUID>.status` | `active` when playing or transitioning, otherwise `inactive` |
| `device.<UUID>.transportState` | Raw transport state: `PLAYING`, `PAUSED_PLAYBACK`, `STOPPED`, or `TRANSITIONING` |
| `device.<UUID>.isCoordinator` | `true` if this speaker is leading a group, otherwise `false` |

### Feedbacks

#### Playback State
- **Device playing** — Lights up (green) when the speaker is in `PLAYING` or `TRANSITIONING` state
- **Device paused** — Lights up (yellow) when the speaker is in `PAUSED_PLAYBACK` state
- **Device stopped** — Lights up (red) when the speaker is in `STOPPED` state
- **Device active (playing or transitioning)** — Lights up (cyan) when the speaker is actively outputting audio

#### Volume & Mute
- **Device volume** — Changes style when the speaker volume matches a condition (equal to, greater than, or less than a target value)
- **Device muted** — Lights up (red) when the speaker is muted

#### Source
- **Source is Line-In** — Lights up (orange) when the speaker is using its Line-In input
- **Source is Queue** — Lights up (green) when the speaker is playing from its local queue
- **Source type matches** — Lights up when the current source matches the selected type (`line-in`, `queue`, `radio`, `stream`, `group`, or `unknown`)

#### Groups
- **Speaker is in a group** — Lights up (blue) when the speaker is following another coordinator
- **Speaker is group coordinator** — Lights up (teal) when the speaker is leading a group

