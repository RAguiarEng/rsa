// Inicialização do AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });

    // Efeito da Navbar no Scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow-lg');
            navbar.style.padding = '10px 0';
        } else {
            navbar.classList.remove('shadow-lg');
            navbar.style.padding = '20px 0';
        }
    });


    // Scroll Suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
    // Fechar menu mobile ao clicar em um link
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const menuToggle = document.getElementById('navbarNav');
    const bsCollapse = new bootstrap.Collapse(menuToggle, {toggle:false});
    
    navLinks.forEach((l) => {
        l.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                bsCollapse.hide();
            }
        });
    });

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