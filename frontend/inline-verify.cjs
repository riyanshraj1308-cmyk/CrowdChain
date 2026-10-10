// One-off: inline the verify build's CSS/JS into dist-verify/index.html so the
// static preview (single file) can serve the whole app.
const fs = require("fs");
const p = "dist-verify/index.html";
let h = fs.readFileSync(p, "utf8");

const cssFile = fs
  .readdirSync("dist-verify/assets")
  .find((f) => f.endsWith(".css"));
const css = fs.readFileSync("dist-verify/assets/" + cssFile, "utf8");

const jsFiles = fs
  .readdirSync("dist-verify/assets")
  .filter((f) => f.endsWith(".js"));
let jss = "";
for (const f of jsFiles) {
  const code = fs
    .readFileSync("dist-verify/assets/" + f, "utf8")
    .replace(/<\/script>/g, "<\\/script>")
    .replace(/<script>/g, "<\\u003cscript>");
  jss += '<script type="module">' + code + "</script>";
}

// Replacer FUNCTIONS, not strings — minified code contains `$&`/`$'`
// sequences that String.replace would otherwise expand as patterns.
h = h.replace(
  /<link rel="stylesheet"[^>]*>/,
  function () {
    return "<style>" + css + "</style>";
  }
);
h = h.replace(
  /<script type="module"[^>]*><\/script>/,
  function () {
    return jss;
  }
);
fs.writeFileSync(p, h);
console.log("inlined", css.length, "css chars,", jsFiles.length, "js files");
