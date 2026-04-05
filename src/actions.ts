import type { SonosDevice, SonosManager } from '@svrooij/sonos'
import { DevicePicker, GroupCoordinatorPicker, MutedPicker, VolumePicker } from './choices.js'
import type { DeviceState } from './main.js'
import type {
	CompanionActionDefinitions,
	CompanionActionEvent,
	CompanionInputFieldNumber,
	InstanceBase,
} from '@companion-module/base'

export enum PlayPauseToggle {
	Play = 'play',
	Pause = 'pause',
	Toggle = 'toggle',
}

export enum ActionId {
	PlayPause = 'play_pause',
	NextTrack = 'next_track',
	PreviousTrack = 'previous_track',
	Mute = 'mute',
	Volume = 'volume',
	VolumeDelta = 'volume_delta',
	LoadStreamUri = 'load_stream_uri',
	SelectLineIn = 'select_line_in',
	SelectQueue = 'select_queue',
	// Group management
	JoinGroup = 'join_group',
	LeaveGroup = 'leave_group',
	GroupVolume = 'group_volume',
	GroupSelectLineIn = 'group_select_line_in',
	GroupSelectQueue = 'group_select_queue',
}

function VolumeDeltaPicker(): CompanionInputFieldNumber {
	return {
		type: 'number',
		label: 'Delta',
		id: 'delta',
		default: 1,
		max: 100,
		min: -100,
	}
}

