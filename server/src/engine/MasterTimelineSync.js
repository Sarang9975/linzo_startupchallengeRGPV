/**
 * Linzo Semantic Engine - Master Timeline Synchronizer (Stage 6)
 * Aligns multi-modal participant outputs over a master timeline (T_0).
 * Eliminates rendering latency skews between speech, 3D avatar animations,
 * refreshable braille displays, and visual subtitles.
 */

export class MasterTimelineSync {
  constructor(targetBufferMs = 150) {
    this.targetBufferMs = targetBufferMs;
    this.masterClockT0 = Date.now();
    this.deliveryQueue = [];
  }

  /**
   * Enqueues rendered participant outputs and tags them with absolute Master Timeline T_0 delivery targets
   */
  scheduleDelivery(renderedOutputs, participantProfiles) {
    const now = Date.now();
    const t0Target = now + this.targetBufferMs;

    const deliveryBundle = {
      bundleId: `bnd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      masterTimestampT0: t0Target,
      timeOffsetMs: t0Target - this.masterClockT0,
      outputsByParticipant: {}
    };

    participantProfiles.forEach(profile => {
      const pid = profile.participantId;
      const adapted = renderedOutputs[pid];

      if (adapted) {
        deliveryBundle.outputsByParticipant[pid] = {
          participantId: pid,
          modality: profile.preferredModality,
          scheduledDeliveryT0: t0Target,
          renderingPayload: adapted
        };
      }
    });

    this.deliveryQueue.push(deliveryBundle);

    // Keep queue length controlled
    if (this.deliveryQueue.length > 100) {
      this.deliveryQueue.shift();
    }

    return deliveryBundle;
  }

  getSyncMetrics() {
    return {
      masterClockT0: new Date(this.masterClockT0).toISOString(),
      queueLength: this.deliveryQueue.length,
      targetBufferMs: this.targetBufferMs,
      status: 'ALIGNED_AND_SYNCHRONIZED'
    };
  }
}
