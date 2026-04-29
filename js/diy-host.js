/**
 * diy-host.js — Lógica de interação da página de planos DIY Hostinger
 * Responsabilidade: troca dinâmica de período/link por seção
 * Stack: Vanilla JS — zero dependências externas
 */

'use strict';

// ══════════════════════════════════════════════════════════
// MAPA DE PERÍODOS ATIVOS POR SEÇÃO
// Armazena qual período está selecionado em cada categoria
// ══════════════════════════════════════════════════════════
const activePeriods = {
    'sites-ia':        12,
    'horizons':         1,
    'email-business':   1,
    'email-marketing':  1
};

// ══════════════════════════════════════════════════════════
// setPeriod()
// Troca o período ativo de uma seção e atualiza os hrefs
// dos CTAs correspondentes sem recarregar a página.
//
// @param {string} sectionId  — ID da section no HTML
// @param {number} period     — Período em meses (1, 12, 24, 48)
// @param {HTMLElement} btn   — Botão clicado (para aplicar .active)
// ══════════════════════════════════════════════════════════
function setPeriod(sectionId, period, btn) {

    // 1. Atualiza o mapa de estado
    activePeriods[sectionId] = period;

    // 2. Troca a classe .active nos botões do grupo desta seção
    const section = document.getElementById(sectionId);
    if (!section) return;

    const periodBtns = section.querySelectorAll('.diy-period-btn');
    periodBtns.forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // 3. Atualiza o href de cada CTA da seção
    const ctaLinks = section.querySelectorAll('a[data-section="' + sectionId + '"]');

    ctaLinks.forEach(link => {
        const targetLink = link.getAttribute('data-link-' + period);

        if (targetLink) {
            link.href = targetLink;

            // Feedback visual sutil: flash no botão ao trocar
            link.classList.remove('diy-link-updated');

            // Força reflow para reiniciar a animação CSS
            void link.offsetWidth;
            link.classList.add('diy-link-updated');
        } else {
            // Período não disponível para este plano:
            // desabilita o link e indica indisponibilidade
            link.href = '#';
            link.setAttribute('aria-disabled', 'true');
            console.warn(
                '[RSA DIY] Link não encontrado para seção "' +
                sectionId + '", plano "' +
                link.getAttribute('data-plan') + '", período ' +
                period + ' meses.'
            );
        }
    });
}

// ══════════════════════════════════════════════════════════
// initDefaultPeriods()
// Aplica os links do período padrão em todos os cards
// ao carregar a página — garante que nenhum CTA fique com href="#"
// ══════════════════════════════════════════════════════════
function initDefaultPeriods() {
    Object.entries(activePeriods).forEach(([sectionId, defaultPeriod]) => {
        const section = document.getElementById(sectionId);
        if (!section) return;

        // Encontra o botão ativo padrão e aplica setPeriod
        const activeBtnSelector =
            '.diy-period-btn.active';
        const activeBtn = section.querySelector(activeBtnSelector);

        setPeriod(sectionId, defaultPeriod, activeBtn);
    });
}

// ══════════════════════════════════════════════════════════
// highlightNavOnScroll()
// Marca o link da navbar como ativo conforme a seção visível
// ══════════════════════════════════════════════════════════
function highlightNavOnScroll() {
    const sections = [
        'sites-ia',
        'horizons',
        'email-business',
        'email-marketing'
    ];

    const navLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;

                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        },
        {
            rootMargin: '-50% 0px -50% 0px', // Ativa no centro da viewport
            threshold: 0
        }
    );

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

// ══════════════════════════════════════════════════════════
// smoothScrollNavLinks()
// Scroll suave para âncoras internas desta página
// (complementa o scripts.js sem conflito)
// ══════════════════════════════════════════════════════════
function smoothScrollNavLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Ignora links que são apenas "#" (CTAs sem período)
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ══════════════════════════════════════════════════════════
// closeMobileMenuOnNavClick()
// Fecha o menu mobile ao clicar em link desta página
// (compatível com o collapse do scripts.js)
// ══════════════════════════════════════════════════════════
function closeMobileMenuOnNavClick() {
    const navbarCollapse = document.getElementById('navbarNavDIY');
    if (!navbarCollapse) return;

    const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

    document.querySelectorAll('#navbarNavDIY .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                bsCollapse.hide();
            }
        });
    });
}

// ══════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    // Inicializa links com os períodos padrão
    initDefaultPeriods();

    // Destaca nav conforme scroll
    highlightNavOnScroll();

    // Scroll suave para âncoras
    smoothScrollNavLinks();

    // Fecha menu mobile ao navegar
    closeMobileMenuOnNavClick();

    // AOS — inicializado pelo scripts.js global,
    // mas chamamos refresh() para garantir que os
    // elementos desta página sejam detectados
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }

    console.log('[RSA DIY] Página de planos inicializada com sucesso. ✅');
});