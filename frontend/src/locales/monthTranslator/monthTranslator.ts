import i18n from '../../i18n';

const monthsUA = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
];

const monthsEN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const monthsPL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

export const translateMonth = (enMonth: string): string => {
    const index = monthsEN.findIndex((m) => m.toLowerCase() === enMonth.toLowerCase());
    if(index === -1) return enMonth;

    const lang = i18n.language;
    // console.log('lang', lang);
    switch (lang) {
        case 'uk':
            return monthsUA[index];
        case 'pl':
            return monthsPL[index];
        default:
            return monthsEN[index];
    }
};