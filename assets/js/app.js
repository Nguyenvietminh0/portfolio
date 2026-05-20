const htmlRoot = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const viewPanels = [...document.querySelectorAll('[data-view]')];
const routeButtons = [...document.querySelectorAll('[data-route]')];
const routeLinks = [...document.querySelectorAll('[data-route-link]')];
const exerciseLinks = [...document.querySelectorAll('.exercise-link')];
const projectsView = document.getElementById('projects');
const revealElements = [...document.querySelectorAll('[data-reveal]')];
const scrollProgress = document.getElementById('scroll-progress');
const storageKey = 'digital-portfolio-theme';

const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let savedTheme = null;

try {
    savedTheme = localStorage.getItem(storageKey);
} catch {
    savedTheme = null;
}

const applyTheme = (theme) => {
    const shouldUseDark = theme === 'dark';
    htmlRoot.classList.toggle('dark', shouldUseDark);
};

const updateScrollProgress = () => {
    if (!scrollProgress) {
        return;
    }

    const activePanel = viewPanels.find((panel) => !panel.classList.contains('hidden'));
    if (!activePanel) {
        scrollProgress.style.transform = 'scaleX(0)';
        return;
    }

    const panelTop = activePanel.offsetTop;
    const maxScrollable = Math.max(activePanel.offsetHeight - window.innerHeight, 1);
    const current = Math.min(Math.max(window.scrollY - panelTop, 0), maxScrollable);
    const progress = maxScrollable <= 1 ? 1 : current / maxScrollable;

    scrollProgress.style.transform = `scaleX(${progress})`;
};

let scrollTicking = false;

const requestScrollProgressUpdate = () => {
    if (scrollTicking) {
        return;
    }

    scrollTicking = true;
    window.requestAnimationFrame(() => {
        scrollTicking = false;
        updateScrollProgress();
    });
};

const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        },
        {
            threshold: 0.12,
            rootMargin: '0px 0px -10% 0px',
        },
    )
    : null;

revealElements.forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);

    if (revealObserver) {
        revealObserver.observe(element);
        return;
    }

    element.classList.add('is-visible');
});

const refreshAnimations = () => {
    if (revealObserver) {
        revealElements.forEach((element) => {
            if (!element.classList.contains('is-visible')) {
                revealObserver.observe(element);
            }
        });
    }

    requestScrollProgressUpdate();
};

applyTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

themeToggle?.addEventListener('click', () => {
    const nextTheme = htmlRoot.classList.contains('dark') ? 'light' : 'dark';
    try {
        localStorage.setItem(storageKey, nextTheme);
    } catch {
        // Ignore storage failures and still apply the theme for the current session.
    }
    applyTheme(nextTheme);
});

const resolveNavigationState = (hashValue) => {
    const cleanHash = hashValue.replace('#', '');

    if (!cleanHash) {
        return { route: 'intro', anchorId: null };
    }

    if (viewPanels.some((panel) => panel.dataset.view === cleanHash)) {
        return { route: cleanHash, anchorId: null };
    }

    const anchorElement = document.getElementById(cleanHash);
    if (anchorElement && projectsView?.contains(anchorElement)) {
        return { route: 'projects', anchorId: cleanHash };
    }

    return { route: 'intro', anchorId: null };
};

const setActiveRoute = (routeName, options = {}) => {
    const {
        anchorId = null,
        updateHash = true,
        scrollBehavior = 'smooth',
        scrollToTop = true,
    } = options;
    const fallback = 'intro';
    const activeRoute = viewPanels.some((panel) => panel.dataset.view === routeName) ? routeName : fallback;

    viewPanels.forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.view !== activeRoute);
    });

    routeButtons.forEach((button) => {
        const isActive = button.dataset.route === activeRoute;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    routeLinks.forEach((link) => {
        const isActive = link.dataset.routeLink === activeRoute;
        link.classList.toggle('text-cyan-700', isActive);
        link.classList.toggle('dark:text-cyan-300', isActive);
        link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    if (mobileMenu && mobileMenuToggle) {
        mobileMenu.classList.add('hidden');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }

    const nextHash = anchorId ? `#${anchorId}` : `#${activeRoute}`;
    if (updateHash && window.location.hash !== nextHash) {
        history.replaceState(null, '', nextHash);
    }

    if (anchorId) {
        const anchorElement = document.getElementById(anchorId);
        anchorElement?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
        refreshAnimations();
        return;
    }

    if (scrollToTop) {
        window.scrollTo({ top: 0, behavior: scrollBehavior });
    }

    refreshAnimations();
};

routeButtons.forEach((button) => {
    button.addEventListener('click', () => {
        setActiveRoute(button.dataset.route);
    });
});

routeLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        setActiveRoute(link.dataset.routeLink);
    });
});

exerciseLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const anchorId = link.getAttribute('href')?.replace('#', '');
        if (!anchorId) {
            return;
        }

        setActiveRoute('projects', {
            anchorId,
            updateHash: true,
            scrollBehavior: 'smooth',
            scrollToTop: false,
        });
    });
});

mobileMenuToggle?.addEventListener('click', () => {
    const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    mobileMenuToggle.setAttribute('aria-expanded', String(!isExpanded));
    mobileMenu?.classList.toggle('hidden', isExpanded);
});

window.addEventListener('hashchange', () => {
    const { route, anchorId } = resolveNavigationState(window.location.hash);
    setActiveRoute(route, {
        anchorId,
        updateHash: false,
        scrollBehavior: 'smooth',
        scrollToTop: !anchorId,
    });
});

const initialState = resolveNavigationState(window.location.hash);
setActiveRoute(initialState.route, {
    anchorId: initialState.anchorId,
    updateHash: !window.location.hash,
    scrollBehavior: 'auto',
    scrollToTop: !initialState.anchorId,
});

window.addEventListener('scroll', requestScrollProgressUpdate, { passive: true });
window.addEventListener('resize', requestScrollProgressUpdate);
requestScrollProgressUpdate();