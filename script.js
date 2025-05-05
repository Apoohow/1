// AI 服務配置
const AI_CONFIG = {
    apiKey: "3a1de39e3c6be2425f3e251c3271bca622b8f0156c3a9fa25f78149d05a1c5dd",
    apiUrl: "https://api.together.xyz/v1/chat/completions",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo"
};

// 日曆配置
let calendar;

document.addEventListener('DOMContentLoaded', function() {
    // 初始化日曆
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'zh-tw',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: '今天',
            month: '月',
            week: '週',
            day: '日'
        },
        dayMaxEvents: true,
        eventDisplay: 'block',
        displayEventEnd: false,
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        eventMaxStack: 3,
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        events: function(fetchInfo, successCallback, failureCallback) {
            const history = JSON.parse(localStorage.getItem('massageHistory') || '[]');
            const events = history.map(record => {
                const startDate = new Date(record.timestamp);
                // 設置結束時間為同一天的23:59:59
                const endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                
                return {
                    title: `${startDate.toLocaleTimeString('zh-tw', {hour: '2-digit', minute:'2-digit'})} ${record.mode}按摩`,
                    start: startDate,
                    end: startDate, // 使用相同的時間作為結束時間
                    extendedProps: record,
                    allDay: false,
                    display: 'block',
                    constraint: 'businessHours', // 限制在當天
                    duration: { minutes: 0 } // 設置持續時間為0分鐘
                };
            });
            successCallback(events);
        },
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        nextDayThreshold: '24:00:00', // 防止事件跨天
        eventDidMount: function(info) {
            // 自定義事件元素的樣式
            info.el.style.maxWidth = '100%';
            info.el.style.width = '100%';
            info.el.style.whiteSpace = 'nowrap';
            info.el.style.overflow = 'hidden';
            info.el.style.textOverflow = 'ellipsis';
            info.el.style.borderRadius = '4px';
            info.el.style.margin = '1px 0';
            info.el.style.padding = '2px 4px';
            info.el.style.fontSize = '0.85em';
            info.el.style.boxSizing = 'border-box';
            
            // 移除任何可能導致寬度溢出的樣式
            info.el.style.left = '0';
            info.el.style.right = '0';
            info.el.style.marginLeft = '0';
            info.el.style.marginRight = '0';
        },
        dayCellDidMount: function(info) {
            // 確保日期格子有相對定位
            info.el.style.position = 'relative';
            info.el.style.overflow = 'hidden';
        }
    });
    calendar.render();

    // 添加全局樣式
    const style = document.createElement('style');
    style.textContent = `
        .fc-event {
            margin-left: 0 !important;
            margin-right: 0 !important;
            border-radius: 4px !important;
            border: none !important;
        }
        .fc .fc-daygrid-event-harness {
            margin-left: 0 !important;
            margin-right: 0 !important;
            width: 100% !important;
        }
        .fc-daygrid-block-event .fc-event-main {
            padding: 2px 4px !important;
        }
        .fc-daygrid-day-events {
            margin: 0 !important;
            padding: 2px !important;
        }
    `;
    document.head.appendChild(style);
});

