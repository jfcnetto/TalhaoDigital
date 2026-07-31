const ts = require("typescript");
const path = require("path");
const fs = require("fs");

const configPath = ts.findConfigFile(
  "C:/TalhaoDigital",
  ts.sys.fileExists,
  "tsconfig.json"
);

if (!configPath) {
  console.log("Could not find a valid 'tsconfig.json'.");
  process.exit(1);
}

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
if (configFile.error) {
  console.log(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
  process.exit(1);
}

const parsedCommandLine = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(configPath)
);

const program = ts.createProgram({
  options: parsedCommandLine.options,
  rootNames: parsedCommandLine.fileNames,
  configFileParsingDiagnostics: parsedCommandLine.errors
});

const emitResult = program.emit();
const allDiagnostics = ts
  .getPreEmitDiagnostics(program)
  .concat(emitResult.diagnostics);

if (allDiagnostics.length === 0) {
  console.log("SUCCESS: No TypeScript errors found.");
  fs.writeFileSync("ts_results.txt", "SUCCESS: No TypeScript errors found.");
} else {
  let output = "";
  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      output += `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}\n`;
    } else {
      output += ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n") + "\n";
    }
  });
  console.log("ERRORS FOUND:");
  console.log(output.substring(0, 1000));
  fs.writeFileSync("ts_results.txt", output);
}
