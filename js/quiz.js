/**
 * quiz.js — Motor do Quiz de Diagnóstico RSA
 * ─────────────────────────────────────────────────────────────
 * Responsabilidades:
 *   1. Controle do carrossel de perguntas (auto-advance)
 *   2. Registro de respostas por questão
 *   3. Atualização da progress bar no footer
 *   4. Geração do resumo e exibição da tela de resultado
 *   5. Reinicialização completa do quiz
 *
 * Stack: Vanilla JS — zero dependências externas
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

// ════════════════════════════════════════════════════════
// CONFIGURAÇÃO CENTRAL
// ════════════════════════════════════════════════════════
const QUIZ_CONFIG = {
    totalQuestions: 15,          // Total de perguntas (incluindo identificação)
    advanceDelay: 420,           // ms antes de avançar (feedback visual)
    resultDelay: 500,            // ms antes de mostrar resultado
};

// ── Endpoint do Google Apps Script Web App ──────────────
// Preencher após publicar o GAS como Web App (Passo 3)
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwp2OAtn4woBpmyIA1xIZxm61S3Cp5d4JUJtXtmF65swkI1S3TBfGvVXdc4zhsJ3GnN/exec';

// ════════════════════════════════════════════════════════
// ESTADO DO QUIZ
// ════════════════════════════════════════════════════════
const quizState = {
    currentSlide: 0,             // Índice do slide atual (0-based)
    answers: {},                 // { questionNumber: { value, label } }
    isAnimating: false,          // Trava durante transição
    started: false,              // true após clicar em "Iniciar"
};

// ════════════════════════════════════════════════════════
// SELETORES DE ELEMENTOS
// ════════════════════════════════════════════════════════
const els = {
    // Hero
    heroSection: document.getElementById('quiz-hero'),
    btnStart: document.getElementById('btn-start-quiz'),

    // Quiz
    quizSection: document.getElementById('quiz-section'),
    track: document.getElementById('quiz-carousel-track'),
    slides: document.querySelectorAll('.quiz-slide'),
    header: document.getElementById('quiz-header'),
    currentStep: document.getElementById('current-step'),
    totalSteps: document.getElementById('total-steps'),
    categoryLabel: document.getElementById('quiz-category-label'),

    // Resultado
    resultScreen: document.getElementById('quiz-result-screen'),
    resultSummary: document.getElementById('quiz-result-summary'),
    btnRestart: document.getElementById('btn-restart-quiz'),
    btnFinish: document.getElementById('btn-finish-quiz'),

    // Footer
    footer: document.getElementById('quiz-footer'),
    footerCurrent: document.getElementById('footer-current'),
    progressFill: document.getElementById('quiz-progress-fill'),
    progressTrack: document.getElementById('quiz-progress-track'),
    progressDots: document.getElementById('quiz-progress-dots'),
};

// ════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    // Define o total de perguntas nos elementos estáticos
    if (els.totalSteps) {
        els.totalSteps.textContent = QUIZ_CONFIG.totalQuestions;
    }

    // Gera os pontos da progress bar
    buildProgressDots();

    // Registra evento do botão "Iniciar"
    if (els.btnStart) {
        els.btnStart.addEventListener('click', startQuiz);
    }

    // Registra evento do botão "Refazer"
    if (els.btnRestart) {
        els.btnRestart.addEventListener('click', restartQuiz);
    }

    // Registra evento do botão "Finalizar"
    if (els.btnFinish) {
        els.btnFinish.addEventListener('click', handleFinishClick);
    }

    // Registra evento do botão de identificação (Slide 1)
    const btnStartForm = document.getElementById('btn-start-form');
    if (btnStartForm) {
        btnStartForm.addEventListener('click', handleStartForm);
    }

    // Registra cliques em todas as opções de resposta
    registerOptionListeners();

    // Atualiza progress bar no estado inicial (0 respondidas)
    updateProgress(0);
});

// ════════════════════════════════════════════════════════
// INICIAR QUIZ
// ════════════════════════════════════════════════════════

/**
 * Oculta o Hero, exibe a seção do quiz e o footer de progresso.
 */
