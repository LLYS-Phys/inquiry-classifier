import type { Category } from './types.js';

/**
 * Класификатор, базиран на правила: претеглени шаблони върху нормализиран текст.
 *
 * Принципи:
 *  - Шаблоните за ИНТЕНЦИЯ (напр. "не се зарежда", "не мога да вляза") тежат повече
 *    от шаблоните за ТЕМА (напр. "математика", "урок"), защото темата се среща във
 *    всички категории ("видеоурокът по математика не се зарежда" е технически проблем).
 *  - Всяко правило се брои най-много веднъж.
 *  - Правилата са данни, не код – лесно се разширяват и тестват.
 */

interface Rule {
  category: Category;
  /** Кратко име, което се връща в `signals`. */
  label: string;
  pattern: RegExp;
  weight: number;
}

/** Съвпада в началото на дума (за кирилица \b не работи, затова lookbehind). */
const start = (alternatives: string): RegExp =>
  new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})`, 'u');

export const RULES: readonly Rule[] = [
  // ── Достъп или регистрация ────────────────────────────────────────────────
  { category: 'access_registration', label: 'вход', pattern: start('вляз|влиз|влез|вход|логин|login|log in|sign in'), weight: 2.5 },
  { category: 'access_registration', label: 'парола', pattern: start('парол|password'), weight: 2 },
  { category: 'access_registration', label: 'регистрация', pattern: start('регистр|sign up|записвам се'), weight: 2.5 },
  { category: 'access_registration', label: 'профил/акаунт', pattern: start('профил|акаунт|account'), weight: 1.5 },
  { category: 'access_registration', label: 'имейл', pattern: start('имейл|емейл|e-?mail|мейл'), weight: 1 },
  { category: 'access_registration', label: 'достъп', pattern: start('достъп'), weight: 2 },
  { category: 'access_registration', label: 'потребителско име', pattern: start('потребителск\\p{L}* име|username'), weight: 2 },
  { category: 'access_registration', label: 'забравена парола/профил', pattern: start('забравен|забравих|възстановяван\\p{L}* (на )?(парол|профил|акаунт|достъп)'), weight: 2.5 },
  { category: 'access_registration', label: 'промяна на данни', pattern: start('промен\\p{L}*\\s.{0,30}(имейл|емейл|парол|име|телефон|профил|данни)'), weight: 2.5 },
  { category: 'access_registration', label: 'изтриване/деактивиране на профил', pattern: start('(изтри\\p{L}*|деактивир\\p{L}*|закри\\p{L}*)\\s.{0,20}(профил|акаунт)'), weight: 3 },
  { category: 'access_registration', label: 'блокиран профил', pattern: start('блокиран|заключен|блокира'), weight: 2.5 },
  { category: 'access_registration', label: 'потвърждение/2FA', pattern: start('двуфакт|2fa|код за потвърждение|потвърд\\p{L}*\\s.{0,15}(имейл|акаунт|профил|регистрация)'), weight: 2.5 },

  // ── Технически проблем ────────────────────────────────────────────────────
  { category: 'technical_issue', label: 'не се зарежда/отваря', pattern: start('не (се )?(зарежд|зареди|отвар|показв|пуск|възпроизвеж|стартир|визуализир|качва|запазва|изтегля|тръгва)'), weight: 4 },
  { category: 'technical_issue', label: 'не работи', pattern: start('не (работи|функциониран|функционира)'), weight: 4 },
  { category: 'technical_issue', label: 'не мога да отворя/гледам…', pattern: start('не мога да (отворя|видя|пусна|изтегля|кача|изпратя|предам|запазя|гледам|чуя|стартирам)'), weight: 3.5 },
  { category: 'technical_issue', label: 'грешка', pattern: start('грешк|error|бъг|bug|exception'), weight: 3 },
  { category: 'technical_issue', label: 'проблем', pattern: start('проблем'), weight: 1.5 },
  { category: 'technical_issue', label: 'срив/зависване', pattern: start('срив|забива|зависва|замръзва|бавн|прекъсва|крашва|crash'), weight: 3 },
  { category: 'technical_issue', label: 'видео/звук', pattern: start('видео|звук|буфер|плейър|субтитр'), weight: 1.5 },
  { category: 'technical_issue', label: 'празен/черен екран', pattern: start('(черен|бял|празен) екран'), weight: 3 },
  { category: 'technical_issue', label: 'устройство/браузър', pattern: start('браузър|chrome|firefox|safari|android|ios|приложение|таблет|уебсайт|сайт'), weight: 1 },

  // ── Учебно съдържание ─────────────────────────────────────────────────────
  { category: 'learning_content', label: 'упражнения', pattern: start('упражнен'), weight: 2.5 },
  { category: 'learning_content', label: 'клас', pattern: start('\\d+\\s*\\.?\\s*(-\\p{L}+\\s+)?клас|клас'), weight: 2.5 },
  { category: 'learning_content', label: 'учебен материал', pattern: start('учебн|материал|учебник|лекци|конспект|презентаци|работни листове|тетрадк'), weight: 2.5 },
  { category: 'learning_content', label: 'къде да намеря', pattern: start('къде\\s.{0,25}(намер|открия|има)|има ли'), weight: 2 },
  { category: 'learning_content', label: 'тест/задачи/изпит', pattern: start('тест|задач|контролн|изпит|матур|олимпиад|нво(?![\\p{L}])'), weight: 2 },
  { category: 'learning_content', label: 'урок/курс', pattern: start('урок|курс|глав[аи]|модул'), weight: 1 },
  { category: 'learning_content', label: 'учебен предмет', pattern: start('математик|български|литератур|физик|хими|биолог|истори|географ|английск|информатик|природни науки|околен свят'), weight: 0.75 },
  { category: 'learning_content', label: 'съдържание/програма', pattern: start('съдържание|програма|препоръч'), weight: 1.5 },

  // ── Друго (плащания, партньорства, жалби, благодарности) ──────────────────
  { category: 'other', label: 'плащане/фактура', pattern: start('фактур|плащан|абонамент|цена|цени|такса|отстъпк|ваучер|промо|сертификат|възстановяван\\p{L}* (на )?сума'), weight: 3 },
  { category: 'other', label: 'партньорство/реклама/кариера', pattern: start('партньор|сътрудничеств|реклам|преподавател|кариера|стаж|медии|пресата|работа при вас'), weight: 3 },
  { category: 'other', label: 'жалба/предложение', pattern: start('жалб|предложение|оплакван'), weight: 3 },
  { category: 'other', label: 'благодарност', pattern: start('благодар|поздрав'), weight: 3 },
  { category: 'other', label: 'работно време/контакт', pattern: start('работно време|работите ли|адрес|офис|телефон за връзка'), weight: 3 },
];

export interface RuleScores {
  scores: Record<Category, number>;
  signals: Record<Category, string[]>;
}

export interface RuleClassification {
  category: Category;
  confidence: number;
  /** Сигналите на победилата категория. */
  signals: string[];
  /** true, ако няма достатъчно доказателства за каквато и да е категория. */
  noEvidence: boolean;
  /**
   * true, ако поне още една категория има собствено доказателство (≥ MIN_EVIDENCE).
   * Такова запитване е смесено и трябва да се прецени от AI/човек, дори победителят да е уверен.
   */
  competing: boolean;
}

/** Минимален сбор от тегла, под който не вярваме на правилата. */
export const MIN_EVIDENCE = 2;
const MAX_RULE_CONFIDENCE = 0.95;

export function normalize(text: string): string {
  return text.toLocaleLowerCase('bg').replace(/ё/g, 'е');
}

export function scoreText(text: string): RuleScores {
  const normalized = normalize(text);
  const scores: Record<Category, number> = {
    technical_issue: 0,
    access_registration: 0,
    learning_content: 0,
    other: 0,
  };
  const signals: Record<Category, string[]> = {
    technical_issue: [],
    access_registration: [],
    learning_content: [],
    other: [],
  };

  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      scores[rule.category] += rule.weight;
      signals[rule.category].push(rule.label);
    }
  }
  return { scores, signals };
}

/**
 * Увереността расте с разликата между първата и втората категория,
 * а не само с броя съвпадения – така двусмислени запитвания получават ниска оценка
 * и се подават към AI (или към човек).
 */
export function classifyWithRules(text: string): RuleClassification {
  const { scores, signals } = scoreText(text);
  const ranked = (Object.entries(scores) as [Category, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const [topCategory, top] = ranked[0]!;
  const second = ranked[1]?.[1] ?? 0;

  if (top < MIN_EVIDENCE) {
    return { category: 'other', confidence: 0.3, signals: [], noEvidence: true, competing: false };
  }

  const confidence = Math.min(
    MAX_RULE_CONFIDENCE,
    0.5 + (0.5 * (top - second)) / (top + second + 1),
  );

  return {
    category: topCategory,
    confidence: Math.round(confidence * 100) / 100,
    signals: signals[topCategory],
    noEvidence: false,
    competing: second >= MIN_EVIDENCE,
  };
}
