const fs = require('fs');
const path = require('path');

const rawPath = path.resolve(__dirname, '..', 'data', 'agentforce_raw.txt');
const dstPath = path.resolve(__dirname, '..', 'data', 'questions.json');

function parse(raw) {
  const parts = raw.split(/NEW QUESTION\s*\d+/i).map(s => s.trim()).filter(Boolean);
  const items = [];
  for (const part of parts) {
    const answerIdx = part.search(/\bAnswer:\s*/i);
    if (answerIdx === -1) continue;
    const questionText = part.slice(0, answerIdx).replace(/\r?\n+/g, ' ').trim();
    const explanationIdx = part.search(/\bExplanation:?/i);
    const answerBlock = explanationIdx === -1 ? part.slice(answerIdx).trim() : part.slice(answerIdx, explanationIdx).trim();
    const explanation = explanationIdx === -1 ? '' : part.slice(explanationIdx).replace(/\bExplanation:?/i, '').trim();

    const answerMatch = answerBlock.match(/Answer:\s*([^\n\r]+)/i);
    const answer = answerMatch ? answerMatch[1].trim() : answerBlock;

    if (questionText.length === 0) continue;
    items.push({ question: questionText, answer: answer, explanation: explanation, reveal: false });
  }
  return items;
}

try {
  const raw = fs.readFileSync(rawPath, 'utf8');
  const parsed = parse(raw);
  if (!parsed.length) {
    console.error('No questions parsed from raw file.');
    process.exitCode = 2;
  }

  const dst = JSON.parse(fs.readFileSync(dstPath, 'utf8'));
  if (!dst.categories) dst.categories = [];
  let cat = dst.categories.find(c => c.name === 'Agentforce');
  if (!cat) {
    cat = { name: 'Agentforce', questions: [] };
    dst.categories.push(cat);
  }

  // Append parsed items
  cat.questions = cat.questions.concat(parsed);

  fs.writeFileSync(dstPath, JSON.stringify(dst, null, 2), 'utf8');
  console.log(`Imported ${parsed.length} questions into Agentforce category in ${path.relative(process.cwd(), dstPath)}`);
} catch (err) {
  console.error('Error parsing/importing dump:', err);
  process.exitCode = 1;
}

// Usage: node tools/parse_agentforce_dump.cjs
