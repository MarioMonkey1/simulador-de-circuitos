document.addEventListener('DOMContentLoaded', () => {
    const svgNS = "http://www.w3.org/2000/svg";
    let state = {
        s1: { currentMode: 'serie', correctAnswer: 0, solutionSteps: "" },
        s2: { currentMode: 'serie', correctAnswer: 0, solutionSteps: "" }
    };

    // --- CRONÓMETRO ---
    let timeLeft = 3600; // 3600seg = 1 hora. Cambia a 120 para 2 minutos.
    const timerDisplay = document.getElementById('timer-display');

    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("¡Tiempo agotado!");
        } else {
            timeLeft--;
        }
    }
    const timerInterval = setInterval(updateTimer, 1000);

    // --- NAVEGACIÓN ---
    const sectionButtons = document.querySelectorAll('.section-button');
    const sectionContents = document.querySelectorAll('.section-content');

    sectionButtons.forEach(button => {
        button.addEventListener('click', () => {
            sectionButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            sectionContents.forEach(content => content.style.display = 'none');
            const activeSectionId = button.id.replace('-btn', '-content');
            document.getElementById(activeSectionId).style.display = 'block';
        });
    });

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

    function generateNewCircuit(sectionNumber) {
        const s = `s${sectionNumber}`;
        const container = document.getElementById(`circuit-container-${s}`);
        clearCircuit(container);
        document.getElementById(`result-text-${s}`).textContent = '';
        document.getElementById(`user-answer-${s}`).value = '';
        document.getElementById(`solution-button-${s}`).style.display = 'none';
        document.getElementById(`solution-steps-${s}`).style.display = 'none';

        const r1 = Math.floor(Math.random() * 900) + 100;
        const r2 = Math.floor(Math.random() * 900) + 100;
        const r3 = Math.floor(Math.random() * 900) + 100;
        
        if (sectionNumber === 1) {
            if (state[s].currentMode === 'serie') {
                state[s].correctAnswer = r1 + r2;
                state[s].solutionSteps = `Fórmula: RT = R1 + R2\nCálculo: ${r1}Ω + ${r2}Ω\nResultado: ${state[s].correctAnswer}Ω`;
                drawSeriesCircuit(container, r1, r2);
            } else if (state[s].currentMode === 'paralelo') {
                const rt = (r1 * r2) / (r1 + r2);
                state[s].correctAnswer = Math.round(rt * 100) / 100;
                state[s].solutionSteps = `Fórmula: RT = (R1 * R2) / (R1 + R2)\nCálculo: (${r1} * ${r2}) / (${r1} + ${r2})\nResultado: ${state[s].correctAnswer}Ω`;
                drawParallelCircuit(container, r1, r2);
            } else if (state[s].currentMode === 'mixto') {
                const parallelPart = (r2 * r3) / (r2 + r3);
                const rt = r1 + parallelPart;
                state[s].correctAnswer = Math.round(rt * 100) / 100;
                state[s].solutionSteps = `1. Paralelo (R2||R3): (${r2}*${r3})/(${r2}+${r3}) = ${Math.round(parallelPart*100)/100}Ω\n2. RT (Serie): R1 + R_paralelo\n3. RT: ${r1} + ${Math.round(parallelPart*100)/100} = ${state[s].correctAnswer}Ω`;
                drawMixedCircuit(container, r1, r2, r3);
            }
        } else if (sectionNumber === 2) {
            const v = Math.floor(Math.random() * 20) + 5;
            let rt = state[s].currentMode === 'serie' ? r1+r2 : (r1*r2)/(r1+r2);
            rt = Math.round(rt * 100) / 100;
            const current = Math.round((v / rt) * 1000) / 1000;
            
            state[s].correctAnswer = current;
            state[s].solutionSteps = `1. Hallar RT: ${rt}Ω\n2. Ley de Ohm: I = V / RT\n3. Cálculo: ${v}V / ${rt}Ω = ${current}A`;
            
            if(state[s].currentMode === 'serie') drawSeriesCircuit(container, r1, r2, v);
            else drawParallelCircuit(container, r1, r2, v);
            document.getElementById(`question-text-${s}`).textContent = `Calcula la Corriente Total (en A):`;
        }
    }

    // --- FUNCIONES DE DIBUJO ---
    function drawSeriesCircuit(container, r1, r2, v = null) {
        const y = 100; let x = 50;
        if (v) { drawVoltageSource(container, x, y, v); drawWire(container, x+20, y, x+50, y); x+=50; }
        drawWire(container, x, y, x+40, y); drawResistor(container, x+40, y, r1);
        drawWire(container, x+100, y, x+140, y); drawResistor(container, x+140, y, r2);
        drawWire(container, x+200, y, x+250, y);
        if(v) { drawWire(container, x+250, y, x+250, 160); drawWire(container, x+250, 160, 50, 160); drawWire(container, 50, 160, 50, 120); }
    }

    function drawParallelCircuit(container, r1, r2, v = null) {
        const y = 100; let startX = 100;
        if(v) { drawVoltageSource(container, 50, y, v); drawWire(container, 70, y, 100, y); }
        drawWire(container, 100, 60, 100, 140); 
        drawWire(container, 100, 60, 140, 60); drawResistor(container, 140, 60, r1); drawWire(container, 200, 60, 240, 60);
        drawWire(container, 100, 140, 140, 140); drawResistor(container, 140, 140, r2); drawWire(container, 200, 140, 240, 140);
        drawWire(container, 240, 60, 240, 140);
        if(v) { drawWire(container, 240, 100, 280, 100); drawWire(container, 280, 100, 280, 170); drawWire(container, 280, 170, 50, 170); drawWire(container, 50, 170, 50, 120); }
    }

    function drawMixedCircuit(container, r1, r2, r3) {
        drawWire(container, 20, 100, 50, 100); drawResistor(container, 50, 100, r1);
        drawWire(container, 110, 100, 140, 100); drawWire(container, 140, 60, 140, 140);
        drawWire(container, 140, 60, 170, 60); drawResistor(container, 170, 60, r2); drawWire(container, 230, 60, 260, 60);
        drawWire(container, 140, 140, 170, 140); drawResistor(container, 170, 140, r3); drawWire(container, 230, 140, 260, 140);
        drawWire(container, 260, 60, 260, 140); drawWire(container, 260, 100, 300, 100);
    }

    function drawVoltageSource(c, x, y, val) {
        const circ = document.createElementNS(svgNS, 'circle'); circ.setAttribute('cx', x); circ.setAttribute('cy', y); circ.setAttribute('r', 20); circ.setAttribute('fill', '#fff9c4'); circ.setAttribute('stroke', 'black');
        const t = document.createElementNS(svgNS, 'text'); t.setAttribute('x', x-35); t.setAttribute('y', y+5); t.textContent = `${val}V`;
        const p = document.createElementNS(svgNS, 'text'); p.setAttribute('x', x); p.setAttribute('y', y+5); p.setAttribute('text-anchor', 'middle'); p.textContent = '+/-';
        c.appendChild(circ); c.appendChild(t); c.appendChild(p);
    }

    function drawResistor(c, x, y, val) {
        const r = document.createElementNS(svgNS, 'rect'); r.setAttribute('x', x); r.setAttribute('y', y-15); r.setAttribute('width', 60); r.setAttribute('height', 30); r.setAttribute('fill', 'white'); r.setAttribute('stroke', 'black');
        const t = document.createElementNS(svgNS, 'text'); t.setAttribute('x', x+30); t.setAttribute('y', y+5); t.setAttribute('text-anchor', 'middle'); t.style.fontSize = "12px"; t.textContent = `${val}Ω`;
        c.appendChild(r); c.appendChild(t);
    }

    function drawWire(c, x1, y1, x2, y2) {
        const l = document.createElementNS(svgNS, 'line'); l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); l.setAttribute('stroke', 'black'); l.setAttribute('stroke-width', 2);
        c.appendChild(l);
    }

    function clearCircuit(c) { while (c.firstChild) c.removeChild(c.firstChild); }

    function checkAnswer(sectionNumber) {
        const s = `s${sectionNumber}`;
        const userVal = parseFloat(document.getElementById(`user-answer-${s}`).value);
        const resText = document.getElementById(`result-text-${s}`);
        const solBtn = document.getElementById(`solution-button-${s}`);

        if (Math.abs(userVal - state[s].correctAnswer) < 0.02) {
            resText.textContent = "¡Correcto!"; resText.style.color = "green";
        } else {
            resText.textContent = "Incorrecto. Prueba otra vez o mira la solución.";
            resText.style.color = "red"; solBtn.style.display = 'inline-block';
        }
    }

    function showSolution(sectionNumber) {
        const s = `s${sectionNumber}`;
        const box = document.getElementById(`solution-steps-${s}`);
        box.innerHTML = `<strong>Resolución:</strong><br>${state[s].solutionSteps.replace(/\n/g, '<br>')}`;
        box.style.display = 'block';
    }
    initializeSection(1);
    initializeSection(2);
});
