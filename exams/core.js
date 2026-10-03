(function () {
  'use strict';
  var domains = [
    { id: '1', name: 'Agentic Architecture & Orchestration', weight: 27, target: 16 },
    { id: '2', name: 'Tool Design & MCP Integration', weight: 18, target: 11 },
    { id: '3', name: 'Claude Code Configuration & Workflows', weight: 20, target: 12 },
    { id: '4', name: 'Prompt Engineering & Structured Output', weight: 20, target: 12 },
    { id: '5', name: 'Context Management & Reliability', weight: 15, target: 9 }
  ];
  function q(objective, stem, choices, answer, rationale) {
    var options = choices.split('|').map(function (option) { return option.trim(); });
    var correct = answer.split('').map(function (letter) { return letter.charCodeAt(0) - 65; });
    if (!/^[1-5]\.\d$/.test(objective) || options.length < 4 || options.length > 5 || !correct.length || correct.some(function (index) { return index < 0 || index >= options.length; })) {
      throw new Error('Invalid mock question: ' + stem);
    }
    // Fixed per item: varies answer positions without changing them on refresh.
    var seed = 2166136261;
    for (var i = 0; i < stem.length; i++) seed = Math.imul(seed ^ stem.charCodeAt(i), 16777619) >>> 0;
    var positions = options.map(function (_, index) { return index; });
    for (var j = positions.length - 1; j > 0; j--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      var swap = seed % (j + 1);
      var temp = positions[j]; positions[j] = positions[swap]; positions[swap] = temp;
    }
    return { objective: objective, domain: objective[0], stem: stem,
      options: positions.map(function (index) { return options[index]; }),
      correct: correct.map(function (index) { return positions.indexOf(index); }).sort(),
      rationale: rationale };
  }
  function scenario(archetype, title, context, questions) {
    return { archetype: archetype, title: title, context: context, questions: questions };
  }
  var papers = [];
  function addPaper(number, title, summary, scenarios) {
    papers.push({ id: 'paper-' + number, number: number, title: title, summary: summary, scenarios: scenarios });
  }
  window.CCAF_MOCKS = {
    guideUrl: 'https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf',
    domains: domains,
    papers: papers,
    q: q,
    scenario: scenario,
    addPaper: addPaper
  };
})();