function startQuiz() {
    if (quizState.started) return;
    quizState.started = true;

    // Oculta o Hero com fade
    if (els.heroSection) {
        els.heroSection.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        els.heroSection.style.opacity = '0';
        els.heroSection.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            els.heroSection.style.display = 'none';
        }, 400);
    }

    // Exibe a seção do quiz
    setTimeout(() => {
        if (els.quizSection) {
            els.quizSection.classList.add('quiz-active');
            els.quizSection.style.animation = 'quiz-fade-in 0.5s ease both';
        }

        // Exibe o header interno
        setTimeout(() => {
            if (els.header) els.header.classList.add('visible');
        }, 200);

        // Exibe o footer de progresso
        if (els.footer) {
            els.footer.classList.add('visible');
        }

        // Posiciona no primeiro slide
        goToSlide(0);

        // Rola para o topo da seção
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Reinicializa AOS para os novos elementos visíveis
        if (typeof AOS !== 'undefined') AOS.refresh();

    }, 350);
}

// ════════════════════════════════════════════════════════
// NAVEGAÇÃO DO CARROSSEL
// ════════════════════════════════════════════════════════

/**
 * Move o carrossel para o slide de índice `index`.
 * @param {number} index — índice do slide (0-based)
 */
function goToSlide(index) {
    if (!els.track) return;

    quizState.currentSlide = index;

    // Translada o track
    els.track.style.transform = `translateX(-${index * 100}%)`;

    // Atualiza o cabeçalho do quiz
    updateQuizHeader(index);

    // Atualiza a barra de progresso baseada nas respostas dadas
    const answeredCount = Object.keys(quizState.answers).length;
    updateProgress(answeredCount);

    // Rola para o topo da seção em mobile
    if (window.innerWidth < 768 && els.quizSection) {
        els.quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Volta para o slide anterior.
 */
window.prevSlide = function () {
    if (quizState.isAnimating || quizState.currentSlide <= 0) return;

    quizState.isAnimating = true;
    const prevIndex = quizState.currentSlide - 1;

    goToSlide(prevIndex);

    setTimeout(() => {
        quizState.isAnimating = false;
    }, QUIZ_CONFIG.advanceDelay);
};

/**
 * Avança para o próximo slide após o delay de feedback.
 */
function advanceToNext() {
    const nextIndex = quizState.currentSlide + 1;

    if (nextIndex >= QUIZ_CONFIG.totalQuestions) {
        // Todas as perguntas respondidas → exibe resultado
        setTimeout(showResult, QUIZ_CONFIG.resultDelay);
    } else {
        setTimeout(() => {
            goToSlide(nextIndex);
            quizState.isAnimating = false;
        }, QUIZ_CONFIG.advanceDelay);
    }
}

// ════════════════════════════════════════════════════════
// REGISTRO E PROCESSAMENTO DE RESPOSTAS
// ════════════════════════════════════════════════════════

/**
 * Registra listeners de clique em todos os botões de opção.
 * Detecta automaticamente todos os elementos com `data-question`.
 */
function registerOptionListeners() {
    const optionSelectors = [
        '.quiz-option-card',
        '.quiz-option-yesno',
        '.quiz-option-scale',
    ];

    optionSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(btn => {
            btn.addEventListener('click', handleOptionClick);
        });
    });
}

/**
 * Handler para o botão de "Iniciar Diagnóstico" no Slide 1.
 * Valida os campos de identificação e avança o quiz.
 */
function handleStartForm() {
    if (quizState.isAnimating) return;

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();

    // Validação básica
    if (!nome || !email) {
        alert('Por favor, preencha seu nome e e-mail para continuarmos.');
        return;
    }

    // Validação de e-mail simples
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Por favor, insira um e-mail válido.');
        return;
    }

    quizState.isAnimating = true;

    // Salva a identificação no estado (Questão 1)
    quizState.answers[1] = {
        value: { nome, email, telefone },
        label: `${nome} (${email})`
    };

    // Atualiza a barra de progresso
    updateProgress(1);

    // Avança para o próximo slide
    advanceToNext();
}

