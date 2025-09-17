document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('digits').addEventListener('input', function() {
    const input = this.value;
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';

    if (input.length !== 4 || !/^\d{4}$/.test(input)) {
      if (input.length === 4) {
        outputDiv.innerHTML = '<div class="solution">Please enter exactly 4 digits (0-9).</div>';
      }
      return;
    }

    const digits = input.split('').map(Number);
    const solutions = findUniqueSolutions(digits, 18);
    
    if (solutions.length === 0) {
      outputDiv.innerHTML = '<div class="solution">No solutions</div>';
    } else {
      outputDiv.innerHTML = solutions.map(s => `<div class="solution">${s}</div>`).join('');
    }
  });

  function findUniqueSolutions(digits, target) {
    // First, generate all valid expressions that equal target
    const allSolutions = [];
    generateAllExpressions(digits, (expr, value) => {
      if (Math.abs(value - target) < 0.0001 && isFinite(value)) {
        allSolutions.push(expr);
      }
    });
    
    // Now deduplicate using numerical equivalence testing
    const uniqueSolutions = deduplicateByEquivalence(allSolutions);
    
    // Sort by length, then alphabetically
    return uniqueSolutions.sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });
  }

  function deduplicateByEquivalence(expressions) {
    if (expressions.length === 0) return [];
    
    // Remove exact string duplicates first
    const uniqueExpressions = [...new Set(expressions)];
    
    // Group equivalent expressions by testing them directly
    const equivalenceGroups = [];
    const processed = new Set();
    
    for (let i = 0; i < uniqueExpressions.length; i++) {
      if (processed.has(i)) continue;
      
      const group = [uniqueExpressions[i]];
      processed.add(i);
      
      for (let j = i + 1; j < uniqueExpressions.length; j++) {
        if (processed.has(j)) continue;
        
        // Test if expressions are mathematically equivalent
        if (areExpressionsEquivalent(uniqueExpressions[i], uniqueExpressions[j])) {
          group.push(uniqueExpressions[j]);
          processed.add(j);
        }
      }
      
      // Keep the shortest/simplest expression from each group
      const representative = group.reduce((best, curr) => {
        // Prefer expressions without unnecessary parentheses
        const bestParens = (best.match(/[()]/g) || []).length;
        const currParens = (curr.match(/[()]/g) || []).length;
        
        if (curr.length < best.length) return curr;
        if (curr.length === best.length && currParens < bestParens) return curr;
        if (curr.length === best.length && currParens === bestParens && curr < best) return curr;
        return best;
      });
      
      equivalenceGroups.push(representative);
    }
    
    return equivalenceGroups;
  }
  
  function areExpressionsEquivalent(expr1, expr2) {
    // Extract digits from both expressions
    const digits1 = expr1.match(/\d/g) || [];
    const digits2 = expr2.match(/\d/g) || [];
    
    // They must use the same number of digits
    if (digits1.length !== digits2.length) return false;
    
    // Check if they use the same multiset of digits
    const sorted1 = [...digits1].sort().join('');
    const sorted2 = [...digits2].sort().join('');
    if (sorted1 !== sorted2) return false;
    
    // Now test with many random substitutions
    const numTests = 100;
    
    for (let test = 0; test < numTests; test++) {
      // Generate random values for each unique digit
      const uniqueDigits = [...new Set(digits1)];
      const digitValues = {};
      
      uniqueDigits.forEach(digit => {
        // Use random values, avoiding zero for division safety
        let val = Math.random() * 20 - 10;
        if (Math.abs(val) < 0.5) val = val >= 0 ? 0.5 : -0.5;
        digitValues[digit] = val;
      });
      
      // Evaluate both expressions with these values
      const val1 = evaluateExpressionWithValues(expr1, digitValues);
      const val2 = evaluateExpressionWithValues(expr2, digitValues);
      
      // Skip if either evaluation failed
      if (isNaN(val1) || isNaN(val2) || !isFinite(val1) || !isFinite(val2)) {
        continue;
      }
      
      // Check if values are different (found a counterexample)
      const diff = Math.abs(val1 - val2);
      const magnitude = Math.max(Math.abs(val1), Math.abs(val2), 1);
      const relativeError = diff / magnitude;
      
      if (relativeError > 1e-10) {
        return false; // Found values where expressions differ
      }
    }
    
    // Also test with the actual digit values
    const actualUniqueDigits = [...new Set(digits1)];
    const actualDigitValues = {};
    actualUniqueDigits.forEach(digit => {
      actualDigitValues[digit] = parseInt(digit);
    });
    
    const actualVal1 = evaluateExpressionWithValues(expr1, actualDigitValues);
    const actualVal2 = evaluateExpressionWithValues(expr2, actualDigitValues);
    
    if (Math.abs(actualVal1 - actualVal2) > 1e-10) {
      return false;
    }
    
    return true; // Passed all tests
  }
  
  function evaluateExpressionWithValues(expr, digitValues) {
    // Replace each digit with its value
    let evalExpr = expr;
    
    // Replace digits from largest to smallest to avoid replacement issues
    const sortedDigits = Object.keys(digitValues).sort((a, b) => b.localeCompare(a));
    
    for (const digit of sortedDigits) {
      const regex = new RegExp(`\\b${digit}\\b`, 'g');
      evalExpr = evalExpr.replace(regex, `(${digitValues[digit]})`);
    }
    
    try {
      // Safety check
      if (!/^[0-9+\-*/().\s]+$/.test(evalExpr)) {
        return NaN;
      }
      return Function('"use strict"; return (' + evalExpr + ')')();
    } catch (e) {
      return NaN;
    }
  }

  function generateAllExpressions(digits, callback) {
    const n = digits.length;
    
    // Dynamic programming with bitmasks
    const dp = Array(1 << n).fill(null).map(() => new Map());
    
    // Initialize single digits
    for (let i = 0; i < n; i++) {
      const expr = digits[i].toString();
      dp[1 << i].set(expr, digits[i]);
    }
    
    // Build up combinations
    for (let mask = 1; mask < (1 << n); mask++) {
      const bitCount = countBits(mask);
      if (bitCount < 2) continue;
      
      // Try all ways to split this mask into two non-empty parts
      for (let submask = (mask - 1) & mask; submask > 0; submask = (submask - 1) & mask) {
        const other = mask ^ submask;
        if (other === 0 || other > submask) continue; // Avoid duplicates
        
        const leftExprs = dp[submask];
        const rightExprs = dp[other];
        
        if (!leftExprs || !rightExprs || leftExprs.size === 0 || rightExprs.size === 0) continue;
        
        // Try all combinations with all operators
        for (const [leftExpr, leftVal] of leftExprs) {
          for (const [rightExpr, rightVal] of rightExprs) {
            // Addition
            tryOperation(leftExpr, leftVal, rightExpr, rightVal, '+', dp[mask]);
            
            // Subtraction (both orders)
            tryOperation(leftExpr, leftVal, rightExpr, rightVal, '-', dp[mask]);
            tryOperation(rightExpr, rightVal, leftExpr, leftVal, '-', dp[mask]);
            
            // Multiplication
            tryOperation(leftExpr, leftVal, rightExpr, rightVal, '*', dp[mask]);
            
            // Division (both orders if valid)
            if (Math.abs(rightVal) > 0.0001) {
              tryOperation(leftExpr, leftVal, rightExpr, rightVal, '/', dp[mask]);
            }
            if (Math.abs(leftVal) > 0.0001) {
              tryOperation(rightExpr, rightVal, leftExpr, leftVal, '/', dp[mask]);
            }
          }
        }
      }
    }
    
    // Report all results for the full set
    const fullMask = (1 << n) - 1;
    if (dp[fullMask]) {
      for (const [expr, value] of dp[fullMask]) {
        callback(expr, value);
      }
    }
  }

  function tryOperation(leftExpr, leftVal, rightExpr, rightVal, op, targetMap) {
    let value;
    switch(op) {
      case '+': value = leftVal + rightVal; break;
      case '-': value = leftVal - rightVal; break;
      case '*': value = leftVal * rightVal; break;
      case '/': value = leftVal / rightVal; break;
    }
    
    if (!isFinite(value)) return;
    
    const expr = buildExpression(leftExpr, rightExpr, op);
    
    // Store expression if we haven't seen this exact string yet
    if (!targetMap.has(expr)) {
      targetMap.set(expr, value);
    }
  }

  function buildExpression(left, right, op) {
    const prec = {'+': 1, '-': 1, '*': 2, '/': 2};
    
    const leftNeedsParens = needsParens(left, op, false);
    const rightNeedsParens = needsParens(right, op, true);
    
    const l = leftNeedsParens ? `(${left})` : left;
    const r = rightNeedsParens ? `(${right})` : right;
    
    return `${l}${op}${r}`;
  }

  function needsParens(expr, parentOp, isRight) {
    // Single digit never needs parens
    if (/^\d+$/.test(expr)) return false;
    
    // Find the main operator
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
    
    // Lower precedence needs parens
    if (prec[mainOp] < prec[parentOp]) return true;
    
    // Same precedence: right side of - or / needs parens
    if (isRight && prec[mainOp] === prec[parentOp] && 
        (parentOp === '-' || parentOp === '/')) {
      return true;
    }
    
    return false;
  }

  function countBits(n) {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }
});