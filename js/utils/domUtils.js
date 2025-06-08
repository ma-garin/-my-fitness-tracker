// js/utils/domUtils.js

const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const menuButton = document.getElementById('menuButton');
const screenTitle = document.getElementById('screenTitle');
const menuItems = document.querySelectorAll('.menu-item');
const screens = document.querySelectorAll('.screen');

/**
 * サイドメニューとオーバーレイを初期化し、メニューボタンのイベントリスナーを設定する。
 */
export const initializeMenu = () => {
    if (menuButton) {
        menuButton.addEventListener('click', toggleMenu);
    }
    if (overlay) {
        overlay.addEventListener('click', toggleMenu); // オーバーレイクリックでメニューを閉じる
    }

    // メニュー項目のクリックイベントリスナー
    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            const screenName = item.dataset.screen;
            showScreen(screenName);
            toggleMenu(); // メニューを閉じる
        });
    });
};

/**
 * サイドメニューの表示/非表示を切り替える。
 */
const toggleMenu = () => {
    sideMenu.classList.toggle('active');
    overlay.classList.toggle('active');
};

/**
 * 指定された画面を表示し、他の画面を非表示にする。
 * @param {string} screenName - 表示する画面のID (例: 'home', 'food')。
 */
export const showScreen = (screenName) => {
    screens.forEach(screen => {
        if (screen.id === `${screenName}Screen`) {
            screen.classList.add('active');
        } else {
            screen.classList.remove('active');
        }
    });

    // アクティブなメニュー項目を更新
    menuItems.forEach(item => {
        if (item.dataset.screen === screenName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // ヘッダーのタイトルを更新
    updateScreenTitle(screenName);
};

/**
 * ヘッダーのタイトルを現在の画面に合わせて更新する。
 * @param {string} screenName - 現在表示されている画面のID。
 */
const updateScreenTitle = (screenName) => {
    let title = 'Health Tracker'; // デフォルトタイトル
    switch (screenName) {
        case 'home':
            title = 'HOME';
            break;
        case 'food':
            title = 'FOOD';
            break;
        case 'sport':
            title = 'SPORT';
            break;
        case 'graph':
            title = 'GRAPH';
            break;
        default:
            title = 'Health Tracker';
    }
    if (screenTitle) {
        screenTitle.textContent = title;
    }
};