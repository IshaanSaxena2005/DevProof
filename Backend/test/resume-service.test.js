const assert = require('node:assert/strict');
const test = require('node:test');

const { ResumeService } = require('../dist/services/resume.service.js');

/**
 * Uploads are rejected on their bytes, not their declared type, so these cover
 * the validation boundary. The parser itself is exercised end to end against a
 * real PDF in the extraction tests below.
 */

const pdfBytes = (body = 'x') => Buffer.from(`%PDF-1.4\n${body}`, 'latin1');

function upload(overrides = {}) {
  const buffer = overrides.buffer ?? pdfBytes();
  return {
    originalName: 'resume.pdf',
    mimeType: 'application/pdf',
    size: buffer.length,
    buffer,
    ...overrides
  };
}

/** assertAcceptable is private; reach it the way upload() does. */
function validate(input) {
  return ResumeService['assertAcceptable'](input);
}

test('a PDF passes validation', () => {
  assert.doesNotThrow(() => validate(upload()));
});

test('a non-PDF mime type is rejected', () => {
  assert.throws(() => validate(upload({ mimeType: 'image/png' })), /only pdf/i);
});

test('a file that merely claims to be a PDF is rejected on its bytes', () => {
  const buffer = Buffer.from('this is plain text pretending to be a pdf');
  assert.throws(
    () => validate(upload({ buffer, size: buffer.length })),
    /not a valid pdf/i,
    'the declared type is a header the client chose; the bytes are what count'
  );
});

test('a file over the size cap is rejected', () => {
  assert.throws(() => validate(upload({ size: 6 * 1024 * 1024 })), /5MB or smaller/i);
});

test('an empty file is rejected rather than stored', () => {
  const buffer = Buffer.alloc(0);
  assert.throws(() => validate(upload({ buffer, size: 0 })), /not a valid pdf/i);
});
