const assert = require('node:assert/strict');
global.window = {};
require('../exams/core.js');
for (let number = 1; number <= 4; number++) require(`../exams/paper-${number}.js`);

const data = window.CCAF_MOCKS;
assert.equal(data.papers.length, 4);
const allStems = [];
const archetypes = new Set(['support', 'code-generation', 'research', 'dev-productivity', 'ci', 'extraction']);
for (const paper of data.papers) {
  assert.equal(paper.scenarios.length, 4, paper.id);
  assert.equal(new Set(paper.scenarios.map(s => s.archetype)).size, 4, paper.id);
  paper.scenarios.forEach(scenario => {
    assert.ok(archetypes.has(scenario.archetype), scenario.archetype);
    assert.equal(scenario.questions.length, 15, `${paper.id} ${scenario.title}`);
    assert.ok(scenario.context.length >= 120, scenario.title);
  });
  const questions = paper.scenarios.flatMap(s => s.questions);
  assert.equal(questions.length, 60, paper.id);
  assert.equal(new Set(questions.map(question => question.objective)).size, 30, paper.id);
  for (const domain of data.domains) assert.equal(questions.filter(question => question.domain === domain.id).length, domain.target, `${paper.id} domain ${domain.id}`);
  assert.ok(questions.filter(question => question.correct.length > 1).length >= 8, `${paper.id} needs multiple-response items`);
  assert.ok(questions.some(question => question.correct.length === 3), `${paper.id} needs a select-three item`);
  questions.forEach((question, index) => {
    allStems.push(question.stem);
    assert.ok(question.stem.length >= 35, `${paper.id} #${index + 1} stem`);
    assert.ok(question.rationale.length >= 35, `${paper.id} #${index + 1} rationale`);
    assert.ok(question.options.length >= 4 && question.options.length <= 5, `${paper.id} #${index + 1} options`);
    assert.equal(new Set(question.options).size, question.options.length, `${paper.id} #${index + 1} duplicate options`);
    assert.equal(new Set(question.correct).size, question.correct.length, `${paper.id} #${index + 1} duplicate answer indices`);
    question.correct.forEach(answer => assert.ok(answer >= 0 && answer < question.options.length, `${paper.id} #${index + 1} answer bounds`));
  });
}
assert.equal(new Set(allStems).size, 240, 'question stems must be unique across papers');
console.log(JSON.stringify({ papers: 4, questions: 240, scenarios: 16, objectivesPerPaper: 30, uniqueStems: 240, multiResponse: data.papers.map(p => p.scenarios.flatMap(s => s.questions).filter(q => q.correct.length > 1).length) }));
