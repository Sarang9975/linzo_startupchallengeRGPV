/**
 * Linzo Semantic Engine - Participant-Aware Rendering Adapters (Stage 5)
 * Renders participant-specific output modalities generated directly from ONE shared semantic state.
 * 
 * Modalities Output:
 * 1. Speech (TTS Synthesis payload & audio stream parameter)
 * 2. Sign Avatar (3D Skeletal Animation joint sequence)
 * 3. Text (Formatted Subtitles with entity highlighting)
 * 4. Braille (Unicode Braille patterns & refreshable display sequence)
 * 5. AAC (Augmentative & Alternative Communication Grid Symbol IDs)
 * 6. Haptic (Pattern pulse timings & intensity vectors)
 */

export class ParticipantAdapters {
  /**
   * Adapts a canonical semantic event for a specific participant profile
   */
  static render(canonicalEvent, participantProfile) {
    const modality = (participantProfile.preferredModality || 'TEXT').toUpperCase();
    const targetLang = participantProfile.language || 'en';

    switch (modality) {
      case 'SPEECH':
      case 'AUDIO':
        return ParticipantAdapters.toSpeech(canonicalEvent, targetLang);
      case 'SIGN_AVATAR':
      case 'SIGN':
      case 'AVATAR':
        return ParticipantAdapters.toSignAvatar(canonicalEvent);
      case 'BRAILLE':
        return ParticipantAdapters.toBraille(canonicalEvent);
      case 'AAC':
        return ParticipantAdapters.toAAC(canonicalEvent);
      case 'HAPTIC':
        return ParticipantAdapters.toHaptic(canonicalEvent);
      case 'TEXT':
      default:
        return ParticipantAdapters.toText(canonicalEvent, targetLang);
    }
  }

  static toSpeech(event, targetLang = 'en') {
    const rawText = event.payload?.rawContent || event.intent;
    return {
      outputModality: 'SPEECH',
      format: 'TTS_AUDIO_SYNTHESIS',
      payload: {
        textToSynthesize: `[${event.actor}]: ${rawText}`,
        language: targetLang,
        ssml: `<speak><voice name="${targetLang}-Standard-A">${rawText}</voice></speak>`,
        pitch: 1.0,
        rate: 1.0
      }
    };
  }

  static toSignAvatar(event) {
    const intent = event.intent;
    const signGlossMap = {
      'JOIN': ['HELLO', 'WELCOME', 'MEETING'],
      'LEAVE': ['GOODBYE', 'EXIT'],
      'AFFIRM': ['YES', 'AGREE'],
      'NEGATE': ['NO', 'DISAGREE'],
      'RAISE_HAND': ['QUESTION', 'ATTENTION'],
      'APPLAUD': ['CLAP', 'CELEBRATE']
    };

    const glosses = signGlossMap[intent] || [intent];

    return {
      outputModality: 'SIGN_AVATAR',
      format: '3D_SKELETAL_ANIMATION',
      payload: {
        glosses,
        jointKeyframes: glosses.map(g => ({
          gloss: g,
          durationMs: 800,
          boneRotations: { shoulder: [0.1, 0.4, 0.0], elbow: [0.8, 0.2, 0.1], wrist: [0.0, 0.5, 0.2] }
        })),
        avatarModel: 'LINZO_3D_ISL_AVATAR_V2'
      }
    };
  }

  static toText(event, targetLang = 'en') {
    const content = event.payload?.rawContent || event.intent;
    return {
      outputModality: 'TEXT',
      format: 'RICH_SUBTITLE',
      payload: {
        actor: event.actor,
        text: content,
        intentTag: `[${event.intent}]`,
        language: targetLang,
        highlightEntities: event.payload?.features?.wordCount > 1
      }
    };
  }

  static toBraille(event) {
    const text = (event.payload?.rawContent || event.intent).toUpperCase();
    
    // Simple ASCII to Unicode Braille Pattern generator
    const brailleMap = {
      'A': '⠁', 'B': '⠃', 'C': '⠉', 'D': '⠙', 'E': '⠑', 'F': '⠋', 'G': '⠛', 'H': '⠯',
      'I': '⠊', 'J': '⠚', 'K': '⠅', 'L': '⠇', 'M': '⠍', 'N': '⠝', 'O': '⠕', 'P': '⠏',
      'Q': '⠟', 'R': '⠗', 'S': '⠎', 'T': '⠞', 'U': '⠥', 'V': '⠧', 'W': '⠺', 'X': '⠭',
      'Y': '⠽', 'Z': '⠵', ' ': ' '
    };

    const brailleUnicode = text.split('').map(ch => brailleMap[ch] || '⠿').join('');

    return {
      outputModality: 'BRAILLE',
      format: 'REFRESHABLE_BRAILLE_CELLS',
      payload: {
        brailleText: brailleUnicode,
        grade: 1,
        cellCount: brailleUnicode.length,
        rawText: text
      }
    };
  }

  static toAAC(event) {
    const symbolMap = {
      'JOIN': { symbolId: 'aac_icon_join', label: 'JOIN', category: 'ACTION' },
      'LEAVE': { symbolId: 'aac_icon_leave', label: 'LEAVE', category: 'ACTION' },
      'AFFIRM': { symbolId: 'aac_icon_yes', label: 'YES', category: 'SOCIAL' },
      'NEGATE': { symbolId: 'aac_icon_no', label: 'NO', category: 'SOCIAL' },
      'RAISE_HAND': { symbolId: 'aac_icon_question', label: 'QUESTION', category: 'INTERACTION' }
    };

    const symbol = symbolMap[event.intent] || { symbolId: 'aac_icon_speak', label: event.intent, category: 'GENERAL' };

    return {
      outputModality: 'AAC',
      format: 'SYMBOL_GRID_CELL',
      payload: {
        symbolId: symbol.symbolId,
        label: symbol.label,
        category: symbol.category,
        gridCoordinates: { row: 1, col: 2 }
      }
    };
  }

  static toHaptic(event) {
    const hapticPatternMap = {
      'JOIN': [100, 50, 100], // Double short pulse
      'LEAVE': [300], // Single long pulse
      'AFFIRM': [80, 40, 80, 40, 80], // Rapid triple pulse
      'URGENT': [200, 100, 200, 100, 200, 100, 500] // Alarm pattern
    };

    const pattern = hapticPatternMap[event.intent] || [150];

    return {
      outputModality: 'HAPTIC',
      format: 'VIBRATION_PULSE_SEQUENCE',
      payload: {
        patternMs: pattern,
        intensity: 0.8,
        motorLocation: 'WRIST_BAND'
      }
    };
  }
}
