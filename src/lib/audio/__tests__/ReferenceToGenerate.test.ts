import { describe, it, expect } from 'vitest';
import { constraintsToProductionParams, type ReferenceConstraints } from '../ReferenceToGenerate';

const makeConstraints = (overrides: Partial<ReferenceConstraints> = {}): ReferenceConstraints => ({
  bpm: 112,
  bpmConfidence: 0.9,
  key: 'Cm',
  camelot: '5A',
  targetLufs: -10,
  energyProfile: [0.3, 0.5, 0.7, 0.8, 0.6],
  avgEnergy: 0.58,
  vocalPresence: 0.4,
  genre: { isAmapiano: true, confidence: 0.85, indicators: ['log_drum'], subgenre: 'private_school' },
  isAmapiano: true,
  suggestedPrompt: 'private school, 112 BPM, in Cm',
  structure: [
    { type: 'intro', durationSec: 16, energy: 0.3 },
    { type: 'drop', durationSec: 32, energy: 0.8 },
  ],
  rawAnalysis: {} as any,
  ...overrides,
});

describe('constraintsToProductionParams', () => {
  it('maps vocal presence to correct level', () => {
    expect(constraintsToProductionParams(makeConstraints({ vocalPresence: 0.1 })).vocalLevel).toBe('none');
    expect(constraintsToProductionParams(makeConstraints({ vocalPresence: 0.4 })).vocalLevel).toBe('subtle');
    expect(constraintsToProductionParams(makeConstraints({ vocalPresence: 0.8 })).vocalLevel).toBe('prominent');
  });

  it('returns correct BPM and key', () => {
    const params = constraintsToProductionParams(makeConstraints());
    expect(params.bpm).toBe(112);
    expect(params.key).toBe('Cm');
  });

  it('quantizes sections to 4-bar boundaries', () => {
    const params = constraintsToProductionParams(makeConstraints());
    for (const section of params.sections) {
      expect(section.bars % 4).toBe(0);
    }
  });

  it('uses subgenre as style when amapiano', () => {
    const params = constraintsToProductionParams(makeConstraints());
    expect(params.style).toBe('private_school');
  });

  it('defaults to amapiano when not amapiano genre', () => {
    const params = constraintsToProductionParams(makeConstraints({
      isAmapiano: false,
      genre: { isAmapiano: false, confidence: 0.3, indicators: [] },
    }));
    expect(params.style).toBe('amapiano');
  });
});
