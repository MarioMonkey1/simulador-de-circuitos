document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES GLOBALES ---
    const svgNS = "http://www.w3.org/2000/svg";
    let state = {
        s1: { currentMode: 'serie', correctAnswer: 0, solutionSteps: "" },
        s2: { currentMode: 'serie', correctAnswer: 0, solutionSteps: "" }
    };

    // --- MANEJO DE SECCIONES ---
    const sectionButtons = document.querySelectorAll('.section-button');
    const sectionContents = document.querySelectorAll('.section-content');

    sectionButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled) return;
            sectionButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            sectionContents.forEach(content => content.style.display = 'none');
            const activeSectionId = button.id.replace('-btn', '-content');
            document.getElementById(activeSectionId).style.display = 'block';
        });
    });

    // --- FUNCIÓN DE INICIALIZACIÓN PARA CADA SECCIÓN ---
    function initializeSection(sectionNumber) {
        const s = `s${sectionNumber}`;
        const modeButtons = document.querySelectorAll(`[data-section="${sectionNumber}"]`);
        
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                state[s].currentMode = button.id.split('-')[1];
                generateNewCircuit(sectionNumber);
            });
        });
        
        document.getElementById(`check-button-${s}`).addEventListener('click', () => checkAnswer(sectionNumber));
        document.getElementById(`solution-button-${s}`).addEventListener('click', () => showSolution(sectionNumber));
        document.getElementById(`new-circuit-button-${s}`).addEventListener('click', () => generateNewCircuit(sectionNumber));

        generateNewCircuit(sectionNumber);
    }

    // --- LÓGICA PRINCIPAL ---
    function generateNewCircuit(sectionNumber) {
        const s = `s${sectionNumber}`;
        const container = document.getElementById(`circuit-container-${s}`);
        clearCircuit(container);
        document.getElementById(`result-text-${s}`).textContent = '';
        document.getElementById(`user-answer-${s}`).value = '';
        document.getElementById(`solution-button-${s}`).style.display = 'none';

        const r1 = Math.floor(Math.random() * 991) + 10;
        const r2 = Math.floor(Math.random() * 991) + 10;
        const r3 = Math.floor(Math.random() * 991) + 10;
        
        if (sectionNumber === 1) {
            document.getElementById(`question-text-${s}`).textContent = 'Calcula la Resistencia Total (en Ω):';
            if (state[s].currentMode === 'serie') {
                state[s].correctAnswer = r1 + r2;
                state[s].solutionSteps = `RT = R1 + R2 = ${r1}Ω + ${r2}Ω = ${state[s].correctAnswer}Ω`;
                drawSeriesCircuit(container, r1, r2);
            } else if (state[s].currentMode === 'paralelo') {
                const rt = (r1 * r2) / (r1 + r2);
                state[s].correctAnswer = Math.round(rt * 100) / 100;
                state[s].solutionSteps = `RT = (R1 * R2) / (R1 + R2) = ${state[s].correctAnswer}Ω`;
                drawParallelCircuit(container, r1, r2);
            } else if (state[s].currentMode === 'mixto') {
                const parallelPart = (r2 * r3) / (r2 + r3);
                const rt = r1 + parallelPart;
                state[s].correctAnswer = Math.round(rt * 100) / 100;
                state[s].solutionSteps = `Req_p = (R2*R3)/(R2+R3) = ${Math.round(parallelPart*100)/100}Ω\nRT = R1 + Req_p = ${state[s].correctAnswer}Ω`;
                drawMixedCircuit(container, r1, r2, r3);
            }
        } else if (sectionNumber === 2) {
            const voltage = Math.floor(Math.random() * 20) + 5;
            let totalResistance = 0;

            if (state[s].currentMode === 'serie') {
                totalResistance = r1 + r2;
                drawSeriesCircuit(container, r1, r2, voltage);
            } else if (state[s].currentMode === 'paralelo') {
                totalResistance = (r1 * r2) / (r1 + r2);
                drawParallelCircuit(container, r1, r2, voltage);
            } else if (state[s].currentMode === 'mixto') {
                const parallelPart = (r2 * r3) / (r2 + r3);
                totalResistance = r1 + parallelPart;
                drawMixedCircuit(container, r1, r2, r3, voltage);
            }
            totalResistance = Math.round(totalResistance * 100) / 100;

            if (Math.random() < 0.5) {
                document.getElementById(`question-text-${s}`).textContent = `Calcula la Resistencia Total (en Ω):`;
                state[s].correctAnswer = totalResistance;
                state[s].solutionSteps = `La Resistencia Total (RT) del circuito es ${totalResistance}Ω.`;
            } else {
                const totalCurrent = Math.round((voltage / totalResistance) * 1000) / 1000;
                document.getElementById(`question-text-${s}`).textContent = `Calcula la Corriente Total (en A):`;
                state[s].correctAnswer = totalCurrent;
                state[s].solutionSteps = `1. RT = ${totalResistance}Ω\n2. I = V/R = ${voltage}V / ${totalResistance}Ω = ${totalCurrent}A`;
            }
        }
    }
    
    // --- FUNCIONES DE DIBUJO (VERSIÓN FINAL Y ESTABLE) ---
    function drawSeriesCircuit(container, r1, r2, voltage = null) {
        const y = 100;
        let startX = 50;
        if (voltage) {
            drawVoltageSource(container, startX, y, voltage);
            drawWire(container, startX + 20, y, startX + 50, y);
            startX += 50;
        }
        drawWire(container, startX, y, startX + 70, y);
        drawResistor(container, startX + 70, y, r1);
        drawWire(container, startX + 130, y, startX + 170, y);
        drawResistor(container, startX + 170, y, r2);
        drawWire(container, startX + 230, y, startX + 300, y);
        if (voltage) {
            const endX = startX + 300;
            const returnY = y + 60;
            const sourceX = 50;
            drawWire(container, endX, y, endX, returnY);
            drawWire(container, endX, returnY, sourceX, returnY);
            drawWire(container, sourceX, returnY, sourceX, y + 20);
        }
    }

    function drawParallelCircuit(container, r1, r2, voltage = null) {
        const y = 100;
        let startX = 110;
        if (voltage) {
            drawVoltageSource(container, 50, y, voltage);
            drawWire(container, 70, y, startX, y); 
        } else {
            drawWire(container, startX - 40, y, startX, y);
        }

        const r_y1 = y - 40, r_y2 = y + 40;
        drawWire(container, startX, y, startX, r_y1); 
        drawWire(container, startX, y, startX, r_y2); 

        const p_endX = startX + 120;
        drawWire(container, startX, r_y1, p_endX, r_y1); 
        drawWire(container, startX, r_y2, p_endX, r_y2); 

        drawResistor(container, startX + 30, r_y1, r1);
        drawResistor(container, startX + 30, r_y2, r2);

        drawWire(container, p_endX, r_y1, p_endX, r_y2); 
        
        const endX = p_endX + 40;
        drawWire(container, p_endX, y, endX, y); 

        if (voltage) {
            const returnY = y + 60;
            const sourceX = 50;
            drawWire(container, endX, y, endX, returnY);
            drawWire(container, endX, returnY, sourceX, returnY);
            drawWire(container, sourceX, returnY, sourceX, y + 20);
        }
    }
    
    function drawMixedCircuit(container, r1, r2, r3, voltage = null) {
        const y_center = 100;
        let startX = 40;
        if (voltage) {
            drawVoltageSource(container, startX, y_center, voltage);
            drawWire(container, startX + 20, y_center, startX + 50, y_center);
            startX += 50;
        } else {
            drawWire(container, startX - 20, y_center, startX, y_center);
        }

        drawResistor(container, startX, y_center, r1);
        
        const p_startX = startX + 80;
        drawWire(container, startX + 60, y_center, p_startX, y_center);

        const y_p1 = y_center - 40, y_p2 = y_center + 40;
        drawWire(container, p_startX, y_center, p_startX, y_p1);
        drawWire(container, p_startX, y_center, p_startX, y_p2);

        const p_endX = p_startX + 120;
        drawWire(container, p_startX, y_p1, p_endX, y_p1);
        drawWire(container, p_startX, y_p2, p_endX, y_p2);

        drawResistor(container, p_startX + 30, y_p1, r2);
        drawResistor(container, p_startX + 30, y_p2, r3);

        drawWire(container, p_endX, y_p1, p_endX, y_p2);

        const endX = p_endX + 40;
        drawWire(container, p_endX, y_center, endX, y_center);

        if (voltage) {
            const returnY = y_center + 60;
            const sourceX = 40;
            drawWire(container, endX, y_center, endX, returnY);
            drawWire(container, endX, returnY, sourceX, returnY);
            drawWire(container, sourceX, returnY, sourceX, y_center + 20);
        }
    }
    
    function drawVoltageSource(container, x, y, value) {
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', x); circle.setAttribute('cy', y);
        circle.setAttribute('r', 20); circle.setAttribute('stroke', 'black');
        circle.setAttribute('stroke-width', 2.5); circle.setAttribute('fill', '#fff9c4');
        
        const plusSign = document.createElementNS(svgNS, 'text');
        plusSign.setAttribute('x', x); plusSign.setAttribute('y', y - 5);
        plusSign.setAttribute('text-anchor', 'middle'); plusSign.setAttribute('font-size', '16px');
        plusSign.textContent = '+';

        const minusSign = document.createElementNS(svgNS, 'text');
        minusSign.setAttribute('x', x); minusSign.setAttribute('y', y + 12);
        minusSign.setAttribute('text-anchor', 'middle'); minusSign.setAttribute('font-size', '18px');
        minusSign.textContent = '−';
        
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', x - 25); text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'end'); text.setAttribute('class', 'voltage-text');
        text.textContent = `${value}V`;
        
        container.appendChild(circle); container.appendChild(plusSign);
        container.appendChild(minusSign); container.appendChild(text);
    }
    
    function drawResistor(container, x, y, value) {
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', x); rect.setAttribute('y', y - 15);
        rect.setAttribute('width', 60); rect.setAttribute('height', 30);
        rect.setAttribute('stroke', 'black'); rect.setAttribute('stroke-width', 2);
        rect.setAttribute('fill', 'white');
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', x + 30); text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'middle'); text.textContent = `${value}Ω`;
        container.appendChild(rect); container.appendChild(text);
    }

    function drawWire(container, x1, y1, x2, y2) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x1); line.setAttribute('y1', y1);
        line.setAttribute('x2', x2); line.setAttribute('y2', y2);
        line.setAttribute('stroke', 'black'); line.setAttribute('stroke-width', 2);
        container.appendChild(line);
    }

    function clearCircuit(container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    // --- FUNCIONES DE VERIFICACIÓN ---
    function checkAnswer(sectionNumber) {
        const s = `s${sectionNumber}`;
        const userAnswer = parseFloat(document.getElementById(`user-answer-${s}`).value);
        const resultText = document.getElementById(`result-text-${s}`);
        const solutionButton = document.getElementById(`solution-button-${s}`);

        if (isNaN(userAnswer)) {
            resultText.textContent = "Por favor, introduce un número válido.";
            resultText.style.color = "orange";
            return;
        }
        const unit = document.getElementById(`question-text-${s}`).textContent.includes('Corriente') ? 'A' : 'Ω';
        if (Math.abs(userAnswer - state[s].correctAnswer) < 0.01) {
            resultText.textContent = `¡Correcto! La respuesta es ${state[s].correctAnswer}${unit}.`;
            resultText.style.color = "green";
            solutionButton.style.display = 'none';
        } else {
            resultText.textContent = `Incorrecto. La respuesta correcta era ${state[s].correctAnswer}${unit}.`;
            resultText.style.color = "red";
            solutionButton.style.display = 'inline-block';
        }
    }

    function showSolution(sectionNumber) {
        alert(state[`s${sectionNumber}`].solutionSteps);
    }

    // --- INICIO DE LA APLICACIÓN ---
    initializeSection(1);
    initializeSection(2);
    document.getElementById('section-1-content').style.display = 'block';
    document.getElementById('section-2-content').style.display = 'none';
});