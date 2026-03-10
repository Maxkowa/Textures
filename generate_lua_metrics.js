/**
 * Converts metrics.json to a Lua table for embedding in fonts.lua
 */
const fs = require("fs");
const path = require("path");

const metrics = JSON.parse(
    fs.readFileSync(path.join(__dirname, "textures/fonts/expressway/metrics.json"), "utf8")
);

let lua = "-- Auto-generated Expressway bitmap font metrics (2x supersampled)\n-- Format: {draw_w, draw_h, advance, offset_x, offset_y}\n-- draw_w/draw_h are 1x dimensions; textures are 2x resolution for smooth AA\nlocal M = {}\n\n";

for (const [size, data] of Object.entries(metrics)) {
    lua += `M[${size}] = { lineHeight = ${data.lineHeight}, g = {\n`;
    for (const [code, g] of Object.entries(data.glyphs)) {
        // Compact: {w, h, advance, ox, oy} — w/h are 1x draw dimensions
        lua += `  [${code}] = {${g.w},${g.h},${g.advance},${g.ox},${g.oy}},\n`;
    }
    lua += "}}\n\n";
}

lua += "return M\n";

const outPath = path.join(__dirname, "expressway_metrics.lua");
fs.writeFileSync(outPath, lua);
console.log(`Written to ${outPath} (${lua.length} bytes)`);