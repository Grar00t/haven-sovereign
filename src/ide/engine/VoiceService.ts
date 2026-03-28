import { pipeline, env } from '@xenova/transformers';

// Configuration for browser environment
env.allowLocalModels = false; // Loads from CDN first (HuggingFace), then caches locally
env.useBrowserCache = true;

export type TranscribeProgress = { status: 'progress'; file: string; progress: number };

export class VoiceService {
    private transcriber: any = null;
    private modelName = 'Xenova/whisper-tiny';
    private isLoading = false;

    async init(onProgress?: (data: TranscribeProgress) => void) {
        if (this.transcriber || this.isLoading) return;

        this.isLoading = true;
        try {
            console.log('[VoiceService] Loading local Whisper model...');
            onProgress?.({ status: 'progress', file: this.modelName, progress: 0.1 });
            this.transcriber = await pipeline('automatic-speech-recognition', this.modelName);
            onProgress?.({ status: 'progress', file: this.modelName, progress: 1 });
            console.log('[VoiceService] Whisper model loaded locally.');
        } catch (error) {
            console.error('[VoiceService] Failed to load model:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async transcribe(audioBlob: Blob, onProgress?: (data: TranscribeProgress) => void): Promise<string> {
        if (!this.transcriber) await this.init(onProgress);

        try {
            // Convert Blob to URL for the processor
            const url = URL.createObjectURL(audioBlob);
            const output = await this.transcriber(url);
            URL.revokeObjectURL(url);
            return output?.text ?? '';
        } catch (error) {
            console.error('[VoiceService] Transcription failed:', error);
            return '';
        }
    }
}

export const voiceService = new VoiceService();