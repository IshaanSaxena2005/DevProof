import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Resume, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { skillsNamedIn } from './skill.service';
import { ResumeAnalysisService, type ResumeAnalysis } from './resumeAnalysis.service';

// ==========================================
// RESUME SERVICE
// ==========================================
// Stores an uploaded resume and extracts what can be read from it.
//
// A resume is self-reported prose, so nothing taken from it is written as
// evidence. Technologies found in the text are *reported* for the user to
// confirm, never turned into skills automatically — unlike a hackathon's
// technology list, which the user entered deliberately field by field. A
// resume mentions technologies in passing, inside job descriptions that may
// describe a team's stack rather than the author's own work.

/** Where uploaded files live. Outside src so a rebuild never touches them. */
const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads/resumes');

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME = 'application/pdf';

/** A heading is short; a sentence beginning "Experience building X" is not
 * one, so anything longer than this is treated as content. */
const MAX_HEADING_LENGTH = 40;

/**
 * PDF text extraction can emit a heading's first letter — or every letter —
 * as its own text fragment, so the joined line reads "E DUCATION",
 * "S KILLS" or "P R O J E C T S". A literal heading match then fails and,
 * because sections only break at recognised headings, every line after the
 * first matching heading collapses into that one section (in practice the
 * professional summary swallows the whole resume). Rejoining
 * single-letter-spaced runs recovers the heading. Only short lines are
 * candidates, and only when the literal match already failed.
 */
function joinFragmentedHeading(line: string): string {
  return line.replace(/([A-Za-z]) (?=[A-Za-z])/g, '$1');
}

/** Section headings recognised in a resume, in the order they usually appear. */
const SECTION_PATTERNS: { key: string; pattern: RegExp }[] = [
  { key: 'summary', pattern: /^(professional\s+)?(summary|profile|objective|about)\b/i },
  { key: 'experience', pattern: /^(work\s+|professional\s+)?(experience|employment|work history)\b/i },
  { key: 'education', pattern: /^(education|academics|academic background|qualifications)\b/i },
  { key: 'skills', pattern: /^(technical\s+)?(skills|technologies|tech stack|competencies)\b/i },
  { key: 'projects', pattern: /^(projects|personal projects|selected projects)\b/i },
  { key: 'certifications', pattern: /^(certifications?|licenses?|credentials)\b/i },
  { key: 'achievements', pattern: /^(achievements|awards|honors|honours)\b/i }
];

/**
 * The same headings with inter-word spacing optional, tried against the
 * rejoined line so a heading whose fragments were both split and letterspaced
 * ("W ORK H ISTORY") still bounds its section instead of leaking its content
 * into the previous section.
 */
const LENIENT_SECTION_PATTERNS = SECTION_PATTERNS.map(({ key, pattern }) => ({
  key,
  pattern: new RegExp(
    pattern.source.replace(/\\s\+/g, '\\s*').replace(/ /g, '\\s*'),
    pattern.flags
  )
}));

export interface ParsedResume {
  /** Text under each recognised heading. Absent keys were not found. */
  sections: Record<string, string>;
  /**
   * Technologies mentioned anywhere in the text.
   *
   * Reported only. The user decides whether any of these belong on their
   * profile — see the note at the top of this file.
   */
  detectedSkills: string[];
  wordCount: number;
  /**
   * Deterministic structured reading of the sections, computed at upload or
   * re-analysis time. Absent on records parsed before this field existed —
   * those still render from `sections` and can gain an analysis via
   * POST /resume/analyse, which re-reads the stored file.
   */
  analysis?: ResumeAnalysis;
}

export interface ResumeUpload {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export class ResumeService {
  /** The user's resume, or null. Never includes the full text. */
  static async get(userId: string) {
    const resume = await prisma.resume.findUnique({ where: { userId } });
    return resume ? ResumeService.toSummary(resume) : null;
  }

