/**
 * A lightweight, zero-dependency parser for nested YAML configurations.
 * Perfectly parses simple structures and nested objects used in BuildPortal configurations.
 * 
 * @param {string} yamlStr - The raw YAML content as a string
 * @returns {object} The parsed JSON object
 */
export function parseYaml(yamlStr) {
  const result = {};
  if (!yamlStr) return result;
  
  const lines = yamlStr.split('\n');
  const stack = [result];
  const indents = [-1];

  for (let line of lines) {
    const rawLine = line;
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    // Calculate indentation level (number of leading spaces)
    const indent = rawLine.match(/^\s*/)[0].length;

    // Pop stack until we are at the correct parent level
    while (indents.length > 1 && indent <= indents[indents.length - 1]) {
      stack.pop();
      indents.pop();
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let val = line.substring(colonIndex + 1).trim();

    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);

    const parent = stack[stack.length - 1];

    if (val === '') {
      // It is a nested object
      parent[key] = {};
      stack.push(parent[key]);
      indents.push(indent);
    } else {
      // It is a primitive value
      if (val.toLowerCase() === 'true') val = true;
      else if (val.toLowerCase() === 'false') val = false;
      else if (val.toLowerCase() === 'null') val = null;
      else if (!isNaN(val) && val !== '') val = Number(val);
      parent[key] = val;
    }
  }

  return result;
}
