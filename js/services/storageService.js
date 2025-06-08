// js/services/storageService.js

/**
 * ローカルストレージから記録を読み込む
 * @param {string} key - ローカルストレージのキー
 * @returns {Object} 日付をキーとする記録オブジェクト
 */
export const loadRecords = (key) => {
    const recordsJson = localStorage.getItem(key);
    return recordsJson ? JSON.parse(recordsJson) : {};
};

/**
 * ローカルストレージに記録を保存する
 * @param {string} key - ローカルストレージのキー
 * @param {Object} records - 保存する記録オブジェクト
 */
export const saveRecords = (key, records) => {
    localStorage.setItem(key, JSON.stringify(records));
};