// js/utils/dateUtils.js

/**
 * 今日の日付を YYYY-MM-DD 形式で取得する
 * @returns {string} フォーマットされた日付文字列
 */
export const getFormattedToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};