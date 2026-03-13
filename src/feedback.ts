import type { SonosDevice, SonosManager } from '@svrooij/sonos'
import { DevicePicker, VolumePicker } from './choices.js'
import { sourceFromUri } from './variables.js'
import {
	combineRgb,
	type CompanionFeedbackBooleanEvent,
	type CompanionFeedbackDefinitions,
	type CompanionInputFieldDropdown,
	type InputValue,
} from '@companion-module/base'

export enum FeedbackId {
	Playing = 'playing',
	Paused = 'paused',
	Stopped = 'stopped',
	Volume = 'volume',
	Mute = 'mute',
	Active = 'active',
	SourceIsLineIn = 'source_is_line_in',
	SourceIsQueue = 'source_is_queue',
	SourceMatches = 'source_matches',
	InGroup = 'in_group',
	IsGroupCoordinator = 'is_group_coordinator',
}

export enum VolumeComparitor {
	Equal = 'eq',
	LessThan = 'lt',
	GreaterThan = 'gt',
}

function VolumeComparitorPicker(): CompanionInputFieldDropdown {
	const options = [
		{ id: VolumeComparitor.Equal, label: 'Equal' },
		{ id: VolumeComparitor.GreaterThan, label: 'Greater than' },
		{ id: VolumeComparitor.LessThan, label: 'Less than' },
	]
	return {
		type: 'dropdown',
		label: 'Comparitor',
		id: 'comparitor',
		default: VolumeComparitor.Equal,
		choices: options,
	}
}

export function GetFeedbacksList(manager: SonosManager): CompanionFeedbackDefinitions {
	const feedbacks: CompanionFeedbackDefinitions = {}
	const devices = manager.Devices

	const getDevice = (event: CompanionFeedbackBooleanEvent): SonosDevice | undefined =>
		manager.Devices.find((d) => d.Uuid === event.options.device)

	feedbacks[FeedbackId.Playing] = {
		name: 'Device playing',
		type: 'boolean',
		description: 'If the device is playing, change colors of the bank',
		options: [DevicePicker(devices)],
		defaultStyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 255, 0),
		},
		callback: (event) => {
			const device = getDevice(event)
			return device?.CurrentTransportState === 'PLAYING' || device?.CurrentTransportState === 'TRANSITIONING'
		},
	}

	feedbacks[FeedbackId.Paused] = {
		name: 'Device paused',
		type: 'boolean',
		description: 'If the device is paused, change colors of the bank',
		options: [DevicePicker(devices)],
		defaultStyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(255, 255, 0),
		},
		callback: (event) => {
			const device = getDevice(event)
			return device?.CurrentTransportState === 'PAUSED_PLAYBACK'
		},
	}

	feedbacks[FeedbackId.Stopped] = {
		name: 'Device stopped',
		type: 'boolean',
		description: 'If the device is stopped, change colors of the bank',
		options: [DevicePicker(devices)],
		defaultStyle: {
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		callback: (event) => {
			const device = getDevice(event)
			return device?.CurrentTransportState === 'STOPPED'
		},
	}

	feedbacks[FeedbackId.Mute] = {
		name: 'Device muted',
		type: 'boolean',
		description: 'If the device is muted, change style of the bank',
		options: [DevicePicker(devices)],
		defaultStyle: {
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		callback: (event) => {
			const device = getDevice(event)
			return !!device?.Muted
		},
	}

	feedbacks[FeedbackId.Volume] = {
		name: 'Device volume',
		type: 'boolean',
		description: 'If the device volume matches, change colors of the bank',
		options: [DevicePicker(devices), VolumeComparitorPicker(), VolumePicker()],
		defaultStyle: {
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		callback: (event) => {
			const device = getDevice(event)
			return (
				device?.Volume !== undefined && compareVolume(event.options.volume, event.options.comparitor, device.Volume)
			)
		},
	}

	feedbacks[FeedbackId.Active] = {
		name: 'Device active (playing or transitioning)',
		type: 'boolean',
		description: 'True when the speaker is actively playing or transitioning',
		options: [DevicePicker(devices)],
		defaultStyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 200, 255),
		},
		callback: (event) => {
			const device = getDevice(event)
			return device?.CurrentTransportState === 'PLAYING' || device?.CurrentTransportState === 'TRANSITIONING'
		},
	}

	feedbacks[FeedbackId.SourceIsLineIn] = {
		name: 'Source is Line-In',
		type: 'boolean',
		description: 'True when the speaker is playing from its Line-In input',
		options: [DevicePicker(devices)],
		defaultStyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(255, 165, 0),
		},
		callback: (event) => {
			const device = getDevice(event)
			return sourceFromUri(device?.CurrentTrackUri) === 'line-in'
		},
	}

	feedbacks[FeedbackId.SourceIsQueue] = {
		name: 'Source is Queue',
		type: 'boolean',
		description: 'True when the speaker is playing from its local queue',
		options: [DevicePicker(devices)],
		defaultStyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 255, 150),
		},
		callback: (event) => {
			const device = getDevice(event)
			return sourceFromUri(device?.CurrentTrackUri) === 'queue'
		},
	}

	feedbacks[FeedbackId.SourceMatches] = {
		name: 'Source type matches',
		type: 'boolean',
		description: 'True when the current source type matches the selected option',
		options: [
			DevicePicker(devices),
			{
				type: 'dropdown',
				label: 'Source',
				id: 'source',
				default: 'line-in',
				choices: [
					{ id: 'line-in', label: 'Line-In' },
					{ id: 'queue', label: 'Queue' },
					{ id: 'radio', label: 'Radio / Stream' },
					{ id: 'group', label: 'Group (following coordinator)' },
					{ id: 'stream', label: 'Music stream (Spotify etc.)' },
					{ id: 'unknown', label: 'Unknown' },
				],
			},
		],
		defaultStyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(255, 200, 0),
		},
		callback: (event) => {
			const device = getDevice(event)
			return sourceFromUri(device?.CurrentTrackUri) === event.options.source
		},
	}

	feedbacks[FeedbackId.InGroup] = {
		name: 'Speaker is in a group',
		type: 'boolean',
		description: 'True when the speaker is following another coordinator (member of a group)',
		options: [DevicePicker(devices)],
		defaultStyle: {
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(80, 80, 200),
		},
		callback: (event) => {
			const device = getDevice(event)
			return sourceFromUri(device?.CurrentTrackUri) === 'group'
		},
	}

	feedbacks[FeedbackId.IsGroupCoordinator] = {
		name: 'Speaker is group coordinator',
		type: 'boolean',
		description: 'True when the speaker is leading a group (other speakers are following it)',
		options: [DevicePicker(devices)],
		defaultStyle: {
			color: combineRgb(0, 0, 0),
			bgcolor: combineRgb(0, 200, 200),
		},
		callback: (event) => {
			const device = getDevice(event)
			if (!device) return false
			// A coordinator has at least one OTHER device following its UUID
			const myUuid = device.Uuid
			return manager.Devices.some(
				(d) => d.Uuid !== myUuid && d.CurrentTrackUri?.includes(myUuid),
			)
		},
	}

	return feedbacks
}

function compareVolume(
	target: InputValue | undefined,
	comparitor: InputValue | undefined,
	currentValue: number,
): boolean {
	const targetVolume = Number(target)
	if (isNaN(targetVolume)) return false

	switch (comparitor) {
		case VolumeComparitor.GreaterThan:
			return currentValue > targetVolume
		case VolumeComparitor.LessThan:
			return currentValue < targetVolume
		default:
			return currentValue === targetVolume
	}
}