  /**
   * Store an uploaded resume, replacing any previous one.
   *
   * The file is written before the row so a successful record always has a file
   * behind it, and the previous file is removed only after the new row commits.
   */
  static async upload(userId: string, upload: ResumeUpload) {
    ResumeService.assertAcceptable(upload);

    const previous = await prisma.resume.findUnique({ where: { userId } });

    const directory = path.join(UPLOAD_ROOT, userId);
    await fs.mkdir(directory, { recursive: true });

    // The stored name is random: an uploaded filename is user input and must
    // never reach the filesystem, where "../" would escape the upload root.
    const storedName = `${crypto.randomUUID()}.pdf`;
    const absolutePath = path.join(directory, storedName);
    await fs.writeFile(absolutePath, upload.buffer);

    let parsed: ParsedResume | null = null;
    let parseError: string | null = null;
    let pageCount: number | null = null;

    try {
      const extraction = await ResumeService.extract(upload.buffer);
      parsed = extraction.parsed;
      pageCount = extraction.pageCount;
    } catch (error) {
      // A file that cannot be read is still kept: the user uploaded something
      // real, and telling them it failed is better than discarding it silently.
      parseError = (error as Error).message;
    }

    const storagePath = path.join(userId, storedName);
    const data = {
      fileName: upload.originalName,
      fileSize: upload.size,
      mimeType: upload.mimeType,
      storagePath,
      pageCount,
      extractedText: parsed ? Object.values(parsed.sections).join('\n\n') || null : null,
      parsed: parsed as unknown as Prisma.InputJsonValue,
      parseError
    };

    const resume = await prisma.resume.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });

    if (previous && previous.storagePath !== storagePath) {
      await ResumeService.removeFile(previous.storagePath);
    }

