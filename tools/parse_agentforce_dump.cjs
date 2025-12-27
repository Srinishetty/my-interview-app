const fs = require('fs');
const path = require('path');

const rawPath = path.resolve(__dirname, '..', 'data', 'agentforce_raw.txt');
const dstPath = path.resolve(__dirname, '..', 'public', 'questions.json');

function parse(raw) {
  const questions = raw.split(/NEW QUESTION\s*\d+/i).slice(1).map(part => part.trim()).filter(Boolean);
  const items = [];

  for (let idx = 0; idx < questions.length; idx++) {
    const part = questions[idx];
    const lines = part.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length < 4) continue; // Need at least question, options, answer

    let question = '';
    const options = {};
    let answer = '';
    let explanation = '';

    let i = 0;
    // Question text until options start
    while (i < lines.length && !/^[A-Z]\./.test(lines[i])) {
      question += (question ? ' ' : '') + lines[i];
      i++;
    }

    // Options
    while (i < lines.length && /^[A-Z]\./.test(lines[i])) {
      const optionMatch = lines[i].match(/^([A-Z])\.\s*(.*)$/);
      if (optionMatch) {
        options[optionMatch[1]] = optionMatch[2];
      }
      i++;
    }

    // Answer
    if (i < lines.length && lines[i].startsWith('Answer:')) {
      answer = lines[i].replace(/^Answer:\s*/, '').trim();
      i++;
    }

    // Explanation
    if (i < lines.length && lines[i].startsWith('Explanation:')) {
      explanation = lines.slice(i).join(' ').replace(/^Explanation:\s*/, '').trim();
    }

    if (question && Object.keys(options).length > 0 && answer) {
      items.push({ question, options, answer, explanation });
    }
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

  // Limit to first 5 questions for testing
  const limitedParsed = parsed.slice(0, 5);

  const dst = JSON.parse(fs.readFileSync(dstPath, 'utf8'));
  if (!dst.categories) dst.categories = [];
  let cat = dst.categories.find(c => c.name === 'Agentforce');
  if (!cat) {
    cat = { name: 'Agentforce', questions: [] };
    dst.categories.push(cat);
  }

  // Replace with limited parsed items
  cat.questions = limitedParsed;

  fs.writeFileSync(dstPath, JSON.stringify(dst, null, 2), 'utf8');
  console.log(`Imported ${parsed.length} questions into Agentforce category in ${path.relative(process.cwd(), dstPath)}`);
} catch (err) {
  console.error('Error parsing/importing dump:', err);
  process.exitCode = 1;
}

// Usage: node tools/parse_agentforce_dump.cjs
