## Sonos Speakers

Control individual Sonos speakers and speaker groups from Bitfocus Companion. Supports playback control, volume management, audio source switching, group management, and real-time status feedback for all auto-discovered devices on your network.

---

### Setup

1. In Companion, add a new connection and choose **Sonos** as the manufacturer.
2. In the **Discovery IP** field, enter the IP address of **any one** Sonos speaker on your network.
3. The module auto-discovers all other Sonos speakers on the same subnet.
4. Once connected, all speakers appear in the device dropdowns for actions, feedbacks, and variables.

> **Tip:** Assign a static/reserved IP to the discovery speaker in your router so the connection remains stable across reboots.

---

### Actions

#### Playback

**Play/Pause**
Controls playback on a selected speaker.
- **Device** — the target speaker
- **Mode** — `Toggle` (default), `Play`, or `Pause`

**Next Track**
Skips to the next track in the queue on a selected speaker.
- **Device** — the target speaker

**Previous Track**
Goes back to the previous track in the queue on a selected speaker.
- **Device** — the target speaker

---

#### Volume

**Set Volume**
Sets the volume of a speaker to an exact level.
- **Device** — the target speaker
- **Volume** — integer from `0` to `100`

**Adjust Volume**
Increases or decreases the volume of a speaker by a relative step.
- **Device** — the target speaker
- **Delta** — integer from `-100` to `+100`. Positive values raise volume, negative values lower it. Default: `1`

**Set Muted**
Controls the mute state of a speaker.
- **Device** — the target speaker
- **Muted** — `Toggle` (default), `Mute`, or `Unmute`

---

#### Source

