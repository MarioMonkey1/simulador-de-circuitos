document.addEventListener('DOMContentLoaded', () => {
    const svgNS = "http://www.w3.org/2000/svg";
    
    // Estado global de la aplicación
    let state = {
        s1: { currentMode: 'serie', correctAnswer: 0, solutionSteps: "" },
        s2: { currentMode: 'serie', correctAnswer: 0, solutionSteps: "" },
        s3: { 
            currentMode: 'thevenin', // 'thevenin' o 'norton'
            correctAnswer: 0, 
            solutionSteps: "",
            circuitData: {}, // Guardamos R1, R2, V para redibujar
            showEquivalent: false // Para alternar vista gráfica
        }
    };

    // --- CRONÓMETRO (MODIFICADO: CON BOTÓN) ---
    let timeLeft = 1200; // 20 minutos * 60 segundos
    let timerInterval = null;

    const timerDisplay = document.getElementById('timer-display');
    const timerWrapper = document.getElementById('timer-wrapper');
    const startBtn = document.getElementById('start-timer-btn');

    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("¡Tiempo agotado! El examen ha terminado.");
        } else {
            timeLeft--;
        }
    }

    // Solo activamos el listener si el botón existe en el HTML
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startBtn.style.display = 'none';      // Ocultar botón
            timerWrapper.style.display = 'inline'; // Mostrar contador
            updateTimer(); // Actualizar inmeditamente
            timerInterval = setInterval(updateTimer, 1000); // Iniciar cuenta regresiva
        });
    }

    // --- NAVEGACIÓN ENTRE SECCIONES ---
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

    // --- INICIALIZACIÓN DE SECCIONES ---
    function initializeSection(sectionNumber) {
        const s = `s${sectionNumber}`;
        const modeButtons = document.querySelectorAll(`[data-section="${sectionNumber}"]`);
        
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                if(sectionNumber === 3) state[s].currentMode = button.id.split('-')[1]; // thevenin o norton
                else state[s].currentMode = button.id.split('-')[1];
                generateNewCircuit(sectionNumber);
            });
        });
        
        document.getElementById(`check-button-${s}`).addEventListener('click', () => checkAnswer(sectionNumber));
        document.getElementById(`solution-button-${s}`).addEventListener('click', () => showSolution(sectionNumber));
        document.getElementById(`new-circuit-button-${s}`).addEventListener('click', () => generateNewCircuit(sectionNumber));
        
        // Botón especial para S3 (Ver Gráfico)
        const visBtn = document.getElementById(`visual-button-${s}`);
        if(visBtn) {
            visBtn.addEventListener('click', () => toggleEquivalentCircuit());
        }

        generateNewCircuit(sectionNumber);
    }

    // --- GENERADOR DE CIRCUITOS ---
    function generateNewCircuit(sectionNumber) {
        const s = `s${sectionNumber}`;
        const container = document.getElementById(`circuit-container-${s}`);
        clearCircuit(container);
        
        // Resetear UI
        document.getElementById(`result-text-${s}`).textContent = '';
        document.getElementById(`user-answer-${s}`).value = '';
        document.getElementById(`solution-button-${s}`).style.display = 'none';
        document.getElementById(`solution-steps-${s}`).style.display = 'none';
        
        if(sectionNumber === 3) {
            state.s3.showEquivalent = false;
            const vBtn = document.getElementById(`visual-button-s3`);
            vBtn.style.display = 'none';
            vBtn.textContent = "Ver Circuito Equivalente";
        }

        const r1 = Math.floor(Math.random() * 20) * 10 + 10; 
        const r2 = Math.floor(Math.random() * 20) * 10 + 10;
        const r3 = Math.floor(Math.random() * 20) * 10 + 10;
        const v = Math.floor(Math.random() * 5) * 5 + 5; 

        // --- LÓGICA SECCIÓN 1 (RESISTENCIAS) ---
        if (sectionNumber === 1) {
            if (state[s].currentMode === 'serie') {
                state[s].correctAnswer = r1 + r2;
                state[s].solutionSteps = `RT = R1 + R2 = ${r1} + ${r2} = ${state[s].correctAnswer}Ω`;
                drawSeriesCircuit(container, r1, r2);
            } else if (state[s].currentMode === 'paralelo') {
                const rt = (r1 * r2) / (r1 + r2);
                state[s].correctAnswer = parseFloat(rt.toFixed(2));
                state[s].solutionSteps = `RT = (R1·R2)/(R1+R2) = (${r1}·${r2})/(${r1}+${r2}) = ${state[s].correctAnswer}Ω`;
                drawParallelCircuit(container, r1, r2);
            } else {
                const rp = (r2 * r3) / (r2 + r3);
                const rt = r1 + rp;
                state[s].correctAnswer = parseFloat(rt.toFixed(2));
                state[s].solutionSteps = `1. Paralelo R2||R3 = ${rp.toFixed(2)}Ω\n2. Serie R1 + Req = ${state[s].correctAnswer}Ω`;
                drawMixedCircuit(container, r1, r2, r3);
            }
        } 
        // --- LÓGICA SECCIÓN 2 (OHM) ---
        else if (sectionNumber === 2) {
            let rt = state[s].currentMode === 'serie' ? r1+r2 : (r1*r2)/(r1+r2);
            const i = v / rt;
            state[s].correctAnswer = parseFloat(i.toFixed(3));
            state[s].solutionSteps = `RT = ${rt.toFixed(2)}Ω\nI = V / RT = ${v} / ${rt.toFixed(2)} = ${state[s].correctAnswer}A`;
            
            if(state[s].currentMode === 'serie') drawSeriesCircuit(container, r1, r2, v);
            else drawParallelCircuit(container, r1, r2, v);
        }
        // --- LÓGICA SECCIÓN 3 (THEVENIN / NORTON) ---
        else if (sectionNumber === 3) {
            state.s3.circuitData = { r1, r2, v };
            
            const rth = (r1 * r2) / (r1 + r2);
            const vth = v * (r2 / (r1 + r2));
            const inorton = vth / rth; 

            drawTheveninProblem(container, r1, r2, v);

            const questionType = Math.random() > 0.5 ? 'R' : (state.s3.currentMode === 'thevenin' ? 'V' : 'I');
            const label = document.getElementById('question-text-s3');

            if (state.s3.currentMode === 'thevenin') {
                if (questionType === 'R') {
                    state.s3.correctAnswer = parseFloat(rth.toFixed(2));
                    label.textContent = "Calcula la Resistencia Thevenin (Rth):";
                    state.s3.solutionSteps = `1. Apagar fuente (cortocircuito).\n2. R1 queda en paralelo con R2.\n3. Rth = (R1·R2)/(R1+R2) = ${state.s3.correctAnswer}Ω`;
                } else {
                    state.s3.correctAnswer = parseFloat(vth.toFixed(2));
                    label.textContent = "Calcula el Voltaje Thevenin (Vth):";
                    state.s3.solutionSteps = `1. Vth es el voltaje en terminales A-B (en R2).\n2. Divisor de voltaje.\n3. Vth = V * R2 / (R1+R2)\n4. Vth = ${v} * ${r2} / ${r1+r2} = ${state.s3.correctAnswer}V`;
                }
            } else { // Norton
                 if (questionType === 'R') {
                    state.s3.correctAnswer = parseFloat(rth.toFixed(2));
                    label.textContent = "Calcula la Resistencia Norton (Rn = Rth):";
                    state.s3.solutionSteps = `1. Apagar fuente.\n2. Rn se calcula igual que Rth.\n3. Rn = R1||R2 = ${state.s3.correctAnswer}Ω`;
                } else {
                    state.s3.correctAnswer = parseFloat(inorton.toFixed(3));
                    label.textContent = "Calcula la Corriente Norton (In):";
                    state.s3.solutionSteps = `1. Cortocircuitar terminales A-B.\n2. R2 se anula.\n3. In = V / R1 = ${v} / ${r1} = ${state.s3.correctAnswer}A`;
                }
            }
        }
    }

    // --- FUNCIONES DE DIBUJO ---
    function drawWire(c, x1, y1, x2, y2) {
        const l = document.createElementNS(svgNS, 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y1);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('stroke', '#333'); l.setAttribute('stroke-width', 2);
        c.appendChild(l);
    }

    function drawResistor(c, x, y, val, vertical = false) {
        const g = document.createElementNS(svgNS, 'g');
        const r = document.createElementNS(svgNS, 'rect');
        const t = document.createElementNS(svgNS, 'text');
        
        if (vertical) {
            r.setAttribute('x', x-10); r.setAttribute('y', y);
            r.setAttribute('width', 20); r.setAttribute('height', 60);
            t.setAttribute('x', x+15); t.setAttribute('y', y+35);
        } else {
            r.setAttribute('x', x); r.setAttribute('y', y-10);
            r.setAttribute('width', 60); r.setAttribute('height', 20);
            t.setAttribute('x', x+30); t.setAttribute('y', y-15);
        }
        
        r.setAttribute('fill', 'white'); r.setAttribute('stroke', '#333'); r.setAttribute('stroke-width', 2);
        t.setAttribute('text-anchor', 'middle'); t.style.fontSize = "14px"; t.textContent = `${val}Ω`;
        g.appendChild(r); g.appendChild(t);
        c.appendChild(g);
    }

    function drawVoltageSource(c, x, y, val) {
        const g = document.createElementNS(svgNS, 'g');
        
        // 1. El Círculo
        const circ = document.createElementNS(svgNS, 'circle');
        circ.setAttribute('cx', x); 
        circ.setAttribute('cy', y); 
        circ.setAttribute('r', 20);
        circ.setAttribute('fill', '#fff9c4'); 
        circ.setAttribute('stroke', '#333');
        
        // 2. El Valor (Texto afuera, a la izquierda)
        const t = document.createElementNS(svgNS, 'text');
        // Lo movemos 25px a la izquierda del centro para que salga del radio de 20px
        t.setAttribute('x', x - 28); 
        t.setAttribute('y', y + 5); 
        // Alineamos al final (end) para que el texto crezca hacia la izquierda y no pise el círculo
        t.setAttribute('text-anchor', 'end'); 
        t.style.fontWeight = "bold"; // Opcional: negrita para leer mejor
        t.textContent = `${val}V`;
        
        // 3. Símbolo Más (+) Arriba
        const plus = document.createElementNS(svgNS, 'text');
        plus.setAttribute('x', x); 
        plus.setAttribute('y', y - 3); // Un poco arriba del centro
        plus.setAttribute('text-anchor', 'middle'); 
        plus.style.fontSize = "16px";
        plus.textContent = '+';
        
        // 4. Símbolo Menos (-) Abajo
        const minus = document.createElementNS(svgNS, 'text');
        minus.setAttribute('x', x); 
        minus.setAttribute('y', y + 14); // Un poco abajo del centro
        minus.setAttribute('text-anchor', 'middle'); 
        minus.style.fontSize = "18px"; // Un poco más grande para que se note la rayita
        minus.style.fontWeight = "bold";
        minus.textContent = '-';
        
        // Agregamos todo al grupo
        g.appendChild(circ); 
        g.appendChild(t); 
        g.appendChild(plus);
        g.appendChild(minus);
        c.appendChild(g);
    }

    function drawCurrentSource(c, x, y, val) {
        const g = document.createElementNS(svgNS, 'g');
        const circ = document.createElementNS(svgNS, 'circle');
        circ.setAttribute('cx', x); circ.setAttribute('cy', y); circ.setAttribute('r', 20);
        circ.setAttribute('fill', '#e0f7fa'); circ.setAttribute('stroke', '#333');
        const arrow = document.createElementNS(svgNS, 'path');
        arrow.setAttribute('d', `M${x},${y+10} L${x},${y-10} M${x-5},${y-5} L${x},${y-10} L${x+5},${y-5}`);
        arrow.setAttribute('stroke', 'black'); arrow.setAttribute('fill', 'none'); arrow.setAttribute('stroke-width', 2);
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', x-45); t.setAttribute('y', y+5); t.textContent = `${val}A`;
        g.appendChild(circ); g.appendChild(arrow); g.appendChild(t);
        c.appendChild(g);
    }

    function drawTerminals(c, x1, y1, x2, y2) {
        const circleStyle = "fill: white; stroke: black; stroke-width: 2;";
        const t1 = document.createElementNS(svgNS, 'circle');
        t1.setAttribute('cx', x1); t1.setAttribute('cy', y1); t1.setAttribute('r', 4); t1.setAttribute('style', circleStyle);
        const txt1 = document.createElementNS(svgNS, 'text'); txt1.setAttribute('x', x1+10); txt1.setAttribute('y', y1+5); txt1.textContent = "A";
        const t2 = document.createElementNS(svgNS, 'circle');
        t2.setAttribute('cx', x2); t2.setAttribute('cy', y2); t2.setAttribute('r', 4); t2.setAttribute('style', circleStyle);
        const txt2 = document.createElementNS(svgNS, 'text'); txt2.setAttribute('x', x2+10); txt2.setAttribute('y', y2+5); txt2.textContent = "B";
        c.appendChild(t1); c.appendChild(t2); c.appendChild(txt1); c.appendChild(txt2);
    }

    function drawSeriesCircuit(c, r1, r2, v = null) {
        if(v) { drawVoltageSource(c, 50, 100, v); drawWire(c, 50, 80, 50, 50); drawWire(c, 50, 120, 50, 150); }
        else { drawWire(c, 50, 100, 50, 50); drawWire(c, 50, 100, 50, 150); } 
        drawWire(c, 50, 50, 100, 50); drawResistor(c, 100, 50, r1);
        drawWire(c, 160, 50, 200, 50); drawResistor(c, 200, 50, r2);
        drawWire(c, 260, 50, 300, 50); drawWire(c, 300, 50, 300, 150); drawWire(c, 300, 150, 50, 150);
    }

    function drawParallelCircuit(c, r1, r2, v = null) {
        if(v) { drawVoltageSource(c, 50, 100, v); drawWire(c, 50, 80, 50, 50); drawWire(c, 50, 120, 50, 150); }
        else { drawWire(c, 50, 100, 50, 50); drawWire(c, 50, 100, 50, 150); }
        drawWire(c, 50, 50, 150, 50); drawWire(c, 150, 50, 150, 70); drawResistor(c, 150, 70, r1, true); drawWire(c, 150, 130, 150, 150);
        drawWire(c, 150, 50, 250, 50); drawWire(c, 250, 50, 250, 70); drawResistor(c, 250, 70, r2, true); drawWire(c, 250, 130, 250, 150);
        drawWire(c, 250, 150, 50, 150);
    }

    function drawMixedCircuit(c, r1, r2, r3) {
        drawWire(c, 20, 100, 50, 100); drawResistor(c, 50, 100, r1);
        drawWire(c, 110, 100, 150, 100); 
        drawWire(c, 150, 60, 150, 140); 
        drawWire(c, 150, 60, 180, 60); drawResistor(c, 180, 60, r2); drawWire(c, 240, 60, 270, 60);
        drawWire(c, 150, 140, 180, 140); drawResistor(c, 180, 140, r3); drawWire(c, 240, 140, 270, 140);
        drawWire(c, 270, 60, 270, 140); 
        drawWire(c, 270, 100, 300, 100); 
    }

    function drawTheveninProblem(c, r1, r2, v) {
        drawVoltageSource(c, 60, 100, v);
        drawWire(c, 60, 80, 60, 50); 
        drawWire(c, 60, 120, 60, 150); 
        drawWire(c, 60, 50, 100, 50); drawResistor(c, 100, 50, r1); 
        drawWire(c, 160, 50, 220, 50); drawWire(c, 220, 50, 220, 70);
        drawResistor(c, 220, 70, r2, true); 
        drawWire(c, 220, 130, 220, 150); drawWire(c, 60, 150, 220, 150); 
        drawWire(c, 220, 50, 300, 50); drawWire(c, 220, 150, 300, 150);
        drawTerminals(c, 300, 50, 300, 150);
    }

    function toggleEquivalentCircuit() {
        const container = document.getElementById(`circuit-container-s3`);
        const btn = document.getElementById(`visual-button-s3`);
        const data = state.s3.circuitData;
        
        clearCircuit(container);
        
        if (!state.s3.showEquivalent) {
            const rth = (data.r1 * data.r2) / (data.r1 + data.r2);
            if (state.s3.currentMode === 'thevenin') {
                const vth = data.v * (data.r2 / (data.r1 + data.r2));
                drawVoltageSource(container, 80, 100, parseFloat(vth.toFixed(2)));
                drawWire(container, 80, 80, 80, 50); drawWire(container, 80, 120, 80, 150);
                drawWire(container, 80, 50, 120, 50); drawResistor(container, 120, 50, parseFloat(rth.toFixed(2)));
                drawWire(container, 180, 50, 300, 50); drawWire(container, 80, 150, 300, 150);
                drawTerminals(container, 300, 50, 300, 150);
                const txt = document.createElementNS(svgNS, 'text');
                txt.setAttribute('x', 200); txt.setAttribute('y', 180); txt.setAttribute('text-anchor', 'middle'); txt.textContent = "Equivalente Thevenin";
                container.appendChild(txt);
            } else {
                const inorton = (data.v * (data.r2 / (data.r1 + data.r2))) / rth;
                drawCurrentSource(container, 80, 100, parseFloat(inorton.toFixed(2)));
                drawWire(container, 80, 80, 80, 50); drawWire(container, 80, 120, 80, 150);
                drawWire(container, 80, 50, 200, 50); drawWire(container, 200, 50, 200, 70);
                drawResistor(container, 200, 70, parseFloat(rth.toFixed(2)), true); 
                drawWire(container, 200, 130, 200, 150); drawWire(container, 80, 150, 200, 150);
                drawWire(container, 200, 50, 300, 50); drawWire(container, 200, 150, 300, 150);
                drawTerminals(container, 300, 50, 300, 150);
                const txt = document.createElementNS(svgNS, 'text');
                txt.setAttribute('x', 200); txt.setAttribute('y', 180); txt.setAttribute('text-anchor', 'middle'); txt.textContent = "Equivalente Norton";
                container.appendChild(txt);
            }
            btn.textContent = "Ver Circuito Original";
            state.s3.showEquivalent = true;
        } else {
            drawTheveninProblem(container, data.r1, data.r2, data.v);
            btn.textContent = "Ver Gráfico Equivalente";
            state.s3.showEquivalent = false;
        }
    }

    function clearCircuit(c) { while (c.firstChild) c.removeChild(c.firstChild); }

    function checkAnswer(sectionNumber) {
        const s = `s${sectionNumber}`;
        const userVal = parseFloat(document.getElementById(`user-answer-${s}`).value);
        const resText = document.getElementById(`result-text-${s}`);
        const solBtn = document.getElementById(`solution-button-${s}`);
        const visBtn = document.getElementById(`visual-button-${s}`);

        if (isNaN(userVal)) {
            resText.textContent = "Por favor ingresa un número."; resText.style.color = "orange";
            return;
        }

        const margin = sectionNumber === 3 ? 0.1 : 0.05;
        if (Math.abs(userVal - state[s].correctAnswer) <= margin) {
            resText.textContent = "¡Correcto!"; resText.style.color = "green";
            if(sectionNumber === 3 && visBtn) visBtn.style.display = 'inline-block';
        } else {
            resText.textContent = "Incorrecto."; resText.style.color = "red";
            solBtn.style.display = 'inline-block';
            if(sectionNumber === 3 && visBtn) visBtn.style.display = 'inline-block';
        }
    }

    function showSolution(sectionNumber) {
        const s = `s${sectionNumber}`;
        const box = document.getElementById(`solution-steps-${s}`);
        box.innerHTML = `<strong>Pasos:</strong><br>${state[s].solutionSteps.replace(/\n/g, '<br>')}`;
        box.style.display = 'block';
    }

    initializeSection(1);
    initializeSection(2);
    initializeSection(3);
});
