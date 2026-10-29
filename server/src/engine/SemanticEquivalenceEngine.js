/**
 * Linzo Semantic Engine - Semantic Equivalence Engine (Stage 3)
 * Implements meaning collapse algorithm for concurrent multimodal inputs.
 * 
 * Collapses equivalent meanings (e.g. speech "I join", sign gesture "WAVE_JOIN",
 * typed text "joining meeting", gaze "GAZE_JOIN_BUTTON") occurring within a sliding
 * temporal window into a single atomic canonical semantic event.
 */

export class SemanticEquivalenceEngine {
  constructor(windowMs = 800) {
    this.windowMs = windowMs;
    this.pendingEvents = [];
  }

  /**
   * Equivalence map linking modality-specific intents to canonical intents
   */
  static EQUIVALENCE_MAP = {
    // Speech Intent Variants
    'JOIN_SPEECH': 'JOIN',
    'JOIN_SIGN': 'JOIN',
    'JOIN_TEXT': 'JOIN',
    'JOIN_GAZE': 'JOIN',

    'AFFIRM_SPEECH': 'AFFIRM',
    'AFFIRM_SIGN': 'AFFIRM',
    'AFFIRM_TEXT': 'AFFIRM',

    'LEAVE_SPEECH': 'LEAVE',
    'LEAVE_SIGN': 'LEAVE',
    'LEAVE_TEXT': 'LEAVE'
  };

  /**
   * Evaluates incoming canonical events for semantic equivalence and collapses duplicates.
   */
  evaluate(canonicalEvent) {
    const now = canonicalEvent.timestamp || Date.now();

    // Clean up stale pending events outside window
    this.pendingEvents = this.pendingEvents.filter(e => (now - e.timestamp) <= this.windowMs);

    // Look for matching semantic event from same actor within window
    const existingIndex = this.pendingEvents.findIndex(e => 
      e.actor === canonicalEvent.actor &&
      (e.intent === canonicalEvent.intent || this.areEquivalent(e.intent, canonicalEvent.intent))
    );

    if (existingIndex !== -1) {
      const existing = this.pendingEvents[existingIndex];
      // Merge confidence and aggregate source modalities
      const mergedModalities = Array.from(new Set([
        ...(Array.isArray(existing.collapsedModalities) ? existing.collapsedModalities : [existing.sourceModality]),
        canonicalEvent.sourceModality
      ]));

      existing.confidence = Math.min(1.0, Math.max(existing.confidence, canonicalEvent.confidence) + 0.05);
      existing.collapsedModalities = mergedModalities;
      existing.isCollapsed = true;
      existing.collapseCount = (existing.collapseCount || 1) + 1;

      return {
        action: 'COLLAPSED',
        primaryEvent: existing,
        duplicateEvent: canonicalEvent,
        message: `Semantic equivalence detected: Collapsed [${canonicalEvent.sourceModality}:${canonicalEvent.intent}] into existing [${existing.intent}] for actor ${canonicalEvent.actor}`
      };
    }

    // New distinct semantic event
    canonicalEvent.collapsedModalities = [canonicalEvent.sourceModality];
    canonicalEvent.isCollapsed = false;
    canonicalEvent.collapseCount = 1;
    this.pendingEvents.push(canonicalEvent);

    return {
      action: 'COMMITTED',
      primaryEvent: canonicalEvent,
      message: `Atomic semantic event committed: [${canonicalEvent.intent}] via ${canonicalEvent.sourceModality}`
    };
  }

  areEquivalent(intentA, intentB) {
    if (intentA === intentB) return true;
    const normA = SemanticEquivalenceEngine.EQUIVALENCE_MAP[intentA] || intentA;
    const normB = SemanticEquivalenceEngine.EQUIVALENCE_MAP[intentB] || intentB;
    return normA === normB;
  }
}
