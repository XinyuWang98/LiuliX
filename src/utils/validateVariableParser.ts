import { extractVariables, isValidVariableName } from './variableParser';


/**
 * 手动验证脚本 for variableParser
 * 运行方式: npx tsx src/utils/validateVariableParser.ts
 */

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ PASSED: ${message}`);
    }
}

function testExtractVariables() {
    console.log('\nTesting extractVariables...');

    // Case 1: Single variable
    const t1 = 'Hello {{name}}';
    const r1 = extractVariables(t1);
    assert(r1.length === 1 && r1[0] === 'name', 'Should extract single variable');

    // Case 2: Multiple unique
    const t2 = '{{greeting}} {{name}}, welcome to {{place}}. {{name}} is here.';
    const r2 = extractVariables(t2).sort();
    assert(JSON.stringify(r2) === JSON.stringify(['greeting', 'name', 'place']), 'Should extract multiple unique variables');

    // Case 3: Whitespace
    const t3 = '{{  user  }} needs {{ action}}';
    const r3 = extractVariables(t3).sort();
    assert(JSON.stringify(r3) === JSON.stringify(['action', 'user']), 'Should handle whitespace');

    // Case 4: Invalid patterns
    const t4 = '{{}} {{ invalid-name }} {{123}}';
    const r4 = extractVariables(t4);
    assert(r4.length === 1 && r4[0] === '123', 'Should ignore empty keys and invalid chars (dash)');
}


function testIsValidVariableName() {
    console.log('\nTesting isValidVariableName...');
    assert(isValidVariableName('user_id') === true, 'user_id should be valid');
    assert(isValidVariableName('variable1') === true, 'variable1 should be valid');
    assert(isValidVariableName('user-id') === false, 'user-id should be invalid (dash)');
    assert(isValidVariableName('user name') === false, 'user name should be invalid (space)');
}

console.log('--- Starting Validation ---');
testExtractVariables();
testIsValidVariableName();
console.log('--- All Tests Passed ---');
