document.addEventListener('DOMContentLoaded', () => {
    const svgNS = "http://www.w3.org/2000/svg";
    
    // --- ESTADO GLOBAL ---
    let state = {
        s1: { currentMode: 'serie', correctAnswer: 0, solutionSteps: "" },
        s2: { currentMode: 'serie', correctAnswer: 0, solutionSteps: "" },
        s3: { 
            currentMode: 'thevenin', 
            correctAnswer: 0, solutionSteps: "", circuitData: {}, showEquivalent: false 
        },
        s4: {
            currentMode: 'intro', correctAnswer: 0, solutionSteps: ""
        }
    };

    // --- BASE DE DATOS DE LECCIONES (BOYLESTAD) ---
    const boylestadLessons = {
        'inductancia': {
            title: "Capítulo 12: Reactancia Inductiva",
            content: `
                <p>Según Boylestad, la oposición que presenta un inductor al flujo de corriente alterna senoidal se llama <strong>Reactancia Inductiva (XL)</strong>.</p>
                <p>A diferencia de la resistencia, la reactancia depende de la frecuencia (<i>f</i>). Cuanto mayor es la frecuencia, más "se opone" la bobina al paso de la corriente.</p>
                <p><strong>Unidades:</strong></p>
                <ul><li><i>f</i> en Hertz (Hz)</li><li><i>L</i> en Henrios (H)</li><li><i>XL</i> en Ohms (Ω)</li></ul>
            `,
            formula: "X_L = 2 \\cdot \\pi \\cdot f \\cdot L",
            generateProblem: () => {
                const f = [50, 60, 100, 1000][Math.floor(Math.random()*4)];
                const l_mH = Math.floor(Math.random() * 500) + 10;
                const l = l_mH / 1000;
                const xl = 2 * Math.PI * f * l;
                return {
                    f: f, val: l_mH, unit: 'mH', type: 'L',
                    answer: parseFloat(xl.toFixed(2)),
                    question: `Calcula XL para f=${f}Hz y L=${l_mH}mH:`,
                    steps: `1. Convertir L a Henrios: ${l_mH}mH = ${l}H\n2. Aplicar fórmula: XL = 2 * 3.1416 * ${f} * ${l}\n3. Resultado: ${xl.toFixed(2)}Ω`
                };
            }
        },
        'capacitancia': {
            title: "Capítulo 10: Reactancia Capacitiva",
            content: `
                <p>Para un capacitor, la oposición a la corriente alterna es la <strong>Reactancia Capacitiva (XC)</strong>.</p>
                <p>Es inversamente proporcional a la frecuencia. A muy altas frecuencias, el capacitor se comporta casi como un cortocircuito.</p>
                <p><strong>Nota importante:</strong> Recuerda convertir los microfaradios (µF) a Faradios (F) dividiendo por 1,000,000.</p>
            `,
            formula: "X_C = \\frac{1}{2 \\cdot \\pi \\cdot f \\cdot C}",
            generateProblem: () => {
                const f = [50, 60, 120, 1000][Math.floor(Math.random()*4)];
                const c_uF = Math.floor(Math.random() * 100) + 1;
                const c = c_uF / 1000000;
                const xc = 1 / (2 * Math.PI * f * c);
                return {
                    f: f, val: c_uF, unit: 'µF', type: 'C',
                    answer: parseFloat(xc.toFixed(2)),
                    question: `Calcula XC para f=${f}Hz y C=${c_uF}µF:`,
                    steps: `1. Convertir C a Faradios: ${c_uF}µF = ${c.toExponential()}F\n2. Denominador: 2 * π * ${f} * ${c} = ${(2*Math.PI*f*c).toFixed(4)}\n3. Inverso: 1 / Ans = ${xc.toFixed(2)}Ω`
                };
            }
        },
        'impedancia_rl': {
            title: "Capítulo 15: Impedancia Serie R-L",
            content: `
                <p>En un circuito serie con Resistencia e Inductor, la oposición total se llama <strong>Impedancia (Z)</strong>.</p>
                <p>No se suman directamente (<i>R + XL</i>) porque están desfasados 90°. Debemos usar fasores (triángulo de impedancia).</p>
                <p>La magnitud de la impedancia se calcula con el Teorema de Pitágoras.</p>
            `,
            formula: "Z_T = \\sqrt{R^2 + X_L^2}",
            generateProblem: () => {
                const r = Math.floor(Math.random() * 100) + 10;
                const xl = Math.floor(Math.random() * 100) + 10;
                const z = Math.sqrt((r*r) + (xl*xl));
                return {
                    r: r, xl: xl, type: 'RL_Series',
                    answer: parseFloat(z.toFixed(2)),
                    question: `Calcula Z total si R=${r}Ω y XL=${xl}Ω:`,
                    steps: `1. Elevar al cuadrado: R²=${r*r}, XL²=${xl*xl}\n2. Sumar: ${r*r + xl*xl}\n3. Raíz cuadrada: √${r*r + xl*xl} = ${z.toFixed(2)}Ω`
                };
            }
        }
    };

    // --- CRONÓMETRO ---
    let timeLeft = 1200; 
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

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startBtn.style.display = 'none';      
            timerWrapper.style.display = 'inline'; 
            updateTimer(); 
            timerInterval = setInterval(updateTimer, 1000); 
        });
    }

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

    // --- INICIALIZACIÓN ---
    function initializeSection(sectionNumber) {
        const s = `s${sectionNumber}`;
        const modeButtons = document.querySelectorAll(`[data-section="${sectionNumber}"]`);
        
        if (sectionNumber < 4) {
            modeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    modeButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    if(sectionNumber === 3) state[s].currentMode = button.id.split('-')[1];
                    else state[s].currentMode = button.id.split('-')[1];
                    generateNewCircuit(sectionNumber);
                });
            });
            document.getElementById(`new-circuit-button-${s}`).addEventListener('click', () => generateNewCircuit(sectionNumber));
            generateNewCircuit(sectionNumber);
        }
        
        document.getElementById(`check-button-${s}`).addEventListener('click', () => checkAnswer(sectionNumber));
        document.getElementById(`solution-button-${s}`).addEventListener('click', () => showSolution(sectionNumber));
        
        const visBtn = document.getElementById(`visual-button-${s}`);
        if(visBtn) visBtn.addEventListener('click', () => toggleEquivalentCircuit());
    }

    // --- LÓGICA SECCIÓN 4 (BOYLESTAD & KATEX) ---
    const topicSelector = document.getElementById('topic-selector');
    if (topicSelector) {
        topicSelector.addEventListener('change', (e) => {
            const topic = e.target.value;
            if (topic === 'intro') return;
            loadBoylestadLesson(topic);
        });
        document.getElementById('new-circuit-button-s4').addEventListener('click', () => {
            loadBoylestadLesson(topicSelector.value);
        });
    }

    function loadBoylestadLesson(topicKey) {
        const lesson = boylestadLessons[topicKey];
        if (!lesson) return;

        // UI Teoría
        document.getElementById('lesson-title').textContent = lesson.title;
        document.getElementById('lesson-content').innerHTML = lesson.content;
        
        // UI Fórmula
        const formulaBox = document.getElementById('formula-box');
        formulaBox.style.display = 'block';
        if (typeof katex !== 'undefined') {
            katex.render(lesson.formula, formulaBox, { throwOnError: false });
        } else {
            formulaBox.textContent = lesson.formula;
        }

        // Generar Problema
        const problem = lesson.generateProblem();
        state.s4 = { currentMode: topicKey, correctAnswer: problem.answer, solutionSteps: problem.steps };

        // UI Práctica
        document.getElementById('question-text-s4').textContent = problem.question;
        document.getElementById('user-answer-s4').value = '';
        document.getElementById('result-text-s4').textContent = '';
        document.getElementById('solution-steps-s4').style.display = 'none';
        document.getElementById('solution-button-s4').style.display = 'none';
        document.getElementById('check-button-s4').disabled = false;
        document.getElementById('new-circuit-button-s4').disabled = false;

        // DIBUJO CON OFFSET HORIZONTAL (+60px)
        const container = document.getElementById('circuit-container-s4');
        clearCircuit(container);
        
        const yTop = 80;
        const yMid = 130; 
        const yBot = 180;
        
        // Offset X para centrar y dar espacio a los textos de la izquierda
        const xOff = 60; 

        if (problem.type === 'L') {
            // Fuente en 50+60 = 110. Texto en 110-40 = 70 (Espacio seguro)
            drawACSource(container, 50 + xOff, yMid, 120, problem.f);
            drawWire(container, 50 + xOff, yTop, 150 + xOff, yTop);
            drawInductor(container, 150 + xOff, yTop, problem.val);
            drawWire(container, 210 + xOff, yTop, 250 + xOff, yTop); 
            drawWire(container, 250 + xOff, yTop, 250 + xOff, yBot);
            drawWire(container, 250 + xOff, yBot, 50 + xOff, yBot); 
            drawWire(container, 50 + xOff, yBot, 50 + xOff, yMid+20);
            drawWire(container, 50 + xOff, yMid-20, 50 + xOff, yTop);
        } else if (problem.type === 'C') {
            drawACSource(container, 50 + xOff, yMid, 120, problem.f);
            drawWire(container, 50 + xOff, yTop, 150 + xOff, yTop);
            drawCapacitor(container, 150 + xOff, yTop, problem.val);
            drawWire(container, 210 + xOff, yTop, 250 + xOff, yTop); 
            drawWire(container, 250 + xOff, yTop, 250 + xOff, yBot);
            drawWire(container, 250 + xOff, yBot, 50 + xOff, yBot); 
            drawWire(container, 50 + xOff, yBot, 50 + xOff, yMid+20);
            drawWire(container, 50 + xOff, yMid-20, 50 + xOff, yTop);
        } else if (problem.type === 'RL_Series') {
            // También movemos este para que se vea centrado
            drawResistor(container, 50 + xOff, yMid, problem.r);
            drawWire(container, 110 + xOff, yMid, 150 + xOff, yMid);
            drawInductor(container, 150 + xOff, yMid, "XL=" + problem.xl); 
            const txt = document.createElementNS(svgNS, 'text');
            txt.setAttribute('x', 150 + xOff); txt.setAttribute('y', yBot + 30); 
            txt.setAttribute('text-anchor', 'middle'); txt.textContent = "Circuito Serie RL";
            container.appendChild(txt);
        }
    }

    // --- GENERADOR DE CIRCUITOS (S1, S2, S3) ---
    function generateNewCircuit(sectionNumber) {
        if(sectionNumber === 4) return;

        const s = `s${sectionNumber}`;
        const container = document.getElementById(`circuit-container-${s}`);
        clearCircuit(container);
        
        document.getElementById(`result-text-${s}`).textContent = '';
        document.getElementById(`user-answer-${s}`).value = '';
        document.getElementById(`solution-button-${s}`).style.display = 'none';
        document.getElementById(`solution-steps-${s}`).style.display = 'none';
        
        if(sectionNumber === 3) {
            state.s3.showEquivalent = false;
            const vBtn = document.getElementById(`visual-button-s3`);
            if(vBtn) {
                vBtn.style.display = 'none';
                vBtn.textContent = "Ver Circuito Equivalente";
            }
        }

        const r1 = Math.floor(Math.random() * 20) * 10 + 10; 
        const r2 = Math.floor(Math.random() * 20) * 10 + 10;
        const r3 = Math.floor(Math.random() * 20) * 10 + 10;
        const v = Math.floor(Math.random() * 5) * 5 + 5; 

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
        else if (sectionNumber === 2) {
            let rt = state[s].currentMode === 'serie' ? r1+r2 : (r1*r2)/(r1+r2);
            const i = v / rt;
            state[s].correctAnswer = parseFloat(i.toFixed(3));
            state[s].solutionSteps = `RT = ${rt.toFixed(2)}Ω\nI = V / RT = ${v} / ${rt.toFixed(2)} = ${state[s].correctAnswer}A`;
            if(state[s].currentMode === 'serie') drawSeriesCircuit(container, r1, r2, v);
            else drawParallelCircuit(container, r1, r2, v);
        }
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
            } else { 
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
        l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('stroke', '#333'); l.setAttribute('stroke-width', 2);
        c.appendChild(l);
    }
    
    function drawResistor(c, x, y, val, vertical = false) {
        const g = document.createElementNS(svgNS, 'g');
        const r = document.createElementNS(svgNS, 'rect');
        const t = document.createElementNS(svgNS, 'text');
        if (vertical) {
            r.setAttribute('x', x-10); r.setAttribute('y', y); r.setAttribute('width', 20); r.setAttribute('height', 60);
            t.setAttribute('x', x+15); t.setAttribute('y', y+35);
        } else {
            r.setAttribute('x', x); r.setAttribute('y', y-10); r.setAttribute('width', 60); r.setAttribute('height', 20);
            t.setAttribute('x', x+30); t.setAttribute('y', y-15);
        }
        r.setAttribute('fill', 'white'); r.setAttribute('stroke', '#333'); r.setAttribute('stroke-width', 2);
        t.setAttribute('text-anchor', 'middle'); t.style.fontSize = "14px"; t.textContent = `${val}Ω`;
        g.appendChild(r); g.appendChild(t); c.appendChild(g);
    }

    function drawVoltageSource(c, x, y, val) {
        const g = document.createElementNS(svgNS, 'g');
        const circ = document.createElementNS(svgNS, 'circle');
        circ.setAttribute('cx', x); circ.setAttribute('cy', y); circ.setAttribute('r', 20);
        circ.setAttribute('fill', '#fff9c4'); circ.setAttribute('stroke', '#333');
        
        // Texto desplazado a la izquierda (x-40)
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', x - 40); 
        t.setAttribute('y', y + 5); 
        t.setAttribute('text-anchor', 'end'); 
        t.style.fontWeight = "bold"; 
        t.textContent = `${val}V`;
        
        const plus = document.createElementNS(svgNS, 'text');
        plus.setAttribute('x', x); plus.setAttribute('y', y - 4); plus.setAttribute('text-anchor', 'middle'); plus.style.fontSize = "16px"; plus.textContent = '+';
        const minus = document.createElementNS(svgNS, 'text');
        minus.setAttribute('x', x); minus.setAttribute('y', y + 15); minus.setAttribute('text-anchor', 'middle'); minus.style.fontSize = "18px"; minus.style.fontWeight = "bold"; minus.textContent = '-';
        
        g.appendChild(circ); g.appendChild(t); g.appendChild(plus); g.appendChild(minus);
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
        g.appendChild(circ); g.appendChild(arrow); g.appendChild(t); c.appendChild(g);
    }

    function drawACSource(c, x, y, val, freq) {
        const g = document.createElementNS(svgNS, 'g');
        const circ = document.createElementNS(svgNS, 'circle');
        circ.setAttribute('cx', x); circ.setAttribute('cy', y); circ.setAttribute('r', 20);
        circ.setAttribute('fill', '#e1bee7'); circ.setAttribute('stroke', '#333'); 
        const wave = document.createElementNS(svgNS, 'path');
        const d = `M ${x-10} ${y} Q ${x-5} ${y-10}, ${x} ${y} T ${x+10} ${y}`;
        wave.setAttribute('d', d); wave.setAttribute('fill', 'none'); wave.setAttribute('stroke', 'black'); wave.setAttribute('stroke-width', 2);
        
        // Texto desplazado a la izquierda (x-40)
        const tV = document.createElementNS(svgNS, 'text');
        tV.setAttribute('x', x - 40); tV.setAttribute('y', y - 5); tV.setAttribute('text-anchor', 'end'); tV.textContent = `${val}V`;
        const tHz = document.createElementNS(svgNS, 'text');
        tHz.setAttribute('x', x - 40); tHz.setAttribute('y', y + 15); tHz.setAttribute('text-anchor', 'end'); tHz.style.fontSize = "12px"; tHz.textContent = `${freq}Hz`;
        
        g.appendChild(circ); g.appendChild(wave); g.appendChild(tV); g.appendChild(tHz); c.appendChild(g);
    }

    function drawCapacitor(c, x, y, val, vertical = false) {
        const g = document.createElementNS(svgNS, 'g');
        const t = document.createElementNS(svgNS, 'text');
        const line1 = document.createElementNS(svgNS, 'line');
        const line2 = document.createElementNS(svgNS, 'line');
        
        line1.setAttribute('stroke', '#333'); line1.setAttribute('stroke-width', 3);
        line2.setAttribute('stroke', '#333'); line2.setAttribute('stroke-width', 3);
        
        if (vertical) {
            // Caso Vertical (Para el circuito mixto o paralelo)
            line1.setAttribute('x1', x-10); line1.setAttribute('y1', y+20); 
            line1.setAttribute('x2', x+10); line1.setAttribute('y2', y+20);
            
            line2.setAttribute('x1', x-10); line2.setAttribute('y1', y+28); 
            line2.setAttribute('x2', x+10); line2.setAttribute('y2', y+28);
            
            drawWire(c, x, y, x, y+20); 
            drawWire(c, x, y+28, x, y+60);
            t.setAttribute('x', x+15); t.setAttribute('y', y+30);
        } else {
            // Caso Horizontal (CORREGIDO)
            // Placa 1
            line1.setAttribute('x1', x+25); line1.setAttribute('y1', y-10); 
            line1.setAttribute('x2', x+25); line1.setAttribute('y2', y+10); // ¡Aquí estaba el error!

            // Placa 2
            line2.setAttribute('x1', x+33); line2.setAttribute('y1', y-10); 
            line2.setAttribute('x2', x+33); line2.setAttribute('y2', y+10);

            // Cables de conexión
            drawWire(c, x, y, x+25, y); 
            drawWire(c, x+33, y, x+60, y);
            t.setAttribute('x', x+30); t.setAttribute('y', y-15);
        }
        
        t.setAttribute('text-anchor', 'middle'); t.style.fontSize = "14px"; t.textContent = `${val}µF`; 
        g.appendChild(line1); g.appendChild(line2); g.appendChild(t); c.appendChild(g);
    }

    function drawInductor(c, x, y, val) {
        const g = document.createElementNS(svgNS, 'g');
        const path = document.createElementNS(svgNS, 'path');
        let d = `M ${x} ${y} `;
        for(let i=1; i<=4; i++) d += `Q ${x + (i*12) - 6} ${y-15}, ${x + (i*12)} ${y} `;
        d += `L ${x+60} ${y}`;
        path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#333'); path.setAttribute('stroke-width', 2);
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', x+30); t.setAttribute('y', y-15); t.setAttribute('text-anchor', 'middle'); t.style.fontSize = "14px"; t.textContent = typeof val === 'string' ? val : `${val}mH`;
        g.appendChild(path); g.appendChild(t); c.appendChild(g);
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

    // --- CIRCUITOS (FUNCIONES DE DIBUJO COMPLETO) ---
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
        drawWire(c, 110, 100, 150, 100); drawWire(c, 150, 60, 150, 140); 
        drawWire(c, 150, 60, 180, 60); drawResistor(c, 180, 60, r2); drawWire(c, 240, 60, 270, 60);
        drawWire(c, 150, 140, 180, 140); drawResistor(c, 180, 140, r3); drawWire(c, 240, 140, 270, 140);
        drawWire(c, 270, 60, 270, 140); drawWire(c, 270, 100, 300, 100); 
    }

    function drawTheveninProblem(c, r1, r2, v) {
        // Offset de 50px a la derecha
        const xOff = 50;
        
        drawVoltageSource(c, 60 + xOff, 100, v);
        drawWire(c, 60 + xOff, 80, 60 + xOff, 50); 
        drawWire(c, 60 + xOff, 120, 60 + xOff, 150); 
        
        drawWire(c, 60 + xOff, 50, 100 + xOff, 50); 
        drawResistor(c, 100 + xOff, 50, r1); 
        
        drawWire(c, 160 + xOff, 50, 220 + xOff, 50); 
        drawWire(c, 220 + xOff, 50, 220 + xOff, 70);
        drawResistor(c, 220 + xOff, 70, r2, true); 
        drawWire(c, 220 + xOff, 130, 220 + xOff, 150); 
        
        drawWire(c, 60 + xOff, 150, 220 + xOff, 150); 
        
        drawWire(c, 220 + xOff, 50, 300 + xOff, 50); 
        drawWire(c, 220 + xOff, 150, 300 + xOff, 150);
        drawTerminals(c, 300 + xOff, 50, 300 + xOff, 150);
    }

    function toggleEquivalentCircuit() {
        const container = document.getElementById(`circuit-container-s3`);
        const btn = document.getElementById(`visual-button-s3`);
        const data = state.s3.circuitData;
        
        clearCircuit(container);
        
        // Offset para centrar mejor
        const xOff = 30;
        
        if (!state.s3.showEquivalent) {
            const rth = (data.r1 * data.r2) / (data.r1 + data.r2);
            
            if (state.s3.currentMode === 'thevenin') {
                const vth = data.v * (data.r2 / (data.r1 + data.r2));
                
                // Fuente en 80+30 = 110. Texto en 70.
                drawVoltageSource(container, 80 + xOff, 100, parseFloat(vth.toFixed(2)));
                
                drawWire(container, 80 + xOff, 80, 80 + xOff, 50); 
                drawWire(container, 80 + xOff, 120, 80 + xOff, 150);
                drawWire(container, 80 + xOff, 50, 120 + xOff, 50); 
                
                drawResistor(container, 120 + xOff, 50, parseFloat(rth.toFixed(2)));
                
                drawWire(container, 180 + xOff, 50, 300 + xOff, 50); 
                drawWire(container, 80 + xOff, 150, 300 + xOff, 150);
                drawTerminals(container, 300 + xOff, 50, 300 + xOff, 150);
                
                const txt = document.createElementNS(svgNS, 'text');
                txt.setAttribute('x', 200 + xOff); txt.setAttribute('y', 180); 
                txt.setAttribute('text-anchor', 'middle'); txt.textContent = "Equivalente Thevenin";
                container.appendChild(txt);
            } else {
                const inorton = (data.v * (data.r2 / (data.r1 + data.r2))) / rth;
                
                drawCurrentSource(container, 80 + xOff, 100, parseFloat(inorton.toFixed(2)));
                
                drawWire(container, 80 + xOff, 80, 80 + xOff, 50); 
                drawWire(container, 80 + xOff, 120, 80 + xOff, 150);
                drawWire(container, 80 + xOff, 50, 200 + xOff, 50); 
                
                drawWire(container, 200 + xOff, 50, 200 + xOff, 70);
                drawResistor(container, 200 + xOff, 70, parseFloat(rth.toFixed(2)), true); 
                drawWire(container, 200 + xOff, 130, 200 + xOff, 150); 
                
                drawWire(container, 80 + xOff, 150, 200 + xOff, 150);
                drawWire(container, 200 + xOff, 50, 300 + xOff, 50); 
                drawWire(container, 200 + xOff, 150, 300 + xOff, 150);
                drawTerminals(container, 300 + xOff, 50, 300 + xOff, 150);
                
                const txt = document.createElementNS(svgNS, 'text');
                txt.setAttribute('x', 200 + xOff); txt.setAttribute('y', 180); 
                txt.setAttribute('text-anchor', 'middle'); txt.textContent = "Equivalente Norton";
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
            resText.textContent = "Por favor ingresa un número."; resText.style.color = "orange"; return;
        }

        const margin = sectionNumber === 3 || sectionNumber === 4 ? 0.1 : 0.05;
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
    initializeSection(4);
});