export function GetActionsList(instance: InstanceBase<any>, manager: SonosManager, state: DeviceState): CompanionActionDefinitions {
	const devices = manager.Devices

	const getDevice = (action: CompanionActionEvent): SonosDevice | undefined =>
		manager.Devices.find((d) => d.Uuid === action.options.device)

	/** Returns true if the target UUID is offline — logs a warning and should abort the action. */
	const isOffline = (uuid: string | undefined): boolean => {
		if (uuid && state.offlineDevices.has(uuid)) {
			const name = state.deviceNames.get(uuid) ?? uuid
			instance.log('warn', `Action skipped: "${name}" is offline / unavailable`)
			return true
		}
		return false
	}

	const getOptInt = (action: CompanionActionEvent, key: string): number => {
		const val = Number(action.options[key])
		if (isNaN(val)) {
			throw new Error(`Invalid option '${key}'`)
		}
		return val
	}

	const actions: CompanionActionDefinitions = {}

	actions[ActionId.PlayPause] = {
		name: 'Play/pause',
		options: [
			DevicePicker(devices, state),
			{
				type: 'dropdown',
				label: 'Mode',
				id: 'mode',
				default: PlayPauseToggle.Toggle,
				choices: [
					{ id: PlayPauseToggle.Toggle, label: 'Toggle' },
					{ id: PlayPauseToggle.Play, label: 'Play' },
					{ id: PlayPauseToggle.Pause, label: 'Pause' },
				],
			},
		],
		callback: async (action) => {
			if (isOffline(String(action.options.device))) return
			const device = getDevice(action)
			if (device) {
				switch (action.options.mode) {
					case PlayPauseToggle.Play:
						await device.Play().catch((e) => { throw new Error(`Sonos: Play failed: ${e}`) })
						break
					case PlayPauseToggle.Pause:
						await device.Pause().catch((e) => { throw new Error(`Sonos: Pause failed: ${e}`) })
						break
					default:
						await device.TogglePlayback().catch((e) => { throw new Error(`Sonos: Toggle failed: ${e}`) })
						break
				}
			}
		},
	}

	actions[ActionId.NextTrack] = {
		name: 'Next Track',
		options: [DevicePicker(devices, state)],
		callback: async (action) => {
			if (isOffline(String(action.options.device))) return
			const device = getDevice(action)
			if (device) {
				await device.Next().catch((e) => { throw new Error(`Sonos: NextTrack failed: ${e}`) })
			}
		},
	}

	actions[ActionId.PreviousTrack] = {
		name: 'Previous Track',
		options: [DevicePicker(devices, state)],
		callback: async (action) => {
			if (isOffline(String(action.options.device))) return
			const device = getDevice(action)
			if (device) {
				await device.Previous().catch((e) => { throw new Error(`Sonos: PreviousTrack failed: ${e}`) })
			}
		},
	}

	actions[ActionId.Mute] = {
		name: 'Set Muted',
		options: [DevicePicker(devices, state), MutedPicker],
		callback: async (action) => {
			if (isOffline(String(action.options.device))) return
			const device = getDevice(action)
			if (device) {
				let muted = action.options.muted === 'mute'
				if (action.options.muted === 'toggle') {
					muted = !device.Muted
				}
				await device.RenderingControlService.SetMute({
					InstanceID: 0,
					Channel: 'Master',
					DesiredMute: muted,
				}).catch((e) => { throw new Error(`Sonos: SetMute failed: ${e}`) })
			}
		},
	}

	actions[ActionId.Volume] = {
		name: 'Set Volume',
		options: [DevicePicker(devices, state), VolumePicker()],
		callback: async (action) => {
			if (isOffline(String(action.options.device))) return
			const device = getDevice(action)
			if (device) {
				await device.SetVolume(getOptInt(action, 'volume')).catch((e) => {
					throw new Error(`Sonos: SetVolume failed: ${e}`)
				})
			}
		},
	}

	actions[ActionId.VolumeDelta] = {
		name: 'Adjust Volume',
		options: [DevicePicker(devices, state), VolumeDeltaPicker()],
		callback: async (action) => {
			if (isOffline(String(action.options.device))) return
			const device = getDevice(action)
			if (device) {
				await device.SetRelativeVolume(getOptInt(action, 'delta')).catch((e) => {
					throw new Error(`Sonos: AdjustVolume failed: ${e}`)
				})
			}
		},
	}

	actions[ActionId.LoadStreamUri] = {
		name: 'Load Stream URI',
		options: [
			DevicePicker(devices, state),
			{
				type: 'textinput',
				label: 'Stream URI',
				id: 'streamUri',
				useVariables: true,
			},
			{
				type: 'static-text',
				id: 'help',
				value: '',
				label:
					'Read about the supported formats at https://sonos-ts.svrooij.io/sonos-device/methods.html#metadata\nIf your uri is not supported, you can follow their steps to figure out the data needed, and if it needs metadata provide that below',
			},
			{
				type: 'textinput',
				label: 'Manual Metadata',
				id: 'streamMetadata',
				useVariables: true,
			},
			{
				type: 'checkbox',
				label: 'Autoplay',
				id: 'autoplay',
				default: true,
			},
		],
		callback: async (action, context) => {
			if (isOffline(String(action.options.device))) return
			const streamUri = await context.parseVariablesInString(String(action.options.streamUri))
			const streamMetadata = await context.parseVariablesInString(String(action.options.streamMetadata ?? ''))
			const device = getDevice(action)
			if (device) {
				if (streamMetadata) {
					await device.AVTransportService.SetAVTransportURI({
						InstanceID: 0,
						CurrentURI: streamUri,
						CurrentURIMetaData: streamMetadata,
					})
				} else {
					await device.SetAVTransportURI(streamUri).catch((e) => {
						throw new Error(`Sonos: LoadStreamUri failed: ${e}`)
					})
				}
				if (action.options.autoplay) {
					await device.Play()
				}
			}
		},
	}

	actions[ActionId.SelectLineIn] = {
		name: 'Select Line-In Source',
		description: 'Switch speaker audio input to its Line-In (analog input)',
		options: [DevicePicker(devices, state)],
		callback: async (action) => {
			if (isOffline(String(action.options.device))) return
			const device = getDevice(action)
			if (device) {
				await device.SwitchToLineIn().catch((e) => {
					throw new Error(`Sonos: SelectLineIn failed: ${e}`)
				})
			}
		},
	}

	actions[ActionId.SelectQueue] = {
		name: 'Select Queue Source',
		description: 'Switch speaker audio source back to its local queue',
		options: [DevicePicker(devices, state)],
		callback: async (action) => {
			if (isOffline(String(action.options.device))) return
			const device = getDevice(action)
			if (device) {
				await device.SwitchToQueue().catch((e) => {
					throw new Error(`Sonos: SelectQueue failed: ${e}`)
				})
			}
		},
	}

	// ── Group management ──────────────────────────────────────────────────────

	actions[ActionId.JoinGroup] = {
		name: 'Join Group',
		description: 'Add a speaker to another speaker\'s group',
		options: [
			{ ...DevicePicker(devices, state), label: 'Speaker to add' },
			GroupCoordinatorPicker(devices, state),
		],
		callback: async (action) => {
			if (isOffline(String(action.options.device)) || isOffline(String(action.options.coordinator))) return
			const device = getDevice(action)
			const coordinator = manager.Devices.find((d) => d.Uuid === action.options.coordinator)
			if (device && coordinator) {
				await device.JoinGroup(coordinator.Name).catch((e) => {
					throw new Error(`Sonos: JoinGroup failed: ${e}`)
				})
			}
		},
	}

	actions[ActionId.LeaveGroup] = {
		name: 'Leave Group',
		description: 'Remove a speaker from its current group (goes standalone)',
		options: [DevicePicker(devices, state)],
		callback: async (action) => {
			if (isOffline(String(action.options.device))) return
			const device = getDevice(action)
			if (device) {
				await device.AVTransportService.BecomeCoordinatorOfStandaloneGroup().catch((e: unknown) => {
					throw new Error(`Sonos: LeaveGroup failed: ${e}`)
				})
			}
		},
	}

	actions[ActionId.GroupVolume] = {
		name: 'Set Group Volume',
		description: 'Set the volume for all speakers in the group (send to coordinator)',
		options: [GroupCoordinatorPicker(devices, state), VolumePicker()],
		callback: async (action) => {
			if (isOffline(String(action.options.coordinator))) return
			const coordinator = manager.Devices.find((d) => d.Uuid === action.options.coordinator)
			if (coordinator) {
				await coordinator.GroupRenderingControlService.SetGroupVolume({
					InstanceID: 0,
					DesiredVolume: getOptInt(action, 'volume'),
				}).catch((e) => {
					throw new Error(`Sonos: SetGroupVolume failed: ${e}`)
				})
			}
		},
	}

	actions[ActionId.GroupSelectLineIn] = {
		name: 'Group: Select Line-In Source',
		description: 'Switch the entire group to the coordinator\'s Line-In input',
		options: [GroupCoordinatorPicker(devices, state)],
		callback: async (action) => {
			if (isOffline(String(action.options.coordinator))) return
			const coordinator = manager.Devices.find((d) => d.Uuid === action.options.coordinator)
			if (coordinator) {
				await coordinator.SwitchToLineIn().catch((e) => {
					throw new Error(`Sonos: Group SelectLineIn failed: ${e}`)
				})
			}
		},
	}

	actions[ActionId.GroupSelectQueue] = {
		name: 'Group: Select Queue Source',
		description: 'Switch the entire group back to the coordinator\'s local queue',
		options: [GroupCoordinatorPicker(devices, state)],
		callback: async (action) => {
			if (isOffline(String(action.options.coordinator))) return
			const coordinator = manager.Devices.find((d) => d.Uuid === action.options.coordinator)
			if (coordinator) {
				await coordinator.SwitchToQueue().catch((e) => {
					throw new Error(`Sonos: Group SelectQueue failed: ${e}`)
				})
			}
		},
	}

	return actions
}

