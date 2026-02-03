
import { pipeline } from '@xenova/transformers';

// Skip local model checks (since we want to download from HF Hub)
// env.allowLocalModels = false;
// env.useBrowserCache = true;

/**
 * Worker State
 */
interface WorkerState {
    classifier: any;
    extractor: any;
    status: 'idle' | 'loading' | 'ready' | 'error';
}

const state: WorkerState = {
    classifier: null,
    extractor: null,
    status: 'idle'
};

/**
 * Load Models
 */
async function loadModels() {
    if (state.status === 'ready') return;

    try {
        state.status = 'loading';
        self.postMessage({ type: 'status', data: 'loading' });

        // Load Classifier (Intent) - Paralleled if possible but JS is single threaded here
        // Using quantization for smaller size
        state.classifier = await pipeline('zero-shot-classification', 'Xenova/bart-large-mnli', {
            quantized: true,
            progress_callback: (item: any) => {
                self.postMessage({
                    type: 'progress',
                    data: { model: 'classifier', ...item }
                });
            }
        });

        // Load Extractor (Params)
        state.extractor = await pipeline('question-answering', 'Xenova/distilbert-base-uncased-distilled-squad', {
            quantized: true,
            progress_callback: (item: any) => {
                self.postMessage({
                    type: 'progress',
                    data: { model: 'extractor', ...item }
                });
            }
        });

        state.status = 'ready';
        self.postMessage({ type: 'status', data: 'ready' });
    } catch (err: any) {
        state.status = 'error';
        self.postMessage({ type: 'error', data: err.message });
    }
}

/**
 * Handle Classifier Request
 */
async function handleClassify(text: string, labels: string[]) {
    if (!state.classifier) throw new Error('Classifier not loaded');
    const result = await state.classifier(text, labels);
    return result;
}

/**
 * Handle Extraction Request
 */
async function handleExtract(context: string, question: string) {
    if (!state.extractor) throw new Error('Extractor not loaded');
    const result = await state.extractor(question, context);
    return result;
}

// Message Handler
self.addEventListener('message', async (event) => {
    const { type, data, id } = event.data;

    try {
        let result;
        switch (type) {
            case 'load':
                await loadModels();
                result = { success: true };
                break;

            case 'classify':
                if (state.status !== 'ready') await loadModels();
                result = await handleClassify(data.text, data.labels);
                break;

            case 'extract':
                if (state.status !== 'ready') await loadModels();
                result = await handleExtract(data.context, data.question);
                break;

            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        self.postMessage({ type: 'result', id, data: result });

    } catch (err: any) {
        self.postMessage({ type: 'error', id, data: err.message });
    }
});
