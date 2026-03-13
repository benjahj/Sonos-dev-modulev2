import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface DeviceConfig {
	host?: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Discovery IP (any Sonos device in the system)',
			width: 6,
			regex: Regex.IP,
		},
	]
}