/**
 * Handler de clique numa opção de resposta.
 * @param {Event} e
 */
function handleOptionClick(e) {
    // Trava durante animação para evitar duplo clique
    if (quizState.isAnimating) return;
    quizState.isAnimating = true;

    const btn = e.currentTarget;
    const originalQuestionNum = parseInt(btn.dataset.question, 10);
    const value = btn.dataset.value;

    // Shift diagnostic questions to make room for identification (Question 1)
    // Buttons in HTML are 1-14, but they correspond to Slides 2-15
    const shiftedQuestionNum = originalQuestionNum + 1;

    // Recupera o label visível da opção
    const label = getOptionLabel(btn);

    // Salva a resposta no estado
    quizState.answers[shiftedQuestionNum] = { value, label };

    // Feedback visual: marca a opção como selecionada
    markSelected(btn, originalQuestionNum);

    // Atualiza a barra de progresso
    const answeredCount = Object.keys(quizState.answers).length;
    updateProgress(answeredCount);

    // Avança para o próximo slide
    advanceToNext();
}

/**
 * Handler para o botão de finalizar (Questão 14).
 */
function handleFinishClick() {
    if (quizState.isAnimating) return;
    quizState.isAnimating = true;

    // Salva o conteúdo do textarea se houver (Questão 15)
    const textarea = document.querySelector('textarea[data-question="14"]');
    if (textarea) {
        const val = textarea.value.trim();
        quizState.answers[15] = {
            value: val || 'N/A',
            label: val || 'Nenhuma consideração extra.'
        };
    }

    // Exibe resultado
    showResult();
}

/**
 * Extrai o texto visível de um botão de opção.
 * @param {HTMLElement} btn
 * @returns {string}
 */
function getOptionLabel(btn) {
    // Tenta pegar o texto do label específico
    const labelEl = btn.querySelector('.quiz-option-label, .quiz-scale-desc, span:last-child');
    if (labelEl) return labelEl.textContent.trim();

    // Fallback: texto direto do botão (sem ícones)
    return btn.textContent.replace(/\s+/g, ' ').trim();
}

/**
 * Marca visualmente a opção selecionada e aplica animação.
 * @param {HTMLElement} selectedBtn — botão clicado
 * @param {number} questionNum — número da pergunta
 */
function markSelected(selectedBtn, questionNum) {
    // Remove seleção anterior da mesma pergunta
    const allInQuestion = document.querySelectorAll(
        `[data-question="${questionNum}"]`
    );
    allInQuestion.forEach(btn => btn.classList.remove('selected', 'quiz-option-selected-anim'));

    // Aplica seleção e animação
    selectedBtn.classList.add('selected', 'quiz-option-selected-anim');
}

// ════════════════════════════════════════════════════════
// ATUALIZAÇÃO DO CABEÇALHO DO QUIZ
// ════════════════════════════════════════════════════════

/**
 * Atualiza o número da pergunta e a categoria no cabeçalho.
 * @param {number} slideIndex — índice 0-based do slide atual
 */
function updateQuizHeader(slideIndex) {
    const currentNum = slideIndex + 1;

    if (els.currentStep) {
        els.currentStep.textContent = currentNum;
    }

    // Recupera a categoria do slide atual
    const currentSlide = els.slides[slideIndex];
    if (currentSlide && els.categoryLabel) {
        const category = currentSlide.dataset.category || '';
        els.categoryLabel.textContent = category;
    }
}

// ════════════════════════════════════════════════════════
// PROGRESS BAR
// ════════════════════════════════════════════════════════

/**
 * Atualiza todos os elementos visuais da progress bar.
 * @param {number} answered — quantidade de perguntas respondidas
 */