    return { resume: ResumeService.toSummary(resume), parsed, parseError };
  }

  /**
   * Re-run extraction and analysis over the file already on disk.
   *
   * Deterministic and side-effect free with respect to the user's records:
   * it rewrites only this row's parse fields, creates no skills and no
   * certifications, and cannot duplicate anything — every derived value is
   * recomputed from the same bytes. This is also how records uploaded before
   * structured analysis existed gain one, without a migration.
   */
  static async reanalyse(userId: string) {
    const existing = await prisma.resume.findUnique({ where: { userId } });
    if (!existing) {
      throw AppError.notFound('No resume has been uploaded.');
    }

    const { absolutePath } = await ResumeService.locate(userId);

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(absolutePath);
    } catch {
      throw AppError.notFound(
        'The stored resume file could not be read. Upload the resume again.'
      );
    }

    let parsed: ParsedResume | null = null;
    let parseError: string | null = null;
    let pageCount: number | null = null;

    try {
      const extraction = await ResumeService.extract(buffer);
      parsed = extraction.parsed;
      pageCount = extraction.pageCount;
    } catch (error) {
      // A file that used to parse but no longer does keeps its previous
      // analysis intact rather than being silently blanked.
      parseError = (error as Error).message;
      const resume = await prisma.resume.update({
        where: { userId },
        data: { parseError }
      });
      return { resume: ResumeService.toSummary(resume) };
    }

    const resume = await prisma.resume.update({
      where: { userId },
      data: {
        pageCount,
        extractedText: parsed ? Object.values(parsed.sections).join('\n\n') || null : null,
        parsed: parsed as unknown as Prisma.InputJsonValue,
        parseError: null
      }
    });

    return { resume: ResumeService.toSummary(resume) };
  }

  static async remove(userId: string): Promise<void> {
    const existing = await prisma.resume.findUnique({ where: { userId } });
    if (!existing) {
      throw AppError.notFound('No resume has been uploaded.');
    }

    await prisma.resume.delete({ where: { userId } });
    await ResumeService.removeFile(existing.storagePath);
  }

  /** Absolute path for download, verified to sit inside the upload root. */
  static async locate(userId: string): Promise<{ absolutePath: string; fileName: string }> {
    const existing = await prisma.resume.findUnique({ where: { userId } });
    if (!existing) {
      throw AppError.notFound('No resume has been uploaded.');
    }

    const absolutePath = path.resolve(UPLOAD_ROOT, existing.storagePath);
    // Defence in depth: the stored path is generated, not user input, but a
    // download handler must never serve a file from outside the upload root.
    if (!absolutePath.startsWith(path.resolve(UPLOAD_ROOT))) {
      throw AppError.notFound('No resume has been uploaded.');
    }

    return { absolutePath, fileName: existing.fileName };
  }

  private static assertAcceptable(upload: ResumeUpload): void {
    if (upload.mimeType !== ACCEPTED_MIME) {
      throw AppError.badRequest('Only PDF resumes are supported.');
    }
    if (upload.size > MAX_BYTES) {
      throw AppError.badRequest('Resume must be 5MB or smaller.');
    }
    // A PDF always starts with this marker; the declared MIME type is just a
    // header the client chose, so the bytes are checked too.
    if (upload.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw AppError.badRequest('That file is not a valid PDF.');
    }
  }

  /** Extract text with pdfjs and split it into recognised sections. */
  private static async extract(buffer: Buffer): Promise<{ parsed: ParsedResume; pageCount: number }> {
    // Imported lazily: pdfjs is ESM-only and costs noticeable startup time, so
    // a server that never receives an upload should never load it.
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const document = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true
    }).promise;

    const lines: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();

      // pdfjs emits positioned fragments, not lines. Fragments are grouped by
      // their y coordinate so a heading stays on its own line, which is what
      // the section matcher below depends on.
      const byLine = new Map<number, string[]>();
      for (const item of content.items as { str?: string; transform?: number[] }[]) {
        if (!item.str || !item.transform) continue;
        const y = Math.round(item.transform[5]);
        const existing = byLine.get(y);
        if (existing) existing.push(item.str);
        else byLine.set(y, [item.str]);
      }

      for (const y of [...byLine.keys()].sort((a, b) => b - a)) {
        const line = byLine.get(y)!.join(' ').replace(/\s+/g, ' ').trim();
        if (line) lines.push(line);
      }
    }

    const text = lines.join('\n');
    if (!text.trim()) {
      // Almost always a scanned resume: an image of text, with no text layer.
      throw new Error(
        'No text could be read from this PDF. If it is a scan or an image, re-export it as a text PDF.'
      );
    }

    const { header, sections } = ResumeService.splitSections(lines);

    return {
      pageCount: document.numPages,
      parsed: {
        sections,
        detectedSkills: skillsNamedIn(text).map((skill) => skill.name),
        wordCount: text.split(/\s+/).filter(Boolean).length,
        analysis: ResumeAnalysisService.analyse(header, sections)
      }
    };
  }

  /**
   * Group lines under the last recognised heading.
   *
   * Text before any heading is returned separately as the header block rather
   * than guessed at or thrown away — it is usually the name and contact block,
   * which attribution to a section would invent, but the contact analyser reads
   * it deliberately. An unrecognised layout simply yields fewer sections.
   */
  private static splitSections(lines: string[]): {
    header: string[];
    sections: Record<string, string>;
  } {
    const header: string[] = [];
    const sections: Record<string, string[]> = {};
    let current: string | null = null;

    for (const line of lines) {
      let heading: { key: string } | undefined;
      if (line.length <= MAX_HEADING_LENGTH) {
        heading =
          SECTION_PATTERNS.find(({ pattern }) => pattern.test(line)) ??
          SECTION_PATTERNS.find(({ pattern }) => pattern.test(joinFragmentedHeading(line))) ??
          LENIENT_SECTION_PATTERNS.find(({ pattern }) =>
            pattern.test(joinFragmentedHeading(line))
          );
      }
      if (heading) {
        current = heading.key;
        sections[current] ??= [];
        continue;
      }
      if (current) sections[current].push(line);
      else header.push(line);
    }

    const compact = Object.fromEntries(
      Object.entries(sections)
        .filter(([, body]) => body.length > 0)
        .map(([key, body]) => [key, body.join('\n')])
    );

    return { header, sections: compact };
  }

  /** Deleting a file that is already gone is not an error worth surfacing. */
  private static async removeFile(storagePath: string): Promise<void> {
    try {
      await fs.unlink(path.resolve(UPLOAD_ROOT, storagePath));
    } catch {
      /* already removed */
    }
  }

  /** Everything except the full text, which is large and rarely wanted. */
  private static toSummary(resume: Resume) {
    return {
      id: resume.id,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      pageCount: resume.pageCount,
      parsed: resume.parsed as unknown as ParsedResume | null,
      parseError: resume.parseError,
      uploadedAt: resume.uploadedAt
    };
  }
}
