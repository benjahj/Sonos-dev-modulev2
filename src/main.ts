import { SonosDevice, SonosEvents, SonosManager } from '@svrooij/sonos'
import { GetActionsList } from './actions.js'
import { DeviceConfig, GetConfigFields } from './config.js'
import { FeedbackId, GetFeedbacksList } from './feedback.js'
import { GetPresetsList } from './presets.js'
import { InitVariables, updateVariables } from './variables.js'
import { InstanceBase, InstanceStatus, SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import { UpgradeScripts } from './upgrades.js'

export interface DeviceState {
	/** Original device names cached at discovery time (UUID → Name) */
	deviceNames: Map<string, string>
	/** Known device IPs cached at discovery time (UUID → host) */
	knownHosts: Map<string, string>
	/** UUIDs of devices currently detected as offline */
	offlineDevices: Set<string>
}

class ControllerInstance extends InstanceBase<DeviceConfig> {
	private readonly manager = new SonosManager()
	private initDone = false
	private config: DeviceConfig = {}
	public readonly deviceState: DeviceState = {
		deviceNames: new Map(),
		knownHosts: new Map(),
		offlineDevices: new Set(),
	}

	// Override base types to make types stricter
	public checkFeedbacks(...feedbackTypes: FeedbackId[]): void {
		if (this.initDone) {
			super.checkFeedbacks(...feedbackTypes)
		}
	}

	/**
	 * Main initialization function called once the module is OK to start doing things.
	 */
	public async init(config: DeviceConfig): Promise<void> {
		await this.configUpdated(config)
	}

	/**
	 * Process an updated configuration array.
	 */
	public async configUpdated(config: DeviceConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)

		try {
			this.manager.CancelSubscription()
		} catch (e) {
			// Ignore
		}

		this.initDone = false

		// Build candidate list: configured host first, then all previously known hosts
		const candidates: string[] = []
		if (this.config.host) candidates.push(this.config.host)
		for (const host of this.deviceState.knownHosts.values()) {
			if (!candidates.includes(host)) candidates.push(host)
		}

		const success = await this.tryInitializeFromHosts(candidates)
		if (!success) {
			this.manager.CancelSubscription()
			this.updateStatus(InstanceStatus.UnknownError, 'All Sonos devices are unreachable')
		}
	}

	/**
	 * Try initializing the manager from a list of candidate IPs.
	 * Returns true on first success, false if all fail.
	 */
	private async tryInitializeFromHosts(hosts: string[]): Promise<boolean> {
		for (const host of hosts) {
			try {
				await this.manager.InitializeFromDevice(host)
				this.onManagerReady()
				return true
			} catch (e) {
				this.log('debug', `Discovery via ${host} failed: ${e}`)
				try { this.manager.CancelSubscription() } catch (_) { /* ignore */ }
			}
		}
		return false
	}

	/**
	 * Called after the manager has successfully discovered the Sonos network.
	 */
	private onManagerReady(): void {
		this.updateStatus(InstanceStatus.Ok)
		this.initDone = true

		// Cache original device names, IPs, and clear offline state
		this.deviceState.offlineDevices.clear()
		this.manager.Devices.forEach((d) => {
			this.deviceState.deviceNames.set(d.Uuid, d.Name)
			this.deviceState.knownHosts.set(d.Uuid, d.Host)
		})

		// Subscribe to events for all discovered devices
		this.manager.Devices.forEach((d) => this.subscribeEvents(d))

		InitVariables(this, this.manager, this.deviceState)
		this.setPresetDefinitions(GetPresetsList(this.manager, this.deviceState))
		this.setActionDefinitions(GetActionsList(this, this.manager, this.deviceState))
		this.setFeedbackDefinitions(GetFeedbacksList(this.manager, this.deviceState))

		this.checkFeedbacks()
	}

	/**
	 * Creates the configuration fields for web config.
	 */
	public getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/**
	 * Clean up the instance before it is destroyed.
	 */
	public async destroy(): Promise<void> {
		try {
			this.manager.CancelSubscription()
		} catch (e) {
			// Ignore
		}
	}

	private markDeviceOffline(device: SonosDevice): void {
		if (this.deviceState.offlineDevices.has(device.Uuid)) return
		this.log('warn', `Device "${this.deviceState.deviceNames.get(device.Uuid) ?? device.Name}" went offline`)
		this.deviceState.offlineDevices.add(device.Uuid)

		// Only set module-level error when ALL discovered devices are offline
		const allOffline = this.manager.Devices.every((d) => this.deviceState.offlineDevices.has(d.Uuid))
		if (allOffline) {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'All Sonos devices are offline')
		}

		this.refreshAll()
	}

	private refreshAll(): void {
		InitVariables(this, this.manager, this.deviceState)
		this.setPresetDefinitions(GetPresetsList(this.manager, this.deviceState))
		this.setActionDefinitions(GetActionsList(this, this.manager, this.deviceState))
		this.setFeedbackDefinitions(GetFeedbacksList(this.manager, this.deviceState))
		this.checkFeedbacks()
	}

	private markDeviceOnline(device: SonosDevice): void {
		if (!this.deviceState.offlineDevices.has(device.Uuid)) return
		this.log('info', `Device "${this.deviceState.deviceNames.get(device.Uuid) ?? device.Name}" is back online`)
		this.deviceState.offlineDevices.delete(device.Uuid)
		this.updateStatus(InstanceStatus.Ok)
		this.refreshAll()
	}

	private subscribeEvents(device: SonosDevice): void {
		// Subscription errors → mark device as offline
		device.Events.on(SonosEvents.SubscriptionError, () => {
			this.markDeviceOffline(device)
		})

		// Transport state changes → refresh playing/paused/stopped/active feedbacks + variables
		device.Events.on(SonosEvents.CurrentTransportState, () => {
			this.markDeviceOnline(device)
			this.checkFeedbacks(
				FeedbackId.Playing,
				FeedbackId.Paused,
				FeedbackId.Stopped,
				FeedbackId.Active,
			)
			updateVariables(this, this.manager, this.deviceState)
		})

		// Group name changes → refresh presets and variables
		device.Events.on(SonosEvents.GroupName, () => {
			this.markDeviceOnline(device)
			this.setPresetDefinitions(GetPresetsList(this.manager, this.deviceState))
			updateVariables(this, this.manager, this.deviceState)
		})

		// Volume changes → refresh volume feedbacks and variables
		device.Events.on(SonosEvents.Volume, () => {
			this.markDeviceOnline(device)
			this.checkFeedbacks(FeedbackId.Volume)
			updateVariables(this, this.manager, this.deviceState)
		})

		// Mute changes → refresh mute feedback
		device.Events.on(SonosEvents.Mute, () => {
			this.markDeviceOnline(device)
			this.checkFeedbacks(FeedbackId.Mute)
		})

		// Track URI changes → refresh source feedbacks and variables
		device.Events.on(SonosEvents.CurrentTrackUri, () => {
			this.markDeviceOnline(device)
			this.checkFeedbacks(
				FeedbackId.SourceIsLineIn,
				FeedbackId.SourceIsQueue,
				FeedbackId.SourceMatches,
				FeedbackId.InGroup,
				FeedbackId.IsGroupCoordinator,
			)
			updateVariables(this, this.manager, this.deviceState)
		})
	}
}

runEntrypoint(ControllerInstance, UpgradeScripts)

