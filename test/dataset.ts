import type { Category } from '../src/types.js';

/** Малък ръчно етикетиран набор за регресионни тестове на правилата. */
export const LABELED: readonly { text: string; expected: Category }[] = [
  // Примерите от заданието
  { text: 'Не мога да вляза в профила си, въпреки че паролата е правилна.', expected: 'access_registration' },
  { text: 'Видеоурокът по математика не се зарежда.', expected: 'technical_issue' },
  { text: 'Къде мога да намеря упражненията за 5. клас?', expected: 'learning_content' },
  { text: 'Как мога да променя имейла на профила си?', expected: 'access_registration' },

  // Достъп или регистрация
  { text: 'Забравих паролата си, как да я възстановя?', expected: 'access_registration' },
  { text: 'Искам да се регистрирам, но не получавам имейл за потвърждение.', expected: 'access_registration' },
  { text: 'Акаунтът ми е блокиран след няколко опита за вход.', expected: 'access_registration' },
  { text: 'Как мога да изтрия профила си?', expected: 'access_registration' },
  { text: 'Нямам достъп до курса, който съм платил.', expected: 'access_registration' },

  // Технически проблем
  { text: 'Сайтът дава грешка 500, когато отворя таблото.', expected: 'technical_issue' },
  { text: 'Приложението крашва всеки път при стартиране на android.', expected: 'technical_issue' },
  { text: 'Няма звук във видеото, а субтитрите не работят.', expected: 'technical_issue' },
  { text: 'Страницата зависва и показва бял екран.', expected: 'technical_issue' },
  { text: 'Не мога да кача домашната си работа, бутонът не работи.', expected: 'technical_issue' },

  // Учебно съдържание
  { text: 'Има ли тестове за подготовка за НВО по български език?', expected: 'learning_content' },
  { text: 'Къде мога да намеря учебните материали по физика за 8 клас?', expected: 'learning_content' },
  { text: 'Търся конспект по литература за матурата.', expected: 'learning_content' },
  { text: 'Може ли да ми препоръчате задачи по география за 6. клас?', expected: 'learning_content' },
  { text: 'Има ли презентации към темата за фотосинтезата?', expected: 'learning_content' },

  // Друго
  { text: 'Искам да получа фактура за последното плащане.', expected: 'other' },
  { text: 'Благодаря за бързата помощ!', expected: 'other' },
  { text: 'Каква е цената на годишния абонамент?', expected: 'other' },
  { text: 'Интересувам се от партньорство с вашата платформа.', expected: 'other' },
  { text: 'Искам да подам жалба относно обслужването.', expected: 'other' },
  { text: 'Какво е работното ви време?', expected: 'other' },
];