**Load Stream URI**
Loads a stream URI onto a speaker and optionally starts playback immediately. Supports Companion variables in both URI and metadata fields.
- **Device** — the target speaker
- **Stream URI** — the URI to load. Supports Companion variables. See [supported URI formats](https://sonos-ts.svrooij.io/sonos-device/methods.html#metadata)
- **Manual Metadata** — *(optional)* raw DIDL-Lite XML metadata. Required for some URI types that the library cannot auto-generate metadata for. Supports Companion variables.
- **Autoplay** — if checked *(default: on)*, playback starts immediately after loading the URI

> If **Manual Metadata** is provided, the URI and metadata are passed directly to `AVTransportService.SetAVTransportURI`. If left empty, the library handles metadata generation automatically.

**Select Line-In Source**
Switches a speaker's audio input to its physical Line-In (analog) connector.
- **Device** — the target speaker

> Only works on speakers with a physical Line-In port (e.g. Play:5, Amp, Era 100/300).

**Select Queue Source**
Switches a speaker back to playing from its local Sonos queue.
- **Device** — the target speaker

---

#### Group Management

**Join Group**
Adds a speaker to another speaker's group. The joining speaker starts following the coordinator and plays the same audio.
- **Speaker to add** — the speaker that will join
- **Group / Coordinator** — the speaker whose group to join

**Leave Group**
Removes a speaker from its current group. The speaker becomes standalone and stops following any coordinator.
- **Device** — the speaker to remove from its group

**Set Group Volume**
Sets the volume of all speakers in a group simultaneously by sending the command to the coordinator.
- **Group / Coordinator** — the group coordinator
- **Volume** — integer from `0` to `100`

**Group: Select Line-In Source**
Switches the entire group to the coordinator's Line-In input.
- **Group / Coordinator** — the group coordinator

**Group: Select Queue Source**
Switches the entire group back to the coordinator's local queue.
- **Group / Coordinator** — the group coordinator

---

### Variables

Eight variables are exposed per discovered speaker. Replace `<UUID>` with the speaker's Sonos UUID (visible in the Variables tab in Companion after connection).

| Variable ID | Description | Example value |
|---|---|---|
| `device.<UUID>.name` | Speaker friendly name | `Living Room` |
| `device.<UUID>.group` | Name of the group this speaker belongs to | `Living Room` |
| `device.<UUID>.volume` | Current volume level | `50%` or `-` if unknown |
| `device.<UUID>.streamUri` | Raw current track or stream URI | `x-rincon-queue:RINCON_...` |
| `device.<UUID>.source` | Resolved source type (see Source Types below) | `queue` |
| `device.<UUID>.status` | Playback activity | `active` or `inactive` |
| `device.<UUID>.transportState` | Raw Sonos transport state | `PLAYING`, `PAUSED_PLAYBACK`, `STOPPED`, `TRANSITIONING` |
| `device.<UUID>.isCoordinator` | Whether this speaker is leading a group | `true` or `false` |

> `status` is `active` when `transportState` is `PLAYING` or `TRANSITIONING`, and `inactive` for all other states.

---

### Feedbacks

All feedbacks are **boolean** type — when the condition is true, the configured style override is applied to the button.

#### Playback State

**Device playing** *(playing)*
True when the transport state is `PLAYING` or `TRANSITIONING`.
Default style: black text · green background.

**Device paused** *(paused)*
True when the transport state is `PAUSED_PLAYBACK`.
Default style: black text · yellow background.

**Device stopped** *(stopped)*
True when the transport state is `STOPPED`.
Default style: white text · red background.

**Device active (playing or transitioning)** *(active)*
True when the transport state is `PLAYING` or `TRANSITIONING`. Same condition as *Device playing* but with a distinct default colour — useful as a combined "is outputting audio" indicator.
Default style: black text · cyan background.

---

#### Volume & Mute

**Device muted** *(mute)*
True when the speaker's mute state is on.
Default style: white text · red background.

**Device volume** *(volume)*
True when the speaker's current volume satisfies the configured condition.
- **Comparitor** — `Equal`, `Greater than`, or `Less than`
- **Volume** — target volume value (`0`–`100`)

Default style: white text · red background.

---

#### Source

**Source is Line-In** *(source_is_line_in)*
True when the speaker's current track URI starts with `x-rincon-stream:` (physical Line-In input).
Default style: black text · orange background.

**Source is Queue** *(source_is_queue)*
True when the speaker's current track URI starts with `x-rincon-queue:` (local Sonos queue).
Default style: black text · green background.

**Source type matches** *(source_matches)*
True when the resolved source type matches the selected option.
- **Source** dropdown options: `Line-In`, `Queue`, `Radio / Stream`, `Group (following coordinator)`, `Music stream (Spotify etc.)`, `Unknown`

Default style: black text · amber background.

---

#### Groups

**Speaker is in a group** *(in_group)*
True when the speaker is following another coordinator. Detected by the track URI starting with `x-rincon:`.
Default style: white text · blue background.

**Speaker is group coordinator** *(is_group_coordinator)*
True when at least one other discovered speaker has a track URI that contains this speaker's UUID (i.e. is following it).
Default style: black text · teal background.

---

### Presets

Ready-made button presets are generated automatically for every discovered speaker. Find them in the **Presets** panel in Companion.

| Category | Preset name | Action on press | Feedback |
|---|---|---|---|
| Playback | `<Speaker> Play/Pause` | Toggle play/pause | Green = playing/transitioning · Yellow = paused · Red = stopped |
| Volume | `<Speaker> Volume 100%` | Set volume to 100 | — |
| Volume | `<Speaker> Volume +5%` | Raise volume by 5 | Yellow when volume is already at 100 |
| Volume | `<Speaker> Volume +1%` | Raise volume by 1 | Yellow when volume is already at 100 |
| Volume | `<Speaker> Volume -5%` | Lower volume by 5 | Yellow when volume is already at 0 |
| Volume | `<Speaker> Volume -1%` | Lower volume by 1 | Yellow when volume is already at 0 |
| Volume | `<Speaker> Mute` | Toggle mute | Red when muted |
| Source | `<Speaker> Line-In` | Switch to Line-In | Orange when Line-In is active |
| Source | `<Speaker> Queue` | Switch to Queue | Green when Queue is active |
| Groups | `<Speaker> Leave Group` | Leave current group | Blue when speaker is in a group |
| Groups | `<Speaker> Group Line-In` | Group: switch all to Line-In | Teal when speaker is the coordinator |
| Groups | `<Speaker A> → join <Speaker B>` | Add A to B's group | — |

> **Join Group** presets are generated for every unique speaker pair. With 3 speakers there will be 6 join presets (A→B, A→C, B→A, B→C, C→A, C→B).

---

### Source Types Reference

The module resolves the raw Sonos track URI into a human-readable source type used in variables and feedbacks.

| Source value | Meaning | Matching URI prefix(es) |
|---|---|---|
| `line-in` | Analog Line-In input | `x-rincon-stream:` |
| `tv` | TV / HDMI ARC input | `x-sonos-htastream:` |
| `queue` | Local Sonos queue | `x-rincon-queue:` |
| `group` | Following another coordinator | `x-rincon:` |
| `radio` | Internet radio / HLS audio stream | `x-sonosapi-stream:`, `x-sonosapi-radio:`, `aac:`, `hls-radio:`, `x-rincon-mp3radio:` |
| `stream` | Music service or local file (Spotify, CIFS, etc.) | `x-sonos-spotify:`, `spotify:`, `x-file-cifs:`, or any other unrecognised URI |
| `unknown` | Nothing playing / URI is empty | *(empty or undefined)* |

> The `tv` source type is not exposed as its own dedicated feedback. Use the **Source type matches** feedback and select `Radio / Stream`, or read the `device.<UUID>.source` variable directly to detect it.

---

### Notes

- **Auto-discovery:** The module uses UPnP/SSDP via the `@svrooij/sonos` library. Only a single discovery IP is needed — all speakers on the same subnet are found automatically.
- **Real-time updates:** Variables and feedbacks are updated immediately via Sonos event subscriptions. No polling occurs.
- **Group coordinator picker:** The **Group / Coordinator** dropdown in group actions lists all discovered speakers. Always select the speaker that is currently acting as the group coordinator (the one other speakers are following).
- **Stable UUIDs:** Sonos speaker UUIDs do not change across reboots or firmware updates. They are safe to use in variable references.
- **Line-In availability:** The *Select Line-In* and *Group: Select Line-In* actions only succeed on speakers that have a physical Line-In port. Sending the command to an incompatible model will result in an error logged by Companion.


