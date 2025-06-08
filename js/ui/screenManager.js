// js/ui/screenManager.js

// === DOM要素の取得 ===
const menuButton = document.getElementById('menuButton');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const menuItems = document.querySelectorAll('.menu-item');
const screenTitle = document.getElementById('screenTitle'); // ヘッダーのタイトル

// 各画面セクション (index.htmlのIDと一致させる)
const homeScreen = document.getElementById('homeScreen');
const foodScreen = document.getElementById('foodScreen');
const sportScreen = document.getElementById('sportScreen');
const graphScreen = document.getElementById('graphScreen');

// 画面情報の定義
const screens = {
    home: { element: homeScreen, title: 'Health Tracker' },
    food: { element: foodScreen, title: 'FOOD' },
    sport: { element: sportScreen, title: 'SPORT' },
    graph: { element: graphScreen, title: 'GRAPH' }
};

/**
 * 指定された画面を表示し、他の画面を非表示にする
 * @param {string} screenName - 表示する画面の名前 ('home', 'food', 'sport', 'graph')
 */
export const showScreen = (screenName) => {
    // すべての画面を非表示
    Object.values(screens).forEach(screen => {
        screen.element.classList.remove('active');
    });

    // 指定された画面を表示
    const targetScreen = screens[screenName];
    if (targetScreen) {
        targetScreen.element.classList.add('active');
        screenTitle.textContent = targetScreen.title; // ヘッダータイトルを更新
    }
    // サイドメニューとオーバーレイを閉じる
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');

    // メニューアイテムのアクティブ状態を更新
    menuItems.forEach(item => {
        if (item.dataset.screen === screenName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
};

/**
 * 画面切り替えに関するイベントリスナーを設定する
 */
export const setupScreenEventListeners = (updateChartCallback) => {
    // ハンバーガーメニューボタン
    menuButton.addEventListener('click', () => {
        sideMenu.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // オーバーレイクリックでメニューを閉じる
    overlay.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
    });

    // メニューアイテムクリック
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const screenName = e.target.dataset.screen;
            showScreen(screenName);
            // グラフ画面に切り替わったらグラフを更新
            if (screenName === 'graph' && typeof updateChartCallback === 'function') {
                updateChartCallback();
            }
        });
    });
};