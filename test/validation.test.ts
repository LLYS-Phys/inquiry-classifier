import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_INQUIRY_LENGTH, validateInput } from '../src/validation.js';

describe('validateInput', () => {
  it('приема нормален текст и го почиства', () => {
    const out = validateInput('  Здравейте,\n\n  имам   проблем.\u0000 ');
    assert.deepEqual(out, { ok: true, text: 'Здравейте, имам проблем.' });
  });

  it('отхвърля празен низ и само интервали', () => {
    for (const value of ['', '   ', '\n\t']) {
      const out = validateInput(value);
      assert.equal(out.ok, false);
      if (!out.ok) assert.equal(out.error.code, 'EMPTY_INPUT');
    }
  });

  it('отхвърля не-текстови стойности', () => {
    for (const value of [null, undefined, 42, {}, [], true]) {
      const out = validateInput(value);
      assert.equal(out.ok, false);
      if (!out.ok) assert.equal(out.error.code, 'INVALID_TYPE');
    }
  });

  it('отхвърля текст само от символи', () => {
    const out = validateInput('?!?! ...');
    assert.equal(out.ok, false);
    if (!out.ok) assert.equal(out.error.code, 'NO_MEANINGFUL_TEXT');
  });

  it('отхвърля твърде дълъг текст, но приема точно максимума', () => {
    const tooLong = validateInput('а'.repeat(MAX_INQUIRY_LENGTH + 1));
    assert.equal(tooLong.ok, false);
    if (!tooLong.ok) assert.equal(tooLong.error.code, 'TOO_LONG');

    assert.equal(validateInput('а'.repeat(MAX_INQUIRY_LENGTH)).ok, true);
  });
});
