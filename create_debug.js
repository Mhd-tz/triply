const fs = require('fs');

let svgData = fs.readFileSync('public/banner.svg', 'utf8');

// Inject grid lines every 100px to easily read coordinates from a screenshot
let gridLabels = '';
for (let x = 0; x < 4700; x += 100) {
    gridLabels += `<line x1="${x}" y1="0" x2="${x}" y2="896" stroke="red" stroke-width="2" opacity="0.3"/>\n`;
    gridLabels += `<text x="${x+5}" y="50" font-size="40" fill="red">${x}</text>\n`;
    gridLabels += `<text x="${x+5}" y="850" font-size="40" fill="red">${x}</text>\n`;
}
for (let y = 0; y < 900; y += 100) {
    gridLabels += `<line x1="0" y1="${y}" x2="4700" y2="${y}" stroke="blue" stroke-width="2" opacity="0.3"/>\n`;
    gridLabels += `<text x="50" y="${y+35}" font-size="40" fill="blue">${y}</text>\n`;
}

// Add our current guess as thick green boxes
// Train guess: x=1350, y=420, w=1330, h=180
// Cruise guess: x=800, y=480, w=1200, h=416
gridLabels += `<rect x="1350" y="420" width="1330" height="180" fill="none" stroke="green" stroke-width="10" />\n`;
gridLabels += `<rect x="800" y="480" width="1200" height="416" fill="none" stroke="green" stroke-width="10" />\n`;

svgData = svgData.replace('</svg>', `<g id="debug-grid">${gridLabels}</g></svg>`);
fs.writeFileSync('public/debug-banner.svg', svgData);

// Create HTML file to view it
const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; background: #eee;">
    <img src="debug-banner.svg" style="width: 100vw; height: auto;">
</body>
</html>
`;
fs.writeFileSync('public/debug.html', html);
