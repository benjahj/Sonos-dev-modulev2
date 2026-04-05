import type { SonosDevice, SonosManager } from '@svrooij/sonos'
import { ActionId, PlayPauseToggle } from './actions.js'
import { FeedbackId, VolumeComparitor } from './feedback.js'
import { deviceLabel } from './choices.js'
import type { DeviceState } from './main.js'
import {
	combineRgb,
	type CompanionPresetDefinitions,
	type CompanionButtonPresetDefinition,
} from '@companion-module/base'

function VolumeDelta(
	device: SonosDevice,
	displayName: string,
	actionId: ActionId,
	volumeFeedback: FeedbackId,
	delta: number,
): CompanionButtonPresetDefinition {
	const deltaStr = delta > 0 ? `+${delta}` : `${delta}`
	return {
		category: 'Volume',
		name: `${displayName} Volume ${deltaStr}%`,
		type: 'button',
		style: {
			text: `${displayName}\\n${deltaStr}%`,
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		feedbacks: [
			{
				feedbackId: volumeFeedback,
				style: {
					bgcolor: combineRgb(238, 238, 0),
					color: combineRgb(0, 0, 0),
				},
				options: {
					device: device.Uuid,
					volume: delta > 0 ? 100 : 0,
					comparitor: VolumeComparitor.Equal,
				},
			},
		],
		steps: [
			{
				down: [{ actionId, options: { device: device.Uuid, delta } }],
				up: [],
			},
		],
	}
}

export function GetPresetsList(manager: SonosManager, state: DeviceState): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

	manager.Devices.forEach((device) => {
		const name = deviceLabel(device, state)
		// --- Volume presets ---
		presets[`volume_100_${device.Uuid}`] = {
			category: 'Volume',
			name: `${name} Volume 100%`,
			type: 'button',
			style: {
				text: `${name}\\n100%`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [],
			steps: [
				{
					down: [{ actionId: ActionId.Volume, options: { device: device.Uuid, volume: 100 } }],
					up: [],
				},
			],
		}
		presets[`volume_+5_${device.Uuid}`] = VolumeDelta(device, name, ActionId.VolumeDelta, FeedbackId.Volume, +5)
		presets[`volume_+1_${device.Uuid}`] = VolumeDelta(device, name, ActionId.VolumeDelta, FeedbackId.Volume, +1)
		presets[`volume_-5_${device.Uuid}`] = VolumeDelta(device, name, ActionId.VolumeDelta, FeedbackId.Volume, -5)
		presets[`volume_-1_${device.Uuid}`] = VolumeDelta(device, name, ActionId.VolumeDelta, FeedbackId.Volume, -1)

		// --- Mute preset ---
		presets[`mute_${device.Uuid}`] = {
			category: 'Volume',
			name: `${name} Mute`,
			type: 'button',
			style: {
				text: `${name}\\nMute`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.Mute,
					style: { color: combineRgb(255, 255, 255), bgcolor: combineRgb(255, 0, 0) },
					options: { device: device.Uuid },
				},
			],
			steps: [
				{
					down: [{ actionId: ActionId.Mute, options: { device: device.Uuid, muted: 'toggle' } }],
					up: [],
				},
			],
		}

		// --- Play/Pause preset ---
		presets[`play_pause_${device.Uuid}`] = {
			category: 'Playback',
			name: `${name} Play/Pause`,
			type: 'button',
			style: {
				text: `${name}\\nP/P`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.Playing,
					style: { bgcolor: combineRgb(0, 255, 0), color: combineRgb(0, 0, 0) },
					options: { device: device.Uuid },
				},
				{
					feedbackId: FeedbackId.Paused,
					style: { bgcolor: combineRgb(255, 255, 0), color: combineRgb(0, 0, 0) },
					options: { device: device.Uuid },
				},
				{
					feedbackId: FeedbackId.Stopped,
					style: { bgcolor: combineRgb(255, 0, 0), color: combineRgb(255, 255, 255) },
					options: { device: device.Uuid },
				},
			],
			steps: [
				{
					down: [{ actionId: ActionId.PlayPause, options: { device: device.Uuid, mode: PlayPauseToggle.Toggle } }],
					up: [],
				},
			],
		}

		// --- Line-In source preset ---
		presets[`line_in_${device.Uuid}`] = {
			category: 'Source',
			name: `${name} Line-In`,
			type: 'button',
			style: {
				text: `${name}\\nLine-In`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.SourceIsLineIn,
					style: { bgcolor: combineRgb(255, 165, 0), color: combineRgb(0, 0, 0) },
					options: { device: device.Uuid },
				},
			],
			steps: [
				{
					down: [{ actionId: ActionId.SelectLineIn, options: { device: device.Uuid } }],
					up: [],
				},
			],
		}

		// --- Queue source preset ---
		presets[`queue_${device.Uuid}`] = {
			category: 'Source',
			name: `${name} Queue`,
			type: 'button',
			style: {
				text: `${name}\\nQueue`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.SourceIsQueue,
					style: { bgcolor: combineRgb(0, 255, 150), color: combineRgb(0, 0, 0) },
					options: { device: device.Uuid },
				},
			],
			steps: [
				{
					down: [{ actionId: ActionId.SelectQueue, options: { device: device.Uuid } }],
					up: [],
				},
			],
		}

		// --- Leave group preset ---
		presets[`leave_group_${device.Uuid}`] = {
			category: 'Groups',
			name: `${name} Leave Group`,
			type: 'button',
			style: {
				text: `${name}\\nLeave Group`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.InGroup,
					style: { bgcolor: combineRgb(80, 80, 200), color: combineRgb(255, 255, 255) },
					options: { device: device.Uuid },
				},
			],
			steps: [
				{
					down: [{ actionId: ActionId.LeaveGroup, options: { device: device.Uuid } }],
					up: [],
				},
			],
		}

		// --- Group Line-In preset (coordinator button) ---
		presets[`group_line_in_${device.Uuid}`] = {
			category: 'Groups',
			name: `${name} Group Line-In`,
			type: 'button',
			style: {
				text: `${name}\\nGroup\\nLine-In`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			feedbacks: [
				{
					feedbackId: FeedbackId.IsGroupCoordinator,
					style: { bgcolor: combineRgb(0, 200, 200), color: combineRgb(0, 0, 0) },
					options: { device: device.Uuid },
				},
			],
			steps: [
				{
					down: [{ actionId: ActionId.GroupSelectLineIn, options: { coordinator: device.Uuid } }],
					up: [],
				},
			],
		}
	})

	// --- Join group presets: one button per speaker pair ---
	manager.Devices.forEach((joiner) => {
		const joinerName = deviceLabel(joiner, state)
		manager.Devices.forEach((coordinator) => {
			if (joiner.Uuid === coordinator.Uuid) return
			const coordName = deviceLabel(coordinator, state)
			presets[`join_${joiner.Uuid}_to_${coordinator.Uuid}`] = {
				category: 'Groups',
				name: `${joinerName} → join ${coordName}`,
				type: 'button',
				style: {
					text: `${joinerName}\\n→ ${coordName}`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(30, 30, 80),
				},
				feedbacks: [],
				steps: [
					{
						down: [
							{
								actionId: ActionId.JoinGroup,
								options: { device: joiner.Uuid, coordinator: coordinator.Uuid },
							},
						],
						up: [],
					},
				],
			}
		})
	})

	return presets
}

