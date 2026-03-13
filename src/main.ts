import { SonosDevice, SonosEvents, SonosManager } from '@svrooij/sonos'
import { GetActionsList } from './actions.js'
import { DeviceConfig, GetConfigFields } from './config.js'
import { FeedbackId, GetFeedbacksList } from './feedback.js'
import { GetPresetsList } from './presets.js'
import { InitVariables, updateVariables } from './variables.js'
import { InstanceBase, InstanceStatus, SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import { UpgradeScripts } from './upgrades.js'

class ControllerInstance extends InstanceBase<DeviceConfig> {
	private readonly manager = new SonosManager()
	private initDone = false
	private config: DeviceConfig = {}

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
		this.manager
			.InitializeFromDevice(this.config.host || '')
			.then(() => {
				this.updateStatus(InstanceStatus.Ok)
				this.initDone = true

				// Subscribe to events for all discovered devices
				this.manager.Devices.forEach((d) => this.subscribeEvents(d))

				InitVariables(this, this.manager)
				this.setPresetDefinitions(GetPresetsList(this.manager))
				this.setActionDefinitions(GetActionsList(this.manager))
				this.setFeedbackDefinitions(GetFeedbacksList(this.manager))

				this.checkFeedbacks()
			})
			.catch((e) => {
				this.manager.CancelSubscription()
				this.updateStatus(InstanceStatus.UnknownError, `Load manager failed: ${e}`)
			})
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

	private subscribeEvents(device: SonosDevice): void {
		// Transport state changes → refresh playing/paused/stopped/active feedbacks + variables
		device.Events.on(SonosEvents.CurrentTransportState, () => {
			this.checkFeedbacks(
				FeedbackId.Playing,
				FeedbackId.Paused,
				FeedbackId.Stopped,
				FeedbackId.Active,
			)
			updateVariables(this, this.manager)
		})

		// Group name changes → refresh presets and variables
		device.Events.on(SonosEvents.GroupName, () => {
			this.setPresetDefinitions(GetPresetsList(this.manager))
			updateVariables(this, this.manager)
		})

		// Volume changes → refresh volume feedbacks and variables
		device.Events.on(SonosEvents.Volume, () => {
			this.checkFeedbacks(FeedbackId.Volume)
			updateVariables(this, this.manager)
		})

		// Mute changes → refresh mute feedback
		device.Events.on(SonosEvents.Mute, () => {
			this.checkFeedbacks(FeedbackId.Mute)
		})

		// Track URI changes → refresh source feedbacks and variables
		device.Events.on(SonosEvents.CurrentTrackUri, () => {
			this.checkFeedbacks(
				FeedbackId.SourceIsLineIn,
				FeedbackId.SourceIsQueue,
				FeedbackId.SourceMatches,
				FeedbackId.InGroup,
				FeedbackId.IsGroupCoordinator,
			)
			updateVariables(this, this.manager)
		})
	}
}

runEntrypoint(ControllerInstance, UpgradeScripts)

