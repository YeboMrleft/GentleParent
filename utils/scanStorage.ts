import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface SavedReportCard {
  id: string;
  filePath: string;
  date: string;
  childName: string;
  breakdown: string;
  talkScript: string;
  focusAreas: string;
}

export interface SavedClinicRecord {
  id: string;
  filePath: string;
  date: string;
  childName: string;
  scanType: 'visit' | 'vaccination';
  visitSummary: string;
  treatmentPlan: string;
  healthNotes: string;
}

const slug = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '_') || 'default';

const REPORT_KEY = (child: string) => `report_cards_v1_${slug(child)}`;
const CLINIC_KEY = (child: string) => `clinic_cards_v1_${slug(child)}`;

function reportDir(child: string): Directory {
  return new Directory(Paths.document, 'report_cards', slug(child));
}

function clinicDir(child: string): Directory {
  return new Directory(Paths.document, 'clinic_cards', slug(child));
}

async function writeImage(dir: Directory, base64: string): Promise<string> {
  dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, `${Date.now()}.jpg`);
  file.write(base64, { encoding: 'base64' });
  return file.uri;
}

// ─── Report Cards ────────────────────────────────────────────────────────────

export async function loadReportCards(childName: string): Promise<SavedReportCard[]> {
  const raw = await AsyncStorage.getItem(REPORT_KEY(childName));
  return raw ? JSON.parse(raw) : [];
}

export async function saveReportCard(
  imageBase64: string,
  childName: string,
  result: Pick<SavedReportCard, 'breakdown' | 'talkScript' | 'focusAreas'>
): Promise<SavedReportCard> {
  const filePath = await writeImage(reportDir(childName), imageBase64);
  const record: SavedReportCard = {
    id: Date.now().toString(),
    filePath,
    date: new Date().toISOString(),
    childName,
    ...result,
  };
  const existing = await loadReportCards(childName);
  await AsyncStorage.setItem(REPORT_KEY(childName), JSON.stringify([record, ...existing]));
  return record;
}

export async function deleteReportCard(childName: string, id: string): Promise<void> {
  const records = await loadReportCards(childName);
  const target  = records.find(r => r.id === id);
  if (target) {
    try { new File(target.filePath).delete(); } catch { /* already gone */ }
  }
  await AsyncStorage.setItem(REPORT_KEY(childName), JSON.stringify(records.filter(r => r.id !== id)));
}

// ─── Clinic Records ──────────────────────────────────────────────────────────

export async function loadClinicRecords(childName: string): Promise<SavedClinicRecord[]> {
  const raw = await AsyncStorage.getItem(CLINIC_KEY(childName));
  return raw ? JSON.parse(raw) : [];
}

export async function saveClinicRecord(
  imageBase64: string,
  childName: string,
  scanType: 'visit' | 'vaccination',
  result: Pick<SavedClinicRecord, 'visitSummary' | 'treatmentPlan' | 'healthNotes'>
): Promise<SavedClinicRecord> {
  const filePath = await writeImage(clinicDir(childName), imageBase64);
  const record: SavedClinicRecord = {
    id: Date.now().toString(),
    filePath,
    date: new Date().toISOString(),
    childName,
    scanType,
    ...result,
  };
  const existing = await loadClinicRecords(childName);
  await AsyncStorage.setItem(CLINIC_KEY(childName), JSON.stringify([record, ...existing]));
  return record;
}

export async function deleteClinicRecord(childName: string, id: string): Promise<void> {
  const records = await loadClinicRecords(childName);
  const target  = records.find(r => r.id === id);
  if (target) {
    try { new File(target.filePath).delete(); } catch { /* already gone */ }
  }
  await AsyncStorage.setItem(CLINIC_KEY(childName), JSON.stringify(records.filter(r => r.id !== id)));
}

// ─── Share & Print ───────────────────────────────────────────────────────────

export async function shareFile(filePath: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return;
  await Sharing.shareAsync(filePath, { mimeType: 'image/jpeg', dialogTitle: 'Share document' });
}

async function imageToDataUri(filePath: string): Promise<string> {
  const b64 = await new File(filePath).base64();
  return `data:image/jpeg;base64,${b64}`;
}

function htmlSection(label: string, color: string, body: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return `
    <div class="section" style="border-left:4px solid ${color}">
      <div class="label" style="color:${color}">${label}</div>
      <div class="body">${escaped}</div>
    </div>`;
}

function buildHtml(title: string, subtitle: string, imgSrc: string, sections: string, date: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #222; }
  .header { background: #5C6BC0; color: white; padding: 20px 24px; border-radius: 10px; margin-bottom: 20px; }
  .header h1 { margin: 0 0 4px; font-size: 20px; }
  .header p  { margin: 0; font-size: 13px; opacity: 0.85; }
  img { width: 100%; max-height: 340px; object-fit: contain; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd; }
  .section { background: #f9f9f9; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px; }
  .label { font-size: 11px; font-weight: 800; letter-spacing: 0.8px; margin-bottom: 8px; }
  .body  { font-size: 14px; line-height: 1.7; }
  .footer { font-size: 11px; color: #888; margin-top: 24px; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
</style></head><body>
<div class="header"><h1>${title}</h1><p>${subtitle}</p></div>
<img src="${imgSrc}" alt="Scanned document" />
${sections}
<div class="footer">
  Scanned with GentleParent &nbsp;·&nbsp; ${date} &nbsp;·&nbsp; For reference only<br>
  Documents are stored privately on your device only. Inka-Tech Solutions does not store or access your files.
</div>
</body></html>`;
}

export async function printReportCard(record: SavedReportCard): Promise<void> {
  const imgSrc = await imageToDataUri(record.filePath);
  const date   = new Date(record.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const html   = buildHtml(
    `📋 Report Card — ${record.childName || 'My Child'}`,
    `Scanned on ${date}`,
    imgSrc,
    htmlSection('📊 RESULTS BREAKDOWN', '#4CAF50', record.breakdown) +
    htmlSection('💬 TALK SCRIPT',       '#FF8F00', record.talkScript) +
    htmlSection('🎯 FOCUS AREAS',       '#1976D2', record.focusAreas),
    date,
  );
  await Print.printAsync({ html });
}

export async function printClinicRecord(record: SavedClinicRecord): Promise<void> {
  const imgSrc = await imageToDataUri(record.filePath);
  const date   = new Date(record.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const isVacc = record.scanType === 'vaccination';
  const color  = isVacc ? '#00897B' : '#1976D2';
  const html   = buildHtml(
    isVacc
      ? `💉 Vaccination Record — ${record.childName || 'My Child'}`
      : `🩺 Clinic Visit — ${record.childName || 'My Child'}`,
    `Scanned on ${date}`,
    imgSrc,
    htmlSection(isVacc ? '💉 VACCINATIONS GIVEN' : '🩺 VISIT SUMMARY',             color,     record.visitSummary)  +
    htmlSection(isVacc ? '📅 UPCOMING / NEXT DUE' : '💊 TREATMENT & NEXT STEPS',   '#E65100', record.treatmentPlan) +
    htmlSection('📝 HEALTH NOTES',                                                   '#558B2F', record.healthNotes),
    date,
  );
  await Print.printAsync({ html });
}
