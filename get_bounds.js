const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const svgData = fs.readFileSync('public/banner.svg', 'utf8');
const dom = new JSDOM(svgData);
const document = dom.window.document;

function getPathBounds(d) {
    if (!d) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
    if (!commands) return null;
    
    let currentX = 0, currentY = 0;
    for (const cmd of commands) {
        const type = cmd[0];
        const argsStr = cmd.substring(1).trim().replace(/,/g, ' ');
        if (!argsStr) continue;
        const formattedArgsStr = argsStr.replace(/([^eE\s])-/g, '$1 -');
        const args = formattedArgsStr.split(/\s+/).map(Number);
        
        switch (type.toUpperCase()) {
            case 'M':
            case 'L':
                for (let i = 0; i < args.length; i += 2) {
                    if (isNaN(args[i]) || isNaN(args[i+1])) continue;
                    currentX = type === 'M' || type === 'L' ? args[i] : currentX + args[i];
                    currentY = type === 'M' || type === 'L' ? args[i+1] : currentY + args[i+1];
                    minX = Math.min(minX, currentX); maxX = Math.max(maxX, currentX);
                    minY = Math.min(minY, currentY); maxY = Math.max(maxY, currentY);
                }
                break;
            case 'H':
                for (let i = 0; i < args.length; i++) {
                    if (isNaN(args[i])) continue;
                    currentX = type === 'H' ? args[i] : currentX + args[i];
                    minX = Math.min(minX, currentX); maxX = Math.max(maxX, currentX);
                }
                break;
            case 'V':
                for (let i = 0; i < args.length; i++) {
                    if (isNaN(args[i])) continue;
                    currentY = type === 'V' ? args[i] : currentY + args[i];
                    minY = Math.min(minY, currentY); maxY = Math.max(maxY, currentY);
                }
                break;
            case 'C':
                for (let i = 0; i < args.length; i += 6) {
                    if (isNaN(args[i]) || isNaN(args[i+5])) continue;
                    minX = Math.min(minX, currentX, args[i], args[i+2], args[i+4]);
                    maxX = Math.max(maxX, currentX, args[i], args[i+2], args[i+4]);
                    minY = Math.min(minY, currentY, args[i+1], args[i+3], args[i+5]);
                    maxY = Math.max(maxY, currentY, args[i+1], args[i+3], args[i+5]);
                    currentX = type === 'C' ? args[i+4] : currentX + args[i+4];
                    currentY = type === 'C' ? args[i+5] : currentY + args[i+5];
                }
                break;
        }
    }
    return minX !== Infinity ? { minX, minY, maxX, maxY } : null;
}

const paths = document.querySelectorAll('.path-fg');
const items = [];

paths.forEach(p => {
    let bounds = null;
    if (p.tagName === 'path') bounds = getPathBounds(p.getAttribute('d'));
    if (p.tagName === 'polygon' || p.tagName === 'polyline') {
        bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
        (p.getAttribute('points') || '').split(/[\s,]+/).forEach((v, i) => {
            if (i % 2 === 0) { bounds.minX = Math.min(bounds.minX, Number(v)); bounds.maxX = Math.max(bounds.maxX, Number(v)); }
            else { bounds.minY = Math.min(bounds.minY, Number(v)); bounds.maxY = Math.max(bounds.maxY, Number(v)); }
        });
    }
    
    if (bounds && bounds.minX !== Infinity) {
        items.push({
            minX: bounds.minX, minY: bounds.minY, maxX: bounds.maxX, maxY: bounds.maxY,
            w: bounds.maxX - bounds.minX, h: bounds.maxY - bounds.minY
        });
    }
});

// Group overlapping/adjacent paths to find the major objects
const objects = [];
for (const item of items) {
    if (item.w === 0 || item.h === 0) continue;
    
    let added = false;
    for (const obj of objects) {
        // If they overlap or are close (within 150px)
        const overlapX = item.minX <= obj.maxX + 150 && item.maxX >= obj.minX - 150;
        const overlapY = item.minY <= obj.maxY + 150 && item.maxY >= obj.minY - 150;
        
        if (overlapX && overlapY) {
            obj.minX = Math.min(obj.minX, item.minX);
            obj.maxX = Math.max(obj.maxX, item.maxX);
            obj.minY = Math.min(obj.minY, item.minY);
            obj.maxY = Math.max(obj.maxY, item.maxY);
            added = true;
            break;
        }
    }
    if (!added) {
        objects.push({ ...item });
    }
}

// Merge them until no more merges occur
let merged;
do {
    merged = false;
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const a = objects[i];
            const b = objects[j];
            const overlapX = a.minX <= b.maxX + 150 && a.maxX >= b.minX - 150;
            const overlapY = a.minY <= b.maxY + 150 && a.maxY >= b.minY - 150;
            if (overlapX && overlapY) {
                a.minX = Math.min(a.minX, b.minX);
                a.maxX = Math.max(a.maxX, b.maxX);
                a.minY = Math.min(a.minY, b.minY);
                a.maxY = Math.max(a.maxY, b.maxY);
                objects.splice(j, 1);
                merged = true;
                break;
            }
        }
        if (merged) break;
    }
} while (merged);

console.log(`Found ${objects.length} major vehicle clusters:`);
objects.forEach((obj, i) => {
    console.log(`Cluster ${i+1}: x=${Math.floor(obj.minX)}, y=${Math.floor(obj.minY)}, w=${Math.ceil(obj.maxX - obj.minX)}, h=${Math.ceil(obj.maxY - obj.minY)}`);
});
