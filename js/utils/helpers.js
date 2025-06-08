// js/utils/helpers.js

/**
 * メッセージを表示する。
 * @param {string} message - 表示するメッセージ。
 * @param {string} type - メッセージのタイプ ('success', 'error', 'info')。
 * @param {string} elementId - メッセージを表示するHTML要素のID。
 */
export const showMessage = (message, type, elementId) => {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `message ${type}`; // 既存のクラスを削除して新しいクラスを設定
        messageElement.style.display = 'block'; // 表示を確実にする

        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.className = 'message'; // クラスをリセット
            messageElement.style.display = 'none'; // 非表示に戻す
        }, 3000); // 3秒後にメッセージを消す
    }
};

/**
 * 日付文字列を 'YYYY年MM月DD日' 形式にフォーマットする。
 * @param {string} dateString - 'YYYY-MM-DD' 形式の日付文字列。
 * @returns {string} フォーマットされた日付文字列。
 */
export const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
};