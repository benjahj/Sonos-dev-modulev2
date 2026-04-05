import { SonosManager } from '@svrooij/sonos'
import { DeviceConfig } from './config.js'
import type { DeviceState } from './main.js'
import { CompanionVariableDefinition, CompanionVariableValues, InstanceBase } from '@companion-module/base'

/**
 * Determine a friendly source name from a Sonos track URI.
 *
 * URI prefixes:
 *   x-rincon-stream:  => Line-In
 *   x-sonos-htastream: => TV / HDMI
 *   x-rincon-queue:   => Queue
 *   x-rincon:         => Group (following another coordinator)
 *   x-sonosapi-stream / x-sonosapi-radio / aac: / hls-radio: => Radio / Stream
 *   (blank / undefined) => Unknown
 */
export function sourceFromUri(uri: string | undefined): string {
	if (!uri) return 'unknown'
	if (uri.startsWith('x-rincon-stream:')) return 'line-in'
	if (uri.startsWith('x-sonos-htastream:')) return 'tv'
	if (uri.startsWith('x-rincon-queue:')) return 'queue'
	if (uri.startsWith('x-rincon:')) return 'group'
	if (
		uri.startsWith('x-sonosapi-stream:') ||
		uri.startsWith('x-sonosapi-radio:') ||
		uri.startsWith('aac:') ||
		uri.startsWith('hls-radio:') ||
		uri.startsWith('x-rincon-mp3radio:')
	) {
		return 'radio'
	}
	if (uri.startsWith('x-file-cifs:') || uri.startsWith('x-sonos-spotify:') || uri.startsWith('spotify:')) {
		return 'stream'
	}
	return 'stream'
}

export function updateVariables(instance: InstanceBase<DeviceConfig>, manager: SonosManager, state: DeviceState): void {
	function numToString(val: number | undefined): string {
		return val === undefined ? '-' : `${val}%`
	}

	const newValues: CompanionVariableValues = {}

	manager.Devices.forEach((dev) => {
		const offline = state.offlineDevices.has(dev.Uuid)
		const cachedName = state.deviceNames.get(dev.Uuid) ?? dev.Name

		const transportState = dev.CurrentTransportState
		const isActive =
			!offline && (transportState === 'PLAYING' || transportState === 'TRANSITIONING')
		// A coordinator is a device that has at least one other device following it
		const isCoordinator = !offline && manager.Devices.some(
			(d) => d.Uuid !== dev.Uuid && d.CurrentTrackUri?.includes(dev.Uuid),
		)

		newValues[`device.${dev.Uuid}.name`] = offline ? `${cachedName}/offline` : cachedName
		newValues[`device.${dev.Uuid}.group`] = dev.GroupName || ''
		newValues[`device.${dev.Uuid}.volume`] = offline ? '-' : numToString(dev.Volume)
		newValues[`device.${dev.Uuid}.streamUri`] = dev.CurrentTrackUri ?? ''
		newValues[`device.${dev.Uuid}.source`] = offline ? 'unknown' : sourceFromUri(dev.CurrentTrackUri)
		newValues[`device.${dev.Uuid}.status`] = offline ? 'offline' : (isActive ? 'active' : 'inactive')
		newValues[`device.${dev.Uuid}.transportState`] = offline ? 'STOPPED' : (transportState ?? 'STOPPED')
		newValues[`device.${dev.Uuid}.isCoordinator`] = isCoordinator ? 'true' : 'false'
	})

	instance.setVariableValues(newValues)
}

export function InitVariables(instance: InstanceBase<DeviceConfig>, manager: SonosManager, state: DeviceState): void {
	const variables: CompanionVariableDefinition[] = []

	manager.Devices.forEach((dev) => {
		const cachedName = state.deviceNames.get(dev.Uuid) ?? dev.Name
		variables.push({
			name: `Device Name (${cachedName})`,
			variableId: `device.${dev.Uuid}.name`,
		})
		variables.push({
			name: `Device Group (${cachedName})`,
			variableId: `device.${dev.Uuid}.group`,
		})
		variables.push({
			name: `Device Volume (${cachedName})`,
			variableId: `device.${dev.Uuid}.volume`,
		})
		variables.push({
			name: `Device Stream URI (${cachedName})`,
			variableId: `device.${dev.Uuid}.streamUri`,
		})
		variables.push({
			name: `Device Source (${cachedName}) - line-in, tv, queue, radio, stream, group, unknown`,
			variableId: `device.${dev.Uuid}.source`,
		})
		variables.push({
			name: `Device Status (${cachedName}) - active, inactive, or offline`,
			variableId: `device.${dev.Uuid}.status`,
		})
		variables.push({
			name: `Device Transport State (${cachedName}) - PLAYING, PAUSED_PLAYBACK, STOPPED, TRANSITIONING`,
			variableId: `device.${dev.Uuid}.transportState`,
		})
		variables.push({
			name: `Device Is Coordinator (${cachedName}) - true if leading a group`,
			variableId: `device.${dev.Uuid}.isCoordinator`,
		})
	})

	instance.setVariableDefinitions(variables)
	updateVariables(instance, manager, state)
}

