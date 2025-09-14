document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('digits').addEventListener('input', function() {
    const input = this.value;
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';

    if (input.length !== 4 || !/^\d{4}$/.test(input)) {
      outputDiv.innerHTML = '<div class="solution">Please enter exactly 4 digits.</div>';
      return;
    }

    const digits = input.split('').map(Number);
    const solutions = findUniqueSolutions(digits, 18);
    
    if (solutions.length === 0) {
      outputDiv.innerHTML = '<div class="solution">No solutions found.</div>';
    } else {
      outputDiv.innerHTML = solutions.map(s => `<div class="solution">${s}</div>`).join('');
    }
  });

  function findUniqueSolutions(digits, target) {
    // Global map to track unique computational structures
    const seenStructures = new Map();
    const validSolutions = [];
    
    // Generate all possible ways to combine the digits
    generateAllCombinations(digits, (value, expr, structure) => {
      if (Math.abs(value - target) < 0.0001 && isFinite(value)) {
        // Only add if we haven't seen this exact structure
        if (!seenStructures.has(structure)) {
          seenStructures.set(structure, expr);
          validSolutions.push(expr);
        }
      }
    });
    
    return validSolutions.sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });
  }

  function generateAllCombinations(digits, callback) {
    const n = digits.length;
    // Cache for each subset of digits
    const cache = new Map();
    
    function getCombinations(mask) {
      const key = mask.toString();
      if (cache.has(key)) return cache.get(key);
      
      const results = [];
      const digitsInMask = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          digitsInMask.push(digits[i]);
        }
      }
      
      if (digitsInMask.length === 1) {
        // Base case: single digit
        const d = digitsInMask[0];
        results.push({
          value: d,
          expr: d.toString(),
          structure: `N${d}`
        });
      } else {
        // Try all non-empty splits
        for (let sub = mask & (mask - 1); sub > 0; sub = (sub - 1) & mask) {
          const other = mask ^ sub;
          if (sub > other) continue; // Avoid duplicate splits
          
          const leftResults = getCombinations(sub);
          const rightResults = getCombinations(other);
          
          for (const left of leftResults) {
            for (const right of rightResults) {
              // Addition (commutative - normalize)
              if (left.structure <= right.structure) {
                results.push({
                  value: left.value + right.value,
                  expr: makeExpr(left.expr, right.expr, '+'),
                  structure: `(${left.structure}+${right.structure})`
                });
              } else {
                results.push({
                  value: left.value + right.value,
                  expr: makeExpr(right.expr, left.expr, '+'),
                  structure: `(${right.structure}+${left.structure})`
                });
              }
              
              // Multiplication (commutative - normalize)
              if (left.structure <= right.structure) {
                results.push({
                  value: left.value * right.value,
                  expr: makeExpr(left.expr, right.expr, '*'),
                  structure: `(${left.structure}*${right.structure})`
                });
              } else {
                results.push({
                  value: left.value * right.value,
                  expr: makeExpr(right.expr, left.expr, '*'),
                  structure: `(${right.structure}*${left.structure})`
                });
              }
              
              // Subtraction (both orders)
              results.push({
                value: left.value - right.value,
                expr: makeExpr(left.expr, right.expr, '-'),
                structure: `(${left.structure}-${right.structure})`
              });
              
              results.push({
                value: right.value - left.value,
                expr: makeExpr(right.expr, left.expr, '-'),
                structure: `(${right.structure}-${left.structure})`
              });
              
              // Division (both orders)
              if (right.value !== 0) {
                results.push({
                  value: left.value / right.value,
                  expr: makeExpr(left.expr, right.expr, '/'),
                  structure: `(${left.structure}/${right.structure})`
                });
              }
              
              if (left.value !== 0) {
                results.push({
                  value: right.value / left.value,
                  expr: makeExpr(right.expr, left.expr, '/'),
                  structure: `(${right.structure}/${left.structure})`
                });
              }
            }
          }
        }
      }
      
      // Deduplicate results for this mask based on EXPRESSION not structure
      const seenExpr = new Set();
      const unique = [];
      for (const r of results) {
        if (!seenExpr.has(r.expr)) {
          seenExpr.add(r.expr);
          unique.push(r);
        }
      }
      
      cache.set(key, unique);
      return unique;
    }
    
    // Get all combinations for the full set
    const fullMask = (1 << n) - 1;
    const allResults = getCombinations(fullMask);
    
    // Deduplicate again before reporting
    const finalSeen = new Set();
    for (const r of allResults) {
      if (!finalSeen.has(r.expr)) {
        finalSeen.add(r.expr);
        callback(r.value, r.expr, r.structure);
      }
    }
  }

  function makeExpr(left, right, op) {
    const prec = {'+': 1, '-': 1, '*': 2, '/': 2};
    
    // Determine if we need parentheses
    const leftNeedsParens = needsParens(left, op, false);
    const rightNeedsParens = needsParens(right, op, true);
    
    const l = leftNeedsParens ? `(${left})` : left;
    const r = rightNeedsParens ? `(${right})` : right;
    
    return `${l}${op}${r}`;
  }

  function needsParens(expr, parentOp, isRight) {
    if (/^\d+$/.test(expr)) return false;
    
    // Find main operator
    let depth = 0;
    let mainOp = null;
    const prec = {'+': 1, '-': 1, '*': 2, '/': 2};
    
    for (let i = expr.length - 1; i >= 0; i--) {
      if (expr[i] === ')') depth++;
      else if (expr[i] === '(') depth--;
      else if (depth === 0 && prec[expr[i]]) {
        mainOp = expr[i];
        break;
      }
    }
    
    if (!mainOp) return false;
    
    // Need parens if lower precedence
    if (prec[mainOp] < prec[parentOp]) return true;
    
    // Right operand of - or / needs parens if same precedence
    if (isRight && prec[mainOp] === prec[parentOp] && 
        (parentOp === '-' || parentOp === '/')) {
      return true;
    }
    
    return false;
  }
});