function updateProgress(answered) {
    const total = QUIZ_CONFIG.totalQuestions;
    const pct = Math.round((answered / total) * 100);

    // Texto "X de 14"
    if (els.footerCurrent) {
        els.footerCurrent.textContent = answered;
    }

    // Percentual
    const pctEl = document.getElementById('footer-pct');
    if (pctEl) pctEl.textContent = `${pct}%`;

    // Largura da barra
    if (els.progressFill) {
        els.progressFill.style.width = `${pct}%`;
    }

    // ARIA
    if (els.progressTrack) {
        els.progressTrack.setAttribute('aria-valuenow', answered);
    }

    // Atualiza os pontos
    updateProgressDots(answered);
}

/**
 * Constrói os 14 pontos de etapa dentro da progress bar.
 * Chamado uma única vez na inicialização.
 */
function buildProgressDots() {
    if (!els.progressDots) return;

    els.progressDots.innerHTML = '';

    for (let i = 1; i <= QUIZ_CONFIG.totalQuestions; i++) {
        const dot = document.createElement('span');
        dot.classList.add('quiz-progress-dot');
        dot.dataset.step = i;
        dot.setAttribute('aria-label', `Pergunta ${i}`);
        els.progressDots.appendChild(dot);
    }
}

/**
 * Atualiza o estado visual (answered / current / default) de cada ponto.
 * @param {number} answered — quantidade de perguntas respondidas
 */
function updateProgressDots(answered) {
    if (!els.progressDots) return;

    const dots = els.progressDots.querySelectorAll('.quiz-progress-dot');

    dots.forEach((dot, index) => {
        const stepNum = index + 1;

        dot.classList.remove('answered', 'current');

        if (stepNum <= answered) {
            dot.classList.add('answered');
        } else if (stepNum === answered + 1) {
            dot.classList.add('current');
        }
    });
}

// ════════════════════════════════════════════════════════
// TELA DE RESULTADO
// ════════════════════════════════════════════════════════

/**
 * Oculta o carrossel, o cabeçalho e exibe a tela de resultado.
 * Gera o resumo das respostas dinamicamente.
 */
