/**
 * Bitmap font glyph generator for RaidRushUI.
 * Renders glyphs at native 1x resolution with canvas built-in AA.
 * Output: white-on-transparent PNGs for tinting via draw_texture.
 */
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

const FONT_PATH = "C:/weewoo2/scripts_data/ultima_ui_fonts/expressway.ttf";
const OUT_DIR = path.join(__dirname, "textures", "fonts", "expressway");
const SIZES = [12, 14, 16, 18];
const CHAR_START = 32;
const CHAR_END = 126;
const PAD = 1;

GlobalFonts.registerFromPath(FONT_PATH, "Expressway");

const metrics = {};

for (const size of SIZES) {
    const sizeDir = path.join(OUT_DIR, String(size));
    fs.mkdirSync(sizeDir, { recursive: true });

    const sizeMetrics = {};
    const fontStr = `${size}px Expressway`;

    // Measure font-level metrics
    const mCtx = createCanvas(400, 400).getContext("2d");
    mCtx.font = fontStr;
    mCtx.textBaseline = "alphabetic";

    const mTest = mCtx.measureText("HgJjQqYy|ÀÿWMfp");
    const fontAscent = Math.ceil(mTest.actualBoundingBoxAscent || size);
    const fontDescent = Math.ceil(mTest.actualBoundingBoxDescent || Math.ceil(size * 0.3));
    const lineHeight = fontAscent + fontDescent;
    const canvasH = lineHeight + PAD * 2;

    for (let code = CHAR_START; code <= CHAR_END; code++) {
        const ch = String.fromCharCode(code);
        const m = mCtx.measureText(ch);
        const advance = m.width;

        const charLeft = Math.ceil(m.actualBoundingBoxLeft || 0);
        const charRight = Math.ceil(m.actualBoundingBoxRight || Math.ceil(m.width));
        const canvasW = charLeft + charRight + PAD * 2;

        if (canvasW <= PAD * 2 || code === 32) {
            sizeMetrics[code] = {
                w: 0, h: canvasH,
                advance: Math.round(advance * 10) / 10,
                ox: 0, oy: 0,
            };
            continue;
        }

        const canvas = createCanvas(canvasW, canvasH);
        const ctx = canvas.getContext("2d");
        ctx.font = fontStr;
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "white";
        ctx.fillText(ch, PAD + charLeft, PAD + fontAscent);

        const pngBuf = canvas.toBuffer("image/png");
        fs.writeFileSync(path.join(sizeDir, `${code}.png`), pngBuf);

        sizeMetrics[code] = {
            w: canvasW,
            h: canvasH,
            advance: Math.round(advance * 10) / 10,
            ox: -(PAD + charLeft),
            oy: -PAD,
        };
    }

    metrics[size] = {
        lineHeight: canvasH,
        glyphs: sizeMetrics,
    };

    console.log(`Size ${size}: ${Object.keys(sizeMetrics).length} glyphs, lineH=${canvasH}`);
}

fs.writeFileSync(path.join(OUT_DIR, "metrics.json"), JSON.stringify(metrics, null, 2));
console.log(`\nDone! Native 1x glyphs generated.`);
