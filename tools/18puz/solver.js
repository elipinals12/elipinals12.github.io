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
    const solutions = findSolutions(digits, 18);
    
    if (solutions.length === 0) {
      outputDiv.innerHTML = '<div class="solution">No solutions found.</div>';
    } else {
      outputDiv.innerHTML = solutions.map(s => `<div class="solution">${s}</div>`).join('');
    }
  });

  function findSolutions(digits, target) {
    // Cache stores all possible values from each set of digits
    // Key: sorted array of digits (with multiplicities)
    // Value: Map of (value -> simplest expression)
    const cache = new Map();
    
    // Build all possible expressions recursively
    const allExpressions = getAllExpressions(digits);
    
    // Filter and deduplicate
    const uniqueSolutions = new Map();
    for (const [value, expr] of allExpressions) {
      if (Math.abs(value - target) < 0.0001) {
        // Create a canonical key for this expression
        const key = getCanonicalKey(expr, value);
        if (!uniqueSolutions.has(key) || expr.length < uniqueSolutions.get(key).length) {
          uniqueSolutions.set(key, expr);
        }
      }
    }
    
    // Sort results
    return Array.from(uniqueSolutions.values()).sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });
  }

  function getAllExpressions(digits) {
    const results = [];
    
    // Base case: single digit
    if (digits.length === 1) {
      results.push([digits[0], digits[0].toString()]);
      return results;
    }
    
    // Try all ways to split into two groups
    for (let mask = 1; mask < (1 << digits.length) - 1; mask++) {
      const group1 = [];
      const group2 = [];
      
      for (let i = 0; i < digits.length; i++) {
        if (mask & (1 << i)) {
          group1.push(digits[i]);
        } else {
          group2.push(digits[i]);
        }
      }
      
      // Get all expressions for each group
      const exprs1 = getAllExpressions(group1);
      const exprs2 = getAllExpressions(group2);
      
      // Combine them with all operations
      for (const [val1, expr1] of exprs1) {
        for (const [val2, expr2] of exprs2) {
          // Addition
          results.push([val1 + val2, buildExpr(expr1, expr2, '+')]);
          
          // Subtraction (both orders matter!)
          results.push([val1 - val2, buildExpr(expr1, expr2, '-')]);
          results.push([val2 - val1, buildExpr(expr2, expr1, '-')]);
          
          // Multiplication
          results.push([val1 * val2, buildExpr(expr1, expr2, '*')]);
          
          // Division (both orders, check for zero)
          if (val2 !== 0) {
            results.push([val1 / val2, buildExpr(expr1, expr2, '/')]);
          }
          if (val1 !== 0) {
            results.push([val2 / val1, buildExpr(expr2, expr1, '/')]);
          }
        }
      }
    }
    
    return results;
  }

  function buildExpr(left, right, op) {
    // Add parentheses only when necessary
    const leftNeedsParens = needsParens(left, op, false);
    const rightNeedsParens = needsParens(right, op, true);
    
    const leftExpr = leftNeedsParens ? `(${left})` : left;
    const rightExpr = rightNeedsParens ? `(${right})` : right;
    
    return `${leftExpr}${op}${rightExpr}`;
  }

  function needsParens(expr, parentOp, isRight) {
    // Single number never needs parens
    if (/^\d+$/.test(expr)) return false;
    
    // Find the main operator
    const mainOp = findMainOp(expr);
    if (!mainOp) return false;
    
    const prec = {'+': 1, '-': 1, '*': 2, '/': 2};
    
    // Lower precedence needs parens
    if (prec[mainOp] < prec[parentOp]) return true;
    
    // Right operand of - or / needs parens if same precedence
    if (isRight && prec[mainOp] === prec[parentOp] && (parentOp === '-' || parentOp === '/')) {
      return true;
    }
    
    return false;
  }

  function findMainOp(expr) {
    let depth = 0;
    let mainOp = null;
    let minPrec = 999;
    const prec = {'+': 1, '-': 1, '*': 2, '/': 2};
    
    for (let i = expr.length - 1; i >= 0; i--) {
      if (expr[i] === ')') depth++;
      else if (expr[i] === '(') depth--;
      else if (depth === 0 && prec[expr[i]] !== undefined) {
        if (prec[expr[i]] <= minPrec) {
          minPrec = prec[expr[i]];
          mainOp = expr[i];
        }
      }
    }
    
    return mainOp;
  }

  function getCanonicalKey(expr, value) {
    // Create a key that identifies mathematically equivalent expressions
    // We'll use a combination of the value and a normalized structure
    
    // Parse expression into a tree
    const tree = parseToTree(expr);
    
    // Get canonical form of tree
    const canonical = treeToCanonical(tree);
    
    // Include value to handle floating point equivalences
    return `${canonical}|${value.toFixed(6)}`;
  }

  function parseToTree(expr) {
    // Remove outer parens if they exist
    expr = expr.trim();
    while (expr.startsWith('(') && expr.endsWith(')') && matchingParen(expr, 0) === expr.length - 1) {
      expr = expr.slice(1, -1);
    }
    
    // Find main operator
    let mainOpPos = -1;
    let mainOp = null;
    let depth = 0;
    let minPrec = 999;
    const prec = {'+': 1, '-': 1, '*': 2, '/': 2};
    
    for (let i = expr.length - 1; i >= 0; i--) {
      if (expr[i] === ')') depth++;
      else if (expr[i] === '(') depth--;
      else if (depth === 0 && prec[expr[i]] !== undefined) {
        if (prec[expr[i]] <= minPrec) {
          minPrec = prec[expr[i]];
          mainOp = expr[i];
          mainOpPos = i;
        }
      }
    }
    
    if (mainOpPos === -1) {
      // Just a number
      return { type: 'num', value: parseInt(expr) };
    }
    
    // Split and recursively parse
    const left = parseToTree(expr.slice(0, mainOpPos));
    const right = parseToTree(expr.slice(mainOpPos + 1));
    
    return { type: 'op', op: mainOp, left, right };
  }

  function matchingParen(expr, start) {
    let depth = 1;
    for (let i = start + 1; i < expr.length; i++) {
      if (expr[i] === '(') depth++;
      else if (expr[i] === ')') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  function treeToCanonical(tree) {
    if (tree.type === 'num') {
      return `N${tree.value}`;
    }
    
    const leftCanon = treeToCanonical(tree.left);
    const rightCanon = treeToCanonical(tree.right);
    
    // For commutative ops, sort operands
    if (tree.op === '+' || tree.op === '*') {
      const sorted = [leftCanon, rightCanon].sort();
      return `(${tree.op}:${sorted[0]},${sorted[1]})`;
    }
    
    // For non-commutative ops, preserve order
    return `(${tree.op}:${leftCanon},${rightCanon})`;
  }
});