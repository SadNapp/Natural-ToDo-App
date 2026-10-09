export const money = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 2 });
export const formatMoney = (value) => money.format(Number(value) || 0);
export const dateInput = (value = new Date()) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const monthInput = (value = new Date()) => dateInput(value).slice(0, 7);
export const operationInMonth = (operation, month) => operation.date?.slice(0, 7) === month;
