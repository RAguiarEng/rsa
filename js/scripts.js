// Inicialização do AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });

    // Efeito da Navbar no Scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('shadow-lg');
                navbar.style.padding = '10px 0';
            } else {
                navbar.classList.remove('shadow-lg');
                navbar.style.padding = '20px 0';
            }
        });
    }


    // Scroll Suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Se o link foi atualizado para URL externa dinamicamente, não bloqueia
            if (!href || !href.startsWith('#')) return;
            
            e.preventDefault(); // Impede pulo para o topo em href="#"
            
            if (href !== '#') {
                try {
                    const target = document.querySelector(href);
                    if (target) {
                        window.scrollTo({
                            top: target.offsetTop - 70,
                            behavior: 'smooth'
                        });
                    }
                } catch (err) {
                    console.warn("[RSA] Seletor inválido no scroll suave:", href);
                }
            }
        });
    });
    // Fechar menu mobile ao clicar em um link (Genérico)
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const menuToggle = document.querySelector('.navbar-collapse');
    
    if (menuToggle) {
        const bsCollapse = new bootstrap.Collapse(menuToggle, { toggle: false });
        
        navLinks.forEach((l) => {
            l.addEventListener('click', () => {
                if (window.innerWidth < 992 && menuToggle.classList.contains('show')) {
                    bsCollapse.hide();
                }
            });
        });
    }

    // Lógica para o Modal Dinâmico do Método RSA
    const methodModal = document.getElementById('methodModal');
    if (methodModal) {
        methodModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const imageSrc = button.getAttribute('data-bs-image');
            const title = button.getAttribute('data-bs-title');
            
            const modalTitle = methodModal.querySelector('.modal-title');
            const modalImage = methodModal.querySelector('#methodModalImage');
            
            modalTitle.textContent = title;
            modalImage.src = imageSrc;
        });
    }
});