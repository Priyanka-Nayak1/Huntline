import ExcelJS from "exceljs";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const reportsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../storage/reports");

export async function generateExcelReport({ reportDate, selected, sourceStats, excluded }) {
  await fs.mkdir(reportsDir, { recursive: true });
  const fileName = uniqueFileName(reportDate);
  const filePath = path.join(reportsDir, fileName);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AI Job Search Agent";
  workbook.created = new Date();

  addTopJobsSheet(workbook, selected);
  addSummarySheet(workbook, sourceStats);
  addExcludedSheet(workbook, excluded);

  await workbook.xlsx.writeFile(filePath);
  return { fileName, filePath };
}

function uniqueFileName(reportDate) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(11, 19);
  return `Daily_Job_Report_${reportDate}_${stamp}.xlsx`;
}

function addTopJobsSheet(workbook, selected) {
  const sheet = workbook.addWorksheet("Top Jobs");
  sheet.columns = [
    { header: "Rank", key: "rank", width: 8 },
    { header: "Match Score", key: "matchScore", width: 14 },
    { header: "Job Title", key: "title", width: 36 },
    { header: "Company", key: "company", width: 24 },
    { header: "Location", key: "location", width: 22 },
    { header: "Source", key: "source", width: 14 },
    { header: "Posted Date", key: "postedAt", width: 16 },
    { header: "Experience", key: "experience", width: 16 },
    { header: "Matching Skills", key: "matchingSkills", width: 32 },
    { header: "Missing Skills", key: "missingSkills", width: 28 },
    { header: "Why It Matches", key: "reasons", width: 48 },
    { header: "Application Link", key: "link", width: 40 },
  ];
  styleHeader(sheet);

  selected.forEach((item, index) => {
    const url = item.job.applicationUrl || item.job.url;
    const row = sheet.addRow({
      rank: index + 1,
      matchScore: `${item.match.matchScore}%`,
      title: item.job.title,
      company: item.job.company,
      location: item.job.location || "",
      source: item.job.source,
      postedAt: item.job.postedAt ? new Date(item.job.postedAt).toISOString().slice(0, 10) : "",
      experience: `${item.match.experienceScore}%`,
      matchingSkills: (item.match.matchingSkills || []).join(", "),
      missingSkills: (item.match.missingSkills || []).join(", "),
      reasons: (item.match.reasons || []).join("; "),
      link: url,
    });
    const cell = row.getCell("link");
    cell.value = { text: url, hyperlink: url };
    cell.font = { color: { argb: "FF1F6F6A" }, underline: true };
  });
}

function addSummarySheet(workbook, sourceStats) {
  const sheet = workbook.addWorksheet("Search Summary");
  sheet.columns = [
    { header: "Source", key: "source", width: 18 },
    { header: "Jobs Found", key: "jobsFound", width: 14 },
    { header: "Jobs After Filtering", key: "jobsAfterFiltering", width: 22 },
    { header: "Jobs Analyzed", key: "jobsAnalyzed", width: 16 },
    { header: "Jobs Selected", key: "jobsSelected", width: 16 },
  ];
  styleHeader(sheet);
  for (const row of sourceStats || []) {
    sheet.addRow(row);
  }
}

function addExcludedSheet(workbook, excluded) {
  const sheet = workbook.addWorksheet("Excluded Jobs");
  sheet.columns = [
    { header: "Job Title", key: "title", width: 36 },
    { header: "Company", key: "company", width: 24 },
    { header: "Match Score", key: "matchScore", width: 14 },
    { header: "Reason Excluded", key: "reason", width: 48 },
  ];
  styleHeader(sheet);
  for (const row of excluded || []) {
    sheet.addRow({
      title: row.title,
      company: row.company,
      matchScore: row.matchScore == null ? "" : `${row.matchScore}%`,
      reason: row.reason,
    });
  }
}

function styleHeader(sheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15232E" } };
  header.alignment = { vertical: "middle" };
}
