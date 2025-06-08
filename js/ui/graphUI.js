// js/ui/graphUI.js
import { loadRecords } from '../services/storageService.js';

// === DOM要素の取得 ===
const chartTypeSelect = document.getElementById('chartType');
const chartPeriodSelect = document.getElementById('chartPeriod');
const noChartDataMessage = document.getElementById('noChartDataMessage');
let myChart; // Chartインスタンスを保持する変数

// === ローカルストレージのキー ===
const STORAGE_KEY_MAIN = 'fitnessRecords';
const STORAGE_KEY_MEAL = 'mealRecords';

/**
 * グラフを初期化または更新する
 */
export const updateChart = () => {
    const mainRecords = loadRecords(STORAGE_KEY_MAIN);
    const mealRecords = loadRecords(STORAGE_KEY_MEAL); // 食事金額の取得元
    const allDates = Array.from(new Set([...Object.keys(mainRecords), ...Object.keys(mealRecords)]))
                          .sort((a, b) => new Date(a) - new Date(b)); // 全記録から日付を結合し昇順ソート

    const selectedType = chartTypeSelect.value;
    const selectedPeriod = chartPeriodSelect.value;

    let filteredDates = [];
    const today = new Date();

    if (selectedPeriod === 'all') {
        filteredDates = allDates;
    } else {
        let daysToSubtract;
        if (selectedPeriod === '7days') daysToSubtract = 7;
        else if (selectedPeriod === '30days') daysToSubtract = 30;
        else if (selectedPeriod === '90days') daysToSubtract = 90;

        const periodStartDate = new Date(today);
        periodStartDate.setDate(today.getDate() - daysToSubtract);
        periodStartDate.setHours(0, 0, 0, 0);

        filteredDates = allDates.filter(dateStr => {
            const recordDate = new Date(dateStr);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate >= periodStartDate;
        });
    }

    const dataLabels = [];
    const dataValues = [];

    filteredDates.forEach(date => {
        let value = null;
        if (selectedType === 'mealCost') {
            const record = mealRecords[date];
            if (record && record.mealCost !== null && !isNaN(record.mealCost)) {
                value = record.mealCost;
            }
        } else {
            const record = mainRecords[date];
            if (record && record[selectedType] !== null && !isNaN(record[selectedType])) {
                value = record[selectedType];
            }
        }

        // データが存在する場合のみ追加
        if (value !== null) {
            dataLabels.push(date);
            dataValues.push(value);
        }
    });

    const ctx = document.getElementById('myChart').getContext('2d');
    const unit = getUnit(selectedType);
    const label = getLabel(selectedType);
    const chartColor = getChartColor(selectedType);

    if (myChart) {
        myChart.data.labels = dataLabels;
        myChart.data.datasets[0].data = dataValues;
        myChart.data.datasets[0].label = label;
        myChart.data.datasets[0].borderColor = chartColor;
        myChart.data.datasets[0].backgroundColor = getChartColor(selectedType, 0.2);
        myChart.options.scales.y.title.text = unit;
        myChart.options.scales.y.beginAtZero = selectedType === 'mealCost'; // 金額は0から開始
        myChart.options.plugins.tooltip.callbacks.label = function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                let value = context.parsed.y.toFixed(selectedType === 'mealCost' ? 0 : 1);
                label += value + ' ' + unit;
            }
            return label;
        };
        myChart.update();
    } else {
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dataLabels,
                datasets: [{
                    label: label,
                    data: dataValues,
                    borderColor: chartColor,
                    backgroundColor: getChartColor(selectedType, 0.2),
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: chartColor,
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            },
                            color: '#636366'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    let value = context.parsed.y.toFixed(selectedType === 'mealCost' ? 0 : 1);
                                    label += value + ' ' + unit;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '日付',
                            color: '#636366'
                        },
                        ticks: {
                            color: '#636366'
                        },
                        grid: {
                            color: '#e5e5ea'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: unit,
                            color: '#636366'
                        },
                        ticks: {
                            color: '#636366'
                        },
                        grid: {
                            color: '#e5e5ea'
                        },
                        beginAtZero: selectedType === 'mealCost' // 金額は0から開始
                    }
                }
            }
        });
    }

    if (dataLabels.length === 0) {
        noChartDataMessage.style.display = 'block';
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }
    } else {
        noChartDataMessage.style.display = 'none';
    }
};

/**
 * 選択された項目に応じたラベルを返す
 * @param {string} type - 項目タイプ
 * @returns {string} 表示ラベル
 */
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

/**
 * 選択された項目に応じた単位を返す
 * @param {string} type - 項目タイプ
 * @returns {string} 単位
 */
const getUnit = (type) => {
    switch (type) {
        case 'weight':
        case 'muscleMass': return 'kg';
        case 'bodyFat': return '%';
        case 'waist': return 'cm';
        case 'mealCost': return '円';
        default: return '';
    }
};

/**
 * 選択された項目に応じたグラフの色を返す
 * @param {string} type - 項目タイプ
 * @param {number} alpha - 透明度 (0-1)
 * @returns {string} 色の文字列
 */
const getChartColor = (type, alpha = 1) => {
    const colors = {
        weight: `rgba(0, 122, 255, ${alpha})`,      // primary-color (blue)
        bodyFat: `rgba(255, 149, 0, ${alpha})`,     // orange
        muscleMass: `rgba(52, 199, 89, ${alpha})`,  // secondary-color (green)
        waist: `rgba(88, 86, 214, ${alpha})`,       // purple
        mealCost: `rgba(255, 45, 85, ${alpha})`    // reddish-pink (for money)
    };
    return colors[type] || `rgba(0, 0, 0, ${alpha})`;
};

/**
 * GRAPH画面のイベントリスナーを設定する
 */
export const setupGraphEventListeners = () => {
    // グラフ表示項目変更時のイベントリスナー
    chartTypeSelect.addEventListener('change', updateChart);
    chartPeriodSelect.addEventListener('change', updateChart);
};