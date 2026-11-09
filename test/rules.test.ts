import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyWithRules } from '../src/rules.js';
import { LABELED } from './dataset.js';

describe('правила', () => {
  for (const { text, expected } of LABELED.slice(0, 4)) {
    it(`пример от заданието: "${text}" → ${expected}`, () => {
      assert.equal(classifyWithRules(text).category, expected);
    });
  }

  it('темата не води до грешна категория: интенцията тежи повече', () => {
    const r = classifyWithRules('Видеоурокът по математика не се зарежда.');
    assert.equal(r.category, 'technical_issue');
  });

  it('текст без сигнали → "Друго" с ниска увереност', () => {
    const r = classifyWithRules('Здравейте, имам един въпрос.');
    assert.equal(r.category, 'other');
    assert.equal(r.noEvidence, true);
    assert.ok(r.confidence < 0.6);
  });

  it('смесено запитване получава по-ниска увереност от ясно', () => {
    const clear = classifyWithRules('Забравих паролата си и не мога да вляза в профила.');
    const mixed = classifyWithRules('Не мога да отворя урока по математика.');
    assert.ok(mixed.confidence < clear.confidence);
  });

  it('competing: втора категория със собствено доказателство, дори победителят да е уверен', () => {
    const mixed = classifyWithRules(
      'Получавам грешка, когато се опитам да вляза в профила си с парола и да се регистрирам.',
    );
    assert.equal(mixed.category, 'access_registration');
    assert.ok(mixed.confidence >= 0.7, 'победителят е уверен…');
    assert.equal(mixed.competing, true, '…но има и технически сигнал');

    assert.equal(classifyWithRules('Забравих паролата си.').competing, false);
    // Само тема (математика) не е конкуриращо доказателство.
    assert.equal(classifyWithRules('Видеоурокът по математика не се зарежда.').competing, false);
  });

  it('точност върху етикетирания набор е поне 90%', () => {
    const wrong = LABELED.filter((s) => classifyWithRules(s.text).category !== s.expected);
    const accuracy = 1 - wrong.length / LABELED.length;
    assert.ok(
      accuracy >= 0.9,
      `Точност ${(accuracy * 100).toFixed(0)}%. Грешни: ${wrong.map((w) => w.text).join(' | ')}`,
    );
  });
});
