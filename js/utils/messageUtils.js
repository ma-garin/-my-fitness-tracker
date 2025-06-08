// js/utils/messageUtils.js

/**
 * メッセージを表示する
 * @param {HTMLElement} element - メッセージを表示するDOM要素
 * @param {string} msg - 表示するメッセージ
 * @param {string} type - 'success', 'error', 'info' のいずれか
 */
export const showMessage = (element, msg, type) => {
    element.textContent = msg;
    element.className = `message ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 3000);
};