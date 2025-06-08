// js/utils/storage.js

/**
 * ローカルストレージから指定されたキーのデータを取得する。
 * @param {string} key - データを取得するキー。
 * @returns {Array<Object>} 取得したデータ（存在しない場合は空の配列）。
 */
export const getRecords = (key) => {
    const records = localStorage.getItem(key);
    return records ? JSON.parse(records) : [];
};

/**
 * 指定されたキーでデータをローカルストレージに保存する。
 * @param {string} key - データを保存するキー。
 * @param {Array<Object>} data - 保存するデータ。
 */
export const saveRecords = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

/**
 * 指定されたキーのデータから、特定の日付の記録を削除する。
 * @param {string} key - データが保存されているキー。
 * @param {string} dateToDelete - 削除する記録の日付 (YYYY-MM-DD)。
 */
export const deleteRecord = (key, dateToDelete) => {
    let records = getRecords(key);
    records = records.filter(record => record.date !== dateToDelete);
    saveRecords(key, records);
};

/**
 * 指定されたキーの全ての記録を削除する。
 * @param {string} key - データを削除するキー。
 */
export const clearAllRecordsByType = (key) => {
    localStorage.removeItem(key);
};