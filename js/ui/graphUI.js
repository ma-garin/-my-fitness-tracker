// js/ui/graphUI.js
import { getRecords } from '../utils/storage.js';
import { showMessage } from '../utils/helpers.js';

// DOM要素の取得
const chartTypeSelect = document.getElementById('chartType');
const chartPeriodSelect = document.getElementById('chartPeriod');
const myChartCanvas = document.getElementById('myChart');
const noChartDataMessage = document.getElementById('noChartDataMessage');

let myChart; // Chart.jsのインスタンスを保持する変数

// 初期化関数
export const initializeGraph = () => {
    // 選択ボックスの変更イベントリスナー
    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', updateChart);
    }
    if (chartPeriodSelect) {
        chartPeriodSelect.addEventListener('change', updateChart);
    }

    // グラフ画面がアクティブになったときに描画する
    // app.jsでshowScreen('graph')が呼ばれたときに、この関数が呼ばれるように設計されていることを想定
    // または、初回ロード時にも描画
    updateChart();
};

// グラフを更新する関数
export const updateChart = () => {
    const selectedType = chartTypeSelect.value;
    const selectedPeriod = chartPeriodSelect.value;
    const records = getRecords('mainRecords').sort((a, b) => new Date(a.date) - new Date(b.date)); // 日付の古い順にソート

    let filteredRecords = records;
    if (selectedPeriod !== 'all') {
        const today = new Date();
        const cutoffDate = new Date();
        if (selectedPeriod === '7days') {
            cutoffDate.setDate(today.getDate() - 7);
        } else if (selectedPeriod === '30days') {
            cutoffDate.setDate(today.getDate() - 30);
        } else if (selectedPeriod === '90days') {
            cutoffDate.setDate(today.getDate() - 90);
        }
        filteredRecords = records.filter(record => new Date(record.date) >= cutoffDate);
    }

    // データが存在し、かつ選択されたタイプに有効なデータがあるかチェック
    const hasValidData = filteredRecords.some(record => record[selectedType] !== null && !isNaN(record[selectedType]));

    if (filteredRecords.length === 0 || !hasValidData) {
        // データがない場合はメッセージを表示し、グラフを非表示にする
        noChartDataMessage.style.display = 'block';
        myChartCanvas.style.display = 'none';
        if (myChart) {
            myChart.destroy(); // 既存のグラフがあれば破棄
            myChart = null;
        }
        return;
    } else {
        noChartDataMessage.style.display = 'none';
        myChartCanvas.style.display = 'block';
    }

    const labels = filteredRecords.map(record => record.date);
    const data = filteredRecords.map(record => record[selectedType]);

    const datasets = [{
        label: getLabel(selectedType),
        data: data,
        borderColor: getBorderColor(selectedType),
        backgroundColor: getBackgroundColor(selectedType),
        fill: false,
        tension: 0.1
    }];

    if (myChart) {
        myChart.destroy(); // 既存のグラフがあれば破棄
    }

    const ctx = myChartCanvas.getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${getLabel(selectedType)}の推移`,
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: 'var(--text-color)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toLocaleString() + getUnit(selectedType);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: getXAxisUnit(selectedPeriod), // 期間に応じてX軸の単位を変更
                        displayFormats: {
                            day: 'MMM DD',
                            month: 'MMM YY',
                            quarter: 'YYYY Q',
                            year: 'YYYY'
                        },
                        tooltipFormat: 'YYYY/MM/DD'
                    },
                    title: {
                        display: true,
                        text: '日付',
                        color: 'var(--secondary-text-color)'
                    },
                    grid: {
                        color: 'var(--chart-grid-color)'
                    },
                    ticks: {
                        color: 'var(--secondary-text-color)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `${getLabel(selectedType)}${getUnit(selectedType)}`,
                        color: 'var(--secondary-text-color)'
                    },
                    beginAtZero: false,
                    grid: {
                        color: 'var(--chart-grid-color)'
                    },
                    ticks: {
                        color: 'var(--secondary-text-color)'
                    }
                }
            }
        }
    });
};

// グラフのラベルを取得
const getLabel = (type) => {
    switch (type) {
        case 'weight': return '体重';
        case 'bodyFat': return '体脂肪率';
        case 'muscleMass': return '筋肉量';
        case 'waist': return 'ウエスト';
        case 'mealCost': return '食事金額';
        default: return '';
    }
};

// グラフの単位を取得
const getUnit = (type) => {
    switch (type) {
        case 'weight': return ' kg';
        case 'bodyFat': return ' %';
        case 'muscleMass': return ' kg';
        case 'waist': return ' cm';
        case 'mealCost': return ' 円';
        default: return '';
    }
};

// グラフの線の色
const getBorderColor = (type) => {
    switch (type) {
        case 'weight': return '#007aff'; // primary-color
        case 'bodyFat': return '#34c759'; // secondary-color
        case 'muscleMass': return '#5856d6';
        case 'waist': return '#ff9500';
        case 'mealCost': return '#5ac8fa';
        default: return '#000000';
    }
};

// グラフの塗りつぶし色 (薄め)
const getBackgroundColor = (type) => {
    switch (type) {
        case 'weight': return 'rgba(0, 122, 255, 0.2)';
        case 'bodyFat': return 'rgba(52, 199, 89, 0.2)';
        case 'muscleMass': return 'rgba(88, 86, 214, 0.2)';
        case 'waist': return 'rgba(255, 149, 0, 0.2)';
        case 'mealCost': return 'rgba(90, 200, 250, 0.2)';
        default: return 'rgba(0, 0, 0, 0.1)';
    }
};

// X軸の表示単位を期間に応じて決定
const getXAxisUnit = (period) => {
    if (period === '7days') {
        return 'day';
    } else if (period === '30days' || period === '90days') {
        return 'week'; // 30日や90日なら週単位で表示
    } else { // 'all'
        return 'month'; // 全期間なら月単位で表示
    }
};