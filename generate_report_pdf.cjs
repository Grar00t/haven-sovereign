const markdownpdf = require("markdown-pdf");
const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "FORENSIC_REPORT_PROJECT_DRAGON_403_HILO_V2.md");
const outputPath = path.join(__dirname, "FORENSIC_REPORT_PROJECT_DRAGON_403_HILO_V2.pdf");

console.log(`Generating PDF from ${inputPath}...`);

markdownpdf()
    .from(inputPath)
    .to(outputPath, function () {
        console.log(`PDF created at ${outputPath}`);
    });

// To run:
// 1. npm install markdown-pdf
// 2. node generate_report_pdf.js