function showResult() {
    // Oculta o carrossel e cabeçalho
    if (els.track) {
        els.track.closest('.quiz-carousel-wrapper').style.display = 'none';
    }
    if (els.header) {
        els.header.style.display = 'none';
    }

    // Preenche o resumo
    buildResultSummary();

    // Exibe a tela de resultado
    if (els.resultScreen) {
        els.resultScreen.classList.add('visible');
        els.resultScreen.removeAttribute('aria-hidden');

        // Scroll suave para o resultado
        setTimeout(() => {
            els.resultScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // Atualiza footer para 100%
    updateProgress(QUIZ_CONFIG.totalQuestions);

    // Libera a trava de animação
    quizState.isAnimating = false;
}

/**
 * Gera dinamicamente os itens do resumo de respostas.
 */
function buildResultSummary() {
    if (!els.resultSummary) return;

    // Recupera os slides para obter os textos das perguntas
    const slides = document.querySelectorAll('.quiz-slide');

    let summaryHTML = '';

    let emailBody = "Olá, Rodrigo!\n\nAcabei de completar o diagnóstico RSA e gostaria de receber meu plano de ação. Seguem as minhas respostas:\n\n";

    slides.forEach(slide => {
        const questionNum = parseInt(slide.dataset.question, 10);
        const answer = quizState.answers[questionNum];

        // Texto da pergunta
        const questionTextEl = slide.querySelector('.quiz-question-text');
        const questionText = questionTextEl
            ? questionTextEl.textContent.trim()
            : `Pergunta ${questionNum}`;

        // Resposta registrada (ou "Não respondida" como fallback)
        const answerLabel = answer ? answer.label : '—';

        emailBody += `Q${questionNum}: ${questionText}\nResposta: ${answerLabel}\n\n`;

        summaryHTML += `
            <div class="quiz-summary-item">
                <span class="quiz-summary-num">Q${questionNum}</span>
                <div>
                    <div style="font-size:0.78rem; color:#999; margin-bottom:2px;">
                        ${questionText}
                    </div>
                    <span class="quiz-summary-answer">${answerLabel}</span>
                </div>
            </div>
        `;
    });

    els.resultSummary.innerHTML = summaryHTML;

    // ── Botão de envio: dispara fetch() ao clicar ──────────
    const btnEmail = document.getElementById('btn-email-result');
    if (btnEmail) {

        // Remove qualquer listener anterior (segurança contra
        // múltiplas chamadas a buildResultSummary)
        const btnClone = btnEmail.cloneNode(true);
        btnEmail.parentNode.replaceChild(btnClone, btnEmail);

        btnClone.addEventListener('click', async function (e) {
            e.preventDefault();

            // ── Feedback visual: desabilita o botão durante o envio
            btnClone.disabled = true;
            btnClone.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';

            const payload = {
                respostas: buildPayload(quizState.answers)
            };

            try {
                await fetch(GAS_ENDPOINT, {
                    method: 'POST',
                    mode: 'no-cors',       // Obrigatório para Apps Script
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(payload),
                });

                // ── Sucesso: feedback ao visitante
                btnClone.innerHTML =
                    '<i class="fas fa-check-circle me-2"></i>Diagnóstico Enviado!';
                btnClone.style.background = '#1ebe5b';
                btnClone.style.cursor = 'default';

            } catch (err) {
                // ── Fallback: abre o mailto como plano B
                console.warn('[RSA Quiz] Falha no envio via GAS. Abrindo e-mail.', err);
                btnClone.disabled = false;
                btnClone.innerHTML =
                    '<i class="fas fa-envelope me-2"></i>Enviar Diagnóstico por E-mail';

                const subject = encodeURIComponent('Resultado Diagnóstico RSA');
                const body = encodeURIComponent(emailBody);
                window.location.href =
                    `mailto:raguiar.eng@gmail.com?subject=${subject}&body=${body}`;
            }
        });
    }
}


// ════════════════════════════════════════════════════════
// buildPayload()
// Formata quizState.answers para envio ao GAS.
// A questão 1 (identificação) mantém o objeto aninhado;
// as demais são achatadas para { value, label }.
// ════════════════════════════════════════════════════════
function buildPayload(answers) {
    const payload = {};

    for (const [key, val] of Object.entries(answers)) {
        if (key === '1' && val.value && typeof val.value === 'object') {
            // Identificação: expõe { nome, email, telefone } diretamente
            payload[key] = val.value;
        } else {
            payload[key] = {
                value: val.value ?? 'N/A',
                label: val.label ?? 'N/A',
            };
        }
    }

    return payload;
}


// ════════════════════════════════════════════════════════
// REINICIALIZAÇÃO
// ════════════════════════════════════════════════════════

/**
 * Reseta completamente o quiz para o estado inicial.
 */
function restartQuiz() {
    // Limpa o estado
    quizState.currentSlide = 0;
    quizState.answers = {};
    quizState.isAnimating = false;
    quizState.started = false;

    // Remove seleções visuais
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected', 'quiz-option-selected-anim');
    });

    // Oculta resultado
    if (els.resultScreen) {
        els.resultScreen.classList.remove('visible');
        els.resultScreen.setAttribute('aria-hidden', 'true');
        if (els.resultSummary) els.resultSummary.innerHTML = '';
    }

    // Restaura o carrossel e cabeçalho
    if (els.track) {
        const wrapper = els.track.closest('.quiz-carousel-wrapper');
        if (wrapper) wrapper.style.display = '';
    }
    if (els.header) {
        els.header.style.display = '';
        els.header.classList.remove('visible');
    }

    // Oculta a seção do quiz
    if (els.quizSection) {
        els.quizSection.classList.remove('quiz-active');
    }

    // Oculta o footer
    if (els.footer) {
        els.footer.classList.remove('visible');
    }

    // Restaura o Hero
    if (els.heroSection) {
        els.heroSection.style.display = '';
        els.heroSection.style.opacity = '';
        els.heroSection.style.transform = '';
    }

    // Reseta a barra de progresso
    updateProgress(0);

    // Reseta o track do carrossel
    if (els.track) {
        els.track.style.transform = 'translateX(0)';
    }

    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reinicializa AOS
    if (typeof AOS !== 'undefined') AOS.refresh();
}