
import { pipeline } from '@xenova/transformers';

// Suppress excessive logging
// (transformers.js logs model loading progress by default, which is fine)

async function testRouterPipeline() {
    console.log("🚀 Starting Router Pipeline PoC (Transformers.js)...");

    // ---------------------------------------------------------
    // Task A: Intent Classification (Zero-Shot)
    // ---------------------------------------------------------
    console.log("\n--- Task A: Intent Classification (bart-large-mnli) ---");

    // Initialize Classifier
    console.log("Loading classifier model...");
    const classifier = await pipeline('zero-shot-classification', 'Xenova/bart-large-mnli');

    // Test Case 1: Filter Missing
    const text1 = "Remove empty rows from Age column";
    const candidate_labels = ['filter_missing', 'dedup_rows', 'standardize_date', 'fill_null_mean'];

    console.log(`\nInput: "${text1}"`);
    console.log(`Candidates: ${candidate_labels.join(', ')}`);

    const result1 = await classifier(text1, candidate_labels);
    console.log("Result:", JSON.stringify(result1, null, 2));

    // Test Case 2: Fill Nulls
    const text2 = "Fill missing values in Salary with average";
    console.log(`\nInput: "${text2}"`);
    const result2 = await classifier(text2, candidate_labels);
    console.log("Result:", JSON.stringify(result2, null, 2));


    // ---------------------------------------------------------
    // Task B: Parameter Extraction (Question Answering)
    // ---------------------------------------------------------
    console.log("\n--- Task B: Parameter Extraction (distilbert-qa) ---");

    // Initialize Extractor
    console.log("Loading QA model...");
    const extractor = await pipeline('question-answering', 'Xenova/distilbert-base-uncased-distilled-squad');

    // Test Case 1: Extract Column Name
    const context1 = "Columns: [Name, Age, Date]. User Request: Remove empty rows from Age column.";
    const question1 = "Which column should be filtered?";

    console.log(`\nContext: "${context1}"`);
    console.log(`Question: "${question1}"`);

    const extract1 = await extractor(question1, context1);
    console.log("Result:", JSON.stringify(extract1, null, 2));

    // Test Case 2: Extract Column Name (Implicit context)
    const context2 = "User wants to standardize the date format in the 'Join Date' field.";
    const question2 = "Which column should be standardized?";

    console.log(`\nContext: "${context2}"`);
    console.log(`Question: "${question2}"`);

    const extract2 = await extractor(question2, context2);
    console.log("Result:", JSON.stringify(extract2, null, 2));

    console.log("\n🎉 PoC Completed!");
}

testRouterPipeline().catch((err) => {
    console.error("❌ Error running pipeline:", err);
});
