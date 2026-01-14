// 자녀 입력 카드 생성
function createChildInputCard(index) {
    const t = window.t || ((key, vars = {}) => key);
    return `
        <div class="child-card">
            <div class="child-card-header">${t("childLabel", { index: index + 1 })}</div>
            <div class="child-input-row">
                <div class="form-group">
                    <label>${t("labelChildAge")}</label>
                    <input type="number" class="input-number child-age" data-index="${index}" min="0" max="20" placeholder="${t("placeholderAge")}">
                    <span class="input-hint">${t("hintAge")}</span>
                </div>
                <div class="form-group">
                    <label>${t("labelChildCost")}</label>
                    <input type="number" class="input-text child-cost" data-index="${index}" min="0" placeholder="${t("placeholderCost")}" step="10000">
                    <span class="input-hint">${t("hintWon")}</span>
                </div>
            </div>
        </div>
    `;
}

// 자녀 수 변경 시 입력란 업데이트
function updateChildrenInputs() {
    const count = parseInt(document.getElementById('childrenCount').value);
    const container = document.getElementById('childrenInputs');
    
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        container.innerHTML += createChildInputCard(i);
    }
}

// Make updateChildrenInputs globally available
window.updateChildrenInputs = updateChildrenInputs;

// 숫자 포맷팅 (천 단위 콤마)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 금액을 한글로 표현
function formatCurrency(num) {
    const lang = window.currentLang || 'ko';
    if (lang === 'en') {
        // English format: use locale with KRW
        return num.toLocaleString('en-US') + ' KRW';
    }
    // Korean format: use 한글 currency units
    if (num >= 100000000) {
        const eok = Math.floor(num / 100000000);
        const man = Math.floor((num % 100000000) / 10000);
        if (man > 0) {
            return `${eok}억 ${formatNumber(man)}만원`;
        }
        return `${eok}억원`;
    } else if (num >= 10000) {
        return `${formatNumber(Math.floor(num / 10000))}만원`;
    } else {
        return `${formatNumber(num)}원`;
    }
}

// 사교육비 계산 함수
function calculateEducationCost(children, options) {
    let total = 0;

    children.forEach(child => {
        const start = options.startAge;
        const end = options.endAge;
        const age = child.age;
        const monthly = child.monthlyCost || 0;

        // 남은 개월 수 계산
        const remainMonths = Math.max(0, (end - age) * 12);
        let cost = remainMonths * monthly;

        // 방학 특강: 연 2회 × 월비용의 50%
        if (options.includeVacationCost) {
            const years = Math.max(0, end - age);
            cost += years * monthly * 0.5 * 2;
        }

        // 물가 상승 옵션 (연 3%)
        if (options.includeInflation) {
            const years = Math.max(0, end - age);
            // 연평균 복리 계산을 위한 근사치
            for (let i = 0; i < years; i++) {
                cost *= 1.03;
            }
        }

        total += cost;
    });

    // 형제 할인 (10%)
    if (options.siblingDiscount && children.length >= 2) {
        total *= 0.9;
    }

    return Math.round(total);
}

