import { describe, it, expect } from 'vitest';
import { ModelRouter, LOBE_CONFIGS, ALL_LOBE_IDS } from './ModelRouter';
import type { LobeId } from './ModelRouter';

describe('ModelRouter', () => {
  describe('LOBE_CONFIGS', () => {
    it('defines all three lobes', () => {
      expect(Object.keys(LOBE_CONFIGS)).toHaveLength(3);
      expect(LOBE_CONFIGS.cognitive).toBeDefined();
      expect(LOBE_CONFIGS.executive).toBeDefined();
      expect(LOBE_CONFIGS.sensory).toBeDefined();
    });

    it('each lobe has valid config', () => {
      for (const id of ALL_LOBE_IDS) {
        const config = LOBE_CONFIGS[id];
        expect(config.id).toBe(id);
        expect(config.name).toBeTruthy();
        expect(config.nameAr).toBeTruthy();
        expect(config.emoji).toBeTruthy();
        expect(config.model).toBeTruthy();
        expect(config.fallbackModel).toBeTruthy();
        expect(config.systemPrompt).toBeTruthy();
        expect(config.temperature).toBeGreaterThanOrEqual(0);
        expect(config.temperature).toBeLessThanOrEqual(1);
        expect(config.maxTokens).toBeGreaterThan(0);
        expect(config.domains.length).toBeGreaterThan(0);
      }
    });

    it('cognitive lobe is configured for technical work', () => {
      const config = LOBE_CONFIGS.cognitive;
      expect(config.name).toContain('Cognitive');
      expect(config.domains).toContain('code');
      expect(config.temperature).toBeLessThan(0.5); // Lower temp for precise code
    });

    it('sensory lobe is configured for language processing', () => {
      const config = LOBE_CONFIGS.sensory;
      expect(config.nameAr).toContain('الحسي');
      expect(config.description).toContain('Arabic');
    });
  });

  describe('ALL_LOBE_IDS', () => {
    it('contains exactly three lobe IDs', () => {
      expect(ALL_LOBE_IDS).toHaveLength(3);
      expect(ALL_LOBE_IDS).toContain('cognitive');
      expect(ALL_LOBE_IDS).toContain('executive');
      expect(ALL_LOBE_IDS).toContain('sensory');
    });
  });
});
