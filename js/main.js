/* ============================================
   ATIV ACADEMIA - Main JavaScript
   Funcionalidades: Loader, Nav, Animações,
   Slider, FAQ, Counter, Form, Scroll Progress
   ============================================ */

(function () {
    'use strict';

    // ============================================
    // UTILITÁRIOS
    // ============================================

    // rAF throttle - evita execução excessiva em eventos de scroll
    function rafThrottle(fn) {
        let ticking = false;
        return function () {
            if (!ticking) {
                requestAnimationFrame(() => {
                    fn.apply(this, arguments);
                    ticking = false;
                });
                ticking = true;
            }
        };
    }

    // ============================================
    // LOADER
    // ============================================
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hidden');
            // Remove do DOM após animação para liberar foco/cliques
            if (loader) setTimeout(() => loader.remove(), 700);
        }, 1500);
    });

    // ============================================
    // SCROLL HANDLERS UNIFICADOS (com throttle)
    // ============================================
    const scrollProgress = document.getElementById('scrollProgress');
    const header = document.getElementById('header');
    const heroImage = document.querySelector('.hero-image');
    const hasHero = !!document.querySelector('.hero'); // só páginas com hero transparente fazem toggle
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function handleScroll() {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // Scroll progress bar
        if (scrollProgress && docHeight > 0) {
            const percent = (scrollY / docHeight) * 100;
            scrollProgress.style.width = percent + '%';
        }

        // Header scrolled state — só toggle em páginas com hero transparente
        // Páginas internas mantêm o "scrolled" já definido no HTML (evita flicker)
        if (header && hasHero) {
            header.classList.toggle('scrolled', scrollY > 50);
        }

        // Active nav link
        const scrollPos = scrollY + 120;
        let activeFound = false;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(l => l.classList.remove('active'));
                const link = document.querySelector(`.nav-link[href="#${id}"]`);
                if (link) link.classList.add('active');
                activeFound = true;
            }
        });
        // No topo: marca o link "Início"
        if (!activeFound && scrollY < 100) {
            navLinks.forEach(l => l.classList.remove('active'));
            const homeLink = document.querySelector('.nav-link[href="#home"]');
            if (homeLink) homeLink.classList.add('active');
        }

        // Hero image parallax (só dentro da viewport do hero)
        if (heroImage && scrollY < window.innerHeight) {
            heroImage.style.transform = `translateY(${scrollY * 0.3}px) scale(${1 + scrollY * 0.0003})`;
        }
    }

    window.addEventListener('scroll', rafThrottle(handleScroll), { passive: true });
    handleScroll(); // executa uma vez no load

    // ============================================
    // MOBILE MENU TOGGLE
    // ============================================
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        // Estado inicial de acessibilidade
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-controls', 'navMenu');
        navMenu.setAttribute('aria-label', 'Menu principal');

        navToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('active');
            navToggle.classList.toggle('active', isOpen);
            navToggle.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Fecha menu ao clicar em qualquer link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', false);
                document.body.style.overflow = '';
            });
        });

        // Fecha menu ao redimensionar pra desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // ============================================
    // AOS-STYLE ANIMATIONS (Intersection Observer)
    // ============================================
    const animateElements = document.querySelectorAll('[data-aos]');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.getAttribute('data-aos-delay')) || 0;
                    setTimeout(() => {
                        entry.target.classList.add('aos-animate');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        animateElements.forEach(el => observer.observe(el));
    } else {
        // Fallback: navegadores antigos sem IntersectionObserver
        animateElements.forEach(el => el.classList.add('aos-animate'));
    }

    // ============================================
    // COUNTER ANIMATION
    // ============================================
    const counters = document.querySelectorAll('[data-count]');
    if ('IntersectionObserver' in window && counters.length) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(c => counterObserver.observe(c));
    }

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-count'));
        if (isNaN(target)) return;
        const duration = 2000;
        const start = performance.now();

        function format(num) {
            return num.toLocaleString('pt-BR') + '+';
        }

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const value = Math.floor(eased * target);
            el.textContent = format(value);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = format(target);
        }
        requestAnimationFrame(update);
    }

    // ============================================
    // TESTIMONIALS SLIDER
    // ============================================
    const slider = document.getElementById('testimonialsSlider');
    if (slider) {
        const cards = slider.querySelectorAll('.testimonial-card');
        const prevBtn = document.getElementById('prevTestimonial');
        const nextBtn = document.getElementById('nextTestimonial');
        const dotsContainer = document.getElementById('sliderDots');
        let current = 0;
        let autoplayInterval;

        if (cards.length > 0 && dotsContainer) {
            cards.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', `Depoimento ${i + 1}`);
                dot.addEventListener('click', () => goTo(i));
                dotsContainer.appendChild(dot);
            });
            const dots = dotsContainer.querySelectorAll('.slider-dot');

            function goTo(index) {
                cards[current].classList.remove('active');
                dots[current].classList.remove('active');
                current = (index + cards.length) % cards.length;
                cards[current].classList.add('active');
                dots[current].classList.add('active');
                resetAutoplay();
            }
            function next() { goTo(current + 1); }
            function prev() { goTo(current - 1); }

            if (nextBtn) nextBtn.addEventListener('click', next);
            if (prevBtn) prevBtn.addEventListener('click', prev);

            function startAutoplay() { autoplayInterval = setInterval(next, 6000); }
            function resetAutoplay() { clearInterval(autoplayInterval); startAutoplay(); }
            startAutoplay();
            slider.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
            slider.addEventListener('mouseleave', startAutoplay);

            // Suporte a swipe touch (mobile)
            let touchStartX = 0;
            slider.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
            slider.addEventListener('touchend', (e) => {
                const diff = touchStartX - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
            }, { passive: true });
        }
    }

    // ============================================
    // FAQ ACCORDION
    // ============================================
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;
        question.setAttribute('aria-expanded', 'false');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                const q = i.querySelector('.faq-question');
                if (q) q.setAttribute('aria-expanded', 'false');
            });
            if (!isActive) {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // ============================================
    // CONTACT FORM (WhatsApp Integration)
    // ============================================
    const form = document.getElementById('contatoForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const nome = (document.getElementById('nome').value || '').trim();
            const email = (document.getElementById('email').value || '').trim();
            const telefone = (document.getElementById('telefone').value || '').trim();
            const interesse = document.getElementById('interesse').value;
            const mensagem = (document.getElementById('mensagem').value || '').trim();

            // Mapa de interesse -> rótulo legível
            const interesseMap = {
                musculacao: 'Musculação',
                yoga: 'Yoga',
                cardio: 'Cardio',
                danca: 'Dança Fitness',
                circuito: 'Circuito Funcional',
                todos: 'Todas as modalidades'
            };
            const interesseLabel = interesseMap[interesse] || interesse;

            const lines = [
                'Olá! Quero agendar uma visita à Ativ Academia.',
                '',
                `*Nome:* ${nome}`,
                `*E-mail:* ${email}`,
                `*Telefone:* ${telefone}`,
                `*Interesse:* ${interesseLabel}`
            ];
            if (mensagem) lines.push(`*Mensagem:* ${mensagem}`);

            const text = encodeURIComponent(lines.join('\n'));
            const url = `https://wa.me/554533777654?text=${text}`;

            // Feedback visual ANTES de redirecionar (caso popup blocker bloqueie)
            const btn = form.querySelector('button[type="submit"]');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> <span>Abrindo WhatsApp...</span>';
            btn.disabled = true;

            // Redireciona na mesma aba — funciona em mobile mesmo com popup blocker
            // Em desktop, abre nova aba via target=_blank fallback
            try {
                const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                if (!newWindow || newWindow.closed) {
                    // popup bloqueado, redireciona na mesma aba
                    window.location.href = url;
                }
            } catch (err) {
                window.location.href = url;
            }

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                form.reset();
            }, 3000);
        });
    }

    // ============================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            // Links placeholder ("#") - previne scroll-to-top indesejado
            if (!href || href === '#' || href.length <= 1) {
                e.preventDefault();
                return;
            }
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ============================================
    // PHONE MASK (Brasileiro, suporta deletar)
    // ============================================
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 11);
            if (!v) { e.target.value = ''; return; }

            if (v.length <= 2) {
                e.target.value = `(${v}`;
            } else if (v.length <= 6) {
                e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            } else if (v.length <= 10) {
                // Fixo: (XX) XXXX-XXXX
                e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
            } else {
                // Celular: (XX) XXXXX-XXXX
                e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
            }
        });

        // Suporte a colar texto
        phoneInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            phoneInput.value = pasted;
            phoneInput.dispatchEvent(new Event('input'));
        });
    }

    // ============================================
    // PARALLAX MOUSE - HERO SHAPES (throttled)
    // ============================================
    const shapes = document.querySelectorAll('.shape');
    if (shapes.length && window.matchMedia('(hover: hover)').matches) {
        let mouseX = 0, mouseY = 0;
        let raf;
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 30;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 30;
            if (!raf) {
                raf = requestAnimationFrame(() => {
                    shapes.forEach((shape, i) => {
                        const speed = (i + 1) * 0.5;
                        shape.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
                    });
                    raf = null;
                });
            }
        });
    }

    // ============================================
    // LAZY LOADING DAS IMAGENS (fallback)
    // ============================================
    document.querySelectorAll('img:not([loading])').forEach(img => {
        // Não aplicar nas imagens above-the-fold (hero)
        if (!img.closest('.hero')) img.setAttribute('loading', 'lazy');
    });

})();