// 대체 시나리오 계산
function calculateScenarios(totalCost) {
    const t = window.t || ((key, vars = {}) => key);
    const scenarios = [];

    // 해외여행 (4인 가족 기준 400만원)
    const trips = Math.floor(totalCost / 4000000);
    if (trips > 0) {
        scenarios.push({
            label: t('scenarioTrip'),
            value: `${trips}${t('unitTimes')}`,
            highlight: trips
        });
    }

    // 중형차 (2,500만원)
    const cars = Math.floor(totalCost / 25000000);
    if (cars > 0) {
        scenarios.push({
            label: t('scenarioCar'),
            value: `${cars}${t('unitCars')}`,
            highlight: cars
        });
    }

    // 전세자금 (1억원 기준)
    const jeonse = totalCost / 100000000;
    if (jeonse >= 0.1) {
        scenarios.push({
            label: t('scenarioJeonse'),
            value: `${(jeonse * 100).toFixed(1)}%`,
            highlight: jeonse.toFixed(1)
        });
    }

    // S&P500 ETF (연평균 7% 복리, 18년)
    const sp500_18yr = totalCost * Math.pow(1.07, 18);
    scenarios.push({
        label: t('scenarioSP500'),
        value: formatCurrency(Math.round(sp500_18yr)),
        highlight: formatCurrency(Math.round(sp500_18yr))
    });

    // 자녀 대학 등록금 (연 800만원)
    const semesters = Math.floor(totalCost / 4000000);
    if (semesters >= 1) {
        scenarios.push({
            label: t('scenarioTuition'),
            value: `${semesters}${t('unitSemesters')}`,
            highlight: semesters
        });
    }

    // 서울 아파트 관리비 (월 30만원 기준, 총 개월 수)
    const months = Math.floor(totalCost / 300000);
    if (months >= 12) {
        const years = Math.floor(months / 12);
        scenarios.push({
            label: t('scenarioMaintenance'),
            value: `${years}${t('unitYears')} ${months % 12}${t('unitMonths')}`,
            highlight: years
        });
    }

    return scenarios;
}

// 결과 화면 표시
function showResults() {
    // 입력값 수집
    const childrenCount = parseInt(document.getElementById('childrenCount').value);
    const startAge = parseInt(document.getElementById('startAge').value);
    const endAge = parseInt(document.getElementById('endAge').value);
    
    const children = [];
    for (let i = 0; i < childrenCount; i++) {
        const ageInput = document.querySelector(`.child-age[data-index="${i}"]`);
        const costInput = document.querySelector(`.child-cost[data-index="${i}"]`);
        
        const age = parseInt(ageInput?.value || 0);
        const monthlyCost = parseInt(costInput?.value || 0);
        
        if (age > 0 && monthlyCost > 0) {
            children.push({ age, monthlyCost });
        }
    }

    // 유효성 검사
    const t = window.t || ((key, vars = {}) => key);
    if (children.length === 0) {
        alert(t('alertNoChildren'));
        return;
    }

    if (startAge >= endAge) {
        alert(t('alertAgeInvalid'));
        return;
    }

    // 옵션 수집
    const options = {
        startAge,
        endAge,
        includeVacationCost: document.getElementById('includeVacationCost').checked,
        includeInflation: document.getElementById('includeInflation').checked,
        siblingDiscount: document.getElementById('siblingDiscount').checked
    };

    // 계산
    const totalCost = calculateEducationCost(children, options);
    
    // 총 비용 표시
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
    
    // 대체 시나리오 표시
    const scenarios = calculateScenarios(totalCost);
    const scenarioList = document.getElementById('scenarioList');
    scenarioList.innerHTML = scenarios.map(scenario => `
        <div class="scenario-item">
            <div class="scenario-item-left">
                <div class="scenario-item-label">${scenario.label}</div>
                <div class="scenario-item-value">${scenario.value}</div>
            </div>
            <div class="scenario-item-highlight">${scenario.highlight}</div>
        </div>
    `).join('');

    // 섹션 전환
    document.getElementById('inputSection').style.display = 'none';
    document.getElementById('resultSection').style.display = 'block';
    
    // 결과 섹션으로 스크롤
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 다시 계산하기
function resetForm() {
    document.getElementById('inputSection').style.display = 'block';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('inputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // 초기 자녀 입력란 생성
    updateChildrenInputs();

    // 자녀 수 변경 시
    document.getElementById('childrenCount').addEventListener('change', updateChildrenInputs);

    // 계산 버튼
    document.getElementById('calculateBtn').addEventListener('click', showResults);

    // 다시 계산하기 버튼
    document.getElementById('backBtn').addEventListener('click', resetForm);

    // Enter 키로 계산하기
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && document.getElementById('inputSection').style.display !== 'none') {
            showResults();
        }
    });
});