// 顯示事件詳情的函數
function showEventDetails(event) {
    const record = event.extendedProps;
    const modalHtml = `
        <div id="eventModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">按摩記錄詳情</h3>
                    <button onclick="closeEventModal()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="font-semibold">${new Date(record.timestamp).toLocaleString()}</div>
                        <div>掃描結果：</div>
                        <div class="ml-4">
                            <div>整體緊繃度：${record.scanData.overallTension}%</div>
                            <div>脊椎狀態：${record.scanData.spineAlignment}</div>
                            <div>肌肉僵硬度：${record.scanData.muscleStiffness}%</div>
                            <div>主要緊繃點位：</div>
                            ${record.scanData.tensionPoints.map(point => 
                                `<div class="ml-2">- ${point.position}：${point.tension}%</div>`
                            ).join('')}
                        </div>
                        <div>按摩效果：</div>
                        <div class="ml-4">
                            ${record.improvedTensionData.map((data, index) => {
                                const initial = record.initialTensionData[index];
                                const improvement = ((initial.value - data.value) / initial.value * 100).toFixed(1);
                                return `<div class="ml-2">- ${data.area}：改善 ${improvement}%</div>`;
                            }).join('')}
                        </div>
                        <div>模式: ${record.mode}</div>
                        <div>強度: ${record.force}</div>
                        <div>速度: ${record.speed}</div>
                        <div>時長: ${record.duration}秒</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.remove();
    }
}

// 按摩模擬類
class MassageSimulation {
    constructor() {
        this.isRunning = false;
        this.duration = 5; // 縮短到5秒
        this.progress = 0;
        this.mode = 'acupressure';
        this.force = 3;
        this.speed = 3;
        this.timer = null;
        this.scanData = null;
        this.spine = null;
        this.updateInterval = 50; // 更新頻率提高到50ms，使動畫更流暢
        this.initialPressureData = null;
        this.initialTensionData = null;
    }

    setSpineVisualization(spine) {
        this.spine = spine;
    }

    async startScan() {
        if (this.isRunning) return;
        
        document.getElementById('scanButton').disabled = true;
        document.getElementById('progressText').textContent = '掃描中...';
        
        // 開始視覺化掃描
        this.spine.startScanning();
        
        // 縮短掃描時間到2秒
        for (let i = 0; i <= 100; i += 50) {
            document.getElementById('progressBar').style.width = `${i}%`;
            document.getElementById('progressText').textContent = `掃描中 ${i}%`;
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        // 掃描完成
        this.spine.stopScanning();
        this.scanData = this.generateScanData();
        
        // 生成並保存初始數據
        this.initialPressureData = this.generatePressureData();
        this.initialTensionData = this.generateTensionData();
        
        // 更新掃描數據圖表
        window.dataVis.updateScanData(this.initialPressureData, this.initialTensionData);

        // 更新AI分析報告
        const aiService = new AIAnalysisService();
        await aiService.analyze({
            scanData: this.scanData,
            recommendedMode: this.getRecommendedMode()
        });

        // 啟用按摩按鈕
        document.getElementById('startButton').disabled = false;
        document.getElementById('scanButton').disabled = false;
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressText').textContent = '準備開始按摩';
    }

    async start() {
        if (this.isRunning || !this.scanData) return;
        
        this.isRunning = true;
        this.progress = 0;
        document.getElementById('stopButton').disabled = false;
        document.getElementById('startButton').disabled = true;
        document.getElementById('scanButton').disabled = true;

        this.timer = setInterval(() => {
            this.progress += (100 / (this.duration * (1000 / this.updateInterval)));
            if (this.progress >= 100) {
                this.stop();
                return;
            }
            this.updateUI();
        }, this.updateInterval);
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.timer);
        document.getElementById('stopButton').disabled = true;
        document.getElementById('startButton').disabled = false;
        document.getElementById('scanButton').disabled = false;

        // 更新按摩後的數據圖表
        const improvements = window.dataVis.updateMassageData(
            this.initialPressureData, 
            this.initialTensionData
        );

        // 保存歷史記錄時包含改善數據
        this.saveHistory(improvements);
    }

    updateUI() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        progressBar.style.width = `${this.progress}%`;
        progressText.textContent = `${Math.round(this.progress)}%`;
    }

    generateScanData() {
        const backRegions = [
            '頸椎區（C1-C7）',
            '胸椎上段（T1-T4）',
            '胸椎中段（T5-T8）',
            '胸椎下段（T9-T12）',
            '腰椎區（L1-L5）',
            '骶椎區（S1-S5）',
            '肩胛提肌區',
            '斜方肌區',
            '豎脊肌群',
            '腰方肌區'
        ];

        return {
            tensionPoints: Array.from({length: 5}, () => ({
                position: backRegions[Math.floor(Math.random() * backRegions.length)],
                tension: Math.floor(Math.random() * 100)
            })),
            overallTension: Math.floor(Math.random() * 100),
            spineAlignment: Math.random() > 0.5 ? '正常' : '輕微偏移',
            muscleStiffness: Math.floor(Math.random() * 100)
        };
    }

    getRecommendedMode() {
        const tension = this.scanData.overallTension;
        if (tension > 80) return '推拿按摩';
        if (tension > 60) return '指壓按摩';
        if (tension > 40) return '穴位按摩';
        return '經絡按摩';
    }

    saveHistory(improvements = null) {
        const history = JSON.parse(localStorage.getItem('massageHistory') || '[]');
        const newRecord = {
            timestamp: new Date().toISOString(),
            mode: this.mode,
            force: this.force,
            speed: this.speed,
            duration: this.duration,
            scanData: this.scanData,
            initialPressureData: this.initialPressureData,
            initialTensionData: this.initialTensionData,
            improvedPressureData: improvements?.pressureImprovement || [],
            improvedTensionData: improvements?.tensionImprovement || []
        };
        history.push(newRecord);
        localStorage.setItem('massageHistory', JSON.stringify(history));
        
        // 更新日曆
        if (calendar) {
            calendar.refetchEvents();
        }
    }

    generatePressureData() {
        const pressurePoints = [
            '頸椎夾脊穴',
            '肩井穴',
            '天宗穴',
            '胸椎夾脊穴',
            '膏肓穴',
            '腰眼穴',
            '腎俞穴',
            '大腸俞穴',
            '關元俞穴',
            '八髎穴'
        ];
        return Array.from({length: 10}, (_, i) => ({
            point: pressurePoints[i],
            value: Math.random() * 100
        }));
    }

    generateTensionData() {
        const tensionAreas = [
            '斜方肌上部',
            '斜方肌中部',
            '斜方肌下部',
            '菱形肌',
            '豎脊肌',
            '背闊肌',
            '腰方肌',
            '髂腰肌',
            '臀中肌',
            '梨狀肌'
        ];
        return Array.from({length: 10}, (_, i) => ({
            area: tensionAreas[i],
            value: Math.random() * 100
        }));
    }
}

// 脊椎視覺化類
class SpineVisualization {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.scanningLine = 0;
        this.isScanning = false;
        this.animate();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    startScanning() {
        this.isScanning = true;
        this.scanningLine = 0;
    }

    stopScanning() {
        this.isScanning = false;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBody();
        if (this.isScanning) {
            this.drawScanningLine();
        }
        requestAnimationFrame(() => this.animate());
    }

    drawBody() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        const centerX = width / 2;
        
        // 繪製肩部
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 60, height * 0.15);
        this.ctx.quadraticCurveTo(centerX, height * 0.1, centerX + 60, height * 0.15);
        this.ctx.strokeStyle = '#4B5563';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 繪製背部輪廓
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 60, height * 0.15);
        this.ctx.quadraticCurveTo(centerX - 40, height * 0.5, centerX - 50, height * 0.85);
        this.ctx.moveTo(centerX + 60, height * 0.15);
        this.ctx.quadraticCurveTo(centerX + 40, height * 0.5, centerX + 50, height * 0.85);
        this.ctx.strokeStyle = '#4B5563';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 繪製腰部
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 50, height * 0.85);
        this.ctx.quadraticCurveTo(centerX, height * 0.9, centerX + 50, height * 0.85);
        this.ctx.strokeStyle = '#4B5563';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // 繪製脊椎
        const startY = height * 0.15;
        const endY = height * 0.85;
        
        // 脊椎主線
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, startY);
        this.ctx.lineTo(centerX, endY);
        this.ctx.strokeStyle = '#4B5563';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        // 脊椎骨節
        const vertebraeCount = 24;
        for (let i = 0; i < vertebraeCount; i++) {
            const y = startY + (endY - startY) * (i / (vertebraeCount - 1));
            
            // 繪製橫向骨節
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 15, y);
            this.ctx.lineTo(centerX + 15, y);
            this.ctx.strokeStyle = '#4B5563';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 繪製圓形關節
            this.ctx.beginPath();
            this.ctx.arc(centerX, y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#3B82F6';
            this.ctx.fill();
        }
    }

    drawScanningLine() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        // 掃描線
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.scanningLine);
        this.ctx.lineTo(width, this.scanningLine);
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 掃描區域
        this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        this.ctx.fillRect(0, 0, width, this.scanningLine);

        // 更新掃描線位置
        this.scanningLine += 2;
        if (this.scanningLine > height) {
            this.scanningLine = 0;
        }
    }
}

// 數據視覺化類
class DataVisualization {
    constructor() {
        this.setupCharts();
    }

    setupCharts() {
        // 掃描數據圖
        const pressureCtx = document.getElementById('pressureChart').getContext('2d');
        this.pressureChart = new Chart(pressureCtx, {
            type: 'line',
            data: {
                labels: [
                    '頸椎夾脊穴',
                    '肩井穴',
                    '天宗穴',
                    '胸椎夾脊穴',
                    '膏肓穴',
                    '腰眼穴',
                    '腎俞穴',
                    '大腸俞穴',
                    '關元俞穴',
                    '八髎穴'
                ],
                datasets: [{
                    label: '掃描時壓力值',
                    data: Array(10).fill(0),
                    borderColor: '#3B82F6',
                    tension: 0.4
                }, {
                    label: '按摩後壓力值',
                    data: Array(10).fill(0),
                    borderColor: '#10B981',
                    tension: 0.4,
                    hidden: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // 肌肉緊繃度圖
        const tensionCtx = document.getElementById('tensionChart').getContext('2d');
        this.tensionChart = new Chart(tensionCtx, {
            type: 'bar',
            data: {
                labels: [
                    '斜方肌上部',
                    '斜方肌中部',
                    '斜方肌下部',
                    '菱形肌',
                    '豎脊肌',
                    '背闊肌',
                    '腰方肌',
                    '髂腰肌',
                    '臀中肌',
                    '梨狀肌'
                ],
                datasets: [{
                    label: '掃描時緊繃度',
                    data: Array(10).fill(0),
                    backgroundColor: '#60A5FA'
                }, {
                    label: '按摩後緊繃度',
                    data: Array(10).fill(0),
                    backgroundColor: '#34D399',
                    hidden: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // 更新掃描數據
    updateScanData(pressureData, tensionData) {
        this.pressureChart.data.datasets[0].data = pressureData.map(d => d.value);
        this.pressureChart.data.datasets[0].hidden = false;
        this.pressureChart.data.datasets[1].hidden = true;
        this.pressureChart.update();

        this.tensionChart.data.datasets[0].data = tensionData.map(d => d.value);
        this.tensionChart.data.datasets[0].hidden = false;
        this.tensionChart.data.datasets[1].hidden = true;
        this.tensionChart.update();
    }

    // 更新按摩後數據
    updateMassageData(pressureData, tensionData) {
        // 獲取當前按摩模式
        const currentMode = document.getElementById('massageMode').value;
        const currentForce = parseInt(document.getElementById('forceRange').value);
        
        // 根據不同按摩模式設定改善效果
        let pressureImprovement, tensionImprovement;
        
        switch(currentMode) {
            case 'acupressure': // 指壓按摩：集中改善特定穴位
                pressureImprovement = pressureData.map((d, index) => ({
                    ...d,
                    value: Math.max(0, d.value * (1 - (0.4 + Math.random() * 0.2))) // 40-60% 改善
                }));
                tensionImprovement = tensionData.map((d, index) => ({
                    ...d,
                    value: Math.max(0, d.value * (1 - (0.2 + Math.random() * 0.2))) // 20-40% 改善
                }));
                break;
                
            case 'tuina': // 推拿按摩：整體肌肉放鬆效果最好
                pressureImprovement = pressureData.map(d => ({
                    ...d,
                    value: Math.max(0, d.value * (1 - (0.3 + Math.random() * 0.2))) // 30-50% 改善
                }));
                tensionImprovement = tensionData.map(d => ({
                    ...d,
                    value: Math.max(0, d.value * (1 - (0.45 + Math.random() * 0.15))) // 45-60% 改善
                }));
                break;
                
            case 'acupoint': // 穴位按摩：壓力點改善明顯
                pressureImprovement = pressureData.map((d, index) => ({
                    ...d,
                    // 隨機選擇2-3個穴位有特別好的改善效果
                    value: Math.max(0, d.value * (1 - (index % 3 === 0 ? 0.6 + Math.random() * 0.2 : 0.2 + Math.random() * 0.2)))
                }));
                tensionImprovement = tensionData.map(d => ({
                    ...d,
                    value: Math.max(0, d.value * (1 - (0.25 + Math.random() * 0.15))) // 25-40% 改善
                }));
                break;
                
            case 'meridian': // 經絡按摩：平衡的改善效果
                pressureImprovement = pressureData.map(d => ({
                    ...d,
                    value: Math.max(0, d.value * (1 - (0.35 + Math.random() * 0.1))) // 35-45% 穩定改善
                }));
                tensionImprovement = tensionData.map(d => ({
                    ...d,
                    value: Math.max(0, d.value * (1 - (0.35 + Math.random() * 0.1))) // 35-45% 穩定改善
                }));
                break;
        }

        // 根據按摩強度調整改善效果
        const forceMultiplier = 0.8 + (currentForce * 0.1); // 強度1-5對應0.9-1.3倍效果
        pressureImprovement = pressureImprovement.map(d => ({
            ...d,
            value: Math.max(0, d.value * forceMultiplier)
        }));
        tensionImprovement = tensionImprovement.map(d => ({
            ...d,
            value: Math.max(0, d.value * forceMultiplier)
        }));

        // 更新圖表
        this.pressureChart.data.datasets[1].data = pressureImprovement.map(d => d.value);
        this.pressureChart.data.datasets[1].hidden = false;
        this.pressureChart.update();

        this.tensionChart.data.datasets[1].data = tensionImprovement.map(d => d.value);
        this.tensionChart.data.datasets[1].hidden = false;
        this.tensionChart.update();

        return {
            pressureImprovement,
            tensionImprovement
        };
    }
}

// AI分析服務類
class AIAnalysisService {
    constructor() {
        this.container = document.getElementById('aiAnalysis');
    }

    async analyze(massageData) {
        const report = this.generateScanReport(massageData.scanData);
        this.updateUI(report, massageData);
    }

    generateScanReport(scanData) {
        return {
            overallCondition: this.generateOverallCondition(scanData),
            tensionPoints: scanData.tensionPoints,
            recommendations: this.generateRecommendations(scanData),
            spineAlignment: scanData.spineAlignment,
            muscleStiffness: scanData.muscleStiffness
        };
    }

    generateOverallCondition(scanData) {
        const tension = scanData.overallTension;
        if (tension > 80) return { level: '嚴重', color: 'red' };
        if (tension > 60) return { level: '中度', color: 'yellow' };
        if (tension > 40) return { level: '輕度', color: 'blue' };
        return { level: '正常', color: 'green' };
    }

    generateRecommendations(scanData) {
        const tension = scanData.overallTension;
        const recommendations = [];
        
        if (tension > 80) {
            recommendations.push('建議進行深層推拿按摩，每週2-3次');
            recommendations.push('注意工作姿勢，每小時起身活動5-10分鐘');
            recommendations.push('考慮進行物理治療評估');
        } else if (tension > 60) {
            recommendations.push('建議進行中等強度指壓按摩，每週1-2次');
            recommendations.push('進行簡單的伸展運動');
            recommendations.push('保持良好的坐姿習慣');
        } else if (tension > 40) {
            recommendations.push('建議進行輕柔穴位按摩，每週1次');
            recommendations.push('日常可進行簡單的肩頸伸展');
            recommendations.push('注意保持正確坐姿');
        } else {
            recommendations.push('建議進行保健性經絡按摩');
            recommendations.push('維持目前的作息習慣');
            recommendations.push('定期進行簡單的伸展運動');
        }
        
        return recommendations;
    }

    updateUI(report, massageData) {
        const conditionColors = {
            red: 'bg-red-100 border-red-500 text-red-700',
            yellow: 'bg-yellow-100 border-yellow-500 text-yellow-700',
            blue: 'bg-blue-100 border-blue-500 text-blue-700',
            green: 'bg-green-100 border-green-500 text-green-700'
        };

        const conditionClass = conditionColors[report.overallCondition.color];
        
        this.container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <!-- 掃描結果卡片 -->
                <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold mb-4 flex items-center text-gray-800">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                        掃描結果
                    </h3>
                    <div class="space-y-4">
                        <div class="${conditionClass} p-4 rounded-lg border">
                            <div class="font-semibold">整體狀況評估：${report.overallCondition.level}</div>
                            <div class="text-sm mt-1">緊繃度指數：${massageData.scanData.overallTension}%</div>
                        </div>
                        <div class="space-y-2">
                            <div class="font-medium">脊椎狀態</div>
                            <div class="flex items-center">
                                <div class="flex-1 bg-gray-200 rounded-full h-2.5">
                                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${100 - massageData.scanData.muscleStiffness}%"></div>
                                </div>
                                <span class="ml-2 text-sm text-gray-600">${report.spineAlignment}</span>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <div class="font-medium">主要緊繃點位</div>
                            <div class="grid grid-cols-1 gap-2">
                                ${report.tensionPoints.map(point => `
                                    <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span>${point.position}</span>
                                        <div class="flex items-center">
                                            <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${point.tension}%"></div>
                                            </div>
                                            <span class="text-sm text-gray-600">${point.tension}%</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 改善建議卡片 -->
                <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <h3 class="text-lg font-semibold mb-4 flex items-center text-gray-800">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        改善建議
                    </h3>
                    <div class="space-y-4">
                        ${report.recommendations.map((rec, index) => `
                            <div class="flex items-start p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <span class="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm mr-3">${index + 1}</span>
                                <p class="text-gray-700">${rec}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- 按摩效果預測 -->
            <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 class="text-lg font-semibold mb-4 flex items-center text-gray-800">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    預期改善效果
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-3">
                        <div class="font-medium">整體緊繃度改善</div>
                        <div class="relative pt-1">
                            <div class="flex mb-2 items-center justify-between">
                                <div>
                                    <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                        當前
                                    </span>
                                </div>
                                <div>
                                    <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                        預期
                                    </span>
                                </div>
                            </div>
                            <div class="flex h-4 mb-4">
                                <div class="flex-1 relative">
                                    <div class="w-full h-4 bg-gray-200 rounded-l"></div>
                                    <div class="absolute top-0 h-4 rounded-l bg-blue-500" style="width: ${massageData.scanData.overallTension}%"></div>
                                </div>
                                <div class="flex-1 relative">
                                    <div class="w-full h-4 bg-gray-200 rounded-r"></div>
                                    <div class="absolute top-0 h-4 rounded-r bg-green-500" style="width: ${Math.max(0, massageData.scanData.overallTension - 30)}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="font-medium">肌肉僵硬度改善</div>
                        <div class="relative pt-1">
                            <div class="flex mb-2 items-center justify-between">
                                <div>
                                    <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                        當前
                                    </span>
                                </div>
                                <div>
                                    <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                        預期
                                    </span>
                                </div>
                            </div>
                            <div class="flex h-4 mb-4">
                                <div class="flex-1 relative">
                                    <div class="w-full h-4 bg-gray-200 rounded-l"></div>
                                    <div class="absolute top-0 h-4 rounded-l bg-blue-500" style="width: ${massageData.scanData.muscleStiffness}%"></div>
                                </div>
                                <div class="flex-1 relative">
                                    <div class="w-full h-4 bg-gray-200 rounded-r"></div>
                                    <div class="absolute top-0 h-4 rounded-r bg-green-500" style="width: ${Math.max(0, massageData.scanData.muscleStiffness - 25)}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    const spine = new SpineVisualization('spineCanvas');
    const dataVis = new DataVisualization();
    const massage = new MassageSimulation();
    const aiService = new AIAnalysisService();

    // 保存到全局以便其他類別訪問
    window.dataVis = dataVis;

    // 設置脊椎視覺化引用
    massage.setSpineVisualization(spine);

    // 事件監聽器
    document.getElementById('scanButton').addEventListener('click', () => massage.startScan());
    document.getElementById('startButton').addEventListener('click', () => massage.start());
    document.getElementById('stopButton').addEventListener('click', () => massage.stop());
    
    document.getElementById('massageMode').addEventListener('change', (e) => {
        massage.mode = e.target.value;
    });

    document.getElementById('forceRange').addEventListener('input', (e) => {
        massage.force = parseInt(e.target.value);
    });

    document.getElementById('speedRange').addEventListener('input', (e) => {
        massage.speed = parseInt(e.target.value);
    });

    // 視窗大小改變時重新設置畫布
    window.addEventListener('resize', () => {
        spine.setupCanvas();
    });
}); 