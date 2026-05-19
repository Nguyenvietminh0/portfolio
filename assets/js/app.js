const htmlRoot = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const viewPanels = [...document.querySelectorAll('[data-view]')];
const routeButtons = [...document.querySelectorAll('[data-route]')];
const routeLinks = [...document.querySelectorAll('[data-route-link]')];
const storageKey = 'digital-portfolio-theme';

const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem(storageKey);

const applyTheme = (theme) => {
    const shouldUseDark = theme === 'dark';
    htmlRoot.classList.toggle('dark', shouldUseDark);
};

applyTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

themeToggle?.addEventListener('click', () => {
    const nextTheme = htmlRoot.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
});

const setActiveRoute = (routeName) => {
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
        link.classList.toggle('dark:text-cyan', isActive);
        link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    if (mobileMenu && mobileMenuToggle) {
        mobileMenu.classList.add('hidden');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }

    const nextHash = `#${activeRoute}`;
    if (window.location.hash !== nextHash) {
        history.replaceState(null, '', nextHash);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
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

mobileMenuToggle?.addEventListener('click', () => {
    const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    mobileMenuToggle.setAttribute('aria-expanded', String(!isExpanded));
    mobileMenu?.classList.toggle('hidden', isExpanded);
});

window.addEventListener('hashchange', () => {
    const routeName = window.location.hash.replace('#', '') || 'intro';
    setActiveRoute(routeName);
});

setActiveRoute(window.location.hash.replace('#', '') || 'intro');